"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ActivityRecord, AllocationRecord, BookingRecord, MaintenanceRecord } from "../lib/erpStore";

type DashboardSummary = {
  kpis: {
    available: number;
    allocated: number;
    bookable: number;
    maintenanceToday: number;
    activeBookings: number;
    pendingTransfers: number;
    upcomingReturns: number;
    overdueReturns: number;
  };
  overdue: AllocationRecord[];
  upcomingBookings: BookingRecord[];
  pendingMaintenance: MaintenanceRecord[];
  activity: ActivityRecord[];
};

async function readApi<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as T & { error?: string };
  if (!response.ok) throw new Error(payload?.error ?? "Unable to load dashboard.");
  return payload;
}

function relative(value: string) {
  const created = new Date(value).getTime();
  const delta = Date.now() - created;
  if (!Number.isFinite(created)) return "now";
  if (delta < 60_000) return "now";
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)}m ago`;
  if (delta < 86_400_000) return `${Math.floor(delta / 3_600_000)}h ago`;
  return `${Math.floor(delta / 86_400_000)}d ago`;
}

export default function AssetFlow() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void fetch("/api/dashboard", { cache: "no-store" })
      .then((response) => readApi<DashboardSummary>(response))
      .then(setSummary)
      .catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load dashboard."));
  }, []);

  const stats = summary ? [
    ["Available", summary.kpis.available],
    ["Allocated", summary.kpis.allocated],
    ["Bookable", summary.kpis.bookable],
    ["Active bookings", summary.kpis.activeBookings],
    ["Pending transfers", summary.kpis.pendingTransfers],
    ["Upcoming returns", summary.kpis.upcomingReturns],
  ] : [];

  return <>
    <header className="product-header"><div><p>Dashboard</p><h1>Today&apos;s overview</h1></div><span className="quiet-badge">Live workspace</span></header>
    {message && <div className="notice danger">{message}</div>}
    <section className="stat-grid">{stats.map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</section>
    {summary && summary.kpis.overdueReturns > 0 && <div className="notice danger">{summary.kpis.overdueReturns} assets are overdue for return</div>}
    <section className="action-row"><Link className="button primary" href="/assets">Register asset</Link><Link className="button" href="/bookings">Book resource</Link><Link className="button" href="/maintenance/new">Raise request</Link></section>
    <section className="dashboard-grid">
      <article className="clean-panel"><div className="panel-title"><h2>Operational queue</h2><Link href="/allocations">Open allocation</Link></div><div className="plain-list">
        {(summary?.overdue ?? []).map((item) => <div key={item.id}><span className="activity-dot" /><strong>{item.assetTag} overdue</strong><span>{item.employeeName} - due {item.dueAt}</span></div>)}
        {(summary?.pendingMaintenance ?? []).map((item) => <div key={item.id}><span className="activity-dot" /><strong>{item.assetTag} maintenance</strong><span>{item.status.replaceAll("_", " ")} - {item.priority}</span></div>)}
        {summary && summary.overdue.length === 0 && summary.pendingMaintenance.length === 0 && <p className="empty-copy">No urgent queue items.</p>}
      </div></article>
      <article className="clean-panel"><div className="panel-title"><h2>Recent activity</h2><Link href="/activity">View all</Link></div><div className="plain-list">{(summary?.activity ?? []).map((item) => <div key={item.id}><span className="activity-dot" /><strong>{item.title}</strong><span>{item.description}</span><time>{relative(item.createdAt)}</time></div>)}</div></article>
    </section>
  </>;
}
