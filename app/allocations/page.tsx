"use client";

import { useState } from "react";
import { FeatureShell } from "../../components/FeatureShell";

export default function AllocationsPage() {
  const [employee, setEmployee] = useState("Priya Shah");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("This asset is already allocated to Priya Shah (Engineering). Submit a transfer request instead.");
  function submit() { if (!reason.trim()) { setMessage("Add a reason before submitting the transfer."); return; } setMessage(`Transfer request sent to ${employee}.`); }
  return <FeatureShell title="Allocation & transfer">
    <section className="form-layout"><article className="clean-panel compact-form"><label>Asset<input value="AF-0114 · Dell laptop" readOnly /></label><div className="notice danger">Already allocated to Priya Shah · direct re-allocation is blocked.</div><div className="two-fields"><label>From<input value="Priya Shah" readOnly /></label><label>Transfer to<select value={employee} onChange={(e) => setEmployee(e.target.value)}><option>Arjun Mehta</option><option>Neha Singh</option><option>Priya Shah</option></select></label></div><label>Reason<textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="Why is this asset being transferred?" /></label><button className="button primary" onClick={submit}>Submit request</button><p className="form-status" role="status">{message}</p></article>
    <aside className="clean-panel"><h2>Allocation history</h2><div className="plain-list"><div><strong>12 Mar</strong> Allocated to Priya Shah · Engineering</div><div><strong>04 Jan</strong> Returned by Arjun Mehta · condition good</div></div></aside></section>
  </FeatureShell>;
}
