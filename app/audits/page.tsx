"use client";

import { CheckCircle2, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FeatureShell } from "../../components/FeatureShell";
import type { AuditCycleRecord, AuditItemRecord, DepartmentRecord, EmployeeRecord, VerificationStatus } from "../../lib/erpStore";

type OrganizationPayload = { departments: DepartmentRecord[]; employees: EmployeeRecord[] };
type AuditDetail = { cycle: AuditCycleRecord; items: AuditItemRecord[]; discrepancies: AuditItemRecord[] };

async function readApi<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as T & { error?: string };
  if (!response.ok) throw new Error(payload?.error ?? "Unable to update audit.");
  return payload;
}

export default function AuditsPage() {
  const [organization, setOrganization] = useState<OrganizationPayload>({ departments: [], employees: [] });
  const [cycles, setCycles] = useState<AuditCycleRecord[]>([]);
  const [detail, setDetail] = useState<AuditDetail | null>(null);
  const [departmentId, setDepartmentId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [auditorIds, setAuditorIds] = useState<string[]>([]);
  const [message, setMessage] = useState("Create a scoped audit cycle, verify each asset, then close it to lock results.");

  async function load() {
    try {
      const [nextOrganization, nextCycles] = await Promise.all([
        readApi<OrganizationPayload>(await fetch("/api/organization", { cache: "no-store" })),
        readApi<AuditCycleRecord[]>(await fetch("/api/audits", { cache: "no-store" })),
      ]);
      setOrganization(nextOrganization);
      setCycles(nextCycles);
      setDepartmentId((current) => current || nextOrganization.departments.find((department) => department.status === "Active")?.id || "");
      setAuditorIds((current) => current.length ? current : nextOrganization.employees.filter((employee) => employee.status === "Active").slice(0, 1).map((employee) => employee.id));
      if (!detail && nextCycles[0]) await openCycle(nextCycles[0].id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load audits.");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeEmployees = organization.employees.filter((employee) => employee.status === "Active");
  const locations = useMemo(() => ["", "Bengaluru HQ", "HQ Floor 1", "HQ Floor 2", "Room B2", "Warehouse", "Operations Desk"], []);

  async function openCycle(id: string) {
    setDetail(await readApi<AuditDetail>(await fetch(`/api/audits/${id}`, { cache: "no-store" })));
  }

  async function createCycle() {
    try {
      const next = await readApi<AuditDetail>(await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentId, locationId, auditorIds }),
      }));
      setDetail(next);
      await load();
      setMessage("Audit cycle created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create audit.");
    }
  }

  async function verify(itemId: string, status: VerificationStatus) {
    if (!detail) return;
    try {
      setDetail(await readApi<AuditDetail>(await fetch(`/api/audits/${detail.cycle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, status }),
      })));
      setMessage("Verification updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update verification.");
    }
  }

  async function closeCycle() {
    if (!detail) return;
    try {
      setDetail(await readApi<AuditDetail>(await fetch(`/api/audits/${detail.cycle.id}`, { method: "POST" })));
      await load();
      setMessage("Audit cycle closed and discrepancies applied.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to close audit.");
    }
  }

  function toggleAuditor(id: string) {
    setAuditorIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return <FeatureShell title="Asset audit" actions={<span className="quiet-badge">Structured verification cycles</span>}>
    {message && <div className="asset-toast" role="status"><CheckCircle2 size={15} />{message}<button type="button" onClick={() => setMessage("")} aria-label="Dismiss"><X size={14} /></button></div>}
    <section className="feature-grid audit-control-grid">
      <article className="feature-panel form-card">
        <p className="eyebrow accent">New audit cycle</p><h2>Scope and assign</h2>
        <label>Department<select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}><option value="">All departments</option>{organization.departments.filter((department) => department.status === "Active").map((department) => <option value={department.id} key={department.id}>{department.name}</option>)}</select></label>
        <label>Location<select value={locationId} onChange={(event) => setLocationId(event.target.value)}>{locations.map((location) => <option value={location} key={location}>{location || "Any location"}</option>)}</select></label>
        <div className="auditor-picker">{activeEmployees.map((employee) => <button type="button" className={auditorIds.includes(employee.id) ? "selected" : ""} onClick={() => toggleAuditor(employee.id)} key={employee.id}>{employee.name}</button>)}</div>
        <button type="button" className="button primary" onClick={createCycle}><Plus size={15} />Create cycle</button>
      </article>
      <article className="feature-panel">
        <div className="panel-title"><h2>Audit cycles</h2><span>{cycles.length} total</span></div>
        <div className="plain-list">{cycles.map((cycle) => <button type="button" className={`audit-cycle-row ${detail?.cycle.id === cycle.id ? "selected" : ""}`} onClick={() => openCycle(cycle.id)} key={cycle.id}>
          <strong>{cycle.departmentName || "All departments"}</strong><span>{cycle.locationId || "Any location"} - {cycle.status}</span><small>{cycle.summary.total} items - {cycle.summary.MISSING + cycle.summary.DAMAGED} flagged</small>
        </button>)}</div>
      </article>
    </section>

    {detail && <section className="clean-panel table-panel">
      <div className="panel-title"><div><p className="eyebrow">{detail.cycle.status}</p><h2>{detail.cycle.departmentName} audit</h2></div><button className="button primary" type="button" disabled={detail.cycle.status === "CLOSED"} onClick={closeCycle}>Close audit cycle</button></div>
      <table className="clean-table"><thead><tr><th>Asset</th><th>Expected location</th><th>Current</th><th>Verification</th></tr></thead><tbody>{detail.items.map((item) => <tr key={item.id}>
        <td><strong>{item.assetTag}</strong><small>{item.assetName}</small></td>
        <td>{item.expectedLocation}</td>
        <td>{item.currentLocation}</td>
        <td><select value={item.verificationStatus} disabled={detail.cycle.status === "CLOSED"} onChange={(event) => verify(item.id, event.target.value as VerificationStatus)}><option value="PENDING">Pending</option><option value="VERIFIED">Verified</option><option value="MISSING">Missing</option><option value="DAMAGED">Damaged</option></select></td>
      </tr>)}</tbody></table>
    </section>}

    {detail && <div className="notice warning">{detail.discrepancies.length} discrepancies in report. Missing assets become Lost; damaged assets create maintenance requests when closed.</div>}
  </FeatureShell>;
}
