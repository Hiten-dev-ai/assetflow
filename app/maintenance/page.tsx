"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FeatureShell } from "../../components/FeatureShell";

const requests = [
  { id: 1042, asset: "Room B2 projector", issue: "Display flickers after warm-up", priority: "HIGH", status: "PENDING", age: "12 min" },
  { id: 1039, asset: "Canon EOS R6", issue: "Autofocus calibration", priority: "MEDIUM", status: "APPROVED", age: "2 hr" },
  { id: 1032, asset: "Toyota Innova", issue: "Scheduled service", priority: "LOW", status: "IN_PROGRESS", age: "1 day" },
];

export default function MaintenancePage() {
  const [status, setStatus] = useState("ALL");
  const filtered = useMemo(() => requests.filter((item) => status === "ALL" || item.status === status), [status]);
  const isAssetManager = true;
  return <FeatureShell title="Maintenance queue" actions={<Link className="primary-button" href="/maintenance/new">Raise request</Link>}>
    <section className="feature-panel queue-panel"><div className="sticky-filter"><div className="section-heading"><div><p className="eyebrow accent">{isAssetManager ? "Asset Manager view" : "Technician view"}</p><h2>Requests requiring attention</h2></div><label className="inline-filter">Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">All</option><option value="PENDING">Pending Approval</option><option value="IN_PROGRESS">In Progress</option><option value="RESOLVED">Resolved</option></select></label></div></div>
      <div className="request-list">{filtered.map((item) => <div className="request-row" key={item.id}><span className={`priority ${item.priority.toLowerCase()}`}>{item.priority}</span><Link href={`/maintenance/${item.id}`}><strong>{item.asset}</strong><small>#{item.id} · {item.issue}</small></Link><span className="status-pill">{item.status.replaceAll("_", " ")}</span><time>{item.age}</time>{isAssetManager && item.status === "PENDING" ? <span className="queue-actions"><button>Approve</button><button>Reject</button></span> : <b>→</b>}</div>)}</div>
    </section>
  </FeatureShell>;
}
