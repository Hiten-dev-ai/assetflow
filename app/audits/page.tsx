"use client";

import { useState } from "react";
import { FeatureShell } from "../../components/FeatureShell";
import { recordActivity } from "../../lib/activityLog";

const seed = [
  { asset: "AF-003 · Dell laptop", expected: "Desk #12", result: "Verified" },
  { asset: "AF-021 · Office chair", expected: "Desk #10", result: "Missing" },
  { asset: "AF-033 · Monitor", expected: "Desk #15", result: "Damaged" },
];

export default function AuditsPage() {
  const [rows, setRows] = useState(seed);
  const [closed, setClosed] = useState(false);

  function updateResult(index: number, result: string) {
    const row = rows[index];
    setRows(rows.map((item, itemIndex) => itemIndex === index ? { ...item, result } : item));
    if (row && result !== "Verified") recordActivity({
      kind: "Audit",
      title: "Audit discrepancy",
      description: `${row.asset} marked ${result.toLowerCase()}.`,
      actor: "Audit team",
      target: row.asset.split("·")[0].trim(),
      severity: result === "Damaged" ? "Critical" : "Warning",
    });
  }

  function closeAudit() {
    setClosed(true);
    recordActivity({
      kind: "Audit",
      title: "Audit cycle closed",
      description: `${rows.filter((row) => row.result !== "Verified").length} discrepancies reported.`,
      actor: "Audit team",
      target: "Q3 audit",
      severity: "Success",
    });
  }

  return <FeatureShell title="Asset audit">
    <div className="notice">Q3 audit · Engineering · 1-15 Jul · A. Rani, S. Iqbal</div>
    <section className="clean-panel table-panel"><table className="clean-table"><thead><tr><th>Asset</th><th>Expected location</th><th>Verification</th></tr></thead><tbody>{rows.map((row, index) => <tr key={row.asset}><td><strong>{row.asset}</strong></td><td>{row.expected}</td><td><select value={row.result} onChange={(event) => updateResult(index, event.target.value)}><option>Verified</option><option>Missing</option><option>Damaged</option></select></td></tr>)}</tbody></table></section>
    <div className="notice warning">{rows.filter((row) => row.result !== "Verified").length} assets flagged · report updates automatically.</div>
    <button className="button primary" onClick={closeAudit}>Close audit cycle</button>{closed && <span className="success-inline">Audit cycle closed.</span>}
  </FeatureShell>;
}
