"use client";

import { Boxes, Building2, CheckCircle2, RotateCcw, Search, Send, UserRoundCheck, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FeatureShell } from "../../components/FeatureShell";
import type { AssetCondition, AssetRecord } from "../../lib/assets";
import { conditions, statusClass } from "../../lib/assets";
import type { AllocationRecord, DepartmentRecord, EmployeeRecord } from "../../lib/erpStore";

type OrganizationPayload = { departments: DepartmentRecord[]; employees: EmployeeRecord[] };

async function readApi<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as T & { error?: string; details?: unknown };
  if (!response.ok) throw new Error(payload?.error ?? "Unable to complete action.");
  return payload;
}

function employeeDepartment(employee: EmployeeRecord, departments: DepartmentRecord[]) {
  return departments.find((department) => department.id === employee.departmentId)?.name ?? "Unassigned";
}

export default function AllocationsPage() {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [allocations, setAllocations] = useState<AllocationRecord[]>([]);
  const [organization, setOrganization] = useState<OrganizationPayload>({ departments: [], employees: [] });
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedAssetTag, setSelectedAssetTag] = useState("");
  const [targetEmployeeId, setTargetEmployeeId] = useState("");
  const [dueAt, setDueAt] = useState(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [condition, setCondition] = useState<AssetCondition>("Good");
  const [reason, setReason] = useState("");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("Select an asset to allocate, transfer, or return.");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [nextAssets, nextAllocations, nextOrganization] = await Promise.all([
        readApi<AssetRecord[]>(await fetch("/api/assets", { cache: "no-store" })),
        readApi<AllocationRecord[]>(await fetch("/api/allocations", { cache: "no-store" })),
        readApi<OrganizationPayload>(await fetch("/api/organization", { cache: "no-store" })),
      ]);
      setAssets(nextAssets);
      setAllocations(nextAllocations);
      setOrganization(nextOrganization);
      setSelectedCategory((current) => current || [...new Set(nextAssets.map((asset) => asset.category))].sort()[0] || "");
      setSelectedAssetTag((current) => current || nextAssets[0]?.tag || "");
      setTargetEmployeeId((current) => current || nextOrganization.employees.find((employee) => employee.status === "Active")?.id || "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load allocations.");
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

  const activeEmployees = organization.employees.filter((employee) => employee.status === "Active");
  const categoryOptions = [...new Set(assets.map((asset) => asset.category))].sort();
  const categoryAssets = assets.filter((asset) => !selectedCategory || asset.category === selectedCategory);
  const scopedAssets = categoryAssets.filter((asset) => !selectedDepartmentId || asset.department === organization.departments.find((department) => department.id === selectedDepartmentId)?.name);
  const selectedAsset = scopedAssets.find((asset) => asset.tag === selectedAssetTag) ?? scopedAssets[0] ?? null;
  const activeAllocation = selectedAsset ? allocations.find((allocation) => allocation.assetTag === selectedAsset.tag && allocation.status !== "Returned" && allocation.status !== "Transferred") ?? null : null;
  const visibleAllocations = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return allocations.filter((allocation) => {
      const haystack = [allocation.assetTag, allocation.assetName, allocation.employeeName, allocation.departmentName, allocation.status, allocation.reason, allocation.notes].join(" ").toLowerCase();
      return (!selectedCategory || assets.find((asset) => asset.tag === allocation.assetTag)?.category === selectedCategory)
        && (!selectedDepartmentId || allocation.departmentId === selectedDepartmentId)
        && (!normalized || haystack.includes(normalized));
    });
  }, [allocations, assets, query, selectedCategory, selectedDepartmentId]);

  async function post<T>(url: string, body: unknown = {}) {
    const payload = await readApi<T>(await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }));
    await load();
    return payload;
  }

  async function allocateAsset() {
    if (!selectedAsset) return;
    try {
      await post("/api/allocations", { assetTag: selectedAsset.tag, employeeId: targetEmployeeId, dueAt, reason });
      setReason("");
      setMessage(`${selectedAsset.tag} allocated successfully.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to allocate asset.");
    }
  }

  async function requestTransfer() {
    if (!activeAllocation) return;
    try {
      await post(`/api/allocations/${activeAllocation.id}/transfer`, { employeeId: targetEmployeeId, reason });
      setReason("");
      setMessage("Transfer request submitted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to request transfer.");
    }
  }

  async function approveTransfer() {
    if (!activeAllocation) return;
    try {
      await post(`/api/allocations/${activeAllocation.id}/approve-transfer`);
      setMessage("Transfer approved and asset reallocated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to approve transfer.");
    }
  }

  async function rejectTransfer() {
    if (!activeAllocation) return;
    try {
      await post(`/api/allocations/${activeAllocation.id}/reject-transfer`);
      setMessage("Transfer rejected.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to reject transfer.");
    }
  }

  async function markReturned() {
    if (!activeAllocation) return;
    try {
      await post(`/api/allocations/${activeAllocation.id}/return`, { condition, notes: reason });
      setReason("");
      setMessage("Asset returned and made available.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to return asset.");
    }
  }

  return <FeatureShell title="Allocation & Transfer" actions={<span className="quiet-badge">Server-synced workflow</span>}>
    <section className="allocation-summary-grid">
      <article><span>Active allocations</span><strong>{allocations.filter((item) => item.status === "Active").length}</strong></article>
      <article><span>Pending transfers</span><strong>{allocations.filter((item) => item.status === "Transfer Pending").length}</strong></article>
      <article><span>Available assets</span><strong>{assets.filter((asset) => asset.status === "Available").length}</strong></article>
      <article><span>Overdue returns</span><strong>{allocations.filter((item) => item.overdue).length}</strong></article>
    </section>

    {message && <div className="asset-toast" role="status"><CheckCircle2 size={15} />{message}<button type="button" onClick={() => setMessage("")} aria-label="Dismiss"><X size={14} /></button></div>}
    {loading && <p className="empty-copy">Loading allocation workspace...</p>}

    <section className="clean-panel allocation-navigator">
      <div className="panel-title"><div><p className="eyebrow">Step 1</p><h2>Select asset category</h2></div><span>{categoryOptions.length} categories</span></div>
      <div className="allocation-tile-grid">
        {categoryOptions.map((category) => <button type="button" key={category} className={`allocation-tile ${selectedCategory === category ? "selected" : ""}`} onClick={() => { setSelectedCategory(category); setSelectedAssetTag(""); }}><Boxes size={18} /><strong>{category}</strong><span>{assets.filter((asset) => asset.category === category).length} assets</span></button>)}
      </div>
    </section>

    <section className="clean-panel allocation-navigator">
      <div className="panel-title"><div><p className="eyebrow">Step 2</p><h2>Select department scope</h2></div><span>Optional filter</span></div>
      <div className="allocation-tile-grid">
        <button type="button" className={`allocation-tile ${selectedDepartmentId === "" ? "selected" : ""}`} onClick={() => setSelectedDepartmentId("")}><Building2 size={18} /><strong>All departments</strong><span>{categoryAssets.length} assets</span></button>
        {organization.departments.filter((department) => department.status === "Active").map((department) => <button type="button" className={`allocation-tile ${selectedDepartmentId === department.id ? "selected" : ""}`} key={department.id} onClick={() => setSelectedDepartmentId(department.id)}><Building2 size={18} /><strong>{department.name}</strong><span>{categoryAssets.filter((asset) => asset.department === department.name).length} assets</span></button>)}
      </div>
    </section>

    <section className="allocation-workspace">
      <article className="clean-panel compact-form allocation-card">
        <div className="panel-title"><h2>Allocation action</h2><span className={`status ${selectedAsset ? statusClass(selectedAsset.status) : ""}`}>{activeAllocation?.status ?? selectedAsset?.status ?? "No asset"}</span></div>
        <label>Asset<select value={selectedAsset?.tag ?? ""} onChange={(event) => setSelectedAssetTag(event.target.value)}>{scopedAssets.map((asset) => <option value={asset.tag} key={asset.tag}>{asset.tag} - {asset.name} - {asset.status}</option>)}</select></label>
        {selectedAsset && <div className="allocation-selected"><strong>{selectedAsset.name}</strong><span>{selectedAsset.department} - {selectedAsset.location}</span><small>{selectedAsset.condition} - {selectedAsset.shared ? "Bookable" : "Assigned asset"}</small></div>}
        {activeAllocation && <div className="notice danger">Already allocated to {activeAllocation.employeeName}. Direct reallocation is blocked; request a transfer instead.</div>}
        <label>{activeAllocation ? "Transfer to" : "Allocate to"}<select value={targetEmployeeId} onChange={(event) => setTargetEmployeeId(event.target.value)}>{activeEmployees.filter((employee) => employee.id !== activeAllocation?.employeeId).map((employee) => <option value={employee.id} key={employee.id}>{employee.name} - {employeeDepartment(employee, organization.departments)}</option>)}</select></label>
        <div className="two-fields">
          <label>Expected return<input type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} disabled={Boolean(activeAllocation)} /></label>
          <label>Return condition<select value={condition} onChange={(event) => setCondition(event.target.value as AssetCondition)} disabled={!activeAllocation}>{conditions.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
        <label>Reason / notes<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} placeholder="Why is this asset being allocated, transferred, or returned?" /></label>
        <div className="allocation-actions-row">
          <button className="button primary" type="button" onClick={allocateAsset} disabled={!selectedAsset || selectedAsset.status !== "Available"}><UserRoundCheck size={15} />Allocate</button>
          <button className="button" type="button" onClick={requestTransfer} disabled={!activeAllocation || activeAllocation.status === "Transfer Pending"}><Send size={15} />Request transfer</button>
          <button className="button" type="button" onClick={approveTransfer} disabled={activeAllocation?.status !== "Transfer Pending"}><CheckCircle2 size={15} />Approve</button>
          <button className="button" type="button" onClick={rejectTransfer} disabled={activeAllocation?.status !== "Transfer Pending"}><X size={15} />Reject</button>
          <button className="button" type="button" onClick={markReturned} disabled={!activeAllocation}><RotateCcw size={15} />Return</button>
        </div>
      </article>
      <aside className="clean-panel allocation-card">
        <div className="panel-title"><h2>Rules</h2></div>
        <div className="plain-list allocation-rules">
          <div><span className="activity-dot" /><strong>Conflict blocked</strong><span>Allocated assets cannot be assigned again.</span></div>
          <div><span className="activity-dot" /><strong>Transfer approval</strong><span>Approvals reassign holder and history.</span></div>
          <div><span className="activity-dot" /><strong>Return check</strong><span>Condition notes update asset status.</span></div>
        </div>
      </aside>
    </section>

    <section className="activity-toolbar allocation-toolbar">
      <label className="activity-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search allocation history" /></label>
    </section>
    <section className="clean-panel table-panel allocation-history-table">
      <table className="clean-table">
        <thead><tr><th>Asset</th><th>Holder</th><th>Department</th><th>Status</th><th>Dates</th><th>Notes</th></tr></thead>
        <tbody>{visibleAllocations.map((allocation) => <tr key={allocation.id}>
          <td><strong>{allocation.assetTag}</strong><small>{allocation.assetName}</small></td>
          <td><strong>{allocation.employeeName}</strong>{allocation.requestedToEmployeeName && <small>To {allocation.requestedToEmployeeName}</small>}</td>
          <td>{allocation.departmentName}</td>
          <td><span className={`status allocation-${allocation.status.toLowerCase().replaceAll(" ", "-")}`}>{allocation.status}</span>{allocation.overdue && <small className="danger-text">Overdue</small>}</td>
          <td><strong>{allocation.allocatedAt}</strong><small>{allocation.returnedAt ? `Returned ${allocation.returnedAt}` : `Due ${allocation.dueAt}`}</small></td>
          <td>{allocation.notes || allocation.reason || "No notes"}</td>
        </tr>)}</tbody>
      </table>
      {visibleAllocations.length === 0 && <p className="empty-copy">No allocation records match your filters.</p>}
    </section>
  </FeatureShell>;
}
