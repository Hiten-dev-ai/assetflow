import { getD1 } from "@/db";
import { seedAssetDirectory } from "./assetDirectory";
import {
  buildAssetRecord,
  conditions,
  nextAssetTag,
  type AssetCondition,
  type AssetDraft,
  type AssetRecord,
  type HistoryEntry,
  type LifecycleStatus,
} from "./assets";

type D1 = ReturnType<typeof getD1>;

export type EntityStatus = "Active" | "Inactive";
export type EmployeeRole = "Employee" | "Department Head" | "Asset Manager" | "Admin";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type MaintenanceStatus = "PENDING" | "APPROVED" | "REJECTED" | "TECHNICIAN_ASSIGNED" | "IN_PROGRESS" | "RESOLVED";
export type BookingStatus = "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";
export type AuditStatus = "ACTIVE" | "CLOSED";
export type VerificationStatus = "PENDING" | "VERIFIED" | "MISSING" | "DAMAGED";
export type ActivitySeverity = "Info" | "Success" | "Warning" | "Critical";
export type ActivityStatus = "Unread" | "Read" | "Resolved";
export type ActivityKind = "Asset" | "Booking" | "Maintenance" | "Audit" | "Approval" | "Organization" | "System";

export type AppUser = {
  id: string;
  employeeId: string;
  name: string;
  username: string;
  role: "ADMIN" | "EMPLOYEE";
  employeeRole: EmployeeRole;
  status: EntityStatus;
  departmentId: string;
  departmentName: string;
};

export type DepartmentRecord = {
  id: string;
  name: string;
  code: string;
  headEmployeeId: string;
  parentId: string;
  status: EntityStatus;
  notes: string;
};

export type AssetCategoryRecord = {
  id: string;
  name: string;
  code: string;
  description: string;
  usefulLife: string;
  requiresSerial: boolean;
  trackWarranty: boolean;
  status: EntityStatus;
};

export type EmployeeRecord = {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  departmentId: string;
  role: EmployeeRole;
  status: EntityStatus;
  jobTitle: string;
  phone: string;
  location: string;
};

export type AllocationRecord = {
  id: string;
  assetTag: string;
  assetName: string;
  employeeId: string;
  employeeName: string;
  departmentId: string;
  departmentName: string;
  allocatedAt: string;
  dueAt: string;
  status: "Active" | "Transfer Pending" | "Returned" | "Transferred";
  reason: string;
  requestedToEmployeeId?: string;
  requestedToEmployeeName?: string;
  returnedAt?: string;
  conditionOut: AssetCondition;
  conditionIn?: AssetCondition;
  notes: string;
  overdue: boolean;
};

export type BookingRecord = {
  id: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  employeeId: string;
  employeeName: string;
  startAt: string;
  endAt: string;
  purpose: string;
  status: BookingStatus;
};

export type MaintenanceRecord = {
  id: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  requestedBy: string;
  requestedByName: string;
  description: string;
  priority: Priority;
  status: MaintenanceStatus;
  technician: string;
  createdAt: string;
  resolvedAt: string;
};

export type AuditCycleRecord = {
  id: string;
  departmentId: string;
  departmentName: string;
  locationId: string;
  status: AuditStatus;
  startedAt: string;
  closedAt: string;
  createdBy: string;
  auditorIds: string[];
  summary: Record<VerificationStatus, number> & { total: number };
};

export type AuditItemRecord = {
  id: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  expectedLocation: string;
  currentLocation: string;
  verificationStatus: VerificationStatus;
  verifiedBy: string;
  updatedAt: string;
};

export type ActivityRecord = {
  id: string;
  kind: ActivityKind;
  title: string;
  description: string;
  actor: string;
  target: string;
  severity: ActivitySeverity;
  status: ActivityStatus;
  createdAt: string;
};

export class ErpError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status = 400, details?: unknown) {
    super(message);
    this.name = "ErpError";
    this.status = status;
    this.details = details;
  }
}

const PASSWORD_SALT = "assetflow-local-auth-v2";
const SESSION_COOKIE = "assetflow_session";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;

const seedDepartments: Array<Omit<DepartmentRecord, "id">> = [
  { name: "Engineering", code: "ENG", headEmployeeId: "", parentId: "", status: "Active", notes: "Product engineering and platform delivery." },
  { name: "Facilities", code: "FAC", headEmployeeId: "", parentId: "", status: "Active", notes: "Buildings, rooms, and workplace operations." },
  { name: "Operations", code: "OPS", headEmployeeId: "", parentId: "", status: "Active", notes: "Asset operations, service readiness, and procurement coordination." },
  { name: "Finance", code: "FIN", headEmployeeId: "", parentId: "", status: "Active", notes: "Budget ownership and capital expense controls." },
  { name: "Field Ops", code: "FLD", headEmployeeId: "", parentId: "", status: "Active", notes: "Distributed teams and field equipment accountability." },
];

const seedCategories: Array<Omit<AssetCategoryRecord, "id">> = [
  { name: "Electronics", code: "ELEC", description: "Laptops, screens, phones, and IT equipment.", usefulLife: "36", requiresSerial: true, trackWarranty: true, status: "Active" },
  { name: "Furniture", code: "FURN", description: "Desks, chairs, storage, and fixtures.", usefulLife: "84", requiresSerial: false, trackWarranty: false, status: "Active" },
  { name: "Vehicles", code: "VEH", description: "Fleet cars, service vans, and transport assets.", usefulLife: "60", requiresSerial: true, trackWarranty: true, status: "Active" },
  { name: "Rooms", code: "ROOM", description: "Bookable rooms and shared spaces.", usefulLife: "", requiresSerial: false, trackWarranty: false, status: "Active" },
  { name: "Tools", code: "TOOL", description: "Maintenance tools and portable kits.", usefulLife: "48", requiresSerial: true, trackWarranty: false, status: "Active" },
];

const seedEmployees: Array<Omit<EmployeeRecord, "id" | "departmentId"> & { departmentCode: string }> = [
  { name: "Hiten S", email: "25cs079@rmkcet.ac.in", employeeId: "AF-EMP-079", departmentCode: "ENG", role: "Admin", status: "Active", jobTitle: "System Administrator", phone: "", location: "Bengaluru HQ" },
  { name: "Sujith Kumar P", email: "25cy055@rmkcet.ac.in", employeeId: "AF-EMP-055", departmentCode: "OPS", role: "Asset Manager", status: "Active", jobTitle: "Asset Operations Manager", phone: "", location: "Operations Desk" },
  { name: "Maha Lakshmi N", email: "25cs117@rmkcet.ac.in", employeeId: "AF-EMP-117", departmentCode: "FAC", role: "Department Head", status: "Active", jobTitle: "Facilities Lead", phone: "", location: "HQ Floor 1" },
  { name: "AssetFlow Admin", email: "admin@assetflow.local", employeeId: "AF-EMP-001", departmentCode: "ENG", role: "Admin", status: "Active", jobTitle: "Fallback Administrator", phone: "", location: "Bengaluru HQ" },
  { name: "Priya Shah", email: "priya.shah@assetflow.demo", employeeId: "AF-EMP-002", departmentCode: "ENG", role: "Employee", status: "Active", jobTitle: "Software Engineer", phone: "+91 98765 10002", location: "Bengaluru HQ" },
  { name: "Rohan Mehta", email: "rohan.mehta@assetflow.demo", employeeId: "AF-EMP-003", departmentCode: "FAC", role: "Department Head", status: "Active", jobTitle: "Facilities Lead", phone: "+91 98765 10003", location: "HQ Floor 1" },
  { name: "Aditi Rao", email: "aditi.rao@assetflow.demo", employeeId: "AF-EMP-004", departmentCode: "OPS", role: "Asset Manager", status: "Active", jobTitle: "Asset Operations Manager", phone: "+91 98765 10004", location: "Operations Desk" },
  { name: "Sana Iqbal", email: "sana.iqbal@assetflow.demo", employeeId: "AF-EMP-005", departmentCode: "FLD", role: "Employee", status: "Active", jobTitle: "Field Coordinator", phone: "+91 98765 10005", location: "Field Ops East" },
];

const seededAccountEmails = new Set([
  "25cs079@rmkcet.ac.in",
  "25cy055@rmkcet.ac.in",
  "25cs117@rmkcet.ac.in",
  "admin@assetflow.local",
]);

const dbStatuses: Record<LifecycleStatus, string> = {
  Available: "AVAILABLE",
  Allocated: "ALLOCATED",
  Reserved: "RESERVED",
  "Under Maintenance": "UNDER_MAINTENANCE",
  Lost: "LOST",
  Retired: "RETIRED",
  Disposed: "DISPOSED",
};

const uiStatuses = Object.fromEntries(Object.entries(dbStatuses).map(([ui, db]) => [db, ui])) as Record<string, LifecycleStatus>;

let coreReady: Promise<void> | undefined;

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: unknown) {
  return normalize(value).toLowerCase();
}

function requiredText(value: unknown, label: string) {
  const text = normalize(value);
  if (!text) throw new ErpError(`${label} is required.`);
  return text;
}

function optionalText(value: unknown) {
  const text = normalize(value);
  return text || "";
}

function requiredId(value: unknown, label: string) {
  const text = requiredText(value, label);
  const id = Number(text);
  if (!Number.isInteger(id) || id <= 0) throw new ErpError(`${label} is invalid.`);
  return id;
}

function roleToDb(role: EmployeeRole) {
  if (role === "Admin") return "ADMIN";
  if (role === "Asset Manager") return "ASSET_MANAGER";
  if (role === "Department Head") return "DEPARTMENT_HEAD";
  return "EMPLOYEE";
}

function roleFromDb(role: string | null | undefined): EmployeeRole {
  if (role === "ADMIN") return "Admin";
  if (role === "ASSET_MANAGER") return "Asset Manager";
  if (role === "DEPARTMENT_HEAD") return "Department Head";
  return "Employee";
}

function uiStatusFromDb(value: string | null | undefined): LifecycleStatus {
  return uiStatuses[value ?? ""] ?? "Available";
}

function dbStatusFromUi(value: LifecycleStatus) {
  return dbStatuses[value] ?? "AVAILABLE";
}

function conditionFromDb(value: string | null | undefined): AssetCondition {
  if (value === "Needs Repair") return "Needs Service";
  return conditions.includes(value as AssetCondition) ? value as AssetCondition : "Good";
}

function booleanFromDb(value: unknown) {
  return value === true || value === 1 || value === "1";
}

function activeFromDb(value: unknown): EntityStatus {
  return booleanFromDb(value) || value === "ACTIVE" || value === "Active" ? "Active" : "Inactive";
}

function dateOnly(value: number | null | undefined) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function iso(value: number | null | undefined) {
  if (!value) return "";
  return new Date(value).toISOString();
}

function parseDate(value: unknown, label: string) {
  const text = requiredText(value, label);
  const timestamp = Date.parse(text.includes("T") ? text : `${text}T00:00:00.000Z`);
  if (!Number.isFinite(timestamp)) throw new ErpError(`${label} is invalid.`);
  return timestamp;
}

function parseDateTime(value: unknown, label: string) {
  const text = requiredText(value, label);
  const timestamp = Date.parse(text);
  if (!Number.isFinite(timestamp)) throw new ErpError(`${label} is invalid.`);
  return timestamp;
}

function safeJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function hashPassword(password: string) {
  let hash = 2166136261;
  const source = `${PASSWORD_SALT}:${password}`;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `v2:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function cookieFromRequest(request: Request, name: string) {
  const cookie = request.headers.get("cookie") ?? "";
  return cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) ?? "";
}

function makeEmployeeNumber(current: Array<{ employeeId: string | null }>) {
  const highest = current.reduce((max, employee) => {
    const value = Number((employee.employeeId ?? "").replace(/\D/g, ""));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `AF-EMP-${String(highest + 1).padStart(3, "0")}`;
}

async function hasColumn(database: D1, table: string, column: string) {
  const rows = await database.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
  return rows.results.some((row) => row.name === column);
}

async function addColumn(database: D1, table: string, column: string, definition: string) {
  if (!(await hasColumn(database, table, column))) {
    await database.prepare(`ALTER TABLE ${table} ADD COLUMN ${definition}`).run();
  }
}

async function ensureCoreSchema() {
  const database = getD1();
  await database.batch([
    database.prepare(`CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      name TEXT NOT NULL,
      parent_id INTEGER,
      head_employee_id INTEGER,
      active INTEGER NOT NULL DEFAULT true
    )`),
    database.prepare(`CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      department_id INTEGER,
      role TEXT NOT NULL DEFAULT 'EMPLOYEE',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at INTEGER NOT NULL
    )`),
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
      created_at INTEGER NOT NULL
    )`),
    database.prepare(`CREATE TABLE IF NOT EXISTS asset_profiles (
      asset_id INTEGER PRIMARY KEY NOT NULL,
      department TEXT NOT NULL,
      qr_code TEXT NOT NULL,
      notes TEXT NOT NULL,
      last_updated TEXT NOT NULL,
      recent_activity TEXT NOT NULL,
      allocation_history TEXT NOT NULL DEFAULT '[]',
      maintenance_history TEXT NOT NULL DEFAULT '[]'
    )`),
    database.prepare(`CREATE TABLE IF NOT EXISTS allocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      asset_id INTEGER NOT NULL,
      employee_id INTEGER,
      department_id INTEGER,
      expected_return_at INTEGER,
      returned_at INTEGER,
      check_in_notes TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at INTEGER NOT NULL
    )`),
    database.prepare(`CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      asset_id INTEGER NOT NULL,
      employee_id INTEGER NOT NULL,
      start_at INTEGER NOT NULL,
      end_at INTEGER NOT NULL,
      purpose TEXT,
      status TEXT NOT NULL DEFAULT 'UPCOMING'
    )`),
    database.prepare(`CREATE TABLE IF NOT EXISTS maintenance_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      asset_id INTEGER NOT NULL,
      requested_by INTEGER NOT NULL,
      description TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'MEDIUM',
      status TEXT NOT NULL DEFAULT 'PENDING',
      technician TEXT,
      created_at INTEGER NOT NULL,
      resolved_at INTEGER
    )`),
    database.prepare(`CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      employee_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      read_at INTEGER,
      created_at INTEGER NOT NULL
    )`),
    database.prepare(`CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      actor_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      metadata TEXT,
      created_at INTEGER NOT NULL
    )`),
    database.prepare(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      employee_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )`),
    database.prepare(`CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    )`),
    database.prepare(`CREATE TABLE IF NOT EXISTS transfer_requests (
      id TEXT PRIMARY KEY NOT NULL,
      allocation_id INTEGER NOT NULL,
      asset_id INTEGER NOT NULL,
      from_employee_id INTEGER NOT NULL,
      to_employee_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'REQUESTED',
      requested_at INTEGER NOT NULL,
      decided_at INTEGER,
      decided_by INTEGER
    )`),
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
      employee_id TEXT NOT NULL
    )`),
    database.prepare(`CREATE TABLE IF NOT EXISTS audit_items (
      id TEXT PRIMARY KEY NOT NULL,
      audit_cycle_id TEXT NOT NULL,
      asset_id INTEGER NOT NULL,
      expected_location TEXT NOT NULL,
      verification_status TEXT NOT NULL DEFAULT 'PENDING',
      verified_by TEXT,
      updated_at INTEGER NOT NULL
    )`),
    database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS employees_email_unique ON employees(email)"),
    database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email)"),
    database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS assets_tag_unique ON assets(tag)"),
    database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS asset_categories_name_unique ON asset_categories(name)"),
    database.prepare("CREATE INDEX IF NOT EXISTS allocations_asset_status_idx ON allocations(asset_id, status)"),
    database.prepare("CREATE INDEX IF NOT EXISTS bookings_asset_time_idx ON bookings(asset_id, start_at, end_at, status)"),
    database.prepare("CREATE INDEX IF NOT EXISTS activity_logs_created_idx ON activity_logs(created_at)"),
  ]);

  await Promise.all([
    addColumn(database, "departments", "code", "code TEXT"),
    addColumn(database, "departments", "notes", "notes TEXT"),
    addColumn(database, "asset_categories", "code", "code TEXT"),
    addColumn(database, "asset_categories", "description", "description TEXT"),
    addColumn(database, "asset_categories", "useful_life", "useful_life TEXT"),
    addColumn(database, "asset_categories", "requires_serial", "requires_serial INTEGER NOT NULL DEFAULT true"),
    addColumn(database, "asset_categories", "track_warranty", "track_warranty INTEGER NOT NULL DEFAULT false"),
    addColumn(database, "employees", "employee_id", "employee_id TEXT"),
    addColumn(database, "employees", "job_title", "job_title TEXT"),
    addColumn(database, "employees", "phone", "phone TEXT"),
    addColumn(database, "employees", "location", "location TEXT"),
    addColumn(database, "allocations", "reason", "reason TEXT"),
    addColumn(database, "allocations", "requested_to_employee_id", "requested_to_employee_id INTEGER"),
    addColumn(database, "allocations", "condition_out", "condition_out TEXT"),
    addColumn(database, "allocations", "condition_in", "condition_in TEXT"),
    addColumn(database, "allocations", "notes", "notes TEXT"),
    addColumn(database, "bookings", "created_at", "created_at INTEGER"),
    addColumn(database, "maintenance_requests", "attachment_name", "attachment_name TEXT"),
    addColumn(database, "activity_logs", "kind", "kind TEXT"),
    addColumn(database, "activity_logs", "title", "title TEXT"),
    addColumn(database, "activity_logs", "description", "description TEXT"),
    addColumn(database, "activity_logs", "target", "target TEXT"),
    addColumn(database, "activity_logs", "severity", "severity TEXT"),
    addColumn(database, "activity_logs", "status", "status TEXT"),
  ]);
}

async function ensureCategoryId(name: string) {
  const database = getD1();
  const existing = await database.prepare("SELECT id FROM asset_categories WHERE name = ? LIMIT 1").bind(name).first<{ id: number }>();
  if (existing) return existing.id;
  const code = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "CAT";
  const inserted = await database.prepare(`INSERT INTO asset_categories (name, code, description, useful_life, requires_serial, track_warranty, active)
    VALUES (?, ?, ?, '', true, false, true)`).bind(name, code, `${name} assets`).run();
  return inserted.meta.last_row_id as number;
}

async function insertAssetRecord(record: AssetRecord) {
  const database = getD1();
  const categoryId = await ensureCategoryId(record.category);
  const inserted = await database.prepare(`INSERT INTO assets
    (tag, name, category_id, serial_number, acquisition_date, acquisition_cost, condition, location, status, shared, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(record.tag, record.name, categoryId, record.serialNumber, parseDate(record.acquisitionDate, "Acquisition date"), record.acquisitionCost, record.condition, record.location, dbStatusFromUi(record.status), record.shared ? 1 : 0, Date.now())
    .run();
  await database.prepare(`INSERT INTO asset_profiles
    (asset_id, department, qr_code, notes, last_updated, recent_activity, allocation_history, maintenance_history)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(inserted.meta.last_row_id, record.department, record.qrCode, record.notes, record.lastUpdated, record.recentActivity, JSON.stringify(record.allocationHistory), JSON.stringify(record.maintenanceHistory))
    .run();
}

async function seedInitialWorkflowRecords(database: D1) {
  const priya = await database.prepare("SELECT id, department_id AS departmentId FROM employees WHERE email = ? LIMIT 1").bind("priya.shah@assetflow.demo").first<{ id: number; departmentId: number }>();
  const aditi = await database.prepare("SELECT id FROM employees WHERE email = ? LIMIT 1").bind("aditi.rao@assetflow.demo").first<{ id: number }>();
  const laptop = await database.prepare("SELECT id, condition FROM assets WHERE tag = 'AF-0001' LIMIT 1").first<{ id: number; condition: string }>();
  const projector = await database.prepare("SELECT id FROM assets WHERE tag = 'AF-0003' LIMIT 1").first<{ id: number }>();
  const fleetCar = await database.prepare("SELECT id FROM assets WHERE tag = 'AF-0004' LIMIT 1").first<{ id: number }>();

  const allocationCount = await database.prepare("SELECT COUNT(*) AS count FROM allocations").first<{ count: number }>();
  if ((allocationCount?.count ?? 0) === 0 && priya && laptop) {
    await database.prepare(`INSERT INTO allocations
      (asset_id, employee_id, department_id, expected_return_at, status, created_at, reason, condition_out, notes)
      VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?)`)
      .bind(laptop.id, priya.id, priya.departmentId, Date.parse("2026-07-31"), Date.parse("2026-03-12"), "Engineering laptop handoff.", laptop.condition, "Allocated to Priya Shah.")
      .run();
  }

  const maintenanceCount = await database.prepare("SELECT COUNT(*) AS count FROM maintenance_requests").first<{ count: number }>();
  if ((maintenanceCount?.count ?? 0) === 0 && aditi && projector) {
    await database.prepare(`INSERT INTO maintenance_requests
      (asset_id, requested_by, description, priority, status, technician, created_at)
      VALUES (?, ?, ?, 'HIGH', 'APPROVED', '', ?)`)
      .bind(projector.id, aditi.id, "Lamp flicker reported after repeated training-room usage.", Date.parse("2026-07-11T16:45:00Z"))
      .run();
  }

  const bookingCount = await database.prepare("SELECT COUNT(*) AS count FROM bookings").first<{ count: number }>();
  if ((bookingCount?.count ?? 0) === 0 && aditi && fleetCar) {
    await database.prepare(`INSERT INTO bookings
      (asset_id, employee_id, start_at, end_at, purpose, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'UPCOMING', ?)`)
      .bind(fleetCar.id, aditi.id, Date.parse("2026-07-15T09:00:00Z"), Date.parse("2026-07-15T12:00:00Z"), "Client visit transport reservation.", Date.parse("2026-07-12T08:05:00Z"))
      .run();
  }
}

async function seedCoreData() {
  const database = getD1();
  const departmentCount = await database.prepare("SELECT COUNT(*) AS count FROM departments").first<{ count: number }>();
  if ((departmentCount?.count ?? 0) === 0) {
    for (const department of seedDepartments) {
      await database.prepare("INSERT INTO departments (name, code, parent_id, head_employee_id, active, notes) VALUES (?, ?, NULL, NULL, ?, ?)")
        .bind(department.name, department.code, department.status === "Active" ? 1 : 0, department.notes)
        .run();
    }
  }

  for (const category of seedCategories) {
    await database.prepare(`INSERT OR IGNORE INTO asset_categories
      (name, code, description, useful_life, requires_serial, track_warranty, active)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(category.name, category.code, category.description, category.usefulLife, category.requiresSerial ? 1 : 0, category.trackWarranty ? 1 : 0, category.status === "Active" ? 1 : 0)
      .run();
  }

  const employees = await database.prepare("SELECT employee_id AS employeeId FROM employees").all<{ employeeId: string | null }>();
  const employeeCount = employees.results.length;
  if (employeeCount === 0) {
    for (const employee of seedEmployees) {
      const department = await database.prepare("SELECT id FROM departments WHERE code = ? LIMIT 1").bind(employee.departmentCode).first<{ id: number }>();
      await database.prepare(`INSERT INTO employees
        (name, email, employee_id, department_id, role, status, job_title, phone, location, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(employee.name, employee.email, employee.employeeId, department?.id ?? null, roleToDb(employee.role), employee.status.toUpperCase(), employee.jobTitle, employee.phone, employee.location, Date.now())
        .run();
    }
  } else {
    for (const employee of seedEmployees) {
      const existing = await database.prepare("SELECT id FROM employees WHERE email = ? LIMIT 1").bind(employee.email).first<{ id: number }>();
      if (!existing) {
        const department = await database.prepare("SELECT id FROM departments WHERE code = ? LIMIT 1").bind(employee.departmentCode).first<{ id: number }>();
        const currentIds = await database.prepare("SELECT employee_id AS employeeId FROM employees").all<{ employeeId: string | null }>();
        const requestedId = await database.prepare("SELECT id FROM employees WHERE employee_id = ? LIMIT 1").bind(employee.employeeId).first<{ id: number }>();
        await database.prepare(`INSERT INTO employees
          (name, email, employee_id, department_id, role, status, job_title, phone, location, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(employee.name, employee.email, requestedId ? makeEmployeeNumber(currentIds.results) : employee.employeeId, department?.id ?? null, roleToDb(employee.role), employee.status.toUpperCase(), employee.jobTitle, employee.phone, employee.location, Date.now())
          .run();
      } else if (seededAccountEmails.has(employee.email)) {
        const department = await database.prepare("SELECT id FROM departments WHERE code = ? LIMIT 1").bind(employee.departmentCode).first<{ id: number }>();
        await database.prepare(`UPDATE employees SET name = ?, employee_id = ?, department_id = ?, role = ?, status = ?, job_title = ?, location = ? WHERE id = ?`)
          .bind(employee.name, employee.employeeId, department?.id ?? null, roleToDb(employee.role), employee.status.toUpperCase(), employee.jobTitle, employee.location, existing.id)
          .run();
      }
    }
  }

  const fieldOps = await database.prepare("SELECT id FROM departments WHERE code = 'FLD' LIMIT 1").first<{ id: number }>();
  const operations = await database.prepare("SELECT id FROM departments WHERE code = 'OPS' LIMIT 1").first<{ id: number }>();
  if (fieldOps && operations) {
    await database.prepare("UPDATE departments SET parent_id = ? WHERE id = ?").bind(operations.id, fieldOps.id).run();
  }
  const headMap = [
    ["ENG", "25cs079@rmkcet.ac.in"],
    ["FAC", "25cs117@rmkcet.ac.in"],
    ["OPS", "25cy055@rmkcet.ac.in"],
    ["FLD", "sana.iqbal@assetflow.demo"],
  ] as const;
  for (const [departmentCode, email] of headMap) {
    const employee = await database.prepare("SELECT id FROM employees WHERE email = ? LIMIT 1").bind(email).first<{ id: number }>();
    if (employee) await database.prepare("UPDATE departments SET head_employee_id = ? WHERE code = ?").bind(employee.id, departmentCode).run();
  }

  for (const asset of seedAssetDirectory as AssetRecord[]) {
    const existing = await database.prepare("SELECT id FROM assets WHERE tag = ? LIMIT 1").bind(asset.tag).first<{ id: number }>();
    if (!existing) {
      await insertAssetRecord(asset);
    } else {
      const categoryId = await ensureCategoryId(asset.category);
      await database.prepare(`UPDATE assets
        SET name = COALESCE(NULLIF(name, ''), ?), category_id = ?, serial_number = COALESCE(serial_number, ?), acquisition_date = COALESCE(acquisition_date, ?), acquisition_cost = COALESCE(acquisition_cost, ?), condition = COALESCE(condition, ?), location = COALESCE(location, ?), status = COALESCE(status, ?), shared = COALESCE(shared, ?)
        WHERE id = ?`)
        .bind(asset.name, categoryId, asset.serialNumber, parseDate(asset.acquisitionDate, "Acquisition date"), asset.acquisitionCost, asset.condition, asset.location, dbStatusFromUi(asset.status), asset.shared ? 1 : 0, existing.id)
        .run();
      await database.prepare(`INSERT INTO asset_profiles (asset_id, department, qr_code, notes, last_updated, recent_activity, allocation_history, maintenance_history)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(asset_id) DO UPDATE SET
          department = COALESCE(NULLIF(asset_profiles.department, ''), excluded.department),
          qr_code = COALESCE(NULLIF(asset_profiles.qr_code, ''), excluded.qr_code),
          notes = COALESCE(NULLIF(asset_profiles.notes, ''), excluded.notes),
          last_updated = COALESCE(NULLIF(asset_profiles.last_updated, ''), excluded.last_updated),
          recent_activity = COALESCE(NULLIF(asset_profiles.recent_activity, ''), excluded.recent_activity)`)
        .bind(existing.id, asset.department, asset.qrCode, asset.notes, asset.lastUpdated, asset.recentActivity, JSON.stringify(asset.allocationHistory), JSON.stringify(asset.maintenanceHistory))
      .run();
    }
  }

  await seedInitialWorkflowRecords(database);

  for (const email of seededAccountEmails) {
    const employee = await database.prepare("SELECT id, email FROM employees WHERE email = ? LIMIT 1").bind(email).first<{ id: number; email: string }>();
    if (!employee) continue;
    const existingUser = await database.prepare("SELECT id FROM users WHERE email = ? LIMIT 1").bind(email).first<{ id: string }>();
    if (existingUser) {
      await database.prepare("UPDATE users SET employee_id = ?, password_hash = ? WHERE id = ?").bind(employee.id, hashPassword("Assetflow@123"), existingUser.id).run();
    } else {
      await database.prepare("INSERT INTO users (id, employee_id, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)")
        .bind(crypto.randomUUID(), employee.id, employee.email.toLowerCase(), hashPassword("Assetflow@123"), Date.now())
        .run();
    }
  }
}

export async function ensureCore() {
  if (!coreReady) {
    coreReady = (async () => {
      await ensureCoreSchema();
      await seedCoreData();
    })().catch((error) => {
      coreReady = undefined;
      throw error;
    });
  }
  return coreReady;
}

export function authCookieHeader(sessionId: string) {
  return `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionMaxAgeSeconds}`;
}

export function clearAuthCookieHeader() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

async function userFromSessionId(sessionId: string): Promise<AppUser | null> {
  if (!sessionId) return null;
  await ensureCore();
  const row = await getD1().prepare(`SELECT
      u.id AS id,
      e.id AS employeeId,
      e.name,
      u.email AS username,
      e.role AS employeeRole,
      e.status,
      e.department_id AS departmentId,
      d.name AS departmentName,
      s.expires_at AS expiresAt
    FROM sessions AS s
    INNER JOIN users AS u ON u.id = s.user_id
    INNER JOIN employees AS e ON e.id = u.employee_id
    LEFT JOIN departments AS d ON d.id = e.department_id
    WHERE s.id = ? LIMIT 1`).bind(sessionId).first<Record<string, unknown>>();
  if (!row || Number(row.expiresAt) < Date.now()) return null;
  const status = String(row.status) === "ACTIVE" ? "Active" : "Inactive";
  if (status !== "Active") return null;
  const employeeRole = roleFromDb(String(row.employeeRole));
  return {
    id: String(row.id),
    employeeId: String(row.employeeId),
    name: String(row.name),
    username: String(row.username),
    role: employeeRole === "Admin" ? "ADMIN" : "EMPLOYEE",
    employeeRole,
    status,
    departmentId: row.departmentId ? String(row.departmentId) : "",
    departmentName: String(row.departmentName ?? "Unassigned"),
  };
}

export async function currentUserFromRequest(request: Request) {
  return userFromSessionId(cookieFromRequest(request, SESSION_COOKIE));
}

export async function requireUser(request: Request) {
  const user = await currentUserFromRequest(request);
  if (!user) throw new ErpError("Sign in to continue.", 401);
  return user;
}

export function requireRole(user: AppUser, allowed: EmployeeRole[]) {
  if (!allowed.includes(user.employeeRole)) {
    throw new ErpError("You do not have permission to perform this action.", 403);
  }
}

export async function signUpUser(payload: unknown) {
  await ensureCore();
  const source = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const email = normalizeEmail(source.username ?? source.email);
  const name = requiredText(source.name, "Full name");
  const password = requiredText(source.password, "Password");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ErpError("Enter a valid work email.");
  if (password.length < 8) throw new ErpError("Password must have at least 8 characters.");
  const database = getD1();
  const existingUser = await database.prepare("SELECT id FROM users WHERE email = ? LIMIT 1").bind(email).first<{ id: string }>();
  if (existingUser) throw new ErpError("An account with this email already exists.", 409);

  let employee = await database.prepare("SELECT id FROM employees WHERE email = ? LIMIT 1").bind(email).first<{ id: number }>();
  if (!employee) {
    const departments = await listDepartments();
    const employees = await database.prepare("SELECT employee_id AS employeeId FROM employees").all<{ employeeId: string | null }>();
    const inserted = await database.prepare(`INSERT INTO employees
      (name, email, employee_id, department_id, role, status, job_title, phone, location, created_at)
      VALUES (?, ?, ?, ?, 'EMPLOYEE', 'ACTIVE', 'Employee', '', '', ?)`)
      .bind(name, email, makeEmployeeNumber(employees.results), Number(departments.find((department) => department.status === "Active")?.id ?? departments[0]?.id ?? 1), Date.now())
      .run();
    employee = { id: inserted.meta.last_row_id as number };
  }

  const userId = crypto.randomUUID();
  await database.prepare("INSERT INTO users (id, employee_id, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(userId, employee.id, email, hashPassword(password), Date.now())
    .run();
  await logActivity({ kind: "Organization", title: "Employee account created", description: `${name} joined as Employee.`, target: email, severity: "Info" });
  return { ok: true };
}

export async function signInUser(payload: unknown) {
  await ensureCore();
  const source = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const email = normalizeEmail(source.username ?? source.email);
  const password = requiredText(source.password, "Password");
  const database = getD1();
  const row = await database.prepare(`SELECT u.id AS userId, e.status
    FROM users AS u
    INNER JOIN employees AS e ON e.id = u.employee_id
    WHERE u.email = ? AND u.password_hash = ? LIMIT 1`)
    .bind(email, hashPassword(password))
    .first<{ userId: string; status: string }>();
  if (!row) throw new ErpError("Incorrect email or password.", 401);
  if (row.status !== "ACTIVE") throw new ErpError("Your employee profile is inactive. Contact an administrator.", 403);
  const sessionId = crypto.randomUUID();
  await database.prepare("INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .bind(sessionId, row.userId, Date.now(), Date.now() + sessionMaxAgeSeconds * 1000)
    .run();
  const user = await userFromSessionId(sessionId);
  await logActivity({ kind: "System", title: "User signed in", description: `${user?.name ?? email} opened the workspace.`, actorId: user?.employeeId, target: email, severity: "Info" });
  return { sessionId, user };
}

export async function signOutUser(request: Request) {
  await ensureCore();
  const sessionId = cookieFromRequest(request, SESSION_COOKIE);
  if (sessionId) await getD1().prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
}

async function listDepartments(): Promise<DepartmentRecord[]> {
  await ensureCore();
  const rows = await getD1().prepare(`SELECT id, name, code, head_employee_id AS headEmployeeId, parent_id AS parentId, active, notes
    FROM departments ORDER BY active DESC, name ASC`).all<Record<string, unknown>>();
  return rows.results.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    code: String(row.code ?? "").trim() || String(row.name).slice(0, 4).toUpperCase(),
    headEmployeeId: row.headEmployeeId ? String(row.headEmployeeId) : "",
    parentId: row.parentId ? String(row.parentId) : "",
    status: activeFromDb(row.active),
    notes: String(row.notes ?? ""),
  }));
}

async function listCategories(): Promise<AssetCategoryRecord[]> {
  await ensureCore();
  const rows = await getD1().prepare(`SELECT id, name, code, description, useful_life AS usefulLife, requires_serial AS requiresSerial, track_warranty AS trackWarranty, active
    FROM asset_categories ORDER BY active DESC, name ASC`).all<Record<string, unknown>>();
  return rows.results.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    code: String(row.code ?? "").trim() || String(row.name).slice(0, 4).toUpperCase(),
    description: String(row.description ?? ""),
    usefulLife: String(row.usefulLife ?? ""),
    requiresSerial: booleanFromDb(row.requiresSerial),
    trackWarranty: booleanFromDb(row.trackWarranty),
    status: activeFromDb(row.active),
  }));
}

async function listEmployees(): Promise<EmployeeRecord[]> {
  await ensureCore();
  const rows = await getD1().prepare(`SELECT id, name, email, employee_id AS employeeId, department_id AS departmentId, role, status, job_title AS jobTitle, phone, location
    FROM employees ORDER BY status ASC, name ASC`).all<Record<string, unknown>>();
  return rows.results.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    employeeId: String(row.employeeId ?? `AF-EMP-${String(row.id).padStart(3, "0")}`),
    departmentId: row.departmentId ? String(row.departmentId) : "",
    role: roleFromDb(String(row.role)),
    status: String(row.status) === "ACTIVE" ? "Active" : "Inactive",
    jobTitle: String(row.jobTitle ?? ""),
    phone: String(row.phone ?? ""),
    location: String(row.location ?? ""),
  }));
}

export async function listOrganization() {
  const [departments, categories, employees] = await Promise.all([listDepartments(), listCategories(), listEmployees()]);
  return { departments, categories, employees };
}

export async function saveDepartment(payload: unknown, id?: string) {
  await ensureCore();
  const source = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const name = requiredText(source.name, "Department name");
  const code = requiredText(source.code, "Department code").toUpperCase();
  const headEmployeeId = optionalText(source.headEmployeeId) ? Number(source.headEmployeeId) : null;
  const parentId = optionalText(source.parentId) ? Number(source.parentId) : null;
  const active = source.status === "Inactive" ? 0 : 1;
  const notes = optionalText(source.notes);
  const database = getD1();
  if (id) {
    await database.prepare("UPDATE departments SET name = ?, code = ?, head_employee_id = ?, parent_id = ?, active = ?, notes = ? WHERE id = ?")
      .bind(name, code, headEmployeeId, parentId, active, notes, Number(id)).run();
  } else {
    await database.prepare("INSERT INTO departments (name, code, head_employee_id, parent_id, active, notes) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(name, code, headEmployeeId, parentId, active, notes).run();
  }
  await logActivity({ kind: "Organization", title: id ? "Department updated" : "Department created", description: `${name} (${code})`, target: code, severity: "Success" });
  return listOrganization();
}

export async function saveCategory(payload: unknown, id?: string) {
  await ensureCore();
  const source = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const name = requiredText(source.name, "Category name");
  const code = requiredText(source.code, "Category code").toUpperCase();
  const active = source.status === "Inactive" ? 0 : 1;
  const database = getD1();
  if (id) {
    await database.prepare(`UPDATE asset_categories SET name = ?, code = ?, description = ?, useful_life = ?, requires_serial = ?, track_warranty = ?, active = ? WHERE id = ?`)
      .bind(name, code, optionalText(source.description), optionalText(source.usefulLife), source.requiresSerial ? 1 : 0, source.trackWarranty ? 1 : 0, active, Number(id)).run();
  } else {
    await database.prepare(`INSERT INTO asset_categories (name, code, description, useful_life, requires_serial, track_warranty, active)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(name, code, optionalText(source.description), optionalText(source.usefulLife), source.requiresSerial ? 1 : 0, source.trackWarranty ? 1 : 0, active).run();
  }
  await logActivity({ kind: "Organization", title: id ? "Category updated" : "Category created", description: `${name} (${code})`, target: code, severity: "Success" });
  return listOrganization();
}

export async function saveEmployee(payload: unknown, id?: string) {
  await ensureCore();
  const source = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const name = requiredText(source.name, "Employee name");
  const email = normalizeEmail(source.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ErpError("Enter a valid email address.");
  const employeeId = requiredText(source.employeeId, "Employee ID").toUpperCase();
  const departmentId = requiredId(source.departmentId, "Department");
  const role = roleToDb((source.role as EmployeeRole) ?? "Employee");
  const status = source.status === "Inactive" ? "INACTIVE" : "ACTIVE";
  const database = getD1();
  if (id) {
    await database.prepare(`UPDATE employees SET name = ?, email = ?, employee_id = ?, department_id = ?, role = ?, status = ?, job_title = ?, phone = ?, location = ? WHERE id = ?`)
      .bind(name, email, employeeId, departmentId, role, status, optionalText(source.jobTitle), optionalText(source.phone), optionalText(source.location), Number(id)).run();
  } else {
    await database.prepare(`INSERT INTO employees (name, email, employee_id, department_id, role, status, job_title, phone, location, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(name, email, employeeId, departmentId, role, status, optionalText(source.jobTitle), optionalText(source.phone), optionalText(source.location), Date.now()).run();
  }
  await logActivity({ kind: "Organization", title: id ? "Employee updated" : "Employee created", description: `${name} assigned as ${roleFromDb(role)}.`, target: employeeId, severity: "Success" });
  return listOrganization();
}

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

const assetSelect = `SELECT a.id, a.tag, a.name, c.name AS category, a.serial_number AS serialNumber,
  a.acquisition_date AS acquisitionDate, a.acquisition_cost AS acquisitionCost, a.status, a.location,
  a.condition, a.shared, p.department, p.qr_code AS qrCode, p.notes, p.last_updated AS lastUpdated,
  p.recent_activity AS recentActivity, p.allocation_history AS allocationHistory, p.maintenance_history AS maintenanceHistory
  FROM assets AS a
  INNER JOIN asset_categories AS c ON c.id = a.category_id
  LEFT JOIN asset_profiles AS p ON p.asset_id = a.id`;

function assetRecord(row: AssetRow): AssetRecord & { id: string } {
  return {
    id: String(row.id),
    tag: row.tag,
    name: row.name,
    category: row.category,
    serialNumber: row.serialNumber ?? "",
    acquisitionDate: dateOnly(row.acquisitionDate),
    acquisitionCost: row.acquisitionCost ?? 0,
    status: uiStatusFromDb(row.status),
    department: row.department ?? "Unassigned",
    location: row.location ?? "Unassigned",
    condition: conditionFromDb(row.condition),
    shared: Boolean(row.shared),
    qrCode: row.qrCode ?? `QR-${row.tag}`,
    notes: row.notes ?? "No notes added.",
    lastUpdated: row.lastUpdated ?? "Recently updated",
    recentActivity: row.recentActivity ?? "Asset directory record created",
    allocationHistory: safeJson<HistoryEntry[]>(row.allocationHistory, []),
    maintenanceHistory: safeJson<HistoryEntry[]>(row.maintenanceHistory, []),
  };
}

async function findAsset(tagOrId: string) {
  await ensureCore();
  const numericId = Number(tagOrId);
  const row = Number.isInteger(numericId)
    ? await getD1().prepare(`${assetSelect} WHERE a.id = ? LIMIT 1`).bind(numericId).first<AssetRow>()
    : await getD1().prepare(`${assetSelect} WHERE a.tag = ? LIMIT 1`).bind(tagOrId).first<AssetRow>();
  if (!row) throw new ErpError("Asset was not found.", 404);
  return row;
}

async function updateAssetHistory(assetId: number, patch: Partial<AssetRecord>) {
  const current = await getD1().prepare(`SELECT p.department, p.qr_code AS qrCode, p.notes, p.last_updated AS lastUpdated,
      p.recent_activity AS recentActivity, p.allocation_history AS allocationHistory, p.maintenance_history AS maintenanceHistory, a.tag
    FROM assets AS a
    LEFT JOIN asset_profiles AS p ON p.asset_id = a.id
    WHERE a.id = ? LIMIT 1`).bind(assetId).first<{
      department: string | null;
      qrCode: string | null;
      notes: string | null;
      lastUpdated: string | null;
      recentActivity: string | null;
      allocationHistory: string | null;
      maintenanceHistory: string | null;
      tag: string | null;
    }>();
  const allocationHistory = patch.allocationHistory ?? safeJson<HistoryEntry[]>(current?.allocationHistory, []);
  const maintenanceHistory = patch.maintenanceHistory ?? safeJson<HistoryEntry[]>(current?.maintenanceHistory, []);
  await getD1().prepare(`INSERT INTO asset_profiles (asset_id, department, qr_code, notes, last_updated, recent_activity, allocation_history, maintenance_history)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(asset_id) DO UPDATE SET
      department = excluded.department,
      qr_code = excluded.qr_code,
      notes = excluded.notes,
      last_updated = excluded.last_updated,
      recent_activity = excluded.recent_activity,
      allocation_history = excluded.allocation_history,
      maintenance_history = excluded.maintenance_history`)
    .bind(
      assetId,
      patch.department ?? current?.department ?? "Unassigned",
      patch.qrCode ?? current?.qrCode ?? `QR-${current?.tag ?? assetId}`,
      patch.notes ?? current?.notes ?? "No notes added.",
      patch.lastUpdated ?? current?.lastUpdated ?? "Just now",
      patch.recentActivity ?? current?.recentActivity ?? "Updated",
      JSON.stringify(allocationHistory),
      JSON.stringify(maintenanceHistory),
    ).run();
}

async function updateAssetState(assetId: number, patch: { status?: LifecycleStatus; condition?: AssetCondition; location?: string }) {
  const fields: string[] = [];
  const values: unknown[] = [];
  if (patch.status) {
    fields.push("status = ?");
    values.push(dbStatusFromUi(patch.status));
  }
  if (patch.condition) {
    fields.push("condition = ?");
    values.push(patch.condition);
  }
  if (patch.location) {
    fields.push("location = ?");
    values.push(patch.location);
  }
  if (fields.length === 0) return;
  values.push(assetId);
  await getD1().prepare(`UPDATE assets SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
}

async function setAssetStatus(assetId: number, status: LifecycleStatus, condition?: AssetCondition) {
  await updateAssetState(assetId, { status, condition });
}

export async function listAllocations() {
  await ensureCore();
  const rows = await getD1().prepare(`SELECT al.id, al.asset_id AS assetId, a.tag AS assetTag, a.name AS assetName,
      al.employee_id AS employeeId, e.name AS employeeName, al.department_id AS departmentId, d.name AS departmentName,
      al.created_at AS allocatedAt, al.expected_return_at AS dueAt, al.returned_at AS returnedAt, al.status,
      al.reason, al.requested_to_employee_id AS requestedToEmployeeId, te.name AS requestedToEmployeeName,
      al.condition_out AS conditionOut, al.condition_in AS conditionIn, al.notes, al.check_in_notes AS checkInNotes
    FROM allocations AS al
    INNER JOIN assets AS a ON a.id = al.asset_id
    LEFT JOIN employees AS e ON e.id = al.employee_id
    LEFT JOIN employees AS te ON te.id = al.requested_to_employee_id
    LEFT JOIN departments AS d ON d.id = al.department_id
    ORDER BY al.created_at DESC`).all<Record<string, unknown>>();
  return rows.results.map((row) => {
    const status = row.status === "TRANSFER_PENDING" ? "Transfer Pending" : row.status === "RETURNED" ? "Returned" : row.status === "TRANSFERRED" ? "Transferred" : "Active";
    const due = Number(row.dueAt) || 0;
    return {
      id: String(row.id),
      assetTag: String(row.assetTag),
      assetName: String(row.assetName),
      employeeId: row.employeeId ? String(row.employeeId) : "",
      employeeName: String(row.employeeName ?? "Unassigned"),
      departmentId: row.departmentId ? String(row.departmentId) : "",
      departmentName: String(row.departmentName ?? "Unassigned"),
      allocatedAt: dateOnly(Number(row.allocatedAt)),
      dueAt: dateOnly(due),
      status,
      reason: String(row.reason ?? ""),
      requestedToEmployeeId: row.requestedToEmployeeId ? String(row.requestedToEmployeeId) : undefined,
      requestedToEmployeeName: row.requestedToEmployeeName ? String(row.requestedToEmployeeName) : undefined,
      returnedAt: dateOnly(Number(row.returnedAt)),
      conditionOut: conditionFromDb(String(row.conditionOut ?? "")),
      conditionIn: row.conditionIn ? conditionFromDb(String(row.conditionIn)) : undefined,
      notes: String(row.notes ?? row.checkInNotes ?? ""),
      overdue: status !== "Returned" && due > 0 && due < Date.now(),
    } satisfies AllocationRecord;
  });
}

async function activeAllocationForAsset(assetId: number) {
  return getD1().prepare(`SELECT al.*, e.name AS employeeName
    FROM allocations AS al
    LEFT JOIN employees AS e ON e.id = al.employee_id
    WHERE al.asset_id = ? AND al.status IN ('ACTIVE', 'TRANSFER_PENDING')
    ORDER BY al.created_at DESC LIMIT 1`).bind(assetId).first<Record<string, unknown>>();
}

export async function createAllocation(payload: unknown, actor?: AppUser) {
  await ensureCore();
  const source = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const asset = await findAsset(requiredText(source.assetTag ?? source.assetId, "Asset"));
  const targetId = requiredId(source.employeeId, "Employee");
  const target = await getD1().prepare("SELECT id, name, department_id AS departmentId, location FROM employees WHERE id = ? AND status = 'ACTIVE' LIMIT 1").bind(targetId).first<Record<string, unknown>>();
  if (!target) throw new ErpError("Choose an active employee.", 404);
  const active = await activeAllocationForAsset(asset.id);
  if (active || asset.status !== "AVAILABLE") {
    throw new ErpError(`${asset.tag} is currently held by ${String(active?.employeeName ?? uiStatusFromDb(asset.status))}.`, 409, {
      currentHolder: active?.employeeName ?? "",
      allocationId: active?.id ? String(active.id) : "",
    });
  }
  const dueAt = parseDate(source.dueAt ?? source.expectedReturnAt, "Expected return date");
  const reason = optionalText(source.reason) || "Standard allocation.";
  const now = Date.now();
  const database = getD1();
  const inserted = await database.prepare(`INSERT INTO allocations
    (asset_id, employee_id, department_id, expected_return_at, status, created_at, reason, condition_out, notes)
    VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?)`)
    .bind(asset.id, Number(target.id), Number(target.departmentId), dueAt, now, reason, asset.condition ?? "Good", `Allocated to ${String(target.name)}.`)
    .run();
  const department = await database.prepare("SELECT name FROM departments WHERE id = ? LIMIT 1").bind(Number(target.departmentId)).first<{ name: string }>();
  const record = assetRecord(asset);
  await updateAssetState(asset.id, { status: "Allocated", location: String(target.location ?? record.location) });
  await updateAssetHistory(asset.id, {
    ...record,
    department: department?.name ?? record.department,
    location: String(target.location ?? record.location),
    lastUpdated: "Just now",
    recentActivity: `Allocated to ${String(target.name)}`,
    allocationHistory: [{ date: new Date(now).toISOString().slice(0, 10), title: `Allocated to ${String(target.name)}`, detail: reason }, ...record.allocationHistory],
  });
  await logActivity({ kind: "Asset", title: "Asset allocated", description: `${asset.tag} assigned to ${String(target.name)}.`, actorId: actor?.employeeId, target: asset.tag, severity: "Success" });
  return { id: String(inserted.meta.last_row_id), allocations: await listAllocations() };
}

export async function requestTransfer(allocationId: string, payload: unknown, actor?: AppUser) {
  await ensureCore();
  const source = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const targetId = requiredId(source.employeeId ?? source.toEmployeeId, "Transfer target");
  const reason = requiredText(source.reason, "Transfer reason");
  const database = getD1();
  const allocation = await database.prepare(`SELECT al.*, a.tag, a.name AS assetName, e.name AS holderName
    FROM allocations AS al
    INNER JOIN assets AS a ON a.id = al.asset_id
    LEFT JOIN employees AS e ON e.id = al.employee_id
    WHERE al.id = ? LIMIT 1`).bind(Number(allocationId)).first<Record<string, unknown>>();
  if (!allocation || allocation.status === "RETURNED") throw new ErpError("Active allocation was not found.", 404);
  if (Number(allocation.employee_id) === targetId) throw new ErpError("Choose a different employee for transfer.");
  const target = await database.prepare("SELECT name FROM employees WHERE id = ? AND status = 'ACTIVE' LIMIT 1").bind(targetId).first<{ name: string }>();
  if (!target) throw new ErpError("Transfer target is not active.", 404);
  await database.prepare("UPDATE allocations SET status = 'TRANSFER_PENDING', requested_to_employee_id = ?, reason = ? WHERE id = ?")
    .bind(targetId, reason, Number(allocationId)).run();
  await database.prepare(`INSERT INTO transfer_requests (id, allocation_id, asset_id, from_employee_id, to_employee_id, reason, status, requested_at)
    VALUES (?, ?, ?, ?, ?, ?, 'REQUESTED', ?)`)
    .bind(crypto.randomUUID(), Number(allocationId), Number(allocation.asset_id), Number(allocation.employee_id), targetId, reason, Date.now()).run();
  await logActivity({ kind: "Approval", title: "Transfer requested", description: `${String(allocation.tag)} from ${String(allocation.holderName)} to ${target.name}.`, actorId: actor?.employeeId, target: String(allocation.tag), severity: "Info" });
  return listAllocations();
}

export async function decideTransfer(allocationId: string, decision: "APPROVED" | "REJECTED", actor?: AppUser) {
  await ensureCore();
  const database = getD1();
  const allocation = await database.prepare(`SELECT al.*, a.tag, a.name AS assetName, a.location AS assetLocation, p.allocation_history AS allocationHistory, p.maintenance_history AS maintenanceHistory, p.notes, p.qr_code AS qrCode,
      e.name AS holderName, te.name AS targetName, te.department_id AS targetDepartmentId, te.location AS targetLocation
    FROM allocations AS al
    INNER JOIN assets AS a ON a.id = al.asset_id
    LEFT JOIN asset_profiles AS p ON p.asset_id = al.asset_id
    LEFT JOIN employees AS e ON e.id = al.employee_id
    LEFT JOIN employees AS te ON te.id = al.requested_to_employee_id
    WHERE al.id = ? LIMIT 1`).bind(Number(allocationId)).first<Record<string, unknown>>();
  if (!allocation || allocation.status !== "TRANSFER_PENDING" || !allocation.requested_to_employee_id) {
    throw new ErpError("No pending transfer was found for this allocation.", 404);
  }
  if (decision === "REJECTED") {
    await database.prepare("UPDATE allocations SET status = 'ACTIVE', requested_to_employee_id = NULL WHERE id = ?").bind(Number(allocationId)).run();
    await database.prepare("UPDATE transfer_requests SET status = 'REJECTED', decided_at = ?, decided_by = ? WHERE allocation_id = ? AND status = 'REQUESTED'")
      .bind(Date.now(), actor?.employeeId ? Number(actor.employeeId) : null, Number(allocationId)).run();
    await logActivity({ kind: "Approval", title: "Transfer rejected", description: `${String(allocation.tag)} remains with ${String(allocation.holderName)}.`, actorId: actor?.employeeId, target: String(allocation.tag), severity: "Warning" });
    return listAllocations();
  }
  const now = Date.now();
  await database.prepare(`UPDATE allocations SET employee_id = ?, department_id = ?, status = 'ACTIVE', requested_to_employee_id = NULL, created_at = ?, notes = ? WHERE id = ?`)
    .bind(Number(allocation.requested_to_employee_id), Number(allocation.targetDepartmentId), now, `Transfer approved to ${String(allocation.targetName)}.`, Number(allocationId)).run();
  await database.prepare("UPDATE transfer_requests SET status = 'APPROVED', decided_at = ?, decided_by = ? WHERE allocation_id = ? AND status = 'REQUESTED'")
    .bind(now, actor?.employeeId ? Number(actor.employeeId) : null, Number(allocationId)).run();
  const department = await database.prepare("SELECT name FROM departments WHERE id = ? LIMIT 1").bind(Number(allocation.targetDepartmentId)).first<{ name: string }>();
  await updateAssetState(Number(allocation.asset_id), { status: "Allocated", location: String(allocation.targetLocation ?? allocation.assetLocation ?? "Unassigned") });
  await updateAssetHistory(Number(allocation.asset_id), {
    tag: String(allocation.tag),
    name: String(allocation.assetName),
    category: "",
    serialNumber: "",
    acquisitionDate: "",
    acquisitionCost: 0,
    status: "Allocated",
    department: department?.name ?? "Unassigned",
    location: String(allocation.targetLocation ?? "Unassigned"),
    condition: conditionFromDb(String(allocation.condition_out ?? "")),
    shared: false,
    qrCode: String(allocation.qrCode ?? `QR-${allocation.tag}`),
    notes: String(allocation.notes ?? "No notes added."),
    lastUpdated: "Just now",
    recentActivity: `Transferred to ${String(allocation.targetName)}`,
    allocationHistory: [{ date: new Date(now).toISOString().slice(0, 10), title: `Transferred to ${String(allocation.targetName)}`, detail: String(allocation.reason ?? "Transfer approved.") }, ...safeJson<HistoryEntry[]>(String(allocation.allocationHistory ?? "[]"), [])],
    maintenanceHistory: safeJson<HistoryEntry[]>(String(allocation.maintenanceHistory ?? "[]"), []),
  });
  await logActivity({ kind: "Approval", title: "Transfer approved", description: `${String(allocation.tag)} transferred to ${String(allocation.targetName)}.`, actorId: actor?.employeeId, target: String(allocation.tag), severity: "Success" });
  return listAllocations();
}

export async function returnAllocation(allocationId: string, payload: unknown, actor?: AppUser) {
  await ensureCore();
  const source = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const condition = conditions.includes(source.condition as AssetCondition) ? source.condition as AssetCondition : "Good";
  const notes = optionalText(source.notes) || "Returned with condition check.";
  const database = getD1();
  const allocation = await database.prepare(`SELECT al.*, a.tag, a.name AS assetName, a.location AS assetLocation,
      p.department, p.allocation_history AS allocationHistory, p.maintenance_history AS maintenanceHistory, p.qr_code AS qrCode, p.notes AS assetNotes, e.name AS holderName
    FROM allocations AS al
    INNER JOIN assets AS a ON a.id = al.asset_id
    LEFT JOIN asset_profiles AS p ON p.asset_id = al.asset_id
    LEFT JOIN employees AS e ON e.id = al.employee_id
    WHERE al.id = ? LIMIT 1`).bind(Number(allocationId)).first<Record<string, unknown>>();
  if (!allocation || allocation.status === "RETURNED") throw new ErpError("Active allocation was not found.", 404);
  const now = Date.now();
  await database.prepare("UPDATE allocations SET status = 'RETURNED', returned_at = ?, condition_in = ?, check_in_notes = ?, notes = ? WHERE id = ?")
    .bind(now, condition, notes, notes, Number(allocationId)).run();
  await setAssetStatus(Number(allocation.asset_id), "Available", condition);
  await updateAssetHistory(Number(allocation.asset_id), {
    tag: String(allocation.tag),
    name: String(allocation.assetName),
    category: "",
    serialNumber: "",
    acquisitionDate: "",
    acquisitionCost: 0,
    status: "Available",
    department: String(allocation.department ?? "Unassigned"),
    location: String(allocation.assetLocation ?? "Unassigned"),
    condition,
    shared: false,
    qrCode: String(allocation.qrCode ?? `QR-${allocation.tag}`),
    notes: String(allocation.assetNotes ?? "No notes added."),
    lastUpdated: "Just now",
    recentActivity: `Returned by ${String(allocation.holderName)}`,
    allocationHistory: [{ date: new Date(now).toISOString().slice(0, 10), title: `Returned by ${String(allocation.holderName)}`, detail: notes }, ...safeJson<HistoryEntry[]>(String(allocation.allocationHistory ?? "[]"), [])],
    maintenanceHistory: safeJson<HistoryEntry[]>(String(allocation.maintenanceHistory ?? "[]"), []),
  });
  await logActivity({ kind: "Asset", title: "Asset returned", description: `${String(allocation.tag)} returned by ${String(allocation.holderName)}.`, actorId: actor?.employeeId, target: String(allocation.tag), severity: "Success" });
  return listAllocations();
}

export async function listBookings() {
  await ensureCore();
  const rows = await getD1().prepare(`SELECT b.id, b.asset_id AS assetId, a.tag AS assetTag, a.name AS assetName, b.employee_id AS employeeId, e.name AS employeeName,
      b.start_at AS startAt, b.end_at AS endAt, b.purpose, b.status
    FROM bookings AS b
    INNER JOIN assets AS a ON a.id = b.asset_id
    LEFT JOIN employees AS e ON e.id = b.employee_id
    ORDER BY b.start_at DESC`).all<Record<string, unknown>>();
  const now = Date.now();
  return rows.results.map((row) => {
    let status = String(row.status) as BookingStatus;
    if (status !== "CANCELLED") {
      if (Number(row.endAt) < now) status = "COMPLETED";
      else if (Number(row.startAt) <= now && Number(row.endAt) >= now) status = "ONGOING";
      else status = "UPCOMING";
    }
    return {
      id: String(row.id),
      assetId: String(row.assetId),
      assetTag: String(row.assetTag),
      assetName: String(row.assetName),
      employeeId: String(row.employeeId),
      employeeName: String(row.employeeName ?? "Unassigned"),
      startAt: new Date(Number(row.startAt)).toISOString(),
      endAt: new Date(Number(row.endAt)).toISOString(),
      purpose: String(row.purpose ?? ""),
      status,
    } satisfies BookingRecord;
  });
}

async function refreshReservedStatus(assetId: number) {
  const active = await getD1().prepare("SELECT id FROM bookings WHERE asset_id = ? AND status != 'CANCELLED' AND end_at >= ? LIMIT 1").bind(assetId, Date.now()).first<{ id: number }>();
  if (active) await setAssetStatus(assetId, "Reserved");
  else {
    const allocation = await activeAllocationForAsset(assetId);
    if (!allocation) await setAssetStatus(assetId, "Available");
  }
}

export async function createBooking(payload: unknown, actor?: AppUser) {
  await ensureCore();
  const source = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const asset = await findAsset(requiredText(source.assetId ?? source.assetTag, "Resource"));
  if (!booleanFromDb(asset.shared)) throw new ErpError("Only shared/bookable assets can be booked.");
  const employeeId = source.employeeId ? requiredId(source.employeeId, "Employee") : Number(actor?.employeeId);
  if (!employeeId) throw new ErpError("Employee is required.");
  const startAt = parseDateTime(source.startAt, "Start time");
  const endAt = parseDateTime(source.endAt, "End time");
  if (endAt <= startAt) throw new ErpError("End time must be after start time.");
  const conflict = await getD1().prepare(`SELECT id FROM bookings WHERE asset_id = ? AND status != 'CANCELLED' AND start_at < ? AND end_at > ? LIMIT 1`)
    .bind(asset.id, endAt, startAt).first<{ id: number }>();
  if (conflict) throw new ErpError("This resource is already booked for part of that time.", 409);
  const purpose = optionalText(source.purpose) || "Resource booking";
  const inserted = await getD1().prepare("INSERT INTO bookings (asset_id, employee_id, start_at, end_at, purpose, status, created_at) VALUES (?, ?, ?, ?, ?, 'UPCOMING', ?)")
    .bind(asset.id, employeeId, startAt, endAt, purpose, Date.now()).run();
  await refreshReservedStatus(asset.id);
  await logActivity({ kind: "Booking", title: "Booking confirmed", description: `${asset.name} reserved for ${purpose}.`, actorId: actor?.employeeId ?? String(employeeId), target: asset.tag, severity: "Success" });
  return { id: String(inserted.meta.last_row_id), bookings: await listBookings() };
}

export async function cancelBooking(id: string, actor?: AppUser) {
  await ensureCore();
  const booking = await getD1().prepare("SELECT asset_id AS assetId, purpose FROM bookings WHERE id = ? LIMIT 1").bind(Number(id)).first<{ assetId: number; purpose: string }>();
  if (!booking) throw new ErpError("Booking was not found.", 404);
  await getD1().prepare("UPDATE bookings SET status = 'CANCELLED' WHERE id = ? AND status != 'COMPLETED'").bind(Number(id)).run();
  await refreshReservedStatus(booking.assetId);
  await logActivity({ kind: "Booking", title: "Booking cancelled", description: booking.purpose || "Resource booking cancelled.", actorId: actor?.employeeId, target: String(id), severity: "Info" });
  return listBookings();
}

export async function rescheduleBooking(id: string, payload: unknown, actor?: AppUser) {
  await ensureCore();
  const source = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const startAt = parseDateTime(source.startAt, "Start time");
  const endAt = parseDateTime(source.endAt, "End time");
  if (endAt <= startAt) throw new ErpError("End time must be after start time.");
  const booking = await getD1().prepare("SELECT asset_id AS assetId FROM bookings WHERE id = ? AND status != 'CANCELLED' LIMIT 1").bind(Number(id)).first<{ assetId: number }>();
  if (!booking) throw new ErpError("Active booking was not found.", 404);
  const conflict = await getD1().prepare(`SELECT id FROM bookings WHERE id != ? AND asset_id = ? AND status != 'CANCELLED' AND start_at < ? AND end_at > ? LIMIT 1`)
    .bind(Number(id), booking.assetId, endAt, startAt).first<{ id: number }>();
  if (conflict) throw new ErpError("This resource is already booked for part of that time.", 409);
  await getD1().prepare("UPDATE bookings SET start_at = ?, end_at = ?, status = 'UPCOMING' WHERE id = ?").bind(startAt, endAt, Number(id)).run();
  await refreshReservedStatus(booking.assetId);
  await logActivity({ kind: "Booking", title: "Booking rescheduled", description: `Booking #${id} moved to a new slot.`, actorId: actor?.employeeId, target: String(id), severity: "Info" });
  return listBookings();
}

export async function listMaintenance() {
  await ensureCore();
  const rows = await getD1().prepare(`SELECT m.id, m.asset_id AS assetId, a.tag AS assetTag, a.name AS assetName, m.requested_by AS requestedBy, e.name AS requestedByName,
      m.description, m.priority, m.status, m.technician, m.created_at AS createdAt, m.resolved_at AS resolvedAt
    FROM maintenance_requests AS m
    INNER JOIN assets AS a ON a.id = m.asset_id
    LEFT JOIN employees AS e ON e.id = m.requested_by
    ORDER BY m.created_at DESC`).all<Record<string, unknown>>();
  return rows.results.map((row) => ({
    id: String(row.id),
    assetId: String(row.assetId),
    assetTag: String(row.assetTag),
    assetName: String(row.assetName),
    requestedBy: String(row.requestedBy),
    requestedByName: String(row.requestedByName ?? "Unassigned"),
    description: String(row.description),
    priority: String(row.priority) as Priority,
    status: String(row.status) as MaintenanceStatus,
    technician: String(row.technician ?? ""),
    createdAt: iso(Number(row.createdAt)),
    resolvedAt: iso(Number(row.resolvedAt)),
  } satisfies MaintenanceRecord));
}

export async function createMaintenance(payload: unknown, actor?: AppUser) {
  await ensureCore();
  const source = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const asset = await findAsset(requiredText(source.assetId ?? source.assetTag, "Asset"));
  const priority = ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(String(source.priority)) ? String(source.priority) as Priority : "MEDIUM";
  const requestedBy = source.requestedBy ? requiredId(source.requestedBy, "Requester") : Number(actor?.employeeId);
  if (!requestedBy) throw new ErpError("Requester is required.");
  const description = requiredText(source.description, "Issue description");
  const inserted = await getD1().prepare(`INSERT INTO maintenance_requests (asset_id, requested_by, description, priority, status, technician, created_at)
    VALUES (?, ?, ?, ?, 'PENDING', '', ?)`).bind(asset.id, requestedBy, description, priority, Date.now()).run();
  await logActivity({ kind: "Maintenance", title: "Maintenance requested", description: `${asset.tag}: ${description}`, actorId: actor?.employeeId ?? String(requestedBy), target: asset.tag, severity: priority === "HIGH" || priority === "CRITICAL" ? "Warning" : "Info" });
  return { id: String(inserted.meta.last_row_id), requests: await listMaintenance() };
}

export async function transitionMaintenanceRequest(id: string, payload: unknown, actor?: AppUser) {
  await ensureCore();
  const source = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const action = requiredText(source.action, "Action");
  const database = getD1();
  const request = await database.prepare(`SELECT m.*, a.tag, a.name AS assetName, a.status AS assetStatus, a.condition AS assetCondition, a.location AS assetLocation,
      p.department, p.maintenance_history AS maintenanceHistory, p.allocation_history AS allocationHistory, p.qr_code AS qrCode, p.notes
    FROM maintenance_requests AS m
    INNER JOIN assets AS a ON a.id = m.asset_id
    LEFT JOIN asset_profiles AS p ON p.asset_id = m.asset_id
    WHERE m.id = ? LIMIT 1`).bind(Number(id)).first<Record<string, unknown>>();
  if (!request) throw new ErpError("Maintenance request was not found.", 404);
  const current = String(request.status) as MaintenanceStatus;
  let next: MaintenanceStatus = current;
  let technician = String(request.technician ?? "");
  if (action === "APPROVE" && current === "PENDING") next = "APPROVED";
  else if (action === "REJECT" && current === "PENDING") next = "REJECTED";
  else if (action === "ASSIGN_TECHNICIAN" && current === "APPROVED") {
    technician = requiredText(source.technician, "Technician");
    next = "TECHNICIAN_ASSIGNED";
  } else if (action === "START_WORK" && current === "TECHNICIAN_ASSIGNED") next = "IN_PROGRESS";
  else if (action === "RESOLVE" && current === "IN_PROGRESS") next = "RESOLVED";
  else throw new ErpError(`${action} cannot be applied while request is ${current}.`, 409);

  const now = Date.now();
  await database.prepare("UPDATE maintenance_requests SET status = ?, technician = ?, resolved_at = ? WHERE id = ?")
    .bind(next, technician, next === "RESOLVED" ? now : null, Number(id)).run();
  if (next === "APPROVED") await setAssetStatus(Number(request.asset_id), "Under Maintenance", "Needs Service");
  if (next === "RESOLVED") await setAssetStatus(Number(request.asset_id), "Available", "Good");
  const maintenanceHistory = safeJson<HistoryEntry[]>(String(request.maintenanceHistory ?? "[]"), []);
  const lifecycleStatus: LifecycleStatus = next === "RESOLVED" ? "Available" : next === "REJECTED" ? uiStatusFromDb(String(request.assetStatus)) : "Under Maintenance";
  await updateAssetHistory(Number(request.asset_id), {
    tag: String(request.tag),
    name: String(request.assetName),
    category: "",
    serialNumber: "",
    acquisitionDate: "",
    acquisitionCost: 0,
    status: lifecycleStatus,
    department: String(request.department ?? "Unassigned"),
    location: String(request.assetLocation ?? "Unassigned"),
    condition: next === "RESOLVED" ? "Good" : next === "REJECTED" ? conditionFromDb(String(request.assetCondition ?? "")) : "Needs Service",
    shared: false,
    qrCode: String(request.qrCode ?? `QR-${request.tag}`),
    notes: String(request.notes ?? "No notes added."),
    lastUpdated: "Just now",
    recentActivity: `Maintenance ${next.toLowerCase().replaceAll("_", " ")}`,
    allocationHistory: safeJson<HistoryEntry[]>(String(request.allocationHistory ?? "[]"), []),
    maintenanceHistory: [{ date: new Date(now).toISOString().slice(0, 10), title: `Maintenance ${next.toLowerCase().replaceAll("_", " ")}`, detail: String(request.description) }, ...maintenanceHistory],
  });
  await logActivity({ kind: "Maintenance", title: "Maintenance updated", description: `${String(request.tag)} moved to ${next.replaceAll("_", " ")}.`, actorId: actor?.employeeId, target: String(request.tag), severity: next === "RESOLVED" ? "Success" : "Info" });
  return listMaintenance();
}

export async function listAudits() {
  await ensureCore();
  const rows = await getD1().prepare("SELECT * FROM audit_cycles ORDER BY started_at DESC").all<Record<string, unknown>>();
  const departments = await listDepartments();
  return Promise.all(rows.results.map(async (row) => {
    const summary = await auditSummary(String(row.id));
    const assignments = await getD1().prepare("SELECT employee_id AS employeeId FROM audit_assignments WHERE audit_cycle_id = ?").bind(String(row.id)).all<{ employeeId: string }>();
    const departmentId = String(row.department_id ?? "");
    return {
      id: String(row.id),
      departmentId,
      departmentName: departments.find((department) => department.id === departmentId)?.name ?? "All departments",
      locationId: String(row.location_id ?? ""),
      status: String(row.status) === "CLOSED" ? "CLOSED" : "ACTIVE",
      startedAt: iso(Number(row.started_at)),
      closedAt: iso(Number(row.closed_at)),
      createdBy: String(row.created_by ?? ""),
      auditorIds: assignments.results.map((item) => String(item.employeeId)),
      summary,
    } satisfies AuditCycleRecord;
  }));
}

async function auditSummary(cycleId: string) {
  const rows = await getD1().prepare("SELECT verification_status AS status, COUNT(*) AS count FROM audit_items WHERE audit_cycle_id = ? GROUP BY verification_status").bind(cycleId).all<{ status: VerificationStatus; count: number }>();
  const summary = { PENDING: 0, VERIFIED: 0, MISSING: 0, DAMAGED: 0, total: 0 };
  for (const row of rows.results) {
    summary[row.status] = row.count;
    summary.total += row.count;
  }
  return summary;
}

export async function createAudit(payload: unknown, actor?: AppUser) {
  await ensureCore();
  const source = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const departmentId = optionalText(source.departmentId);
  const locationId = optionalText(source.locationId);
  const auditorIds = Array.isArray(source.auditorIds) ? source.auditorIds.map(String).filter(Boolean) : [];
  if (!departmentId && !locationId) throw new ErpError("Select a department or location scope before starting an audit.");
  if (auditorIds.length === 0) throw new ErpError("Assign at least one auditor.");
  const departments = await listDepartments();
  const selectedDepartment = departmentId ? departments.find((department) => department.id === departmentId) : undefined;
  if (departmentId && !selectedDepartment) throw new ErpError("Selected department was not found.", 404);
  const departmentName = selectedDepartment?.name ?? "";
  for (const auditorId of auditorIds) {
    const auditor = await getD1().prepare("SELECT id FROM employees WHERE id = ? AND status = 'ACTIVE' LIMIT 1").bind(Number(auditorId)).first<{ id: number }>();
    if (!auditor) throw new ErpError("Assign only active employees as auditors.", 400);
  }
  const rows = await getD1().prepare(`${assetSelect} WHERE (? = '' OR p.department = ?) AND (? = '' OR a.location = ?) ORDER BY a.tag ASC`)
    .bind(departmentName, departmentName, locationId, locationId).all<AssetRow>();
  if (rows.results.length === 0) throw new ErpError("No assets were found for this audit scope.", 404);
  const cycleId = crypto.randomUUID();
  const now = Date.now();
  const database = getD1();
  await database.batch([
    database.prepare("INSERT INTO audit_cycles (id, department_id, location_id, status, started_at, created_by) VALUES (?, ?, ?, 'ACTIVE', ?, ?)")
      .bind(cycleId, departmentId || null, locationId || null, now, actor?.employeeId ?? "system"),
    ...auditorIds.map((employeeId) => database.prepare("INSERT INTO audit_assignments (id, audit_cycle_id, employee_id) VALUES (?, ?, ?)").bind(crypto.randomUUID(), cycleId, employeeId)),
    ...rows.results.map((asset) => database.prepare("INSERT INTO audit_items (id, audit_cycle_id, asset_id, expected_location, verification_status, updated_at) VALUES (?, ?, ?, ?, 'PENDING', ?)")
      .bind(crypto.randomUUID(), cycleId, asset.id, asset.location ?? "Unassigned", now)),
  ]);
  await logActivity({ kind: "Audit", title: "Audit cycle started", description: `${rows.results.length} assets queued for verification.`, actorId: actor?.employeeId, target: cycleId, severity: "Info" });
  return getAudit(cycleId);
}

export async function getAudit(cycleId: string) {
  await ensureCore();
  const cycles = await listAudits();
  const cycle = cycles.find((item) => item.id === cycleId);
  if (!cycle) throw new ErpError("Audit cycle was not found.", 404);
  const rows = await getD1().prepare(`SELECT ai.id, ai.asset_id AS assetId, ai.expected_location AS expectedLocation, ai.verification_status AS verificationStatus,
      ai.verified_by AS verifiedBy, ai.updated_at AS updatedAt, a.tag, a.name, a.location AS currentLocation
    FROM audit_items AS ai
    INNER JOIN assets AS a ON a.id = ai.asset_id
    WHERE ai.audit_cycle_id = ?
    ORDER BY a.tag ASC`).bind(cycleId).all<Record<string, unknown>>();
  const items = rows.results.map((row) => ({
    id: String(row.id),
    assetId: String(row.assetId),
    assetTag: String(row.tag),
    assetName: String(row.name),
    expectedLocation: String(row.expectedLocation),
    currentLocation: String(row.currentLocation ?? "Unassigned"),
    verificationStatus: String(row.verificationStatus) as VerificationStatus,
    verifiedBy: String(row.verifiedBy ?? ""),
    updatedAt: iso(Number(row.updatedAt)),
  } satisfies AuditItemRecord));
  return { cycle, items, discrepancies: items.filter((item) => item.verificationStatus === "MISSING" || item.verificationStatus === "DAMAGED") };
}

export async function verifyAuditItem(cycleId: string, payload: unknown, actor?: AppUser) {
  await ensureCore();
  const source = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const itemId = requiredText(source.itemId ?? source.auditItemId, "Audit item");
  const status = String(source.status) as VerificationStatus;
  if (!["PENDING", "VERIFIED", "MISSING", "DAMAGED"].includes(status)) throw new ErpError("Verification status is invalid.");
  const cycle = await getD1().prepare("SELECT status FROM audit_cycles WHERE id = ? LIMIT 1").bind(cycleId).first<{ status: string }>();
  if (!cycle) throw new ErpError("Audit cycle was not found.", 404);
  if (cycle.status === "CLOSED") throw new ErpError("This audit cycle is closed.", 409);
  await getD1().prepare("UPDATE audit_items SET verification_status = ?, verified_by = ?, updated_at = ? WHERE audit_cycle_id = ? AND id = ?")
    .bind(status, actor?.employeeId ?? "", Date.now(), cycleId, itemId).run();
  if (status !== "VERIFIED" && status !== "PENDING") {
    await logActivity({ kind: "Audit", title: "Audit discrepancy", description: `An asset was marked ${status.toLowerCase()}.`, actorId: actor?.employeeId, target: cycleId, severity: status === "DAMAGED" ? "Critical" : "Warning" });
  }
  return getAudit(cycleId);
}

export async function closeAudit(cycleId: string, actor?: AppUser) {
  await ensureCore();
  const audit = await getAudit(cycleId);
  if (audit.cycle.status === "CLOSED") throw new ErpError("This audit cycle is already closed.", 409);
  const database = getD1();
  const now = Date.now();
  const statements = [
    ...audit.items.filter((item) => item.verificationStatus === "MISSING").map((item) => database.prepare("UPDATE assets SET status = 'LOST' WHERE id = ?").bind(Number(item.assetId))),
    ...audit.items.filter((item) => item.verificationStatus === "DAMAGED").flatMap((item) => [
      database.prepare("UPDATE assets SET status = 'UNDER_MAINTENANCE', condition = 'Needs Service' WHERE id = ?").bind(Number(item.assetId)),
      database.prepare("INSERT INTO maintenance_requests (asset_id, requested_by, description, priority, status, technician, created_at) VALUES (?, ?, ?, 'HIGH', 'PENDING', '', ?)")
        .bind(Number(item.assetId), actor?.employeeId ? Number(actor.employeeId) : 1, `Auto-created from audit cycle ${cycleId}: asset marked damaged.`, now),
    ]),
    database.prepare("UPDATE audit_cycles SET status = 'CLOSED', closed_at = ? WHERE id = ?").bind(now, cycleId),
  ];
  await database.batch(statements);
  for (const item of audit.items.filter((auditItem) => auditItem.verificationStatus === "MISSING" || auditItem.verificationStatus === "DAMAGED")) {
    const asset = await findAsset(item.assetTag);
    const record = assetRecord(asset);
    const status: LifecycleStatus = item.verificationStatus === "MISSING" ? "Lost" : "Under Maintenance";
    await updateAssetHistory(asset.id, {
      ...record,
      status,
      condition: item.verificationStatus === "DAMAGED" ? "Needs Service" : record.condition,
      lastUpdated: "Just now",
      recentActivity: item.verificationStatus === "MISSING" ? "Marked missing during audit" : "Marked damaged during audit",
      maintenanceHistory: item.verificationStatus === "DAMAGED"
        ? [{ date: new Date(now).toISOString().slice(0, 10), title: "Audit damage report", detail: `Auto-created from audit cycle ${cycleId}.` }, ...record.maintenanceHistory]
        : record.maintenanceHistory,
    });
  }
  await logActivity({ kind: "Audit", title: "Audit cycle closed", description: `${audit.discrepancies.length} discrepancies reported.`, actorId: actor?.employeeId, target: cycleId, severity: "Success" });
  return getAudit(cycleId);
}

export async function logActivity(input: {
  kind: ActivityKind;
  title: string;
  description: string;
  actorId?: string | null;
  target?: string;
  severity?: ActivitySeverity;
  status?: ActivityStatus;
}) {
  await ensureCoreSchema();
  const actorId = input.actorId ? Number(input.actorId) : null;
  await getD1().prepare(`INSERT INTO activity_logs
    (actor_id, action, entity_type, entity_id, metadata, created_at, kind, title, description, target, severity, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(actorId, input.title.toUpperCase().replace(/\s+/g, "_"), input.kind.toLowerCase(), input.target ?? "", JSON.stringify(input), Date.now(), input.kind, input.title, input.description, input.target ?? "", input.severity ?? "Info", input.status ?? "Unread")
    .run();
}

export async function listActivity() {
  await ensureCore();
  const rows = await getD1().prepare(`SELECT l.id, l.kind, l.title, l.description, l.target, l.severity, l.status, l.created_at AS createdAt, e.name AS actor
    FROM activity_logs AS l
    LEFT JOIN employees AS e ON e.id = l.actor_id
    ORDER BY l.created_at DESC
    LIMIT 100`).all<Record<string, unknown>>();
  return rows.results.map((row) => {
    const metadata = safeJson<Record<string, unknown>>(String(row.metadata ?? "{}"), {});
    return {
      id: String(row.id),
      kind: String(row.kind ?? metadata.kind ?? "System") as ActivityKind,
      title: String(row.title ?? metadata.title ?? "Activity"),
      description: String(row.description ?? metadata.description ?? ""),
      actor: String(row.actor ?? "System"),
      target: String(row.target ?? metadata.target ?? ""),
      severity: String(row.severity ?? metadata.severity ?? "Info") as ActivitySeverity,
      status: String(row.status ?? metadata.status ?? "Unread") as ActivityStatus,
      createdAt: iso(Number(row.createdAt)),
    } satisfies ActivityRecord;
  });
}

export async function updateActivityStatus(id: string, status: ActivityStatus) {
  await ensureCore();
  await getD1().prepare("UPDATE activity_logs SET status = ? WHERE id = ?").bind(status, Number(id)).run();
  return listActivity();
}

export async function dashboardSummary() {
  await ensureCore();
  const [assets, allocations, bookings, maintenance, activity] = await Promise.all([
    getD1().prepare("SELECT status, shared, COUNT(*) AS count FROM assets GROUP BY status, shared").all<{ status: string; shared: number; count: number }>(),
    listAllocations(),
    listBookings(),
    listMaintenance(),
    listActivity(),
  ]);
  const assetCounts: Record<string, number> = {};
  let bookable = 0;
  for (const row of assets.results) {
    assetCounts[uiStatusFromDb(row.status)] = (assetCounts[uiStatusFromDb(row.status)] ?? 0) + row.count;
    if (row.shared) bookable += row.count;
  }
  return {
    kpis: {
      available: assetCounts.Available ?? 0,
      allocated: assetCounts.Allocated ?? 0,
      bookable,
      maintenanceToday: maintenance.filter((item) => item.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length,
      activeBookings: bookings.filter((item) => item.status === "ONGOING" || item.status === "UPCOMING").length,
      pendingTransfers: allocations.filter((item) => item.status === "Transfer Pending").length,
      upcomingReturns: allocations.filter((item) => item.status === "Active" && !item.overdue).length,
      overdueReturns: allocations.filter((item) => item.overdue).length,
    },
    overdue: allocations.filter((item) => item.overdue).slice(0, 5),
    upcomingBookings: bookings.filter((item) => item.status === "UPCOMING").slice(0, 5),
    pendingMaintenance: maintenance.filter((item) => item.status !== "RESOLVED" && item.status !== "REJECTED").slice(0, 5),
    activity: activity.slice(0, 6),
  };
}

export async function reportsSummary() {
  await ensureCore();
  const [assets, allocations, bookings, maintenance] = await Promise.all([
    getD1().prepare(`${assetSelect} ORDER BY a.tag ASC`).all<AssetRow>(),
    listAllocations(),
    listBookings(),
    listMaintenance(),
  ]);
  const assetRecords = assets.results.map(assetRecord);
  const byDepartment = new Map<string, number>();
  for (const allocation of allocations.filter((item) => item.status === "Active")) {
    byDepartment.set(allocation.departmentName, (byDepartment.get(allocation.departmentName) ?? 0) + 1);
  }
  const maintenanceByAsset = new Map<string, number>();
  for (const request of maintenance) maintenanceByAsset.set(request.assetTag, (maintenanceByAsset.get(request.assetTag) ?? 0) + 1);
  const bookingHours = new Map<string, number>();
  for (const booking of bookings) {
    const hour = new Date(booking.startAt).getHours();
    bookingHours.set(`${String(hour).padStart(2, "0")}:00`, (bookingHours.get(`${String(hour).padStart(2, "0")}:00`) ?? 0) + 1);
  }
  return {
    utilizationByDepartment: [...byDepartment.entries()].map(([name, count]) => ({ name, count })),
    mostUsedAssets: [...maintenanceByAsset.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag, count]) => ({ tag, count })),
    idleAssets: assetRecords.filter((asset) => asset.status === "Available" && asset.allocationHistory.length === 0).slice(0, 5),
    maintenanceFrequency: maintenance,
    serviceDue: assetRecords.filter((asset) => asset.condition === "Needs Service" || asset.status === "Under Maintenance").slice(0, 5),
    bookingHeatmap: [...bookingHours.entries()].map(([hour, count]) => ({ hour, count })),
  };
}

export async function nextAssetDraftTag() {
  const rows = await getD1().prepare(`${assetSelect} ORDER BY a.tag ASC`).all<AssetRow>();
  return nextAssetTag(rows.results.map(assetRecord));
}

export function buildNewAssetForDraft(tag: string, draft: AssetDraft) {
  return buildAssetRecord(tag, draft);
}
