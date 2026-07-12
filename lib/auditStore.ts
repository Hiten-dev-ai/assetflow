import { getD1 } from "@/db";
import { publishAuditSummary, type AuditSummaryEvent } from "./auditEvents";

type AuditStatus = "DRAFT" | "ACTIVE" | "CLOSED";
type VerificationStatus = "PENDING" | "VERIFIED" | "MISSING" | "DAMAGED";

type InitiateAuditPayload = {
  departmentId?: string;
  locationId?: string;
  auditorIds?: string[];
  createdBy?: string;
};

type VerifyAuditPayload = {
  assetId?: number;
  auditItemId?: string;
  status?: VerificationStatus;
  verifiedBy?: string;
};

type AuditCycleRow = {
  id: string;
  departmentId: string | null;
  locationId: string | null;
  status: AuditStatus;
  startedAt: number;
  closedAt: number | null;
  createdBy: string;
};

type AuditItemRow = {
  id: string;
  auditCycleId: string;
  assetId: number;
  expectedLocation: string;
  verificationStatus: VerificationStatus;
  verifiedBy: string | null;
  updatedAt: number;
};

type AuditScopeAssetRow = {
  id: number;
  tag: string;
  name: string;
  status: string;
  condition: string;
  location: string | null;
  department: string | null;
};

export class AuditStoreError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AuditStoreError";
    this.status = status;
  }
}

let schemaReady: Promise<void> | undefined;

function requiredText(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AuditStoreError(`${field} is required.`);
  }

  return value.trim();
}

function optionalText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function parseInitiatePayload(payload: unknown): InitiateAuditPayload {
  if (!payload || typeof payload !== "object") {
    throw new AuditStoreError("Audit payload is required.");
  }

  const source = payload as Record<string, unknown>;
  const departmentId = optionalText(source.departmentId);
  const locationId = optionalText(source.locationId);

  if (!departmentId && !locationId) {
    throw new AuditStoreError("Select a department or location scope before starting an audit.");
  }

  const auditorIds = Array.isArray(source.auditorIds)
    ? source.auditorIds.map((id) => requiredText(id, "Auditor id"))
    : [];

  if (auditorIds.length === 0) {
    throw new AuditStoreError("At least one auditor is required.");
  }

  return {
    departmentId: departmentId ?? undefined,
    locationId: locationId ?? undefined,
    auditorIds,
    createdBy: requiredText(source.createdBy, "Admin id"),
  };
}

function parseVerifyPayload(payload: unknown): VerifyAuditPayload {
  if (!payload || typeof payload !== "object") {
    throw new AuditStoreError("Verification payload is required.");
  }

  const source = payload as Record<string, unknown>;
  const status = source.status;
  const validStatuses: VerificationStatus[] = ["PENDING", "VERIFIED", "MISSING", "DAMAGED"];

  if (!validStatuses.includes(status as VerificationStatus)) {
    throw new AuditStoreError("Verification status must be Pending, Verified, Missing, or Damaged.");
  }

  const assetId = Number(source.assetId);
  const auditItemId = optionalText(source.auditItemId);

  if (!Number.isInteger(assetId) && !auditItemId) {
    throw new AuditStoreError("Provide either assetId or auditItemId.");
  }

  return {
    assetId: Number.isInteger(assetId) ? assetId : undefined,
    auditItemId: auditItemId ?? undefined,
    status: status as VerificationStatus,
    verifiedBy: requiredText(source.verifiedBy, "Auditor id"),
  };
}

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const database = getD1();
      await database.batch([
        database.prepare(`CREATE TABLE IF NOT EXISTS audit_cycles (
          id TEXT PRIMARY KEY NOT NULL,
          department_id TEXT,
          location_id TEXT,
          status TEXT NOT NULL DEFAULT 'ACTIVE',
          started_at INTEGER NOT NULL,
          closed_at INTEGER,
          created_by TEXT NOT NULL
        )`),
        database.prepare(`CREATE TABLE IF NOT EXISTS audit_assignments (
          id TEXT PRIMARY KEY NOT NULL,
          audit_cycle_id TEXT NOT NULL,
          employee_id TEXT NOT NULL,
          FOREIGN KEY (audit_cycle_id) REFERENCES audit_cycles(id) ON DELETE CASCADE
        )`),
        database.prepare(`CREATE TABLE IF NOT EXISTS audit_items (
          id TEXT PRIMARY KEY NOT NULL,
          audit_cycle_id TEXT NOT NULL,
          asset_id INTEGER NOT NULL,
          expected_location TEXT NOT NULL,
          verification_status TEXT NOT NULL DEFAULT 'PENDING',
          verified_by TEXT,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY (audit_cycle_id) REFERENCES audit_cycles(id) ON DELETE CASCADE,
          FOREIGN KEY (asset_id) REFERENCES assets(id)
        )`),
        database.prepare("CREATE INDEX IF NOT EXISTS audit_cycles_scope_status_idx ON audit_cycles (department_id, location_id, status)"),
        database.prepare("CREATE INDEX IF NOT EXISTS audit_assignments_cycle_idx ON audit_assignments (audit_cycle_id)"),
        database.prepare("CREATE INDEX IF NOT EXISTS audit_items_cycle_status_idx ON audit_items (audit_cycle_id, verification_status)"),
        database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS audit_items_cycle_asset_unique ON audit_items (audit_cycle_id, asset_id)"),
        database.prepare("CREATE INDEX IF NOT EXISTS assets_location_idx ON assets (location)"),
        database.prepare("CREATE INDEX IF NOT EXISTS asset_profiles_department_idx ON asset_profiles (department)"),
      ]);
    })().catch((error) => {
      schemaReady = undefined;
      throw error;
    });
  }

  return schemaReady;
}

function normalizeLocation(value: string | undefined) {
  return value?.trim() || undefined;
}

async function getCycle(cycleId: string) {
  await ensureSchema();
  const cycle = await getD1()
    .prepare(`SELECT id, department_id AS departmentId, location_id AS locationId, status, started_at AS startedAt, closed_at AS closedAt, created_by AS createdBy
      FROM audit_cycles WHERE id = ? LIMIT 1`)
    .bind(cycleId)
    .first<AuditCycleRow>();

  if (!cycle) {
    throw new AuditStoreError(`Audit cycle ${cycleId} was not found.`, 404);
  }

  return cycle;
}

async function summarize(cycleId: string): Promise<AuditSummaryEvent> {
  await ensureSchema();
  const rows = await getD1()
    .prepare(`SELECT verification_status AS verificationStatus, COUNT(*) AS count
      FROM audit_items
      WHERE audit_cycle_id = ?
      GROUP BY verification_status`)
    .bind(cycleId)
    .all<{ verificationStatus: VerificationStatus; count: number }>();

  const counts: Record<VerificationStatus, number> = {
    PENDING: 0,
    VERIFIED: 0,
    MISSING: 0,
    DAMAGED: 0,
  };

  for (const row of rows.results) {
    counts[row.verificationStatus] = row.count;
  }

  return {
    cycleId,
    totalCount: counts.PENDING + counts.VERIFIED + counts.MISSING + counts.DAMAGED,
    pendingCount: counts.PENDING,
    verifiedCount: counts.VERIFIED,
    missingCount: counts.MISSING,
    damagedCount: counts.DAMAGED,
    updatedAt: new Date().toISOString(),
  };
}

export async function initiateAuditCycle(payload: unknown) {
  const draft = parseInitiatePayload(payload);
  await ensureSchema();

  const departmentId = draft.departmentId ?? null;
  const locationId = normalizeLocation(draft.locationId) ?? null;
  const database = getD1();

  const overlap = await database
    .prepare(`SELECT id FROM audit_cycles
      WHERE status = 'ACTIVE'
        AND COALESCE(department_id, '') = COALESCE(?, '')
        AND COALESCE(location_id, '') = COALESCE(?, '')
      LIMIT 1`)
    .bind(departmentId, locationId)
    .first<{ id: string }>();

  if (overlap) {
    throw new AuditStoreError("An active audit cycle already exists for this department/location scope.", 409);
  }

  const assetQuery = `${scopeAssetSelect()} ORDER BY a.tag ASC`;
  const scopeAssets = await database.prepare(assetQuery).bind(departmentId, departmentId, locationId, locationId).all<AuditScopeAssetRow>();

  if (scopeAssets.results.length === 0) {
    throw new AuditStoreError("No assets were found for the selected audit scope.", 404);
  }

  const cycleId = crypto.randomUUID();
  const now = Date.now();
  const statements = [
    database.prepare(`INSERT INTO audit_cycles (id, department_id, location_id, status, started_at, created_by)
      VALUES (?, ?, ?, 'ACTIVE', ?, ?)`).bind(cycleId, departmentId, locationId, now, draft.createdBy),
    ...draft.auditorIds.map((employeeId) => database.prepare(`INSERT INTO audit_assignments (id, audit_cycle_id, employee_id)
      VALUES (?, ?, ?)`).bind(crypto.randomUUID(), cycleId, employeeId)),
    ...scopeAssets.results.map((asset) => database.prepare(`INSERT INTO audit_items (id, audit_cycle_id, asset_id, expected_location, verification_status, updated_at)
      VALUES (?, ?, ?, ?, 'PENDING', ?)`).bind(crypto.randomUUID(), cycleId, asset.id, asset.location ?? "Unassigned", now)),
  ];

  await database.batch(statements);

  return {
    cycleId,
    status: "ACTIVE" as AuditStatus,
    totalItems: scopeAssets.results.length,
    summary: await summarize(cycleId),
  };
}

function scopeAssetSelect() {
  return `SELECT a.id, a.tag, a.name, a.status, a.condition, a.location, p.department
    FROM assets AS a
    LEFT JOIN asset_profiles AS p ON p.asset_id = a.id
    WHERE (? IS NULL OR p.department = ?)
      AND (? IS NULL OR a.location = ?)`;
}

export async function verifyAuditItem(cycleId: string, payload: unknown) {
  const draft = parseVerifyPayload(payload);
  const cycle = await getCycle(cycleId);

  if (cycle.status === "CLOSED") {
    throw new AuditStoreError("This audit cycle is closed and can no longer be modified.", 409);
  }

  const database = getD1();
  const item = draft.auditItemId
    ? await database.prepare(`SELECT id, audit_cycle_id AS auditCycleId, asset_id AS assetId, expected_location AS expectedLocation,
        verification_status AS verificationStatus, verified_by AS verifiedBy, updated_at AS updatedAt
        FROM audit_items WHERE audit_cycle_id = ? AND id = ? LIMIT 1`).bind(cycleId, draft.auditItemId).first<AuditItemRow>()
    : await database.prepare(`SELECT id, audit_cycle_id AS auditCycleId, asset_id AS assetId, expected_location AS expectedLocation,
        verification_status AS verificationStatus, verified_by AS verifiedBy, updated_at AS updatedAt
        FROM audit_items WHERE audit_cycle_id = ? AND asset_id = ? LIMIT 1`).bind(cycleId, draft.assetId).first<AuditItemRow>();

  if (!item) {
    throw new AuditStoreError("Audit item was not found in this cycle.", 404);
  }

  await database.prepare(`UPDATE audit_items
    SET verification_status = ?, verified_by = ?, updated_at = ?
    WHERE id = ?`).bind(draft.status, draft.verifiedBy, Date.now(), item.id).run();

  const summary = await summarize(cycleId);
  publishAuditSummary(summary);

  return {
    itemId: item.id,
    cycleId,
    assetId: item.assetId,
    status: draft.status,
    summary,
  };
}

export async function getDiscrepancyReport(cycleId: string) {
  const cycle = await getCycle(cycleId);
  const flagged = await getD1()
    .prepare(`SELECT ai.id, ai.asset_id AS assetId, ai.expected_location AS expectedLocation,
        ai.verification_status AS verificationStatus, ai.verified_by AS verifiedBy, ai.updated_at AS updatedAt,
        a.tag, a.name, a.location AS currentLocation
      FROM audit_items AS ai
      INNER JOIN assets AS a ON a.id = ai.asset_id
      WHERE ai.audit_cycle_id = ? AND ai.verification_status IN ('MISSING', 'DAMAGED')
      ORDER BY ai.updated_at DESC`)
    .bind(cycleId)
    .all<Record<string, unknown>>();

  return {
    cycle,
    summary: await summarize(cycleId),
    discrepancies: flagged.results,
  };
}

export async function closeAuditCycle(cycleId: string, payload: unknown) {
  const cycle = await getCycle(cycleId);
  if (cycle.status === "CLOSED") {
    throw new AuditStoreError("This audit cycle is already closed.", 409);
  }

  const closedBy = payload && typeof payload === "object"
    ? requiredText((payload as Record<string, unknown>).closedBy, "Admin id")
    : (() => { throw new AuditStoreError("Admin id is required."); })();

  const database = getD1();
  const items = await database.prepare(`SELECT id, audit_cycle_id AS auditCycleId, asset_id AS assetId, expected_location AS expectedLocation,
      verification_status AS verificationStatus, verified_by AS verifiedBy, updated_at AS updatedAt
      FROM audit_items WHERE audit_cycle_id = ?`).bind(cycleId).all<AuditItemRow>();

  if (items.results.length === 0) {
    throw new AuditStoreError("This audit cycle has no audit items to close.", 409);
  }

  const now = Date.now();
  const statements = [
    ...items.results
      .filter((item) => item.verificationStatus === "MISSING")
      .map((item) => database.prepare("UPDATE assets SET status = 'LOST' WHERE id = ?").bind(item.assetId)),
    ...items.results
      .filter((item) => item.verificationStatus === "DAMAGED")
      .flatMap((item) => [
        database.prepare("UPDATE assets SET status = 'UNDER_MAINTENANCE', condition = 'Needs Repair' WHERE id = ?").bind(item.assetId),
        database.prepare(`INSERT INTO maintenance_requests (asset_id, requested_by, description, priority, status, created_at)
          VALUES (?, 1, ?, 'HIGH', 'PENDING', ?)`).bind(item.assetId, `Auto-created from audit cycle ${cycleId}: asset marked damaged.`, now),
      ]),
    ...items.results
      .filter((item) => item.verificationStatus === "VERIFIED")
      .map((item) => database.prepare(`UPDATE assets
        SET status = CASE
          WHEN status IN ('LOST', 'RETIRED', 'DISPOSED', 'ALLOCATED', 'RESERVED', 'UNDER_MAINTENANCE') THEN status
          ELSE 'AVAILABLE'
        END
        WHERE id = ?`).bind(item.assetId)),
    database.prepare("UPDATE audit_cycles SET status = 'CLOSED', closed_at = ? WHERE id = ?").bind(now, cycleId),
    database.prepare(`INSERT INTO activity_logs (actor_id, action, entity_type, entity_id, metadata, created_at)
      VALUES (NULL, 'AUDIT_CLOSED', 'audit_cycle', ?, ?, ?)`).bind(cycleId, JSON.stringify({ closedBy, status: "CLOSED" }), now),
  ];

  await database.batch(statements);
  const summary = await summarize(cycleId);
  publishAuditSummary(summary);

  return {
    cycleId,
    status: "CLOSED" as AuditStatus,
    closedAt: new Date(now).toISOString(),
    summary,
  };
}

export async function getAuditSummary(cycleId: string) {
  await getCycle(cycleId);
  return summarize(cycleId);
}
