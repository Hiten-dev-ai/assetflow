import type { LocalUser } from "./localAuth";

export type EntityStatus = "Active" | "Inactive";
export type EmployeeRole = "Employee" | "Department Head" | "Asset Manager" | "Admin";

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

export const departmentStorageKey = "assetflow-master-departments";
export const categoryStorageKey = "assetflow-master-asset-categories";
export const employeeStorageKey = "assetflow-master-employees";

export const seedDepartments: DepartmentRecord[] = [
  { id: "dept-engineering", name: "Engineering", code: "ENG", headEmployeeId: "emp-hiten", parentId: "", status: "Active", notes: "Product engineering and platform delivery." },
  { id: "dept-facilities", name: "Facilities", code: "FAC", headEmployeeId: "emp-rohan", parentId: "", status: "Active", notes: "Buildings, rooms, and workplace operations." },
  { id: "dept-operations", name: "Operations", code: "OPS", headEmployeeId: "emp-aditi", parentId: "", status: "Active", notes: "Asset operations, service readiness, and procurement coordination." },
  { id: "dept-finance", name: "Finance", code: "FIN", headEmployeeId: "", parentId: "", status: "Active", notes: "Budget ownership and capital expense controls." },
  { id: "dept-field-ops", name: "Field Ops", code: "FLD", headEmployeeId: "emp-sana", parentId: "dept-operations", status: "Active", notes: "Distributed teams and field equipment accountability." },
];

export const seedCategories: AssetCategoryRecord[] = [
  { id: "cat-electronics", name: "Electronics", code: "ELEC", description: "Laptops, screens, phones, and IT equipment.", usefulLife: "36", requiresSerial: true, trackWarranty: true, status: "Active" },
  { id: "cat-furniture", name: "Furniture", code: "FURN", description: "Desks, chairs, storage, and fixtures.", usefulLife: "84", requiresSerial: false, trackWarranty: false, status: "Active" },
  { id: "cat-vehicles", name: "Vehicles", code: "VEH", description: "Fleet cars, service vans, and transport assets.", usefulLife: "60", requiresSerial: true, trackWarranty: true, status: "Active" },
  { id: "cat-rooms", name: "Rooms", code: "ROOM", description: "Bookable rooms and shared workspaces.", usefulLife: "", requiresSerial: false, trackWarranty: false, status: "Active" },
  { id: "cat-tools", name: "Tools", code: "TOOL", description: "Maintenance tools and portable kits.", usefulLife: "48", requiresSerial: true, trackWarranty: false, status: "Active" },
  { id: "cat-medical-equipment", name: "Medical Equipment", code: "MED", description: "Clinical and first-aid equipment.", usefulLife: "60", requiresSerial: true, trackWarranty: true, status: "Active" },
];

export const seedEmployees: EmployeeRecord[] = [
  { id: "emp-hiten", name: "Hiten S", email: "hiten.s@assetflow.demo", employeeId: "AF-EMP-001", departmentId: "dept-engineering", role: "Admin", status: "Active", jobTitle: "System Administrator", phone: "+91 98765 10001", location: "Bengaluru HQ" },
  { id: "emp-priya", name: "Priya Shah", email: "priya.shah@assetflow.demo", employeeId: "AF-EMP-002", departmentId: "dept-engineering", role: "Employee", status: "Active", jobTitle: "Software Engineer", phone: "+91 98765 10002", location: "Bengaluru HQ" },
  { id: "emp-rohan", name: "Rohan Mehta", email: "rohan.mehta@assetflow.demo", employeeId: "AF-EMP-003", departmentId: "dept-facilities", role: "Department Head", status: "Active", jobTitle: "Facilities Lead", phone: "+91 98765 10003", location: "HQ Floor 1" },
  { id: "emp-aditi", name: "Aditi Rao", email: "aditi.rao@assetflow.demo", employeeId: "AF-EMP-004", departmentId: "dept-operations", role: "Asset Manager", status: "Active", jobTitle: "Asset Operations Manager", phone: "+91 98765 10004", location: "Operations Desk" },
  { id: "emp-sana", name: "Sana Iqbal", email: "sana.iqbal@assetflow.demo", employeeId: "AF-EMP-005", departmentId: "dept-field-ops", role: "Employee", status: "Active", jobTitle: "Field Coordinator", phone: "+91 98765 10005", location: "Field Ops East" },
];

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readList<T>(key: string, fallback: T[]): T[] {
  if (!hasStorage()) return fallback;

  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed as T[] : fallback;
  } catch {
    return fallback;
  }
}

function writeList<T>(key: string, records: T[]) {
  if (!hasStorage()) return;
  localStorage.setItem(key, JSON.stringify(records));
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function safeId(prefix: string) {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? `${prefix}-${crypto.randomUUID()}` : `${prefix}-${Date.now().toString(36)}`;
}

function nextEmployeeId(employees: EmployeeRecord[]) {
  const highest = employees.reduce((max, employee) => {
    const value = Number(employee.employeeId.replace(/\D/g, ""));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `AF-EMP-${String(highest + 1).padStart(3, "0")}`;
}

export function readDepartments() {
  return readList<DepartmentRecord>(departmentStorageKey, seedDepartments);
}

export function writeDepartments(records: DepartmentRecord[]) {
  writeList(departmentStorageKey, records);
}

export function readAssetCategories() {
  return readList<AssetCategoryRecord>(categoryStorageKey, seedCategories);
}

export function writeAssetCategories(records: AssetCategoryRecord[]) {
  writeList(categoryStorageKey, records);
}

export function readEmployees() {
  return readList<EmployeeRecord>(employeeStorageKey, seedEmployees);
}

export function writeEmployees(records: EmployeeRecord[]) {
  writeList(employeeStorageKey, records);
}

export function departmentName(departmentId: string, departments = readDepartments()) {
  return departments.find((department) => department.id === departmentId)?.name ?? "Unassigned";
}

export function ensureUserEmployee(user: LocalUser) {
  if (!hasStorage()) return null;

  const departments = readDepartments();
  const employees = readEmployees();
  const email = normalize(user.username);
  const existing = employees.find((employee) => normalize(employee.email) === email);
  const departmentId = existing?.departmentId || departments.find((department) => department.status === "Active")?.id || seedDepartments[0].id;
  const role: EmployeeRole = user.role === "ADMIN" ? "Admin" : existing?.role ?? "Employee";

  if (!localStorage.getItem(departmentStorageKey)) writeDepartments(departments);
  if (!localStorage.getItem(categoryStorageKey)) writeAssetCategories(readAssetCategories());

  if (existing) {
    const updated = { ...existing, name: user.name, role, status: existing.status ?? "Active" };
    writeEmployees(employees.map((employee) => employee.id === existing.id ? updated : employee));
    return updated;
  }

  const employee: EmployeeRecord = {
    id: safeId("emp"),
    name: user.name,
    email,
    employeeId: nextEmployeeId(employees),
    departmentId,
    role,
    status: "Active",
    jobTitle: user.role === "ADMIN" ? "Administrator" : "Employee",
    phone: "",
    location: "",
  };

  writeEmployees([...employees, employee]);
  return employee;
}

export function authRoleFromEmployee(employee: EmployeeRecord | null | undefined): LocalUser["role"] {
  return employee?.role === "Admin" ? "ADMIN" : "EMPLOYEE";
}
