"use client";

import { CheckCircle2, Pencil, Plus, RotateCcw, Search, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { FeatureShell } from "../../components/FeatureShell";
import type { AssetCategoryRecord, DepartmentRecord, EmployeeRecord, EmployeeRole, EntityStatus } from "../../lib/erpStore";

type OrganizationTab = "Departments" | "Asset Categories" | "Employees";
type OrganizationPayload = { departments: DepartmentRecord[]; categories: AssetCategoryRecord[]; employees: EmployeeRecord[] };

const tabs: OrganizationTab[] = ["Departments", "Asset Categories", "Employees"];
const roles: EmployeeRole[] = ["Employee", "Department Head", "Asset Manager", "Admin"];
const statusOptions: EntityStatus[] = ["Active", "Inactive"];

const emptyDepartment: Omit<DepartmentRecord, "id"> = { name: "", code: "", headEmployeeId: "", parentId: "", status: "Active", notes: "" };
const emptyCategory: Omit<AssetCategoryRecord, "id"> = { name: "", code: "", description: "", usefulLife: "", requiresSerial: true, trackWarranty: true, status: "Active" };
const emptyEmployee: Omit<EmployeeRecord, "id"> = { name: "", email: "", employeeId: "", departmentId: "", role: "Employee", status: "Active", jobTitle: "", phone: "", location: "" };

async function readApi<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as T & { error?: string };
  if (!response.ok) throw new Error(payload?.error ?? "Unable to save changes.");
  return payload;
}

function statusClass(status: EntityStatus) {
  return status === "Active" ? "active" : "inactive";
}

function roleClass(role: EmployeeRole) {
  return role.toLowerCase().replaceAll(" ", "-");
}

function departmentName(id: string, departments: DepartmentRecord[]) {
  return departments.find((department) => department.id === id)?.name ?? "Unassigned";
}

function employeeName(id: string, employees: EmployeeRecord[]) {
  return employees.find((employee) => employee.id === id)?.name ?? "Unassigned";
}

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState<OrganizationTab>("Departments");
  const [data, setData] = useState<OrganizationPayload>({ departments: [], categories: [], employees: [] });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<{ type: OrganizationTab; id: string } | null>(null);
  const [departmentForm, setDepartmentForm] = useState(emptyDepartment);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [employeeForm, setEmployeeForm] = useState(emptyEmployee);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeDepartmentFilter, setEmployeeDepartmentFilter] = useState("All");
  const [employeeRoleFilter, setEmployeeRoleFilter] = useState("All");
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState("All");

  async function load() {
    setLoading(true);
    try {
      setData(await readApi<OrganizationPayload>(await fetch("/api/organization", { cache: "no-store" })));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load Organization.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const activeEmployees = data.employees.filter((employee) => employee.status === "Active");
  const activeDepartments = data.departments.filter((department) => department.status === "Active");
  const filteredEmployees = useMemo(() => {
    const query = employeeSearch.trim().toLowerCase();
    return data.employees.filter((employee) => {
      const haystack = [employee.name, employee.email, employee.employeeId, employee.role, employee.status, employee.jobTitle, employee.location, departmentName(employee.departmentId, data.departments)].join(" ").toLowerCase();
      return (!query || haystack.includes(query))
        && (employeeDepartmentFilter === "All" || employee.departmentId === employeeDepartmentFilter)
        && (employeeRoleFilter === "All" || employee.role === employeeRoleFilter)
        && (employeeStatusFilter === "All" || employee.status === employeeStatusFilter);
    });
  }, [data.departments, data.employees, employeeDepartmentFilter, employeeRoleFilter, employeeSearch, employeeStatusFilter]);

  function openCreate() {
    setMessage("");
    setEditing({ type: activeTab, id: "new" });
    setDepartmentForm(emptyDepartment);
    setCategoryForm(emptyCategory);
    setEmployeeForm({ ...emptyEmployee, departmentId: activeDepartments[0]?.id ?? data.departments[0]?.id ?? "" });
  }

  function openEdit(type: OrganizationTab, id: string) {
    setMessage("");
    setEditing({ type, id });
    if (type === "Departments") {
      const row = data.departments.find((item) => item.id === id);
      if (row) setDepartmentForm({ ...row });
    } else if (type === "Asset Categories") {
      const row = data.categories.find((item) => item.id === id);
      if (row) setCategoryForm({ ...row });
    } else {
      const row = data.employees.find((item) => item.id === id);
      if (row) setEmployeeForm({ ...row });
    }
  }

  function closeModal() {
    setEditing(null);
  }

  async function save(path: string, body: unknown, id?: string) {
    const method = id ? "PATCH" : "POST";
    const next = await readApi<OrganizationPayload>(await fetch(id ? `${path}/${id}` : path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }));
    setData(next);
  }

  async function submitDepartment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await save("/api/organization/departments", departmentForm, editing?.id === "new" ? undefined : editing?.id);
      setMessage(`${departmentForm.name} saved.`);
      closeModal();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save department.");
    }
  }

  async function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await save("/api/organization/categories", categoryForm, editing?.id === "new" ? undefined : editing?.id);
      setMessage(`${categoryForm.name} saved.`);
      closeModal();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save category.");
    }
  }

  async function submitEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await save("/api/organization/employees", employeeForm, editing?.id === "new" ? undefined : editing?.id);
      setMessage(`${employeeForm.name} saved.`);
      closeModal();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save employee.");
    }
  }

  async function toggleStatus(type: OrganizationTab, row: DepartmentRecord | AssetCategoryRecord | EmployeeRecord) {
    const next = { ...row, status: row.status === "Active" ? "Inactive" : "Active" };
    const path = type === "Departments" ? "/api/organization/departments" : type === "Asset Categories" ? "/api/organization/categories" : "/api/organization/employees";
    try {
      await save(path, next, row.id);
      setMessage(`${"name" in row ? row.name : "Record"} ${next.status.toLowerCase()}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update status.");
    }
  }

  const modalTitle = editing?.id === "new" ? `Add ${editing.type === "Asset Categories" ? "Category" : editing.type.slice(0, -1)}` : `Edit ${editing?.type === "Asset Categories" ? "Category" : editing?.type.slice(0, -1)}`;

  return <FeatureShell title="Organization Setup" actions={<button className="button primary" type="button" onClick={openCreate}><Plus size={15} />Add {activeTab === "Asset Categories" ? "Category" : activeTab.slice(0, -1)}</button>}>
    <div className="tabs organization-tabs" role="tablist" aria-label="Organization setup sections">
      {tabs.map((tab) => <button type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)} key={tab}>{tab}</button>)}
    </div>

    {message && <div className="asset-toast organization-toast" role="status"><CheckCircle2 size={15} />{message}<button type="button" onClick={() => setMessage("")} aria-label="Dismiss"><X size={14} /></button></div>}
    {loading && <p className="empty-copy">Loading organization data...</p>}

    {activeTab === "Departments" && <section className="clean-panel table-panel organization-panel">
      <table className="clean-table organization-table departments-table">
        <thead><tr><th>Department</th><th>Code</th><th>Head</th><th>Parent</th><th>Status</th><th>Notes</th><th>Actions</th></tr></thead>
        <tbody>{data.departments.map((department) => <tr key={department.id}>
          <td><strong>{department.name}</strong></td>
          <td>{department.code}</td>
          <td>{employeeName(department.headEmployeeId, data.employees)}</td>
          <td>{department.parentId ? departmentName(department.parentId, data.departments) : "None"}</td>
          <td><button type="button" className={`status ${statusClass(department.status)}`} onClick={() => toggleStatus("Departments", department)}>{department.status}</button></td>
          <td>{department.notes || "No notes"}</td>
          <td><div className="organization-actions"><button type="button" className="row-action" onClick={() => openEdit("Departments", department.id)}><Pencil size={13} />Edit</button><button type="button" className="row-action" onClick={() => toggleStatus("Departments", department)}><RotateCcw size={13} />{department.status === "Active" ? "Deactivate" : "Reactivate"}</button></div></td>
        </tr>)}</tbody>
      </table>
    </section>}

    {activeTab === "Asset Categories" && <section className="clean-panel table-panel organization-panel">
      <table className="clean-table organization-table categories-table">
        <thead><tr><th>Category</th><th>Code</th><th>Useful life</th><th>Serial</th><th>Warranty</th><th>Status</th><th>Description</th><th>Actions</th></tr></thead>
        <tbody>{data.categories.map((category) => <tr key={category.id}>
          <td><strong>{category.name}</strong></td>
          <td>{category.code}</td>
          <td>{category.usefulLife ? `${category.usefulLife} months` : "Optional"}</td>
          <td><span className={category.requiresSerial ? "bookable-pill yes" : "bookable-pill"}>{category.requiresSerial ? "Required" : "No"}</span></td>
          <td><span className={category.trackWarranty ? "bookable-pill yes" : "bookable-pill"}>{category.trackWarranty ? "Tracked" : "No"}</span></td>
          <td><button type="button" className={`status ${statusClass(category.status)}`} onClick={() => toggleStatus("Asset Categories", category)}>{category.status}</button></td>
          <td>{category.description || "No description"}</td>
          <td><div className="organization-actions"><button type="button" className="row-action" onClick={() => openEdit("Asset Categories", category.id)}><Pencil size={13} />Edit</button><button type="button" className="row-action" onClick={() => toggleStatus("Asset Categories", category)}><RotateCcw size={13} />{category.status === "Active" ? "Deactivate" : "Reactivate"}</button></div></td>
        </tr>)}</tbody>
      </table>
    </section>}

    {activeTab === "Employees" && <>
      <section className="organization-employee-toolbar">
        <label className="asset-search organization-search"><Search size={15} /><input value={employeeSearch} onChange={(event) => setEmployeeSearch(event.target.value)} placeholder="Search name, email, department, role, status, title, or location" /></label>
        <div className="asset-filters organization-filters">
          <select value={employeeDepartmentFilter} onChange={(event) => setEmployeeDepartmentFilter(event.target.value)}><option value="All">All departments</option>{data.departments.map((department) => <option value={department.id} key={department.id}>{department.name}</option>)}</select>
          <select value={employeeRoleFilter} onChange={(event) => setEmployeeRoleFilter(event.target.value)}><option value="All">All roles</option>{roles.map((role) => <option key={role}>{role}</option>)}</select>
          <select value={employeeStatusFilter} onChange={(event) => setEmployeeStatusFilter(event.target.value)}><option value="All">All status</option>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select>
        </div>
      </section>
      <section className="clean-panel table-panel organization-panel">
        <table className="clean-table organization-table employees-table">
          <thead><tr><th>Employee</th><th>ID</th><th>Department</th><th>Role</th><th>Status</th><th>Contact</th><th>Location</th><th>Actions</th></tr></thead>
          <tbody>{filteredEmployees.map((employee) => <tr key={employee.id}>
            <td><strong>{employee.name}</strong><small>{employee.email}</small></td>
            <td>{employee.employeeId}</td>
            <td>{departmentName(employee.departmentId, data.departments)}</td>
            <td><span className={`role-pill ${roleClass(employee.role)}`}>{employee.role}</span></td>
            <td><button type="button" className={`status ${statusClass(employee.status)}`} onClick={() => toggleStatus("Employees", employee)}>{employee.status}</button></td>
            <td><strong>{employee.jobTitle || "No title"}</strong><small>{employee.phone || "No phone"}</small></td>
            <td>{employee.location || "Unassigned"}</td>
            <td><div className="organization-actions"><button type="button" className="row-action" onClick={() => openEdit("Employees", employee.id)}><Pencil size={13} />Edit</button><button type="button" className="row-action" onClick={() => toggleStatus("Employees", employee)}><RotateCcw size={13} />{employee.status === "Active" ? "Deactivate" : "Reactivate"}</button></div></td>
          </tr>)}</tbody>
        </table>
        {filteredEmployees.length === 0 && <p className="empty-copy">No employees match the current filters.</p>}
      </section>
    </>}

    {editing && <div className="asset-modal-backdrop" role="presentation">
      <section className="asset-modal organization-modal" role="dialog" aria-modal="true" aria-labelledby="organization-modal-title">
        <header><div><p>{editing.type}</p><h2 id="organization-modal-title">{modalTitle}</h2></div><button type="button" onClick={closeModal} aria-label="Close organization form"><X size={17} /></button></header>
        {editing.type === "Departments" && <form className="asset-form organization-form" onSubmit={submitDepartment}>
          <label><span>Department name</span><input autoFocus value={departmentForm.name} onChange={(event) => setDepartmentForm({ ...departmentForm, name: event.target.value })} required /></label>
          <label><span>Department code</span><input value={departmentForm.code} onChange={(event) => setDepartmentForm({ ...departmentForm, code: event.target.value.toUpperCase() })} required /></label>
          <label><span>Department head</span><select value={departmentForm.headEmployeeId} onChange={(event) => setDepartmentForm({ ...departmentForm, headEmployeeId: event.target.value })}><option value="">Unassigned</option>{activeEmployees.map((employee) => <option value={employee.id} key={employee.id}>{employee.name}</option>)}</select></label>
          <label><span>Parent department</span><select value={departmentForm.parentId} onChange={(event) => setDepartmentForm({ ...departmentForm, parentId: event.target.value })}><option value="">None</option>{data.departments.filter((department) => department.id !== editing.id).map((department) => <option value={department.id} key={department.id}>{department.name}</option>)}</select></label>
          <label><span>Status</span><select value={departmentForm.status} onChange={(event) => setDepartmentForm({ ...departmentForm, status: event.target.value as EntityStatus })}>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label className="organization-wide-field"><span>Notes</span><textarea value={departmentForm.notes} onChange={(event) => setDepartmentForm({ ...departmentForm, notes: event.target.value })} /></label>
          <footer><button type="button" className="button" onClick={closeModal}>Cancel</button><button type="submit" className="button primary">Save Department</button></footer>
        </form>}
        {editing.type === "Asset Categories" && <form className="asset-form organization-form" onSubmit={submitCategory}>
          <label><span>Category name</span><input autoFocus value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} required /></label>
          <label><span>Category code</span><input value={categoryForm.code} onChange={(event) => setCategoryForm({ ...categoryForm, code: event.target.value.toUpperCase() })} required /></label>
          <label><span>Useful life</span><input type="number" min="0" value={categoryForm.usefulLife} onChange={(event) => setCategoryForm({ ...categoryForm, usefulLife: event.target.value })} /></label>
          <label><span>Status</span><select value={categoryForm.status} onChange={(event) => setCategoryForm({ ...categoryForm, status: event.target.value as EntityStatus })}>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label className="asset-toggle organization-toggle"><input type="checkbox" checked={categoryForm.requiresSerial} onChange={(event) => setCategoryForm({ ...categoryForm, requiresSerial: event.target.checked })} /><span>Requires serial number</span></label>
          <label className="asset-toggle organization-toggle"><input type="checkbox" checked={categoryForm.trackWarranty} onChange={(event) => setCategoryForm({ ...categoryForm, trackWarranty: event.target.checked })} /><span>Track warranty</span></label>
          <label className="organization-wide-field"><span>Description</span><textarea value={categoryForm.description} onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })} /></label>
          <footer><button type="button" className="button" onClick={closeModal}>Cancel</button><button type="submit" className="button primary">Save Category</button></footer>
        </form>}
        {editing.type === "Employees" && <form className="asset-form organization-form" onSubmit={submitEmployee}>
          <label><span>Employee name</span><input autoFocus value={employeeForm.name} onChange={(event) => setEmployeeForm({ ...employeeForm, name: event.target.value })} required /></label>
          <label><span>Email</span><input type="email" value={employeeForm.email} onChange={(event) => setEmployeeForm({ ...employeeForm, email: event.target.value })} required /></label>
          <label><span>Employee ID</span><input value={employeeForm.employeeId} onChange={(event) => setEmployeeForm({ ...employeeForm, employeeId: event.target.value.toUpperCase() })} required /></label>
          <label><span>Department</span><select value={employeeForm.departmentId} onChange={(event) => setEmployeeForm({ ...employeeForm, departmentId: event.target.value })} required><option value="">Select department</option>{data.departments.map((department) => <option value={department.id} key={department.id}>{department.name}</option>)}</select></label>
          <label><span>Role</span><select value={employeeForm.role} onChange={(event) => setEmployeeForm({ ...employeeForm, role: event.target.value as EmployeeRole })}>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>
          <label><span>Status</span><select value={employeeForm.status} onChange={(event) => setEmployeeForm({ ...employeeForm, status: event.target.value as EntityStatus })}>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label><span>Job title</span><input value={employeeForm.jobTitle} onChange={(event) => setEmployeeForm({ ...employeeForm, jobTitle: event.target.value })} /></label>
          <label><span>Phone</span><input value={employeeForm.phone} onChange={(event) => setEmployeeForm({ ...employeeForm, phone: event.target.value })} /></label>
          <label><span>Location</span><input value={employeeForm.location} onChange={(event) => setEmployeeForm({ ...employeeForm, location: event.target.value })} /></label>
          <footer><button type="button" className="button" onClick={closeModal}>Cancel</button><button type="submit" className="button primary">Save Employee</button></footer>
        </form>}
      </section>
    </div>}
  </FeatureShell>;
}
