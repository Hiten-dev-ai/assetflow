"use client";

import Link from "next/link";
import { useState } from "react";
import { readActivityLog, relativeActivityTime } from "../lib/activityLog";
import type { ActivityRecord } from "../lib/activityLog";

const stats = [
  ["Available", "128"], ["Allocated", "96"], ["Bookable", "4"],
  ["Active bookings", "9"], ["Pending transfers", "3"], ["Upcoming returns", "12"],
];

export default function AssetFlow() {
  const [activity] = useState<ActivityRecord[]>(() => readActivityLog().slice(0, 4));

  return <>
    <header className="product-header"><div><p>Dashboard</p><h1>Today&apos;s overview</h1></div><span className="quiet-badge">Live workspace</span></header>
    <section className="stat-grid">{stats.map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</section>
    <div className="notice danger">3 assets are overdue for return</div>
    <section className="action-row"><Link className="button primary" href="/assets">Register asset</Link><Link className="button" href="/bookings">Book resource</Link><Link className="button" href="/maintenance/new">Raise request</Link></section>
    <section className="clean-panel"><div className="panel-title"><h2>Recent activity</h2><Link href="/activity">View all</Link></div><div className="plain-list">{activity.map((item) => <div key={item.id}><span className="activity-dot" /><strong>{item.title}</strong><span>{item.description}</span><time>{relativeActivityTime(item.createdAt)}</time></div>)}</div></section>
  </>;
}
