"use client";

import { useState } from "react";
import { FeatureShell } from "../../../components/FeatureShell";

export default function NewMaintenancePage() {
  const [sent, setSent] = useState(false);
  return <FeatureShell title="Raise maintenance request"><section className="feature-panel request-form"><p className="eyebrow accent">New request</p><h2>Tell the maintenance team what happened</h2><p>Provide enough detail for an Asset Manager to review and route the issue.</p>
    <label>Asset<select><option>Room B2 projector · AF-0412</option><option>Canon EOS R6 · AF-0203</option><option>Toyota Innova · AF-0301</option></select></label>
    <label>Issue<textarea rows={5} placeholder="Describe the symptoms, when they started, and any troubleshooting already tried." /></label>
    <label>Priority<select><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select></label>
    <label className="attachment">Attachment placeholder<input type="file" /><span>Drop a photo or service document here</span></label>
    <button className="primary-button wide" onClick={() => setSent(true)}>Submit request</button>{sent && <p className="success-note" role="status">Request submitted with PENDING status.</p>}
  </section></FeatureShell>;
}
