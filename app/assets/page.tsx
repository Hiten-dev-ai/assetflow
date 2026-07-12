"use client";

import { useMemo, useState } from "react";
import { FeatureShell } from "../../components/FeatureShell";

const seed = [
  { tag: "AF-0012", name: "Dell Laptop", category: "Electronics", status: "Allocated", location: "Bengaluru" },
  { tag: "AF-0062", name: "Projector", category: "Electronics", status: "Maintenance", location: "HQ Floor 2" },
  { tag: "AF-0201", name: "Office chair", category: "Furniture", status: "Available", location: "Warehouse" },
];

export default function AssetsPage() {
  const [assets, setAssets] = useState(seed);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [adding, setAdding] = useState(false);
  const visible = useMemo(() => assets.filter((asset) => (status === "All" || asset.status === status) && `${asset.tag} ${asset.name} ${asset.category}`.toLowerCase().includes(query.toLowerCase())), [assets, query, status]);
  function addAsset() { setAssets([...assets, { tag: `AF-${String(assets.length + 220).padStart(4, "0")}`, name: "New asset", category: "Equipment", status: "Available", location: "HQ" }]); setAdding(false); }
  return <FeatureShell title="Assets" actions={<button className="button primary" onClick={() => setAdding(true)}>Register asset</button>}>
    <section className="toolbar"><input aria-label="Search assets" placeholder="Search by tag, serial, or QR code" value={query} onChange={(e) => setQuery(e.target.value)} /><select aria-label="Status filter" value={status} onChange={(e) => setStatus(e.target.value)}><option>All</option><option>Available</option><option>Allocated</option><option>Maintenance</option></select></section>
    {adding && <section className="inline-form"><strong>Register a new asset?</strong><span>A clean placeholder record will be added for editing.</span><button className="button primary" onClick={addAsset}>Confirm</button><button className="button" onClick={() => setAdding(false)}>Cancel</button></section>}
    <section className="clean-panel table-panel"><table className="clean-table"><thead><tr><th>Tag</th><th>Asset</th><th>Category</th><th>Status</th><th>Location</th></tr></thead><tbody>{visible.map((asset) => <tr key={asset.tag}><td>{asset.tag}</td><td><strong>{asset.name}</strong></td><td>{asset.category}</td><td><span className={`status ${asset.status.toLowerCase()}`}>{asset.status}</span></td><td>{asset.location}</td></tr>)}</tbody></table>{visible.length === 0 && <p className="empty-copy">No assets match these filters.</p>}</section>
  </FeatureShell>;
}
