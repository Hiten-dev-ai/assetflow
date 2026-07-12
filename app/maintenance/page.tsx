"use client";

import Link from "next/link";
import { useState } from "react";
import { FeatureShell } from "../../components/FeatureShell";

const stages = ["Pending", "Approved", "Technician assigned", "In progress", "Resolved"];
const seed = [
  { id: 62, asset: "Projector", note: "Not turning on", stage: 0 },
  { id: 3, asset: "AV unit", note: "Noisy compressor", stage: 1 },
  { id: 28, asset: "Forklift", note: "Seat repair", stage: 2 },
  { id: 97, asset: "Printer", note: "Parts ordered", stage: 3 },
  { id: 53, asset: "Chair", note: "Repair resolved", stage: 4 },
];

export default function MaintenancePage() {
  const [items, setItems] = useState(seed);
  function advance(id: number) { setItems(items.map((item) => item.id === id ? { ...item, stage: Math.min(item.stage + 1, 4) } : item)); }
  return <FeatureShell title="Maintenance" actions={<Link className="button primary" href="/maintenance/new">Raise request</Link>}>
    <section className="kanban">{stages.map((stage, index) => <div className="kanban-column" key={stage}><h2>{stage}<span>{items.filter((item) => item.stage === index).length}</span></h2>{items.filter((item) => item.stage === index).map((item) => <article className={index === 4 ? "resolved" : ""} key={item.id}><strong>AF-{String(item.id).padStart(4, "0")}</strong><span>{item.asset}</span><small>{item.note}</small><div>{index < 4 && <button onClick={() => advance(item.id)}>{index === 0 ? "Approve" : "Move forward"}</button>}<Link href={`/maintenance/${item.id}`}>Details</Link></div></article>)}</div>)}</section>
    <p className="subtle-note">Approving a request moves the asset under maintenance. Resolving it returns the asset to available.</p>
  </FeatureShell>;
}
