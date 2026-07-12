"use client";

import { use, useEffect, useState } from "react";
import { FeatureShell } from "../../../components/FeatureShell";
import type { MaintenanceRecord } from "../../../lib/erpStore";

async function readApi<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as T & { error?: string };
  if (!response.ok) throw new Error(payload?.error ?? "Unable to load maintenance request.");
  return payload;
}

export default function MaintenanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [request, setRequest] = useState<MaintenanceRecord | null>(null);
  const [message, setMessage] = useState("");
  const [technician, setTechnician] = useState("Ravi Shah");

  async function load() {
    const rows = await readApi<MaintenanceRecord[]>(await fetch("/api/maintenance", { cache: "no-store" }));
    setRequest(rows.find((item) => item.id === id) ?? null);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load().catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load request."));
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function act(action: string) {
    try {
      const rows = await readApi<MaintenanceRecord[]>(await fetch(`/api/maintenance/${id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, technician }),
      }));
      setRequest(rows.find((item) => item.id === id) ?? null);
      setMessage("Request updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update request.");
    }
  }

  const steps = ["PENDING", "APPROVED", "TECHNICIAN_ASSIGNED", "IN_PROGRESS", "RESOLVED"];
  const stepIndex = request ? steps.indexOf(request.status) : -1;

  return <FeatureShell title={`Maintenance request #${id}`}>
    {!request && <p className="empty-copy">Loading request...</p>}
    {request && <section className="detail-grid"><article className="feature-panel">
      <div className="asset-summary"><span className="asset-icon">AF</span><div><p className="eyebrow">{request.assetTag}</p><h2>{request.assetName}</h2><p>{request.description}</p></div><span className="status-pill">Priority: {request.priority}</span></div>
      <h3 className="subheading">Workflow timeline</h3>
      <ol className="workflow">{steps.map((step, index) => <li className={index <= stepIndex ? "done" : ""} key={step}><i /><span><strong>{step.replaceAll("_", " ")}</strong><small>{index <= stepIndex ? "Completed" : "Waiting"}</small></span></li>)}</ol>
    </article>
    <aside className="feature-panel action-card"><p className="eyebrow accent">Actions</p><h2>Update request</h2><label>Technician<select value={technician} onChange={(event) => setTechnician(event.target.value)}><option>Ravi Shah</option><option>Meera Iyer</option><option>Daniel Thomas</option></select></label><div className="action-stack"><button onClick={() => act("APPROVE")}>Approve</button><button onClick={() => act("REJECT")}>Reject</button><button onClick={() => act("ASSIGN_TECHNICIAN")}>Assign technician</button><button onClick={() => act("START_WORK")}>Start work</button><button onClick={() => act("RESOLVE")}>Resolve</button></div><p className="form-message" role="status">{message}</p></aside></section>}
  </FeatureShell>;
}
