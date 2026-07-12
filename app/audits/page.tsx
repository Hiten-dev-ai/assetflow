"use client";

import { useState } from "react";
import { FeatureShell } from "../../components/FeatureShell";

const seed = [{ asset: "AF-003 · Dell laptop", expected: "Desk #12", result: "Verified" }, { asset: "AF-021 · Office chair", expected: "Desk #10", result: "Missing" }, { asset: "AF-033 · Monitor", expected: "Desk #15", result: "Damaged" }];
export default function AuditsPage() {
  const [rows, setRows] = useState(seed);
  const [closed, setClosed] = useState(false);
  return <FeatureShell title="Asset audit">
    <div className="notice">Q3 audit · Engineering dept · 1–15 Jul · Auditors: A. Rani, S. Iqbal</div>
    <section className="clean-panel table-panel"><table className="clean-table"><thead><tr><th>Asset</th><th>Expected location</th><th>Verification</th></tr></thead><tbody>{rows.map((row, index) => <tr key={row.asset}><td><strong>{row.asset}</strong></td><td>{row.expected}</td><td><select value={row.result} onChange={(e) => setRows(rows.map((item, i) => i === index ? { ...item, result: e.target.value } : item))}><option>Verified</option><option>Missing</option><option>Damaged</option></select></td></tr>)}</tbody></table></section>
    <div className="notice warning">{rows.filter((row) => row.result !== "Verified").length} assets flagged · discrepancy report updates automatically.</div>
    <button className="button primary" onClick={() => setClosed(true)}>Close audit cycle</button>{closed && <span className="success-inline">Audit cycle closed.</span>}
  </FeatureShell>;
}
