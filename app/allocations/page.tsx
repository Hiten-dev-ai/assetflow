"use client";

import { Boxes, Building2, CheckCircle2, ChevronRight, RotateCcw, Search, Send, UserRoundCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FeatureShell } from "../../components/FeatureShell";
import { recordActivity } from "../../lib/activityLog";
import { AssetCondition, AssetDirectoryRecord, readAssetDirectory, writeAssetDirectory } from "../../lib/assetDirectory";
import { DepartmentRecord, EmployeeRecord, departmentName, readDepartments, readEmployees } from "../../lib/organizationDirectory";
import { currentUser } from "../../lib/localAuth";

type AllocationStatus = "Active" | "Transfer Pending" | "Returned";

type AllocationRecord = {
  id: string;
  assetTag: string;
  employeeId: string;
  departmentId: string;
  allocatedAt: string;
  dueAt: string;
  status: AllocationStatus;
  reason: string;
  requestedToEmployeeId?: string;
  returnedAt?: string;
  conditionOut: AssetCondition;
  conditionIn?: AssetCondition;
  notes: string;
};

const allocationStorageKey = "assetflow-allocations";
const conditions: AssetCondition[] = ["Excellent", "Good", "Fair", "Needs Service", "Damaged"];

const seedAllocations: AllocationRecord[] = [
  {
    id: "alloc-af0001-priya",
    assetTag: "AF-0001",
    employeeId: "emp-priya",
    departmentId: "dept-engineering",
    allocatedAt: "2026-03-12",
    dueAt: "2026-07-20",
    status: "Active",
    reason: "Primary engineering laptop.",
    conditionOut: "Good",
    notes: "Charger and privacy screen issued.",
  },
];

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readAllocations() {
  if (!hasStorage()) return seedAllocations;

  try {
    const parsed = JSON.parse(localStorage.getItem(allocationStorageKey) ?? "[]") as unknown;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed as AllocationRecord[] : seedAllocations;
  } catch {
    return seedAllocations;
  }
}

function writeAllocations(records: AllocationRecord[]) {
  if (!hasStorage()) return;
  localStorage.setItem(allocationStorageKey, JSON.stringify(records));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function makeId(prefix: string) {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? `${prefix}-${crypto.randomUUID()}` : `${prefix}-${Date.now().toString(36)}`;
}

function employeeName(id: string, employees: EmployeeRecord[]) {
  return employees.find((employee) => employee.id === id)?.name ?? "Unassigned";
}

function employeeDepartment(id: string, employees: EmployeeRecord[], departments: DepartmentRecord[]) {
  const employee = employees.find((item) => item.id === id);
  return employee ? departmentName(employee.departmentId, departments) : "Unassigned";
}

function statusClass(status: AllocationStatus) {
  return status.toLowerCase().replace(/\s+/g, "-");
}

function saveAssets(nextAssets: AssetDirectoryRecord[], setAssets: (assets: AssetDirectoryRecord[]) => void) {
  setAssets(nextAssets);
  writeAssetDirectory(nextAssets);
}

function saveAllocations(nextAllocations: AllocationRecord[], setAllocations: (records: AllocationRecord[]) => void) {
  setAllocations(nextAllocations);
  writeAllocations(nextAllocations);
}

export default function AllocationsPage() {
  const [assets, setAssets] = useState<AssetDirectoryRecord[]>(() => readAssetDirectory());
  const [employees] = useState<EmployeeRecord[]>(() => readEmployees());
  const [departments] = useState<DepartmentRecord[]>(() => readDepartments());
  const [allocations, setAllocations] = useState<AllocationRecord[]>(() => readAllocations());
  const [query, setQuery] = useState("");
  const [selectedAssetTag, setSelectedAssetTag] = useState(() => readAssetDirectory().find((asset) => asset.status === "Allocated")?.tag ?? readAssetDirectory()[0]?.tag ?? "");
  const [targetEmployeeId, setTargetEmployeeId] = useState(() => readEmployees().find((employee) => employee.status === "Active" && employee.id !== "emp-priya")?.id ?? readEmployees()[0]?.id ?? "");
  const [dueAt, setDueAt] = useState("2026-07-31");
  const [reason, setReason] = useState("");
  const [returnCondition, setReturnCondition] = useState<AssetCondition>("Good");
  const [message, setMessage] = useState("Select an asset to allocate, transfer, or return.");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/assets", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<AssetDirectoryRecord[]> : Promise.reject(new Error("Unable to load assets.")))
      .then((records) => {
        if (active) setAssets(records);
      })
      .catch(() => {
        if (active) setMessage("Using the local allocation directory while the Assets service is unavailable.");
      });
    return () => { active = false; };
  }, []);

  const activeEmployees = useMemo(() => employees.filter((employee) => employee.status === "Active"), [employees]);
  const isAdmin = currentUser()?.role === "ADMIN";
  const categoryOptions = useMemo(() => [...new Set(assets.map((asset) => asset.category))].sort(), [assets]);
  const categoryAssets = useMemo(() => assets.filter((asset) => asset.category === selectedCategory), [assets, selectedCategory]);
  const accessibleDepartments = useMemo(() => {
    if (isAdmin) return departments.filter((department) => department.status === "Active");
    const user = currentUser();
    const employee = employees.find((item) => item.email.toLowerCase() === user?.username.toLowerCase());
    return departments.filter((department) => department.id === employee?.departmentId);
  }, [departments, employees, isAdmin]);
  const scopedAssets = useMemo(() => categoryAssets.filter((asset) => !selectedDepartmentId || asset.department === departmentName(selectedDepartmentId, departments)), [categoryAssets, departments, selectedDepartmentId]);
  const selectedAsset = scopedAssets.find((asset) => asset.tag === selectedAssetTag) ?? scopedAssets[0] ?? null;
  const activeAllocation = selectedAsset ? allocations.find((allocation) => allocation.assetTag === selectedAsset.tag && allocation.status !== "Returned") ?? null : null;
  const currentHolderId = activeAllocation?.employeeId ?? "";
  const transferTargetId = activeAllocation?.requestedToEmployeeId ?? targetEmployeeId;
  const transferTargets = activeEmployees.filter((employee) => employee.id !== currentHolderId);

  const visibleAllocations = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return allocations.filter((allocation) => {
      const asset = assets.find((item) => item.tag === allocation.assetTag);
      const searchable = [
        allocation.assetTag,
        asset?.name ?? "",
        allocation.status,
        employeeName(allocation.employeeId, employees),
        employeeName(allocation.requestedToEmployeeId ?? "", employees),
        departmentName(allocation.departmentId, departments),
        allocation.reason,
      ].join(" ").toLowerCase();

      const matchesScope = asset?.category === selectedCategory
        && (!selectedDepartmentId || allocation.departmentId === selectedDepartmentId || asset?.department === departmentName(selectedDepartmentId, departments));
      return matchesScope && (!normalized || searchable.includes(normalized));
    });
  }, [allocations, assets, departments, employees, query, selectedCategory, selectedDepartmentId]);

  function updateAsset(assetTag: string, update: (asset: AssetDirectoryRecord) => AssetDirectoryRecord) {
    const nextAssets = assets.map((asset) => asset.tag === assetTag ? update(asset) : asset);
    saveAssets(nextAssets, setAssets);
    const nextAsset = nextAssets.find((asset) => asset.tag === assetTag);
    if (!nextAsset) return;
    void fetch(`/api/assets/${encodeURIComponent(assetTag)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nextAsset.name,
        category: nextAsset.category,
        serialNumber: nextAsset.serialNumber,
        acquisitionDate: nextAsset.acquisitionDate,
        acquisitionCost: nextAsset.acquisitionCost,
        condition: nextAsset.condition,
        department: nextAsset.department,
        location: nextAsset.location,
        shared: nextAsset.shared,
        notes: nextAsset.notes,
        status: nextAsset.status,
      }),
    }).catch(() => setMessage("Allocation saved locally, but the Assets service could not be updated."));
  }

  function allocateAsset() {
    if (!selectedAsset) return;
    const target = activeEmployees.find((employee) => employee.id === targetEmployeeId);
    if (!target) {
      setMessage("Choose an active employee from Organization.");
      return;
    }

    if (selectedAsset.status !== "Available") {
      setMessage(`${selectedAsset.tag} is ${selectedAsset.status}. Use transfer or return first.`);
      return;
    }

    const targetDepartment = departmentName(target.departmentId, departments);
    const allocation: AllocationRecord = {
      id: makeId("alloc"),
      assetTag: selectedAsset.tag,
      employeeId: target.id,
      departmentId: target.departmentId,
      allocatedAt: today(),
      dueAt,
      status: "Active",
      reason: reason.trim() || "Standard allocation.",
      conditionOut: selectedAsset.condition,
      notes: `Allocated from Assets to ${target.name}.`,
    };

    saveAllocations([allocation, ...allocations], setAllocations);
    updateAsset(selectedAsset.tag, (asset) => ({
      ...asset,
      status: "Allocated",
      department: targetDepartment,
      location: target.location || asset.location,
      lastUpdated: "Just now",
      recentActivity: `Allocated to ${target.name}`,
      allocationHistory: [{ date: today(), title: `Allocated to ${target.name}`, detail: allocation.reason }, ...asset.allocationHistory],
    }));
    setReason("");
    setMessage(`${selectedAsset.tag} allocated to ${target.name}.`);
    recordActivity({ kind: "Asset", title: "Asset allocated", description: `${selectedAsset.tag} assigned to ${target.name}.`, actor: "Allocation", target: selectedAsset.tag, severity: "Success" });
  }

  function requestTransfer() {
    if (!selectedAsset || !activeAllocation) return;
    const target = transferTargets.find((employee) => employee.id === targetEmployeeId);
    if (!target) {
      setMessage("Choose a different active employee for transfer.");
      return;
    }

    if (!reason.trim()) {
      setMessage("Add a transfer reason before submitting.");
      return;
    }

    const nextAllocations = allocations.map((allocation) => allocation.id === activeAllocation.id ? {
      ...allocation,
      status: "Transfer Pending" as AllocationStatus,
      requestedToEmployeeId: target.id,
      reason: reason.trim(),
    } : allocation);

    saveAllocations(nextAllocations, setAllocations);
    updateAsset(selectedAsset.tag, (asset) => ({ ...asset, lastUpdated: "Just now", recentActivity: `Transfer requested to ${target.name}` }));
    setMessage(`Transfer request sent to ${target.name}.`);
    recordActivity({ kind: "Approval", title: "Transfer requested", description: `${selectedAsset.tag} from ${employeeName(activeAllocation.employeeId, employees)} to ${target.name}.`, actor: "Allocation", target: selectedAsset.tag, severity: "Info" });
  }

  function approveTransfer() {
    if (!selectedAsset || !activeAllocation?.requestedToEmployeeId) return;
    const target = employees.find((employee) => employee.id === activeAllocation.requestedToEmployeeId);
    if (!target) {
      setMessage("Transfer target is no longer available.");
      return;
    }

    const targetDepartment = departmentName(target.departmentId, departments);
    const nextAllocations = allocations.map((allocation) => allocation.id === activeAllocation.id ? {
      ...allocation,
      employeeId: target.id,
      departmentId: target.departmentId,
      status: "Active" as AllocationStatus,
      allocatedAt: today(),
      requestedToEmployeeId: undefined,
      notes: `Transfer approved to ${target.name}.`,
    } : allocation);

    saveAllocations(nextAllocations, setAllocations);
    updateAsset(selectedAsset.tag, (asset) => ({
      ...asset,
      status: "Allocated",
      department: targetDepartment,
      location: target.location || asset.location,
      lastUpdated: "Just now",
      recentActivity: `Transferred to ${target.name}`,
      allocationHistory: [{ date: today(), title: `Transferred to ${target.name}`, detail: activeAllocation.reason }, ...asset.allocationHistory],
    }));
    setReason("");
    setMessage(`Transfer approved. ${selectedAsset.tag} now belongs to ${target.name}.`);
    recordActivity({ kind: "Approval", title: "Transfer approved", description: `${selectedAsset.tag} transferred to ${target.name}.`, actor: "Allocation", target: selectedAsset.tag, severity: "Success" });
  }

  function markReturned() {
    if (!selectedAsset || !activeAllocation) return;
    const holder = employeeName(activeAllocation.employeeId, employees);
    const nextAllocations = allocations.map((allocation) => allocation.id === activeAllocation.id ? {
      ...allocation,
      status: "Returned" as AllocationStatus,
      returnedAt: today(),
      conditionIn: returnCondition,
      notes: reason.trim() || `Returned by ${holder}.`,
    } : allocation);

    saveAllocations(nextAllocations, setAllocations);
    updateAsset(selectedAsset.tag, (asset) => ({
      ...asset,
      status: "Available",
      condition: returnCondition,
      lastUpdated: "Just now",
      recentActivity: `Returned by ${holder}`,
      allocationHistory: [{ date: today(), title: `Returned by ${holder}`, detail: reason.trim() || `Condition marked ${returnCondition}.` }, ...asset.allocationHistory],
    }));
    setReason("");
    setMessage(`${selectedAsset.tag} returned and marked available.`);
    recordActivity({ kind: "Asset", title: "Asset returned", description: `${selectedAsset.tag} returned by ${holder}.`, actor: "Allocation", target: selectedAsset.tag, severity: "Success" });
  }

  return <FeatureShell title="Allocation & transfer" actions={<span className="quiet-badge">Synced with Organization + Assets</span>}>
    <section className="allocation-summary-grid">
      <article><span>Active allocations</span><strong>{allocations.filter((item) => item.status === "Active").length}</strong></article>
      <article><span>Pending transfers</span><strong>{allocations.filter((item) => item.status === "Transfer Pending").length}</strong></article>
      <article><span>Available assets</span><strong>{assets.filter((asset) => asset.status === "Available").length}</strong></article>
      <article><span>Active employees</span><strong>{activeEmployees.length}</strong></article>
    </section>

    <section className="clean-panel allocation-navigator">
      <div className="panel-title"><div><p className="eyebrow">Step 1</p><h2>Select asset category</h2></div><span>{categoryOptions.length} categories</span></div>
      <div className="allocation-tile-grid">
        {categoryOptions.map((category) => {
          const count = assets.filter((asset) => asset.category === category).length;
          return <button type="button" key={category} className={`allocation-tile ${selectedCategory === category ? "selected" : ""}`} onClick={() => { setSelectedCategory(category); setSelectedDepartmentId(""); }}><Boxes size={18} /><strong>{category}</strong><span>{count} asset{count === 1 ? "" : "s"}</span><ChevronRight size={15} /></button>;
        })}
      </div>
    </section>

    {selectedCategory && <section className="clean-panel allocation-navigator">
      <div className="panel-title"><div><p className="eyebrow">Step 2</p><h2>Select department</h2></div><span>{isAdmin ? "Administrator view" : "Your department"}</span></div>
      <div className="allocation-tile-grid">
        {isAdmin && <button type="button" className={`allocation-tile ${selectedDepartmentId === "" ? "selected" : ""}`} onClick={() => setSelectedDepartmentId("")}><Building2 size={18} /><strong>All departments</strong><span>{categoryAssets.length} category assets</span><ChevronRight size={15} /></button>}
        {accessibleDepartments.map((department) => {
          const count = categoryAssets.filter((asset) => asset.department === department.name).length;
          return <button type="button" key={department.id} className={`allocation-tile ${selectedDepartmentId === department.id ? "selected" : ""}`} onClick={() => setSelectedDepartmentId(department.id)}><Building2 size={18} /><strong>{department.name}</strong><span>{count} asset{count === 1 ? "" : "s"}</span><ChevronRight size={15} /></button>;
        })}
      </div>
    </section>}

    {selectedCategory && (isAdmin || selectedDepartmentId) && <section className="allocation-workspace">
      <article className="clean-panel compact-form allocation-card">
        <div className="panel-title"><h2>Allocation action</h2><span className={`status ${selectedAsset ? statusClass(activeAllocation?.status ?? "Returned") : ""}`}>{activeAllocation?.status ?? selectedAsset?.status ?? "No asset"}</span></div>
        <label>Asset<select value={selectedAsset?.tag ?? ""} onChange={(event) => setSelectedAssetTag(event.target.value)}>{assets.map((asset) => <option value={asset.tag} key={asset.tag}>{asset.tag} · {asset.name} · {asset.status}</option>)}</select></label>

        {selectedAsset && <div className="allocation-selected">
          <strong>{selectedAsset.name}</strong>
          <span>{selectedAsset.department} · {selectedAsset.location}</span>
          <small>{selectedAsset.condition} · {selectedAsset.shared ? "Bookable" : "Assigned asset"}</small>
        </div>}

        {selectedAsset?.status === "Available" && <label>Allocate to<select value={targetEmployeeId} onChange={(event) => setTargetEmployeeId(event.target.value)}>{activeEmployees.map((employee) => <option value={employee.id} key={employee.id}>{employee.name} · {employeeDepartment(employee.id, employees, departments)}</option>)}</select></label>}

        {activeAllocation && <div className="notice danger">Already allocated to {employeeName(activeAllocation.employeeId, employees)} · direct re-allocation is blocked.</div>}

        {activeAllocation && <div className="two-fields">
          <label>From<input value={employeeName(activeAllocation.employeeId, employees)} readOnly /></label>
          <label>Transfer to<select value={transferTargetId} onChange={(event) => setTargetEmployeeId(event.target.value)} disabled={activeAllocation.status === "Transfer Pending"}>{transferTargets.map((employee) => <option value={employee.id} key={employee.id}>{employee.name} · {employeeDepartment(employee.id, employees, departments)}</option>)}</select></label>
        </div>}

        <div className="two-fields">
          <label>Due date<input type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} disabled={Boolean(activeAllocation)} /></label>
          <label>Return condition<select value={returnCondition} onChange={(event) => setReturnCondition(event.target.value as AssetCondition)} disabled={!activeAllocation}>{conditions.map((condition) => <option key={condition}>{condition}</option>)}</select></label>
        </div>

        <label>Reason / notes<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} placeholder="Why is this asset being allocated, transferred, or returned?" /></label>

        <div className="allocation-actions-row">
          <button className="button primary" type="button" onClick={allocateAsset} disabled={!selectedAsset || selectedAsset.status !== "Available"}><UserRoundCheck size={15} />Allocate</button>
          <button className="button" type="button" onClick={requestTransfer} disabled={!activeAllocation || activeAllocation.status === "Transfer Pending"}><Send size={15} />Request transfer</button>
          <button className="button" type="button" onClick={approveTransfer} disabled={activeAllocation?.status !== "Transfer Pending"}><CheckCircle2 size={15} />Approve transfer</button>
          <button className="button" type="button" onClick={markReturned} disabled={!activeAllocation}><RotateCcw size={15} />Return</button>
        </div>
        <p className="form-status" role="status">{message}</p>
      </article>

      <aside className="clean-panel allocation-card">
        <div className="panel-title"><h2>Rules</h2></div>
        <div className="plain-list allocation-rules">
          <div><span className="activity-dot" /><strong>Available assets</strong><span>can be allocated to active Organization employees.</span></div>
          <div><span className="activity-dot" /><strong>Allocated assets</strong><span>must use transfer or return before reassignment.</span></div>
          <div><span className="activity-dot" /><strong>Approved transfers</strong><span>update the shared Assets directory immediately.</span></div>
        </div>
      </aside>
    </section>}

    {!selectedCategory && <section className="clean-panel allocation-empty-state"><Boxes size={22} /><h2>Choose a category to start</h2><p>Select an asset category above, then narrow to a department before editing its allocations.</p></section>}

    {selectedCategory && (isAdmin || selectedDepartmentId) && <section className="activity-toolbar allocation-toolbar">
      <label className="activity-search">
        <Search size={15} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search allocation history" />
      </label>
    </section>}

    {selectedCategory && (isAdmin || selectedDepartmentId) && <section className="clean-panel table-panel allocation-history-table">
      <table className="clean-table">
        <thead><tr><th>Asset</th><th>Holder</th><th>Department</th><th>Status</th><th>Dates</th><th>Notes</th></tr></thead>
        <tbody>
          {visibleAllocations.map((allocation) => {
            const asset = assets.find((item) => item.tag === allocation.assetTag);
            return <tr key={allocation.id}>
              <td><strong>{allocation.assetTag}</strong><small>{asset?.name ?? "Unknown asset"}</small></td>
              <td><strong>{employeeName(allocation.employeeId, employees)}</strong>{allocation.requestedToEmployeeId && <small>To {employeeName(allocation.requestedToEmployeeId, employees)}</small>}</td>
              <td>{departmentName(allocation.departmentId, departments)}</td>
              <td><span className={`status allocation-${statusClass(allocation.status)}`}>{allocation.status}</span></td>
              <td><strong>{allocation.allocatedAt}</strong><small>{allocation.returnedAt ? `Returned ${allocation.returnedAt}` : `Due ${allocation.dueAt}`}</small></td>
              <td>{allocation.notes || allocation.reason || "No notes"}</td>
            </tr>;
          })}
        </tbody>
      </table>
      {visibleAllocations.length === 0 && <p className="empty-copy">No allocation records match your search.</p>}
    </section>}
  </FeatureShell>;
}
