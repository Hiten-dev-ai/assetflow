"use client";

import { useState } from "react";
import { FeatureShell } from "../../components/FeatureShell";

const initial = [
  { name: "Engineering", head: "Aditi Rao", parent: "—", active: true },
  { name: "Facilities", head: "Rohan Mehta", parent: "—", active: true },
  { name: "Field Ops (East)", head: "Sana Iqbal", parent: "Field Ops", active: false },
];

export default function OrganizationPage() {
  const [tab, setTab] = useState("Departments");
  const [rows, setRows] = useState(initial);
  return <FeatureShell title="Organization setup">
    <div className="tabs">{["Departments", "Categories", "Employees"].map((item) => <button className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}>{item}</button>)}<button className="add-tab" onClick={() => setRows([...rows, { name: `New ${tab.slice(0, -1).toLowerCase()}`, head: "Unassigned", parent: "—", active: true }])}>+ Add</button></div>
    <section className="clean-panel table-panel"><table className="clean-table"><thead><tr><th>{tab.slice(0, -1)}</th><th>Owner</th><th>Parent</th><th>Status</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.name}-${index}`}><td><strong>{row.name}</strong></td><td>{row.head}</td><td>{row.parent}</td><td><button className={`status ${row.active ? "active" : "inactive"}`} onClick={() => setRows(rows.map((item, i) => i === index ? { ...item, active: !item.active } : item))}>{row.active ? "Active" : "Inactive"}</button></td></tr>)}</tbody></table></section>
    <p className="subtle-note">Changes here update department and category options across allocations, bookings, and audits.</p>
  </FeatureShell>;
}
