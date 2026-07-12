"use client";

import { useState } from "react";
import { FeatureShell } from "../../../components/FeatureShell";
import { AssetStatus, MaintenanceAction, MaintenanceRequest, MaintenanceRuleError, transitionMaintenance } from "../../../features/maintenance/service";
import { recordActivity } from "../../../lib/activityLog";

const steps = ["PENDING", "APPROVED", "TECHNICIAN_ASSIGNED", "IN_PROGRESS", "RESOLVED"];
const actions: { label: string; value: MaintenanceAction }[] = [
  { label: "Approve", value: "APPROVE" },
  { label: "Reject", value: "REJECT" },
  { label: "Assign technician", value: "ASSIGN_TECHNICIAN" },
  { label: "Start work", value: "START_WORK" },
  { label: "Resolve", value: "RESOLVE" },
];

export default function MaintenanceDetailPage() {
  const [request, setRequest] = useState<MaintenanceRequest>({ id: 1042, assetId: 1, requestedBy: 7, description: "Display flickers after warm-up", priority: "HIGH", status: "PENDING", createdAt: new Date() });
  const [assetStatus, setAssetStatus] = useState<AssetStatus>("AVAILABLE");
  const [technician, setTechnician] = useState("Ravi Shah");
  const [message, setMessage] = useState("Only Asset Managers can approve or reject this request.");

  function act(action: MaintenanceAction) {
    try {
      const result = transitionMaintenance(request, action, { id: 1, role: "ASSET_MANAGER" }, { technician, assetStatus });
      setRequest(result.request);
      if (result.assetStatus) setAssetStatus(result.assetStatus);
      setMessage(result.notification.body);
      recordActivity({
        kind: "Maintenance",
        title: "Maintenance action completed",
        description: result.notification.body,
        actor: "Maintenance",
        target: `#${request.id}`,
        severity: result.request.status === "RESOLVED" ? "Success" : "Info",
      });
    } catch (error) {
      setMessage(error instanceof MaintenanceRuleError ? error.message : "Action could not be completed.");
    }
  }

  const stepIndex = steps.indexOf(request.status);

  return <FeatureShell title={`Maintenance request #${request.id}`}><section className="detail-grid"><article className="feature-panel"><div className="asset-summary"><span className="asset-icon">AV</span><div><p className="eyebrow">Room B2 · AF-0412</p><h2>Projector display issue</h2><p>{request.description}</p></div><span className="status-pill">Asset: {assetStatus.replaceAll("_", " ")}</span></div><h3 className="subheading">Workflow timeline</h3><ol className="workflow">{steps.map((step, index) => <li className={index <= stepIndex ? "done" : ""} key={step}><i /> <span><strong>{step.replaceAll("_", " ")}</strong><small>{index <= stepIndex ? "Completed" : "Waiting"}</small></span></li>)}</ol></article>
    <aside className="feature-panel action-card"><p className="eyebrow accent">Role-aware actions</p><h2>Update request</h2><label>Technician<select value={technician} onChange={(event) => setTechnician(event.target.value)}><option>Ravi Shah</option><option>Meera Iyer</option><option>Daniel Thomas</option></select></label><div className="action-stack">{actions.map((action) => <button key={action.value} onClick={() => act(action.value)}>{action.label}</button>)}</div><p className="form-message" role="status">{message}</p><small>Each change writes to Activity log.</small></aside></section></FeatureShell>;
}
