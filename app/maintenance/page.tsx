"use client";

import { CheckCircle2, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { FeatureShell } from "../../components/FeatureShell";
import type { AssetRecord } from "../../lib/assets";
import type { MaintenanceRecord, MaintenanceStatus, Priority } from "../../lib/erpStore";

const stages: MaintenanceStatus[] = ["PENDING", "APPROVED", "TECHNICIAN_ASSIGNED", "IN_PROGRESS", "RESOLVED"];
const labels: Record<MaintenanceStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  TECHNICIAN_ASSIGNED: "Technician assigned",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
};

async function readApi<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as T & { error?: string };
  if (!response.ok) throw new Error(payload?.error ?? "Unable to update maintenance.");
  return payload;
}

export default function MaintenancePage() {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [requests, setRequests] = useState<MaintenanceRecord[]>([]);
  const [assetTag, setAssetTag] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [technician, setTechnician] = useState("Ravi Shah");
  const [message, setMessage] = useState("Approval moves assets under maintenance; resolution returns them to available.");

  async function load() {
    try {
      const [nextAssets, nextRequests] = await Promise.all([
        readApi<AssetRecord[]>(await fetch("/api/assets", { cache: "no-store" })),
        readApi<MaintenanceRecord[]>(await fetch("/api/maintenance", { cache: "no-store" })),
      ]);
      setAssets(nextAssets);
      setRequests(nextRequests);
      setAssetTag((current) => current || nextAssets[0]?.tag || "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load maintenance.");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function raise() {
    try {
      const payload = await readApi<{ requests: MaintenanceRecord[] }>(await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetTag, description, priority }),
      }));
      setRequests(payload.requests);
      setDescription("");
      setMessage("Maintenance request raised.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to raise request.");
    }
  }

  async function transition(id: string, action: string) {
    try {
      setRequests(await readApi<MaintenanceRecord[]>(await fetch(`/api/maintenance/${id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, technician }),
      })));
      setMessage("Maintenance workflow updated.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update workflow.");
    }
  }

  function nextAction(status: MaintenanceStatus) {
    if (status === "PENDING") return ["APPROVE", "Approve"] as const;
    if (status === "APPROVED") return ["ASSIGN_TECHNICIAN", "Assign"] as const;
    if (status === "TECHNICIAN_ASSIGNED") return ["START_WORK", "Start"] as const;
    if (status === "IN_PROGRESS") return ["RESOLVE", "Resolve"] as const;
    return null;
  }

  return <FeatureShell title="Maintenance" actions={<span className="quiet-badge">Approval workflow</span>}>
    {message && <div className="asset-toast" role="status"><CheckCircle2 size={15} />{message}<button type="button" onClick={() => setMessage("")} aria-label="Dismiss"><X size={14} /></button></div>}
    <section className="feature-panel request-form maintenance-create">
      <p className="eyebrow accent">New request</p><h2>Report an issue</h2>
      <div className="three-fields">
        <label>Asset<select value={assetTag} onChange={(event) => setAssetTag(event.target.value)}>{assets.map((asset) => <option value={asset.tag} key={asset.tag}>{asset.tag} - {asset.name}</option>)}</select></label>
        <label>Priority<select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select></label>
        <label>Technician<select value={technician} onChange={(event) => setTechnician(event.target.value)}><option>Ravi Shah</option><option>Meera Iyer</option><option>Daniel Thomas</option></select></label>
      </div>
      <label>Issue<textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the fault or service need" /></label>
      <button className="button primary" type="button" onClick={raise}><Plus size={15} />Raise request</button>
    </section>

    <section className="kanban">
      {stages.map((stage) => <div className="kanban-column" key={stage}>
        <h2>{labels[stage]}<span>{requests.filter((item) => item.status === stage).length}</span></h2>
        {requests.filter((item) => item.status === stage).map((item) => {
          const action = nextAction(item.status);
          return <article className={item.status === "RESOLVED" ? "resolved" : ""} key={item.id}>
            <strong>{item.assetTag}</strong><span>{item.assetName}</span><small>{item.description}</small><small>{item.priority} - {item.requestedByName}</small>
            <div>{action && <button onClick={() => transition(item.id, action[0])}>{action[1]}</button>}{item.status === "PENDING" && <button onClick={() => transition(item.id, "REJECT")}>Reject</button>}</div>
          </article>;
        })}
      </div>)}
    </section>
  </FeatureShell>;
}
