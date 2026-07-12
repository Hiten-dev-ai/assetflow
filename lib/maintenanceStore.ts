import { getD1 } from "@/db";
import { publishMaintenanceStatus } from "./maintenanceEvents";

export type MaintenanceStatus = "PENDING" | "APPROVED" | "REJECTED" | "TECHNICIAN_ASSIGNED" | "IN_PROGRESS" | "RESOLVED";
export type MaintenancePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type MaintenanceRole = "ADMIN" | "ASSET_MANAGER" | "TECHNICIAN" | "EMPLOYEE" | "DEPARTMENT_HEAD";
type RequestRow = { id:number; assetId:number; requestedBy:number; description:string; priority:MaintenancePriority; status:MaintenanceStatus; technician:string|null; createdAt:number; resolvedAt:number|null };

export class MaintenanceStoreError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.name = "MaintenanceStoreError"; this.status = status; }
}

let schemaReady: Promise<void> | undefined;
async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const database = getD1();
      await database.batch([
        database.prepare(`CREATE INDEX IF NOT EXISTS maintenance_requests_status_idx ON maintenance_requests (status)`),
        database.prepare(`CREATE INDEX IF NOT EXISTS maintenance_requests_asset_status_idx ON maintenance_requests (asset_id, status)`),
        database.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS maintenance_active_asset_unique ON maintenance_requests (asset_id) WHERE status IN ('APPROVED','TECHNICIAN_ASSIGNED','IN_PROGRESS')`),
        database.prepare(`CREATE TABLE IF NOT EXISTS maintenance_assignments (
          id INTEGER PRIMARY KEY AUTOINCREMENT, request_id INTEGER NOT NULL, technician_id TEXT NOT NULL,
          technician_name TEXT NOT NULL, assigned_by TEXT NOT NULL, assigned_at INTEGER NOT NULL, estimated_completion_at INTEGER,
          FOREIGN KEY (request_id) REFERENCES maintenance_requests(id) ON DELETE CASCADE
        )`),
        database.prepare(`CREATE INDEX IF NOT EXISTS maintenance_assignments_request_idx ON maintenance_assignments (request_id)`),
        database.prepare(`CREATE INDEX IF NOT EXISTS maintenance_assignments_technician_idx ON maintenance_assignments (technician_id)`),
        database.prepare(`CREATE TABLE IF NOT EXISTS maintenance_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT, request_id INTEGER NOT NULL, asset_id INTEGER NOT NULL, actor_id TEXT NOT NULL,
          from_status TEXT, to_status TEXT NOT NULL, notes TEXT, cost REAL, created_at INTEGER NOT NULL,
          FOREIGN KEY (request_id) REFERENCES maintenance_requests(id) ON DELETE CASCADE,
          FOREIGN KEY (asset_id) REFERENCES assets(id)
        )`),
        database.prepare(`CREATE INDEX IF NOT EXISTS maintenance_logs_request_idx ON maintenance_logs (request_id, created_at)`),
        database.prepare(`CREATE INDEX IF NOT EXISTS maintenance_logs_asset_idx ON maintenance_logs (asset_id, created_at)`),
      ]);
    })().catch((error) => { schemaReady = undefined; throw error; });
  }
  return schemaReady;
}

function text(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) throw new MaintenanceStoreError(`${field} is required.`);
  return value.trim();
}
function integer(value: unknown, field: string) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new MaintenanceStoreError(`${field} must be a positive integer.`);
  return parsed;
}
function role(payload: Record<string, unknown>) { return text(payload.actorRole, "Actor role").toUpperCase() as MaintenanceRole; }
function actor(payload: Record<string, unknown>) { return text(payload.actorId, "Actor id"); }
function manager(value: MaintenanceRole) { if (value !== "ADMIN" && value !== "ASSET_MANAGER") throw new MaintenanceStoreError("Only Asset Managers can perform this action.", 403); }
function technician(value: MaintenanceRole) { if (!["ADMIN", "ASSET_MANAGER", "TECHNICIAN"].includes(value)) throw new MaintenanceStoreError("Only an assigned technician can perform this action.", 403); }

async function getRequest(requestId: number) {
  await ensureSchema();
  const row = await getD1().prepare(`SELECT id, asset_id AS assetId, requested_by AS requestedBy, description, priority, status, technician, created_at AS createdAt, resolved_at AS resolvedAt FROM maintenance_requests WHERE id = ? LIMIT 1`).bind(requestId).first<RequestRow>();
  if (!row) throw new MaintenanceStoreError(`Maintenance request ${requestId} was not found.`, 404);
  return row;
}
function parseStatus(value: unknown): MaintenanceStatus {
  const status = text(value, "Status").toUpperCase() as MaintenanceStatus;
  if (!["APPROVED", "REJECTED"].includes(status)) throw new MaintenanceStoreError("Review status must be APPROVED or REJECTED.");
  return status;
}
async function writeTransition(request: RequestRow, toStatus: MaintenanceStatus, actorId: string, notes?: string, cost?: number, extra: D1PreparedStatement[] = []) {
  const now = Date.now();
  const database = getD1();
  const statements = [
    database.prepare(`UPDATE maintenance_requests SET status = ?, updated_at = ?, resolved_at = CASE WHEN ? = 'RESOLVED' THEN ? ELSE resolved_at END WHERE id = ? AND status = ?`).bind(toStatus, now, toStatus, now, request.id, request.status),
    database.prepare(`INSERT INTO maintenance_logs (request_id, asset_id, actor_id, from_status, to_status, notes, cost, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(request.id, request.assetId, actorId, request.status, toStatus, notes ?? null, cost ?? null, now),
    database.prepare(`INSERT INTO notifications (employee_id, type, title, body, created_at) VALUES (?, ?, ?, ?, ?)`).bind(request.requestedBy, `MAINTENANCE_${toStatus}`, "Maintenance request updated", `Request #${request.id} moved from ${request.status} to ${toStatus}.`, now),
    database.prepare(`INSERT INTO activity_logs (actor_id, action, entity_type, entity_id, metadata, created_at) VALUES (?, ?, 'maintenance_request', ?, ?, ?)`).bind(Number(actorId) || null, `maintenance.${toStatus.toLowerCase()}`, String(request.id), JSON.stringify({ from: request.status, to: toStatus, assetId: request.assetId }), now),
    ...extra,
  ];
  await database.batch(statements);
  const updated = await getRequest(request.id);
  publishMaintenanceStatus({ requestId: request.id, assetId: request.assetId, oldStatus: request.status, newStatus: toStatus, actorId, updatedAt: new Date(now).toISOString() });
  return updated;
}

export async function createMaintenanceRequest(payload: unknown) {
  if (!payload || typeof payload !== "object") throw new MaintenanceStoreError("Maintenance request payload is required.");
  const source = payload as Record<string, unknown>;
  const assetId = integer(source.assetId, "Asset id");
  const requestedBy = integer(source.requestedBy, "Reporter id");
  const description = text(source.description, "Issue description");
  const priority = text(source.priority ?? "MEDIUM", "Priority").toUpperCase() as MaintenancePriority;
  if (!["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(priority)) throw new MaintenanceStoreError("Invalid maintenance priority.");
  const actorRole = role(source); if (!["EMPLOYEE", "DEPARTMENT_HEAD", "TECHNICIAN", "ADMIN", "ASSET_MANAGER"].includes(actorRole)) throw new MaintenanceStoreError("Invalid actor role.");
  await ensureSchema();
  const asset = await getD1().prepare(`SELECT id, status FROM assets WHERE id = ? LIMIT 1`).bind(assetId).first<{id:number;status:string}>();
  if (!asset) throw new MaintenanceStoreError(`Asset ${assetId} was not found.`, 404);
  const now = Date.now();
  const result = await getD1().prepare(`INSERT INTO maintenance_requests (asset_id, requested_by, description, priority, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'PENDING', ?, ?) RETURNING id`).bind(assetId, requestedBy, description, priority, now, now).first<{id:number}>();
  if (!result) throw new MaintenanceStoreError("Unable to create maintenance request.", 500);
  const request = await getRequest(result.id);
  publishMaintenanceStatus({ requestId: request.id, assetId, oldStatus: "NONE", newStatus: "PENDING", actorId: actor(source), updatedAt: new Date(now).toISOString() });
  return request;
}

export async function reviewMaintenanceRequest(requestId: number, payload: unknown) {
  const source = (payload ?? {}) as Record<string, unknown>; manager(role(source)); const actorId = actor(source); const next = parseStatus(source.status);
  const request = await getRequest(requestId);
  if (request.status !== "PENDING") throw new MaintenanceStoreError("Only pending requests can be reviewed.");
  if (next === "APPROVED") {
    const active = await getD1().prepare(`SELECT 1 AS found FROM maintenance_requests WHERE asset_id = ? AND id <> ? AND status IN ('APPROVED','TECHNICIAN_ASSIGNED','IN_PROGRESS') LIMIT 1`).bind(request.assetId, request.id).first<{found:number}>();
    if (active) throw new MaintenanceStoreError("This asset already has an active maintenance ticket.", 409);
    const asset = await getD1().prepare(`SELECT status FROM assets WHERE id = ?`).bind(request.assetId).first<{status:string}>();
    if (asset?.status === "UNDER_MAINTENANCE") throw new MaintenanceStoreError("This asset is already under maintenance.", 409);
    return writeTransition(request, next, actorId, undefined, undefined, [getD1().prepare(`UPDATE assets SET status = 'UNDER_MAINTENANCE' WHERE id = ?`).bind(request.assetId)]);
  }
  return writeTransition(request, next, actorId);
}

export async function assignMaintenanceTechnician(requestId: number, payload: unknown) {
  const source = (payload ?? {}) as Record<string, unknown>; manager(role(source)); const actorId = actor(source); const technicianId = text(source.technicianId, "Technician id"); const technicianName = text(source.technicianName, "Technician name");
  const request = await getRequest(requestId); if (request.status !== "APPROVED") throw new MaintenanceStoreError("Only approved requests can be assigned.");
  const now = Date.now();
  return writeTransition(request, "TECHNICIAN_ASSIGNED", actorId, undefined, undefined, [
    getD1().prepare(`UPDATE maintenance_requests SET technician = ?, updated_at = ? WHERE id = ?`).bind(technicianName, now, request.id),
    getD1().prepare(`INSERT INTO maintenance_assignments (request_id, technician_id, technician_name, assigned_by, assigned_at, estimated_completion_at) VALUES (?, ?, ?, ?, ?, ?)`).bind(request.id, technicianId, technicianName, actorId, now, source.estimatedCompletionAt ? Number(source.estimatedCompletionAt) : null),
  ]);
}

export async function startMaintenanceWork(requestId: number, payload: unknown) {
  const source = (payload ?? {}) as Record<string, unknown>; technician(role(source)); const request = await getRequest(requestId); if (request.status !== "TECHNICIAN_ASSIGNED") throw new MaintenanceStoreError("Only assigned requests can start work.");
  return writeTransition(request, "IN_PROGRESS", actor(source));
}

export async function resolveMaintenanceRequest(requestId: number, payload: unknown) {
  const source = (payload ?? {}) as Record<string, unknown>; technician(role(source)); const notes = text(source.resolutionNotes, "Resolution notes"); const cost = Number(source.cost); if (!Number.isFinite(cost) || cost < 0) throw new MaintenanceStoreError("A non-negative resolution cost is required.");
  const request = await getRequest(requestId); if (request.status !== "IN_PROGRESS") throw new MaintenanceStoreError("Only in-progress requests can be resolved.");
  const nextStatusSql = `CASE WHEN status IN ('LOST','RETIRED','DISPOSED') THEN status ELSE 'AVAILABLE' END`;
  return writeTransition(request, "RESOLVED", actor(source), notes, cost, [getD1().prepare(`UPDATE assets SET status = ${nextStatusSql} WHERE id = ?`).bind(request.assetId)]);
}

export async function listMaintenanceRequests() { await ensureSchema(); return (await getD1().prepare(`SELECT id, asset_id AS assetId, requested_by AS requestedBy, description, priority, status, technician, created_at AS createdAt, resolved_at AS resolvedAt FROM maintenance_requests ORDER BY created_at DESC`).all<RequestRow>()).results; }

export async function getMaintenanceRequest(requestId: number) { const request = await getRequest(requestId); const [assignments, logs] = await Promise.all([
  getD1().prepare(`SELECT id, technician_id AS technicianId, technician_name AS technicianName, assigned_by AS assignedBy, assigned_at AS assignedAt, estimated_completion_at AS estimatedCompletionAt FROM maintenance_assignments WHERE request_id = ? ORDER BY assigned_at DESC`).bind(requestId).all(),
  getD1().prepare(`SELECT id, actor_id AS actorId, from_status AS fromStatus, to_status AS toStatus, notes, cost, created_at AS createdAt FROM maintenance_logs WHERE request_id = ? ORDER BY created_at ASC`).bind(requestId).all(),
]); return { request, assignments: assignments.results, logs: logs.results }; }
