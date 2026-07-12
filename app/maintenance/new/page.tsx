"use client";

import { useEffect, useState } from "react";
import { FeatureShell } from "../../../components/FeatureShell";
import type { AssetRecord } from "../../../lib/assets";
import type { Priority } from "../../../lib/erpStore";

async function readApi<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as T & { error?: string };
  if (!response.ok) throw new Error(payload?.error ?? "Unable to submit request.");
  return payload;
}

export default function NewMaintenancePage() {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [assetTag, setAssetTag] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void fetch("/api/assets", { cache: "no-store" })
      .then((response) => readApi<AssetRecord[]>(response))
      .then((records) => { setAssets(records); setAssetTag(records[0]?.tag ?? ""); })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load assets."));
  }, []);

  async function submit() {
    try {
      await readApi(await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetTag, description, priority }),
      }));
      setMessage("Request submitted.");
      setDescription("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit request.");
    }
  }

  return <FeatureShell title="Raise maintenance request"><section className="feature-panel request-form">
    <p className="eyebrow accent">New request</p><h2>Report an issue</h2>
    <label>Asset<select value={assetTag} onChange={(event) => setAssetTag(event.target.value)}>{assets.map((asset) => <option value={asset.tag} key={asset.tag}>{asset.tag} - {asset.name}</option>)}</select></label>
    <label>Issue<textarea rows={5} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What happened?" /></label>
    <label>Priority<select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select></label>
    <button className="primary-button wide" type="button" onClick={submit}>Submit request</button>{message && <p className="success-note" role="status">{message}</p>}
  </section></FeatureShell>;
}
