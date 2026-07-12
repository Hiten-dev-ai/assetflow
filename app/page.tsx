"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const kpis = [
  ["Assets available", "284", "+12 this month", "green"], ["Assets allocated", "1,248", "81% utilization", "blue"],
  ["Maintenance today", "18", "5 need approval", "amber"], ["Active bookings", "36", "8 starting soon", "violet"],
  ["Pending transfers", "7", "3 overdue", "rose"], ["Upcoming returns", "24", "Next 7 days", "slate"],
];
const allocations = [
  { tag:"AF-0114", asset:"MacBook Pro 14", holder:"Priya Nair", department:"Design", due:"10 Jul 2026", status:"2d overdue" },
  { tag:"AF-0088", asset:"Dell Latitude 7440", holder:"Arjun Mehta", department:"Operations", due:"11 Jul 2026", status:"1d overdue" },
  { tag:"AF-0203", asset:"Canon EOS R6", holder:"Media Studio", department:"Marketing", due:"12 Jul 2026", status:"Due today" },
];
const activity = [
  ["AS","Asset AF-0317 assigned","Neha Singh · 8 minutes ago"], ["MR","Maintenance request approved","AF-0092 · 24 minutes ago"],
  ["BK","Room Atlas booking confirmed","Finance · 41 minutes ago"], ["TR","Transfer request submitted","AF-0114 · 1 hour ago"],
];
const navItems = ["Overview","Assets","Allocations","Bookings","Maintenance","Audits","Reports"];

export default function Dashboard() {
  const [active,setActive] = useState("Overview");
  const [query,setQuery] = useState("");
  const filtered = useMemo(() => allocations.filter(x => `${x.tag} ${x.asset} ${x.holder}`.toLowerCase().includes(query.toLowerCase())),[query]);
  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">A</span><span>AssetFlow</span></div><div className="workspace-label">Operations workspace</div>
      <nav aria-label="Primary navigation">{navItems.map(item=><button className={active===item?"nav-item active":"nav-item"} key={item} onClick={()=>setActive(item)}><span className="nav-dot"/>{item}</button>)}</nav>
      <div className="sidebar-bottom"><button className="nav-item"><span className="nav-dot"/>Organization setup</button><button className="nav-item"><span className="nav-dot"/>Activity log</button><div className="profile-card"><span className="avatar">HK</span><span><strong>Hiten Kumar</strong><small>Administrator</small></span><span>⌄</span></div></div>
    </aside>
    <section className="content">
      <header className="topbar"><div><p className="eyebrow">Sunday, 12 July</p><h1>{active}</h1></div><div className="topbar-actions"><label className="search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search assets, people, tags…"/></label><button className="icon-button" aria-label="Notifications">●<span className="notification-ping"/></button><Link className="primary-button" href="/login">Open account</Link></div></header>
      <section className="hero-row"><div><p className="eyebrow accent">Operational command center</p><h2>Good morning, Hiten.</h2><p>Here is what needs attention across your organization today.</p></div><div className="quick-actions"><button>＋ Register asset</button><button>▣ Book resource</button><button>◇ Raise request</button></div></section>
      <section className="kpi-grid" aria-label="Key performance indicators">{kpis.map(k=><article className={`kpi-card ${k[3]}`} key={k[0]}><div><span>{k[0]}</span><strong>{k[1]}</strong></div><small>{k[2]}</small></article>)}</section>
      <section className="dashboard-grid">
        <article className="panel overdue-panel"><div className="panel-header"><div><p className="eyebrow danger">Action required</p><h3>Overdue allocations</h3></div><button className="text-button">View all →</button></div><div className="table-wrap"><table><thead><tr><th>Asset</th><th>Holder</th><th>Department</th><th>Expected return</th><th/></tr></thead><tbody>{filtered.map(x=><tr key={x.tag}><td><strong>{x.asset}</strong><small>{x.tag}</small></td><td>{x.holder}</td><td><span className="pill">{x.department}</span></td><td><span className="due">{x.due}<small>{x.status}</small></span></td><td><button className="more-button">•••</button></td></tr>)}</tbody></table>{filtered.length===0&&<div className="empty-state">No matching overdue allocations.</div>}</div></article>
        <article className="panel activity-panel"><div className="panel-header"><div><p className="eyebrow">Live feed</p><h3>Recent activity</h3></div><button className="text-button">See log</button></div><div className="activity-list">{activity.map(x=><div className="activity-item" key={x[1]}><span className="activity-mark">{x[0]}</span><span><strong>{x[1]}</strong><small>{x[2]}</small></span></div>)}</div></article>
        <article className="panel utilization-panel"><div className="panel-header"><div><p className="eyebrow">Portfolio health</p><h3>Asset utilization</h3></div><select aria-label="Utilization period"><option>Last 30 days</option><option>Last quarter</option></select></div><div className="utilization-body"><div className="donut"><span><strong>81%</strong><small>in use</small></span></div><div className="legend"><p><i className="legend-dot"/>Allocated <strong>1,248</strong></p><p><i className="legend-dot available"/>Available <strong>284</strong></p><p><i className="legend-dot maintenance"/>Maintenance <strong>43</strong></p></div></div></article>
        <article className="panel schedule-panel"><div className="panel-header"><div><p className="eyebrow">Today</p><h3>Resource schedule</h3></div><button className="text-button">Calendar →</button></div><div className="timeline"><div><time>09:00</time><span className="timeline-bar blue"/><p><strong>Room Atlas</strong><small>Product planning · 09:00–10:00</small></p></div><div><time>10:30</time><span className="timeline-bar violet"/><p><strong>Toyota Innova</strong><small>Client visit · 10:30–13:00</small></p></div><div><time>14:00</time><span className="timeline-bar amber"/><p><strong>Studio Camera Kit</strong><small>Campaign shoot · 14:00–17:30</small></p></div></div></article>
      </section>
    </section>
  </main>;
}
