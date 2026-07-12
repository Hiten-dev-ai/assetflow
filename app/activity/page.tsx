"use client";

import { CheckCircle2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FeatureShell } from "../../components/FeatureShell";
import type { ActivityKind, ActivityRecord, ActivitySeverity } from "../../lib/erpStore";

const tabs = ["All", "Alerts", "Approvals", "Bookings", "Assets", "Audits", "Organization"] as const;
const severities: Array<"All" | ActivitySeverity> = ["All", "Info", "Success", "Warning", "Critical"];

async function readApi<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as T & { error?: string };
  if (!response.ok) throw new Error(payload?.error ?? "Unable to load activity.");
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

function tabMatches(tab: (typeof tabs)[number], row: ActivityRecord) {
  if (tab === "All") return true;
  if (tab === "Alerts") return row.severity === "Warning" || row.severity === "Critical";
  if (tab === "Approvals") return row.kind === "Approval" || row.kind === "Maintenance";
  if (tab === "Bookings") return row.kind === "Booking";
  if (tab === "Assets") return row.kind === "Asset";
  if (tab === "Audits") return row.kind === "Audit";
  return row.kind === "Organization";
}

export default function ActivityPage() {
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<"All" | ActivitySeverity>("All");
  const [message, setMessage] = useState("");

  async function load() {
    setRecords(await readApi<ActivityRecord[]>(await fetch("/api/activity", { cache: "no-store" })));
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load().catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load activity."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function mark(id: string, status: ActivityRecord["status"]) {
    setRecords(await readApi<ActivityRecord[]>(await fetch(`/api/activity/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })));
  }

  async function markAllRead() {
    for (const record of records.filter((item) => item.status === "Unread")) await mark(record.id, "Read");
    await load();
  }

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return records.filter((record) => {
      const matchesSearch = !search || [record.title, record.description, record.actor, record.target, record.kind].some((value) => value.toLowerCase().includes(search));
      return tabMatches(tab, record) && matchesSearch && (severity === "All" || record.severity === severity);
    });
  }, [query, records, severity, tab]);
  const unread = records.filter((record) => record.status === "Unread").length;
  const alerts = records.filter((record) => record.severity === "Warning" || record.severity === "Critical").length;
  const resolved = records.filter((record) => record.status === "Resolved").length;

  return <FeatureShell title="Activity log" actions={<button className="button" type="button" onClick={markAllRead}><CheckCircle2 size={15} />Mark all read</button>}>
    {message && <div className="notice danger">{message}</div>}
    <section className="activity-metrics"><article><span>Unread</span><strong>{unread}</strong></article><article><span>Alerts</span><strong>{alerts}</strong></article><article><span>Resolved</span><strong>{resolved}</strong></article></section>
    <div className="tabs activity-tabs" role="tablist" aria-label="Activity filters">{tabs.map((item) => <button type="button" role="tab" aria-selected={tab === item} className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}>{item}</button>)}</div>
    <section className="activity-toolbar"><label className="activity-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search activity" /></label><select value={severity} onChange={(event) => setSeverity(event.target.value as "All" | ActivitySeverity)}>{severities.map((item) => <option key={item}>{item}</option>)}</select></section>
    <section className="clean-panel activity-feed" aria-label="Activity events">{visible.map((record) => <article className={`activity-event ${record.status.toLowerCase()} ${record.severity.toLowerCase()}`} key={record.id}>
      <span className="activity-kind">{record.kind as ActivityKind}</span><div><header><strong>{record.title}</strong><time>{relative(record.createdAt)}</time></header><p>{record.description}</p><small>{record.actor}{record.target ? ` - ${record.target}` : ""}</small></div><span className={`activity-severity ${record.severity.toLowerCase()}`}>{record.severity}</span>
      <div className="activity-event-actions">{record.status === "Unread" && <button type="button" onClick={() => mark(record.id, "Read")}>Read</button>}{record.status !== "Resolved" && (record.severity === "Warning" || record.severity === "Critical") && <button type="button" onClick={() => mark(record.id, "Resolved")}>Resolve</button>}{record.status === "Resolved" && <span>Resolved</span>}</div>
    </article>)}{visible.length === 0 && <p className="empty-copy">No activity matches these filters.</p>}</section>
  </FeatureShell>;
}
