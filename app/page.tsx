"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppSidebar } from "../components/AppSidebar";
import { LoginScreen } from "../components/LoginScreen";
import { currentUser } from "../lib/localAuth";

const stats = [
  ["Available", "128"], ["Allocated", "96"], ["Bookable", "4"],
  ["Active bookings", "9"], ["Pending transfers", "3"], ["Upcoming returns", "12"],
];
const activity = [
  "Laptop AF-0114 allocated to Priya Shah · IT",
  "Room B2 booking confirmed · 2:00 to 3:00 PM",
  "Projector AF-0062 maintenance resolved",
];

export default function AssetFlow() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => setSignedIn(currentUser() !== null), []);
  if (signedIn === null) return <main className="session-loading">Opening workspace…</main>;
  if (!signedIn) return <LoginScreen onAuthenticated={() => setSignedIn(true)} />;
  return <main className="product-shell"><AppSidebar /><section className="product-content">
    <header className="product-header"><div><p>Dashboard</p><h1>Today&apos;s overview</h1></div><span className="quiet-badge">Live workspace</span></header>
    <section className="stat-grid">{stats.map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</section>
    <div className="notice danger">3 assets are overdue for return</div>
    <section className="action-row"><Link className="button primary" href="/assets">Register asset</Link><Link className="button" href="/bookings">Book resource</Link><Link className="button" href="/maintenance/new">Raise request</Link></section>
    <section className="clean-panel"><div className="panel-title"><h2>Recent activity</h2><Link href="/activity">View all</Link></div><div className="plain-list">{activity.map((item) => <div key={item}><span className="activity-dot" />{item}</div>)}</div></section>
  </section></main>;
}
