"use client";

import { CheckCircle2, Pencil, Plus, RotateCcw, Search, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { FeatureShell } from "../../components/FeatureShell";

type EntityStatus = "Active" | "Inactive";
type OrganizationTab = "Departments" | "Asset Categories" | "Employees";
type EmployeeRole = "Employee" | "Department Head" | "Asset Manager" | "Admin";

type Department = {
  id: string;
  name: string;
  code: string;
  headEmployeeId: string;
  parentId: string;
  status: EntityStatus;
  notes: string;
};

type AssetCategory = {
  id: string;
  name: string;
  code: string;
  description: string;
  usefulLife: string;
  requiresSerial: boolean;
  trackWarranty: boolean;
  status: EntityStatus;
};

type Employee = {
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

type DepartmentForm = Omit<Department, "id">;
type CategoryForm = Omit<AssetCategory, "id">;
type EmployeeForm = Omit<Employee, "id">;

const departmentStorageKey = "assetflow-master-departments";
const categoryStorageKey = "assetflow-master-asset-categories";
const employeeStorageKey = "assetflow-master-employees";

const organizationTabs: OrganizationTab[] = ["Departments", "Asset Categories", "Employees"];
const roles: EmployeeRole[] = ["Employee", "Department Head", "Asset Manager", "Admin"];
const statusOptions: EntityStatus[] = ["Active", "Inactive"];

const seedDepartments: Department[] = [
  { id: "dept-engineering", name: "Engineering", code: "ENG", headEmployeeId: "emp-hiten", parentId: "", status: "Active", notes: "Product engineering and platform delivery." },
  { id: "dept-facilities", name: "Facilities", code: "FAC", headEmployeeId: "emp-rohan", parentId: "", status: "Active", notes: "Buildings, rooms, and workplace operations." },
  { id: "dept-operations", name: "Operations", code: "OPS", headEmployeeId: "emp-aditi", parentId: "", status: "Active", notes: "Asset operations, service readiness, and procurement coordination." },
  { id: "dept-finance", name: "Finance", code: "FIN", headEmployeeId: "", parentId: "", status: "Active", notes: "Budget ownership and capital expense controls." },
  { id: "dept-field-ops", name: "Field Ops", code: "FLD", headEmployeeId: "emp-sana", parentId: "dept-operations", status: "Active", notes: "Distributed teams and field equipment accountability." },
];

const seedCategories: AssetCategory[] = [
  { id: "cat-electronics", name: "Electronics", code: "ELEC", description: "Laptops, screens, phones, and IT equipment.", usefulLife: "36", requiresSerial: true, trackWarranty: true, status: "Active" },
  { id: "cat-furniture", name: "Furniture", code: "FURN", description: "Desks, chairs, storage, and fixtures.", usefulLife: "84", requiresSerial: false, trackWarranty: false, status: "Active" },
  { id: "cat-vehicles", name: "Vehicles", code: "VEH", description: "Fleet cars, service vans, and transport assets.", usefulLife: "60", requiresSerial: true, trackWarranty: true, status: "Active" },
  { id: "cat-rooms", name: "Rooms", code: "ROOM", description: "Bookable rooms and shared workspaces.", usefulLife: "", requiresSerial: false, trackWarranty: false, status: "Active" },
  { id: "cat-tools", name: "Tools", code: "TOOL", description: "Maintenance tools and portable kits.", usefulLife: "48", requiresSerial: true, trackWarranty: false, status: "Active" },
  { id: "cat-medical-equipment", name: "Medical Equipment", code: "MED", description: "Clinical and first-aid equipment.", usefulLife: "60", requiresSerial: true, trackWarranty: true, status: "Active" },
];

const seedEmployees: Employee[] = [
  { id: "emp-hiten", name: "Hiten S", email: "hiten.s@assetflow.demo", employeeId: "AF-EMP-001", departmentId: "dept-engineering", role: "Admin", status: "Active", jobTitle: "System Administrator", phone: "+91 98765 10001", location: "Bengaluru HQ" },
  { id: "emp-priya", name: "Priya Shah", email: "priya.shah@assetflow.demo", employeeId: "AF-EMP-002", departmentId: "dept-engineering", role: "Employee", status: "Active", jobTitle: "Software Engineer", phone: "+91 98765 10002", location: "Bengaluru HQ" },
  { id: "emp-rohan", name: "Rohan Mehta", email: "rohan.mehta@assetflow.demo", employeeId: "AF-EMP-003", departmentId: "dept-facilities", role: "Department Head", status: "Active", jobTitle: "Facilities Lead", phone: "+91 98765 10003", location: "HQ Floor 1" },
  { id: "emp-aditi", name: "Aditi Rao", email: "aditi.rao@assetflow.demo", employeeId: "AF-EMP-004", departmentId: "dept-operations", role: "Asset Manager", status: "Active", jobTitle: "Asset Operations Manager", phone: "+91 98765 10004", location: "Operations Desk" },
  { id: "emp-sana", name: "Sana Iqbal", email: "sana.iqbal@assetflow.demo", employeeId: "AF-EMP-005", departmentId: "dept-field-ops", role: "Employee", status: "Active", jobTitle: "Field Coordinator", phone: "+91 98765 10005", location: "Field Ops East" },
];

const emptyDepartmentForm: DepartmentForm = {
  name: "",
  code: "",
  headEmployeeId: "",
  parentId: "",
  status: "Active",
  notes: "",
};

const emptyCategoryForm: CategoryForm = {
  name: "",
  code: "",
  description: "",
  usefulLife: "",
  requiresSerial: true,
  trackWarranty: true,
  status: "Active",
};

const emptyEmployeeForm: EmployeeForm = {
  name: "",
  email: "",
  employeeId: "",
  departmentId: "",
  role: "Employee",
  status: "Active",
  jobTitle: "",
  phone: "",
  location: "",
};

function makeId(prefix: string) {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as T : fallback;
  } catch {
    return fallback;
  }
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function formatHead(employeeId: string, employees: Employee[]) {
  if (!employeeId) return "Unassigned";
  return employees.find((employee) => employee.id === employeeId)?.name ?? "Unassigned";
}

function departmentName(departmentId: string, departments: Department[]) {
  if (!departmentId) return "Unassigned";
  return departments.find((department) => department.id === departmentId)?.name ?? "Unassigned";
}

function statusClass(status: EntityStatus) {
  return status === "Active" ? "active" : "inactive";
}

function roleClass(role: EmployeeRole) {
  return role.toLowerCase().replaceAll(" ", "-");
}

function isCircularParent(departments: Department[], departmentId: string, parentId: string) {
  let current = parentId;
  const visited = new Set<string>();

  while (current) {
    if (current === departmentId) return true;
    if (visited.has(current)) return true;
    visited.add(current);
    current = departments.find((department) => department.id === current)?.parentId ?? "";
  }

  return false;
}

function emailLooksValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState<OrganizationTab>("Departments");
  const [departments, setDepartments] = useState(seedDepartments);
  const [categories, setCategories] = useState(seedCategories);
  const [employees, setEmployees] = useState(seedEmployees);
  const [loaded, setLoaded] = useState(false);
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [departmentForm, setDepartmentForm] = useState<DepartmentForm>(emptyDepartmentForm);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategoryForm);
  const [employeeForm, setEmployeeForm] = useState<EmployeeForm>(emptyEmployeeForm);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeDepartmentFilter, setEmployeeDepartmentFilter] = useState("All");
  const [employeeRoleFilter, setEmployeeRoleFilter] = useState("All");
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState("All");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDepartments(readStored(departmentStorageKey, seedDepartments));
      setCategories(readStored(categoryStorageKey, seedCategories));
      setEmployees(readStored(employeeStorageKey, seedEmployees));
      setLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(departmentStorageKey, JSON.stringify(departments));
  }, [departments, loaded]);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(categoryStorageKey, JSON.stringify(categories));
  }, [categories, loaded]);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(employeeStorageKey, JSON.stringify(employees));
  }, [employees, loaded]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const activeEmployees = useMemo(() => employees.filter((employee) => employee.status === "Active"), [employees]);
  const activeDepartments = useMemo(() => departments.filter((department) => department.status === "Active"), [departments]);

  const filteredEmployees = useMemo(() => {
    const query = normalize(employeeSearch);

    return employees.filter((employee) => {
      const department = departmentName(employee.departmentId, departments);
      const matchesSearch = !query || [
        employee.name,
        employee.email,
        employee.employeeId,
        department,
        employee.role,
        employee.status,
        employee.jobTitle,
        employee.location,
      ].some((value) => normalize(value).includes(query));

      return matchesSearch
        && (employeeDepartmentFilter === "All" || employee.departmentId === employeeDepartmentFilter)
        && (employeeRoleFilter === "All" || employee.role === employeeRoleFilter)
        && (employeeStatusFilter === "All" || employee.status === employeeStatusFilter);
    });
  }, [departments, employeeDepartmentFilter, employeeRoleFilter, employeeSearch, employeeStatusFilter, employees]);

  const modalTitle = editingDepartmentId
    ? "Edit Department"
    : editingCategoryId
      ? "Edit Asset Category"
      : editingEmployeeId
        ? "Edit Employee"
        : activeTab === "Departments"
          ? "Add Department"
          : activeTab === "Asset Categories"
            ? "Add Asset Category"
            : "Add Employee";

  function closeModal() {
    setEditingDepartmentId(null);
    setEditingCategoryId(null);
    setEditingEmployeeId(null);
    setDepartmentForm(emptyDepartmentForm);
    setCategoryForm(emptyCategoryForm);
    setEmployeeForm(emptyEmployeeForm);
    setFormError("");
  }

  function openCreate() {
    setFormError("");

    if (activeTab === "Departments") {
      setDepartmentForm(emptyDepartmentForm);
      setEditingDepartmentId("new");
      return;
    }

    if (activeTab === "Asset Categories") {
      setCategoryForm(emptyCategoryForm);
      setEditingCategoryId("new");
      return;
    }

    setEmployeeForm({ ...emptyEmployeeForm, departmentId: activeDepartments[0]?.id ?? departments[0]?.id ?? "" });
    setEditingEmployeeId("new");
  }

  function openDepartmentEdit(department: Department) {
    setActiveTab("Departments");
    setDepartmentForm({
      name: department.name,
      code: department.code,
      headEmployeeId: department.headEmployeeId,
      parentId: department.parentId,
      status: department.status,
      notes: department.notes,
    });
    setFormError("");
    setEditingDepartmentId(department.id);
  }

  function openCategoryEdit(category: AssetCategory) {
    setActiveTab("Asset Categories");
    setCategoryForm({
      name: category.name,
      code: category.code,
      description: category.description,
      usefulLife: category.usefulLife,
      requiresSerial: category.requiresSerial,
      trackWarranty: category.trackWarranty,
      status: category.status,
    });
    setFormError("");
    setEditingCategoryId(category.id);
  }

  function openEmployeeEdit(employee: Employee) {
    setActiveTab("Employees");
    setEmployeeForm({
      name: employee.name,
      email: employee.email,
      employeeId: employee.employeeId,
      departmentId: employee.departmentId,
      role: employee.role,
      status: employee.status,
      jobTitle: employee.jobTitle,
      phone: employee.phone,
      location: employee.location,
    });
    setFormError("");
    setEditingEmployeeId(employee.id);
  }

  function submitDepartment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = departmentForm.name.trim();
    const code = departmentForm.code.trim().toUpperCase();
    const editId = editingDepartmentId === "new" ? "" : editingDepartmentId ?? "";

    if (!name) {
      setFormError("Department name is required.");
      return;
    }

    if (!code) {
      setFormError("Department code is required.");
      return;
    }

    if (departments.some((department) => normalize(department.code) === normalize(code) && department.id !== editId)) {
      setFormError("Department code already exists.");
      return;
    }

    if (editId && departmentForm.parentId && isCircularParent(departments, editId, departmentForm.parentId)) {
      setFormError("Parent department cannot create a circular hierarchy.");
      return;
    }

    const nextRecord: Department = {
      id: editId || makeId("dept"),
      name,
      code,
      headEmployeeId: departmentForm.headEmployeeId,
      parentId: departmentForm.parentId,
      status: departmentForm.status,
      notes: departmentForm.notes.trim(),
    };

    setDepartments((current) => editId ? current.map((department) => department.id === editId ? nextRecord : department) : [...current, nextRecord]);
    setToast(`${name} ${editId ? "updated" : "added"}.`);
    closeModal();
  }

  function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = categoryForm.name.trim();
    const code = categoryForm.code.trim().toUpperCase();
    const editId = editingCategoryId === "new" ? "" : editingCategoryId ?? "";

    if (!name) {
      setFormError("Category name is required.");
      return;
    }

    if (!code) {
      setFormError("Category code is required.");
      return;
    }

    if (categories.some((category) => normalize(category.code) === normalize(code) && category.id !== editId)) {
      setFormError("Category code already exists.");
      return;
    }

    const nextRecord: AssetCategory = {
      id: editId || makeId("cat"),
      name,
      code,
      description: categoryForm.description.trim(),
      usefulLife: categoryForm.usefulLife.trim(),
      requiresSerial: categoryForm.requiresSerial,
      trackWarranty: categoryForm.trackWarranty,
      status: categoryForm.status,
    };

    setCategories((current) => editId ? current.map((category) => category.id === editId ? nextRecord : category) : [...current, nextRecord]);
    setToast(`${name} ${editId ? "updated" : "added"}.`);
    closeModal();
  }

  function submitEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = employeeForm.name.trim();
    const email = employeeForm.email.trim().toLowerCase();
    const employeeId = employeeForm.employeeId.trim().toUpperCase();
    const editId = editingEmployeeId === "new" ? "" : editingEmployeeId ?? "";

    if (!name) {
      setFormError("Employee name is required.");
      return;
    }

    if (!emailLooksValid(email)) {
      setFormError("Enter a valid email address.");
      return;
    }

    if (!employeeId) {
      setFormError("Employee ID is required.");
      return;
    }

    if (employees.some((employee) => normalize(employee.email) === normalize(email) && employee.id !== editId)) {
      setFormError("Email already exists.");
      return;
    }

    if (employees.some((employee) => normalize(employee.employeeId) === normalize(employeeId) && employee.id !== editId)) {
      setFormError("Employee ID already exists.");
      return;
    }

    if (!employeeForm.departmentId) {
      setFormError("Department is required.");
      return;
    }

    const nextRecord: Employee = {
      id: editId || makeId("emp"),
      name,
      email,
      employeeId,
      departmentId: employeeForm.departmentId,
      role: employeeForm.role,
      status: employeeForm.status,
      jobTitle: employeeForm.jobTitle.trim(),
      phone: employeeForm.phone.trim(),
      location: employeeForm.location.trim(),
    };

    setEmployees((current) => editId ? current.map((employee) => employee.id === editId ? nextRecord : employee) : [...current, nextRecord]);
    setToast(`${name} ${editId ? "updated" : "added"}.`);
    closeModal();
  }

  function toggleDepartmentStatus(id: string) {
    setDepartments((current) => current.map((department) => department.id === id ? { ...department, status: department.status === "Active" ? "Inactive" : "Active" } : department));
  }

  function toggleCategoryStatus(id: string) {
    setCategories((current) => current.map((category) => category.id === id ? { ...category, status: category.status === "Active" ? "Inactive" : "Active" } : category));
  }

  function toggleEmployeeStatus(id: string) {
    setEmployees((current) => current.map((employee) => employee.id === id ? { ...employee, status: employee.status === "Active" ? "Inactive" : "Active" } : employee));
  }

  const isModalOpen = editingDepartmentId !== null || editingCategoryId !== null || editingEmployeeId !== null;

  return <FeatureShell title="Organization Setup" actions={<button className="button primary" type="button" onClick={openCreate}><Plus size={15} />Add {activeTab === "Asset Categories" ? "Category" : activeTab.slice(0, -1)}</button>}>
    <div className="tabs organization-tabs" role="tablist" aria-label="Organization setup sections">
      {organizationTabs.map((item) => <button type="button" role="tab" aria-selected={activeTab === item} className={activeTab === item ? "active" : ""} onClick={() => setActiveTab(item)} key={item}>{item}</button>)}
    </div>

    {toast && <div className="asset-toast organization-toast" role="status"><CheckCircle2 size={15} />{toast}<button type="button" onClick={() => setToast("")} aria-label="Dismiss notification"><X size={14} /></button></div>}

    {activeTab === "Departments" && <section className="clean-panel table-panel organization-panel" aria-label="Departments">
      <table className="clean-table organization-table departments-table">
        <thead>
          <tr>
            <th>Department</th>
            <th>Code</th>
            <th>Head</th>
            <th>Parent</th>
            <th>Status</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {departments.map((department) => <tr key={department.id}>
            <td><strong>{department.name}</strong></td>
            <td>{department.code}</td>
            <td>{formatHead(department.headEmployeeId, employees)}</td>
            <td>{department.parentId ? departmentName(department.parentId, departments) : "None"}</td>
            <td><button type="button" className={`status ${statusClass(department.status)}`} onClick={() => toggleDepartmentStatus(department.id)} aria-label={`${department.status === "Active" ? "Deactivate" : "Reactivate"} ${department.name}`}>{department.status}</button></td>
            <td>{department.notes || "No notes"}</td>
            <td><div className="organization-actions"><button type="button" className="row-action" onClick={() => openDepartmentEdit(department)}><Pencil size={13} />Edit</button><button type="button" className="row-action" onClick={() => toggleDepartmentStatus(department.id)}><RotateCcw size={13} />{department.status === "Active" ? "Deactivate" : "Reactivate"}</button></div></td>
          </tr>)}
        </tbody>
      </table>
      {departments.length === 0 && <p className="empty-copy">No departments yet. Add the first department to define the organization structure.</p>}
    </section>}

    {activeTab === "Asset Categories" && <section className="clean-panel table-panel organization-panel" aria-label="Asset Categories">
      <table className="clean-table organization-table categories-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Code</th>
            <th>Useful life</th>
            <th>Serial</th>
            <th>Warranty</th>
            <th>Status</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => <tr key={category.id}>
            <td><strong>{category.name}</strong></td>
            <td>{category.code}</td>
            <td>{category.usefulLife ? `${category.usefulLife} months` : "Optional"}</td>
            <td><span className={category.requiresSerial ? "bookable-pill yes" : "bookable-pill"}>{category.requiresSerial ? "Required" : "No"}</span></td>
            <td><span className={category.trackWarranty ? "bookable-pill yes" : "bookable-pill"}>{category.trackWarranty ? "Tracked" : "No"}</span></td>
            <td><button type="button" className={`status ${statusClass(category.status)}`} onClick={() => toggleCategoryStatus(category.id)} aria-label={`${category.status === "Active" ? "Deactivate" : "Reactivate"} ${category.name}`}>{category.status}</button></td>
            <td>{category.description || "No description"}</td>
            <td><div className="organization-actions"><button type="button" className="row-action" onClick={() => openCategoryEdit(category)}><Pencil size={13} />Edit</button><button type="button" className="row-action" onClick={() => toggleCategoryStatus(category.id)}><RotateCcw size={13} />{category.status === "Active" ? "Deactivate" : "Reactivate"}</button></div></td>
          </tr>)}
        </tbody>
      </table>
      {categories.length === 0 && <p className="empty-copy">No asset categories yet. Add categories before registering assets.</p>}
    </section>}

    {activeTab === "Employees" && <>
      <section className="organization-employee-toolbar" aria-label="Employee filters">
        <label className="asset-search organization-search">
          <Search size={15} />
          <input value={employeeSearch} onChange={(event) => setEmployeeSearch(event.target.value)} placeholder="Search name, email, department, role, status, title, or location" aria-label="Search employees" />
        </label>
        <div className="asset-filters organization-filters">
          <select value={employeeDepartmentFilter} onChange={(event) => setEmployeeDepartmentFilter(event.target.value)} aria-label="Filter employees by department"><option value="All">All departments</option>{departments.map((department) => <option value={department.id} key={department.id}>{department.name}</option>)}</select>
          <select value={employeeRoleFilter} onChange={(event) => setEmployeeRoleFilter(event.target.value)} aria-label="Filter employees by role"><option value="All">All roles</option>{roles.map((role) => <option key={role}>{role}</option>)}</select>
          <select value={employeeStatusFilter} onChange={(event) => setEmployeeStatusFilter(event.target.value)} aria-label="Filter employees by status"><option value="All">All status</option>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select>
        </div>
      </section>

      <section className="clean-panel table-panel organization-panel" aria-label="Employees">
        <table className="clean-table organization-table employees-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>ID</th>
              <th>Department</th>
              <th>Role</th>
              <th>Status</th>
              <th>Contact</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((employee) => <tr key={employee.id}>
              <td><strong>{employee.name}</strong><small>{employee.email}</small></td>
              <td>{employee.employeeId}</td>
              <td>{departmentName(employee.departmentId, departments)}</td>
              <td><span className={`role-pill ${roleClass(employee.role)}`}>{employee.role}</span></td>
              <td><button type="button" className={`status ${statusClass(employee.status)}`} onClick={() => toggleEmployeeStatus(employee.id)} aria-label={`${employee.status === "Active" ? "Deactivate" : "Reactivate"} ${employee.name}`}>{employee.status}</button></td>
              <td><strong>{employee.jobTitle || "No title"}</strong><small>{employee.phone || "No phone"}</small></td>
              <td>{employee.location || "Unassigned"}</td>
              <td><div className="organization-actions"><button type="button" className="row-action" onClick={() => openEmployeeEdit(employee)}><Pencil size={13} />Edit</button><button type="button" className="row-action" onClick={() => toggleEmployeeStatus(employee.id)}><RotateCcw size={13} />{employee.status === "Active" ? "Deactivate" : "Reactivate"}</button></div></td>
            </tr>)}
          </tbody>
        </table>
        {filteredEmployees.length === 0 && <p className="empty-copy">No employees match the current search and filters.</p>}
      </section>
    </>}

    {isModalOpen && <div className="asset-modal-backdrop" role="presentation">
      <section className="asset-modal organization-modal" role="dialog" aria-modal="true" aria-labelledby="organization-modal-title">
        <header>
          <div><p>{activeTab}</p><h2 id="organization-modal-title">{modalTitle}</h2></div>
          <button type="button" onClick={closeModal} aria-label="Close organization form"><X size={17} /></button>
        </header>

        {editingDepartmentId !== null && <form className="asset-form organization-form" onSubmit={submitDepartment}>
          <label><span>Department name</span><input autoFocus value={departmentForm.name} onChange={(event) => setDepartmentForm({ ...departmentForm, name: event.target.value })} placeholder="Engineering" required /></label>
          <label><span>Department code</span><input value={departmentForm.code} onChange={(event) => setDepartmentForm({ ...departmentForm, code: event.target.value })} placeholder="ENG" required /></label>
          <label><span>Department head</span><select value={departmentForm.headEmployeeId} onChange={(event) => setDepartmentForm({ ...departmentForm, headEmployeeId: event.target.value })}><option value="">Unassigned</option>{activeEmployees.map((employee) => <option value={employee.id} key={employee.id}>{employee.name}</option>)}</select></label>
          <label><span>Parent department</span><select value={departmentForm.parentId} onChange={(event) => setDepartmentForm({ ...departmentForm, parentId: event.target.value })}><option value="">None</option>{departments.filter((department) => department.id !== editingDepartmentId).map((department) => <option value={department.id} key={department.id}>{department.name}</option>)}</select></label>
          <label><span>Status</span><select value={departmentForm.status} onChange={(event) => setDepartmentForm({ ...departmentForm, status: event.target.value as EntityStatus })}>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label className="organization-wide-field"><span>Description or notes</span><textarea value={departmentForm.notes} onChange={(event) => setDepartmentForm({ ...departmentForm, notes: event.target.value })} placeholder="Ownership, scope, or reporting notes" /></label>
          {formError && <p className="asset-form-error" role="alert">{formError}</p>}
          <footer><button type="button" className="button" onClick={closeModal}>Cancel</button><button type="submit" className="button primary">{editingDepartmentId === "new" ? "Add Department" : "Save Department"}</button></footer>
        </form>}

        {editingCategoryId !== null && <form className="asset-form organization-form" onSubmit={submitCategory}>
          <label><span>Category name</span><input autoFocus value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} placeholder="Electronics" required /></label>
          <label><span>Category code</span><input value={categoryForm.code} onChange={(event) => setCategoryForm({ ...categoryForm, code: event.target.value })} placeholder="ELEC" required /></label>
          <label><span>Default useful life</span><input type="number" min="0" step="1" value={categoryForm.usefulLife} onChange={(event) => setCategoryForm({ ...categoryForm, usefulLife: event.target.value })} placeholder="36 months" /></label>
          <label><span>Status</span><select value={categoryForm.status} onChange={(event) => setCategoryForm({ ...categoryForm, status: event.target.value as EntityStatus })}>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label className="asset-toggle organization-toggle"><input type="checkbox" checked={categoryForm.requiresSerial} onChange={(event) => setCategoryForm({ ...categoryForm, requiresSerial: event.target.checked })} /><span>Requires serial number</span></label>
          <label className="asset-toggle organization-toggle"><input type="checkbox" checked={categoryForm.trackWarranty} onChange={(event) => setCategoryForm({ ...categoryForm, trackWarranty: event.target.checked })} /><span>Track warranty</span></label>
          <label className="organization-wide-field"><span>Description</span><textarea value={categoryForm.description} onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })} placeholder="Category scope and registration guidance" /></label>
          {formError && <p className="asset-form-error" role="alert">{formError}</p>}
          <footer><button type="button" className="button" onClick={closeModal}>Cancel</button><button type="submit" className="button primary">{editingCategoryId === "new" ? "Add Category" : "Save Category"}</button></footer>
        </form>}

        {editingEmployeeId !== null && <form className="asset-form organization-form" onSubmit={submitEmployee}>
          <label><span>Employee name</span><input autoFocus value={employeeForm.name} onChange={(event) => setEmployeeForm({ ...employeeForm, name: event.target.value })} placeholder="Priya Shah" required /></label>
          <label><span>Email</span><input type="email" value={employeeForm.email} onChange={(event) => setEmployeeForm({ ...employeeForm, email: event.target.value })} placeholder="name@assetflow.demo" required /></label>
          <label><span>Employee ID</span><input value={employeeForm.employeeId} onChange={(event) => setEmployeeForm({ ...employeeForm, employeeId: event.target.value })} placeholder="AF-EMP-006" required /></label>
          <label><span>Department</span><select value={employeeForm.departmentId} onChange={(event) => setEmployeeForm({ ...employeeForm, departmentId: event.target.value })} required><option value="">Select department</option>{departments.map((department) => <option value={department.id} key={department.id}>{department.name}{department.status === "Inactive" ? " (Inactive)" : ""}</option>)}</select></label>
          <label><span>Role</span><select value={employeeForm.role} onChange={(event) => setEmployeeForm({ ...employeeForm, role: event.target.value as EmployeeRole })}>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>
          <label><span>Status</span><select value={employeeForm.status} onChange={(event) => setEmployeeForm({ ...employeeForm, status: event.target.value as EntityStatus })}>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label><span>Job title</span><input value={employeeForm.jobTitle} onChange={(event) => setEmployeeForm({ ...employeeForm, jobTitle: event.target.value })} placeholder="Asset Operations Manager" /></label>
          <label><span>Phone</span><input value={employeeForm.phone} onChange={(event) => setEmployeeForm({ ...employeeForm, phone: event.target.value })} placeholder="+91 98765 10006" /></label>
          <label><span>Location</span><input value={employeeForm.location} onChange={(event) => setEmployeeForm({ ...employeeForm, location: event.target.value })} placeholder="Bengaluru HQ" /></label>
          {formError && <p className="asset-form-error" role="alert">{formError}</p>}
          <footer><button type="button" className="button" onClick={closeModal}>Cancel</button><button type="submit" className="button primary">{editingEmployeeId === "new" ? "Add Employee" : "Save Employee"}</button></footer>
        </form>}
      </section>
    </div>}
  </FeatureShell>;
}
