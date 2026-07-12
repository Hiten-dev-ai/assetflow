"use client";

import { useState } from "react";
import { FeatureShell } from "../../../components/FeatureShell";
import { recordActivity } from "../../../lib/activityLog";

export default function NewMaintenancePage() {
  const [asset, setAsset] = useState("Room B2 projector · AF-0412");
  const [priority, setPriority] = useState("MEDIUM");
  const [sent, setSent] = useState(false);

  function submit() {
    setSent(true);
    recordActivity({
      kind: "Maintenance",
      title: "Maintenance requested",
      description: `${asset} submitted with ${priority} priority.`,
      actor: "Maintenance",
      target: asset.split("·").pop()?.trim() ?? asset,
      severity: priority === "HIGH" || priority === "CRITICAL" ? "Warning" : "Info",
    });
  }

  return <FeatureShell title="Raise maintenance request"><section className="feature-panel request-form"><p className="eyebrow accent">New request</p><h2>Report an issue</h2><p>Give the team the asset, issue, and priority.</p>
    <label>Asset<select value={asset} onChange={(event) => setAsset(event.target.value)}><option>Room B2 projector · AF-0412</option><option>Canon EOS R6 · AF-0203</option><option>Toyota Innova · AF-0301</option></select></label>
    <label>Issue<textarea rows={5} placeholder="What happened?" /></label>
    <label>Priority<select value={priority} onChange={(event) => setPriority(event.target.value)}><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select></label>
    <label className="attachment">Attachment placeholder<input type="file" /><span>Drop a photo or service document here</span></label>
    <button className="primary-button wide" onClick={submit}>Submit request</button>{sent && <p className="success-note" role="status">Request submitted.</p>}
  </section></FeatureShell>;
}
