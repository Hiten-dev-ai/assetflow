"use client";

import { useState } from "react";
import { FeatureShell } from "../../components/FeatureShell";

const rows = [{ type: "Approvals", text: "Maintenance request AF-0055 approved", time: "18m" }, { type: "Bookings", text: "Room B2 confirmed · 2:00 to 3:00 PM", time: "1h" }, { type: "All", text: "Laptop AF-0019 assigned to Priya Shah", time: "2m" }, { type: "Alerts", text: "Overdue return · AF-0021 was due 3 days ago", time: "1d" }, { type: "All", text: "Audit discrepancy flagged · AF-0088 damaged", time: "2d" }];
export default function ActivityPage() {
  const [tab, setTab] = useState("All");
  const visible = rows.filter((row) => tab === "All" || row.type === tab);
  return <FeatureShell title="Activity & notifications"><div className="tabs">{["All", "Alerts", "Approvals", "Bookings"].map((item) => <button className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}>{item}</button>)}</div><section className="clean-panel plain-list">{visible.map((row) => <div key={row.text}><span className="activity-dot" /><strong>{row.text}</strong><time>{row.time} ago</time></div>)}{visible.length === 0 && <p className="empty-copy">Nothing here yet.</p>}</section></FeatureShell>;
}
