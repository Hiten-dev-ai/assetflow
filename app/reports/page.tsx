"use client";

import { useEffect, useMemo, useState } from "react";
import { FeatureShell } from "../../components/FeatureShell";
import type { AssetRecord } from "../../lib/assets";
import type { MaintenanceRecord } from "../../lib/erpStore";

type ReportsSummary = {
  utilizationByDepartment: Array<{ name: string; count: number }>;
  mostUsedAssets: Array<{ tag: string; count: number }>;
  idleAssets: AssetRecord[];
  maintenanceFrequency: MaintenanceRecord[];
  serviceDue: AssetRecord[];
  bookingHeatmap: Array<{ hour: string; count: number }>;
};

async function readApi<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as T & { error?: string };
  if (!response.ok) throw new Error(payload?.error ?? "Unable to load reports.");
  return payload;
}

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void fetch("/api/reports/summary", { cache: "no-store" })
      .then((response) => readApi<ReportsSummary>(response))
      .then(setSummary)
      .catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load reports."));
  }, []);

  const maxDepartment = useMemo(() => Math.max(1, ...(summary?.utilizationByDepartment.map((row) => row.count) ?? [1])), [summary]);
  const maxHeat = useMemo(() => Math.max(1, ...(summary?.bookingHeatmap.map((row) => row.count) ?? [1])), [summary]);

  function exportReport() {
    if (!summary) return;
    const lines = [
      "AssetFlow Report",
      "",
      "Department allocation",
      ...summary.utilizationByDepartment.map((row) => `${row.name},${row.count}`),
      "",
      "Service due",
      ...summary.serviceDue.map((asset) => `${asset.tag},${asset.name},${asset.status},${asset.condition}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "assetflow-report.csv";
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Report exported.");
  }

  return <FeatureShell title="Reports & analytics" actions={<button className="button" onClick={exportReport}>Export report</button>}>
    {message && <span className="success-inline">{message}</span>}
    <section className="report-grid">
      <article className="clean-panel"><h2>Department allocation</h2><div className="bar-chart">{(summary?.utilizationByDepartment ?? []).map((row) => <div key={row.name}><span>{row.name}</span><i><b style={{ width: `${(row.count / maxDepartment) * 100}%` }} /></i><strong>{row.count}</strong></div>)}</div></article>
      <article className="clean-panel"><h2>Booking heatmap</h2><div className="heatmap">{(summary?.bookingHeatmap ?? []).map((row) => <div key={row.hour}><span>{row.hour}</span><i className="heat" style={{ width: `${Math.max(12, (row.count / maxHeat) * 100)}%` }} /></div>)}</div>{!summary?.bookingHeatmap.length && <p className="empty-copy">No bookings yet.</p>}</article>
    </section>
    <section className="clean-panel summary-list"><h2>What needs attention</h2>
      <p><strong>Most used:</strong> {(summary?.mostUsedAssets ?? []).map((row) => `${row.tag} (${row.count})`).join(", ") || "Not enough history yet"}</p>
      <p><strong>Idle:</strong> {(summary?.idleAssets ?? []).map((asset) => `${asset.tag} ${asset.name}`).join(", ") || "No idle assets"}</p>
      <p><strong>Service due:</strong> {(summary?.serviceDue ?? []).map((asset) => `${asset.tag} ${asset.name}`).join(", ") || "No service flags"}</p>
    </section>
  </FeatureShell>;
}
