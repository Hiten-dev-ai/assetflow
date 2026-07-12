export type ActivityKind = "Asset" | "Booking" | "Maintenance" | "Audit" | "Approval" | "Organization" | "System";
export type ActivitySeverity = "Info" | "Success" | "Warning" | "Critical";
export type ActivityStatus = "Unread" | "Read" | "Resolved";

export type ActivityRecord = {
  id: string;
  kind: ActivityKind;
  title: string;
  description: string;
  actor: string;
  target: string;
  severity: ActivitySeverity;
  status: ActivityStatus;
  createdAt: string;
};

export type ActivityInput = Partial<Pick<ActivityRecord, "actor" | "description" | "severity" | "status" | "target">> & {
  kind: ActivityKind;
  title: string;
};

const ACTIVITY_KEY = "assetflow-activity-log";

const seedActivity: ActivityRecord[] = [
  {
    id: "seed-asset-allocated",
    kind: "Asset",
    title: "Laptop assigned",
    description: "AF-0114 assigned to Priya Shah.",
    actor: "System",
    target: "AF-0114",
    severity: "Success",
    status: "Unread",
    createdAt: minutesAgo(2),
  },
  {
    id: "seed-maintenance-approved",
    kind: "Approval",
    title: "Maintenance approved",
    description: "Projector repair moved to technician queue.",
    actor: "Asset Manager",
    target: "AF-0062",
    severity: "Success",
    status: "Read",
    createdAt: minutesAgo(18),
  },
  {
    id: "seed-booking-confirmed",
    kind: "Booking",
    title: "Room booking confirmed",
    description: "Room B2 booked from 2:00 to 3:00 PM.",
    actor: "Facilities",
    target: "Room B2",
    severity: "Info",
    status: "Read",
    createdAt: minutesAgo(64),
  },
  {
    id: "seed-overdue-return",
    kind: "Asset",
    title: "Overdue return",
    description: "AF-0021 is 3 days overdue.",
    actor: "System",
    target: "AF-0021",
    severity: "Warning",
    status: "Unread",
    createdAt: daysAgo(1),
  },
  {
    id: "seed-audit-flag",
    kind: "Audit",
    title: "Audit discrepancy",
    description: "AF-0088 marked damaged during audit.",
    actor: "Audit team",
    target: "AF-0088",
    severity: "Critical",
    status: "Unread",
    createdAt: daysAgo(2),
  },
];

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function safeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `activity-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isRecord(value: unknown): value is ActivityRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as ActivityRecord;
  return Boolean(record.id && record.kind && record.title && record.createdAt);
}

export function readActivityLog(): ActivityRecord[] {
  if (!hasStorage()) return seedActivity;

  try {
    const stored = JSON.parse(localStorage.getItem(ACTIVITY_KEY) ?? "[]") as unknown[];
    const records = Array.isArray(stored) ? stored.filter(isRecord) : [];
    if (records.length > 0) return records;
  } catch {
    return seedActivity;
  }

  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(seedActivity));
  return seedActivity;
}

export function writeActivityLog(records: ActivityRecord[]) {
  if (!hasStorage()) return;
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(records.slice(0, 80)));
}

export function recordActivity(input: ActivityInput) {
  if (!hasStorage()) return;

  const next: ActivityRecord = {
    id: safeId(),
    kind: input.kind,
    title: input.title,
    description: input.description ?? "",
    actor: input.actor ?? "Workspace",
    target: input.target ?? "",
    severity: input.severity ?? "Info",
    status: input.status ?? "Unread",
    createdAt: new Date().toISOString(),
  };

  writeActivityLog([next, ...readActivityLog()]);
}

export function relativeActivityTime(value: string) {
  const created = new Date(value).getTime();
  const delta = Date.now() - created;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (!Number.isFinite(created)) return "now";
  if (delta < minute) return "now";
  if (delta < hour) return `${Math.floor(delta / minute)}m ago`;
  if (delta < day) return `${Math.floor(delta / hour)}h ago`;
  return `${Math.floor(delta / day)}d ago`;
}
