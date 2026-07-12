"use client";

import { CheckCircle2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { FeatureShell } from "../../components/FeatureShell";
import { readActivityLog, relativeActivityTime, writeActivityLog } from "../../lib/activityLog";
import type { ActivityRecord, ActivitySeverity } from "../../lib/activityLog";

const tabs = ["All", "Alerts", "Approvals", "Bookings", "Assets", "Audits", "Organization"] as const;
const severities: Array<"All" | ActivitySeverity> = ["All", "Info", "Success", "Warning", "Critical"];

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
  const [records, setRecords] = useState<ActivityRecord[]>(() => readActivityLog());
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<"All" | ActivitySeverity>("All");

  function save(next: ActivityRecord[]) {
    setRecords(next);
    writeActivityLog(next);
  }

  function mark(id: string, status: ActivityRecord["status"]) {
    save(records.map((record) => record.id === id ? { ...record, status } : record));
  }

  function markAllRead() {
    save(records.map((record) => record.status === "Unread" ? { ...record, status: "Read" } : record));
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
    <section className="activity-metrics">
      <article><span>Unread</span><strong>{unread}</strong></article>
      <article><span>Alerts</span><strong>{alerts}</strong></article>
      <article><span>Resolved</span><strong>{resolved}</strong></article>
    </section>

    <div className="tabs activity-tabs" role="tablist" aria-label="Activity filters">
      {tabs.map((item) => <button type="button" role="tab" aria-selected={tab === item} className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}>{item}</button>)}
    </div>

    <section className="activity-toolbar">
      <label className="activity-search">
        <Search size={15} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search activity" />
      </label>
      <select value={severity} onChange={(event) => setSeverity(event.target.value as "All" | ActivitySeverity)} aria-label="Filter by severity">
        {severities.map((item) => <option key={item}>{item}</option>)}
      </select>
    </section>

    <section className="clean-panel activity-feed" aria-label="Activity events">
      {visible.map((record) => <article className={`activity-event ${record.status.toLowerCase()} ${record.severity.toLowerCase()}`} key={record.id}>
        <span className="activity-kind">{record.kind}</span>
        <div>
          <header>
            <strong>{record.title}</strong>
            <time>{relativeActivityTime(record.createdAt)}</time>
          </header>
          <p>{record.description}</p>
          <small>{record.actor}{record.target ? ` • ${record.target}` : ""}</small>
        </div>
        <span className={`activity-severity ${record.severity.toLowerCase()}`}>{record.severity}</span>
        <div className="activity-event-actions">
          {record.status === "Unread" && <button type="button" onClick={() => mark(record.id, "Read")}>Read</button>}
          {record.status !== "Resolved" && (record.severity === "Warning" || record.severity === "Critical") && <button type="button" onClick={() => mark(record.id, "Resolved")}>Resolve</button>}
          {record.status === "Resolved" && <span>Resolved</span>}
        </div>
      </article>)}
      {visible.length === 0 && <p className="empty-copy">No activity matches these filters.</p>}
    </section>
  </FeatureShell>;
}
