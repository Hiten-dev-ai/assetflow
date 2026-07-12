import seedAssets from "../data/assets.json";
import { getD1 } from "@/db";
import {
  buildAssetRecord,
  nextAssetTag,
  parseAssetDraft,
  updateAssetRecord,
  type AssetRecord,
  type AssetDraft,
  type HistoryEntry,
  type LifecycleStatus,
} from "./assets";

type AssetRow = {
  id: number;
  tag: string;
  name: string;
  category: string;
  serialNumber: string | null;
  acquisitionDate: number | null;
  acquisitionCost: number | null;
  status: string;
  location: string | null;
  condition: string | null;
  shared: number | boolean;
  department: string | null;
  qrCode: string | null;
  notes: string | null;
  lastUpdated: string | null;
  recentActivity: string | null;
  allocationHistory: string | null;
  maintenanceHistory: string | null;
};

const databaseStatuses: Record<LifecycleStatus, string> = {
  Available: "AVAILABLE",
  Allocated: "ALLOCATED",
  Reserved: "RESERVED",
  "Under Maintenance": "UNDER_MAINTENANCE",
  Lost: "LOST",
  Retired: "RETIRED",
  Disposed: "DISPOSED",
};

const uiStatuses = Object.fromEntries(
  Object.entries(databaseStatuses).map(([label, value]) => [value, label]),
) as Record<string, LifecycleStatus>;

const assetSelect = `
  SELECT
    a.id,
    a.tag,
    a.name,
    c.name AS category,
    a.serial_number AS serialNumber,
    a.acquisition_date AS acquisitionDate,
    a.acquisition_cost AS acquisitionCost,
    a.status,
    a.location,
    a.condition,
    a.shared,
    p.department,
    p.qr_code AS qrCode,
    p.notes,
    p.last_updated AS lastUpdated,
    p.recent_activity AS recentActivity,
    p.allocation_history AS allocationHistory,
    p.maintenance_history AS maintenanceHistory
  FROM assets AS a
  INNER JOIN asset_categories AS c ON c.id = a.category_id
  LEFT JOIN asset_profiles AS p ON p.asset_id = a.id
`;

export class AssetStoreError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AssetStoreError";
    this.status = status;
  }
}

let schemaReady: Promise<void> | undefined;
let writeQueue = Promise.resolve();

function parseHistory(value: string | null): HistoryEntry[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed as HistoryEntry[] : [];
  } catch {
    return [];
  }
}

function toUiStatus(status: string): LifecycleStatus {
  return uiStatuses[status] ?? "Available";
}

function toIsoDate(value: number | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function toTimestamp(value: string) {
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(timestamp)) {
    throw new AssetStoreError("Acquisition date is invalid.");
  }
  return timestamp;
}

function toRecord(row: AssetRow): AssetRecord {
  return {
    tag: row.tag,
    name: row.name,
    category: row.category,
    serialNumber: row.serialNumber ?? "",
    acquisitionDate: toIsoDate(row.acquisitionDate),
    acquisitionCost: row.acquisitionCost ?? 0,
    status: toUiStatus(row.status),
    department: row.department ?? "Unassigned",
    location: row.location ?? "Unassigned",
    condition: (row.condition ?? "Good") as AssetRecord["condition"],
    shared: Boolean(row.shared),
    qrCode: row.qrCode ?? `QR-${row.tag}`,
    notes: row.notes ?? "No notes added.",
    lastUpdated: row.lastUpdated ?? "Recently updated",
    recentActivity: row.recentActivity ?? "Asset directory record created",
    allocationHistory: parseHistory(row.allocationHistory),
    maintenanceHistory: parseHistory(row.maintenanceHistory),
  };
}

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const database = getD1();
      await database.batch([
        database.prepare(`CREATE TABLE IF NOT EXISTS asset_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          name TEXT NOT NULL,
          custom_fields TEXT,
          active INTEGER NOT NULL DEFAULT true
        )`),
        database.prepare(`CREATE TABLE IF NOT EXISTS assets (
          id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          tag TEXT NOT NULL,
          name TEXT NOT NULL,
          category_id INTEGER NOT NULL,
          serial_number TEXT,
          acquisition_date INTEGER,
          acquisition_cost REAL,
          condition TEXT NOT NULL DEFAULT 'Good',
          location TEXT,
          status TEXT NOT NULL DEFAULT 'AVAILABLE',
          shared INTEGER NOT NULL DEFAULT false,
          created_at INTEGER NOT NULL,
          FOREIGN KEY (category_id) REFERENCES asset_categories(id)
        )`),
        database.prepare(`CREATE TABLE IF NOT EXISTS asset_profiles (
          asset_id INTEGER PRIMARY KEY NOT NULL,
          department TEXT NOT NULL,
          qr_code TEXT NOT NULL,
          notes TEXT NOT NULL,
          last_updated TEXT NOT NULL,
          recent_activity TEXT NOT NULL,
          allocation_history TEXT NOT NULL DEFAULT '[]',
          maintenance_history TEXT NOT NULL DEFAULT '[]',
          FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
        )`),
        database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS asset_categories_name_unique ON asset_categories(name)"),
        database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS assets_tag_unique ON assets(tag)"),
      ]);
    })().catch((error) => {
      schemaReady = undefined;
      throw error;
    });
  }

  return schemaReady;
}

async function getCategoryId(category: string) {
  const database = getD1();
  const existing = await database
    .prepare("SELECT id FROM asset_categories WHERE name = ? LIMIT 1")
    .bind(category)
    .first<{ id: number }>();

  if (existing) return existing.id;

  const result = await database
    .prepare("INSERT INTO asset_categories (name, active) VALUES (?, true)")
    .bind(category)
    .run();

  if (typeof result.meta.last_row_id !== "number") {
    throw new AssetStoreError("Unable to create asset category.", 500);
  }

  return result.meta.last_row_id;
}

async function readRows() {
  const database = getD1();
  const result = await database.prepare(`${assetSelect} ORDER BY a.tag ASC`).all<AssetRow>();
  return result.results;
}

async function findRow(tag: string) {
  const database = getD1();
  const result = await database.prepare(`${assetSelect} WHERE a.tag = ? LIMIT 1`).bind(tag).first<AssetRow>();
  return result ?? null;
}

async function insertRecord(record: AssetRecord) {
  const database = getD1();
  const categoryId = await getCategoryId(record.category);
  const inserted = await database.prepare(`
    INSERT INTO assets (tag, name, category_id, serial_number, acquisition_date, acquisition_cost, condition, location, status, shared, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    record.tag,
    record.name,
    categoryId,
    record.serialNumber,
    toTimestamp(record.acquisitionDate),
    record.acquisitionCost,
    record.condition,
    record.location,
    databaseStatuses[record.status],
    record.shared ? 1 : 0,
    Date.now(),
  ).run();

  if (typeof inserted.meta.last_row_id !== "number") {
    throw new AssetStoreError("Unable to create asset.", 500);
  }

  await database.prepare(`
    INSERT INTO asset_profiles (asset_id, department, qr_code, notes, last_updated, recent_activity, allocation_history, maintenance_history)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    inserted.meta.last_row_id,
    record.department,
    record.qrCode,
    record.notes,
    record.lastUpdated,
    record.recentActivity,
    JSON.stringify(record.allocationHistory),
    JSON.stringify(record.maintenanceHistory),
  ).run();
}

async function seedIfEmpty() {
  const database = getD1();
  const count = await database.prepare("SELECT COUNT(*) AS count FROM assets").first<{ count: number }>();
  if ((count?.count ?? 0) > 0) return;

  for (const asset of seedAssets as AssetRecord[]) {
    await insertRecord(asset);
  }
}

async function ensureStore() {
  await ensureSchema();
  await seedIfEmpty();
}

async function withWriteLock<T>(task: () => Promise<T>) {
  const run = writeQueue.then(task, task);
  writeQueue = run.then(() => undefined, () => undefined);
  return run;
}

export async function listAssets() {
  await ensureStore();
  return (await readRows()).map(toRecord);
}

export async function createAsset(payload: unknown) {
  const draft = parseAssetDraft(payload);
  return withWriteLock(async () => {
    await ensureStore();
    const tag = nextAssetTag((await readRows()).map(toRecord));
    const asset = buildAssetRecord(tag, draft);
    await insertRecord(asset);
    return asset;
  });
}

export async function updateAsset(tag: string, payload: unknown) {
  const draft = parseAssetDraft(payload);
  return withWriteLock(async () => {
    await ensureStore();
    const current = await findRow(tag);
    if (!current) {
      throw new AssetStoreError(`Asset ${tag} was not found.`, 404);
    }

    const asset = updateAssetRecord(toRecord(current), draft);
    const database = getD1();
    const categoryId = await getCategoryId(asset.category);
    await database.batch([
      database.prepare(`
        UPDATE assets
        SET name = ?, category_id = ?, serial_number = ?, acquisition_date = ?, acquisition_cost = ?, condition = ?, location = ?, shared = ?
        WHERE tag = ?
      `).bind(
        asset.name,
        categoryId,
        asset.serialNumber,
        toTimestamp(asset.acquisitionDate),
        asset.acquisitionCost,
        asset.condition,
        asset.location,
        asset.shared ? 1 : 0,
        tag,
      ),
      database.prepare(`
        INSERT INTO asset_profiles (asset_id, department, qr_code, notes, last_updated, recent_activity, allocation_history, maintenance_history)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(asset_id) DO UPDATE SET
          department = excluded.department,
          qr_code = excluded.qr_code,
          notes = excluded.notes,
          last_updated = excluded.last_updated,
          recent_activity = excluded.recent_activity
      `).bind(
        current.id,
        asset.department,
        asset.qrCode,
        asset.notes,
        asset.lastUpdated,
        asset.recentActivity,
        JSON.stringify(asset.allocationHistory),
        JSON.stringify(asset.maintenanceHistory),
      ),
    ]);
    return asset;
  });
}

export async function deleteAsset(tag: string) {
  return withWriteLock(async () => {
    await ensureStore();
    const current = await findRow(tag);
    if (!current) {
      throw new AssetStoreError(`Asset ${tag} was not found.`, 404);
    }

    const database = getD1();
    await database.batch([
      database.prepare("DELETE FROM asset_profiles WHERE asset_id = ?").bind(current.id),
      database.prepare("DELETE FROM assets WHERE id = ?").bind(current.id),
    ]);
  });
}

export { parseAssetDraft };
export type { AssetRecord, AssetDraft };
