"use client";

import { useState } from "react";
import { FeatureShell } from "../../components/FeatureShell";

export default function ReportsPage() {
  const [message, setMessage] = useState("");
  return <FeatureShell title="Reports & analytics">
    <section className="report-grid"><article className="clean-panel"><h2>Utilization by department</h2><div className="bar-chart">{[["Engineering", 82], ["Facilities", 68], ["Field Ops", 74], ["Finance", 45]].map(([name, value]) => <div key={name}><span>{name}</span><i><b style={{ width: `${value}%` }} /></i><strong>{value}%</strong></div>)}</div></article><article className="clean-panel"><h2>Maintenance frequency</h2><div className="sparkline"><i /><i /><i /><i /><i /><i /></div><p className="subtle-note">18 requests this month · 4 fewer than June.</p></article></section>
    <section className="clean-panel summary-list"><h2>What needs attention</h2><p><strong>Most used:</strong> Room B2, Van AF-082, Projector AF-335</p><p><strong>Idle:</strong> Camera AF-0301 unused 60+ days</p><p><strong>Service due:</strong> Forklift AF-0087 in 5 days</p><button className="button" onClick={() => setMessage("Report prepared for download.")}>Export report</button><span className="success-inline">{message}</span></section>
  </FeatureShell>;
}
