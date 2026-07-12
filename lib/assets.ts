export const statuses = ["Available", "Allocated", "Reserved", "Under Maintenance", "Lost", "Retired", "Disposed"] as const;
export type LifecycleStatus = (typeof statuses)[number];

export const conditions = ["Excellent", "Good", "Fair", "Needs Service", "Damaged"] as const;
export type AssetCondition = (typeof conditions)[number];

export type HistoryEntry = {
  date: string;
  title: string;
  detail: string;
};

export type AssetRecord = {
  tag: string;
  name: string;
  category: string;
  serialNumber: string;
  acquisitionDate: string;
  acquisitionCost: number;
  status: LifecycleStatus;
  department: string;
  location: string;
  condition: AssetCondition;
  shared: boolean;
  qrCode: string;
  notes: string;
  lastUpdated: string;
  recentActivity: string;
  allocationHistory: HistoryEntry[];
  maintenanceHistory: HistoryEntry[];
};

export type AssetForm = {
  name: string;
  category: string;
  serialNumber: string;
  acquisitionDate: string;
  acquisitionCost: string;
  condition: AssetCondition;
  department: string;
  location: string;
  shared: boolean;
  notes: string;
  status?: LifecycleStatus;
};

export type AssetDraft = {
  name: string;
  category: string;
  serialNumber: string;
  acquisitionDate: string;
  acquisitionCost: number;
  condition: AssetCondition;
  department: string;
  location: string;
  shared: boolean;
  notes: string;
  status?: LifecycleStatus;
};

export const categories = ["Laptop", "Projector", "Furniture", "Vehicle", "Room", "Shared Lab Kit", "Equipment"];
export const departments = ["Engineering", "Design", "Marketing", "Operations", "Finance", "Facilities", "IT"];
export const locations = ["Bengaluru HQ", "HQ Floor 2", "Room B2", "Warehouse", "Chennai Office", "Mumbai Office"];

export function emptyAssetForm(): AssetForm {
  return {
    name: "",
    category: "",
    serialNumber: "",
    acquisitionDate: "",
    acquisitionCost: "",
    condition: "Good",
    department: "",
    location: "",
    shared: false,
    notes: "",
  };
}

export function statusClass(status: LifecycleStatus) {
  return status.toLowerCase().replace(/\s+/g, "-");
}

export function unique(values: string[]) {
  return [...new Set(values)].sort((first, second) => first.localeCompare(second));
}

export function nextAssetTag(assets: AssetRecord[]) {
  const highest = assets.reduce((max, asset) => {
    const numeric = Number(asset.tag.replace("AF-", ""));
    return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
  }, 0);
  return `AF-${String(highest + 1).padStart(4, "0")}`;
}

export function formatCurrency(amount: number) {
  if (amount === 0) return "Not capitalized";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

function createQrCode(tag: string, serialNumber: string) {
  return `QR-${tag}-${serialNumber.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) || "ASSET"}`;
}

export function buildAssetRecord(tag: string, draft: AssetDraft): AssetRecord {
  return {
    tag,
    name: draft.name.trim(),
    category: draft.category.trim(),
    serialNumber: draft.serialNumber.trim(),
    acquisitionDate: draft.acquisitionDate,
    acquisitionCost: draft.acquisitionCost,
    status: "Available",
    department: draft.department.trim(),
    location: draft.location.trim(),
    condition: draft.condition,
    shared: draft.shared,
    qrCode: createQrCode(tag, draft.serialNumber.trim()),
    notes: draft.notes.trim() || "No notes added.",
    lastUpdated: "Just now",
    recentActivity: "Created in asset directory",
    allocationHistory: [],
    maintenanceHistory: [],
  };
}

export function updateAssetRecord(asset: AssetRecord, draft: AssetDraft): AssetRecord {
  return {
    ...asset,
    name: draft.name.trim(),
    category: draft.category.trim(),
    serialNumber: draft.serialNumber.trim(),
    acquisitionDate: draft.acquisitionDate,
    acquisitionCost: draft.acquisitionCost,
    status: draft.status ?? asset.status,
    department: draft.department.trim(),
    location: draft.location.trim(),
    condition: draft.condition,
    shared: draft.shared,
    qrCode: createQrCode(asset.tag, draft.serialNumber.trim()),
    notes: draft.notes.trim() || "No notes added.",
    lastUpdated: "Just now",
    recentActivity: "Asset details updated",
  };
}

function requireString(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required.`);
  }
  return value.trim();
}

function requireCondition(value: unknown) {
  if (typeof value !== "string" || !conditions.includes(value as AssetCondition)) {
    throw new Error("Condition is invalid.");
  }
  return value as AssetCondition;
}

function optionalStatus(value: unknown) {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !statuses.includes(value as LifecycleStatus)) {
    throw new Error("Lifecycle status is invalid.");
  }
  return value as LifecycleStatus;
}

function requireBoolean(value: unknown, label: string) {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean.`);
  }
  return value;
}

function requireNumber(value: unknown, label: string) {
  const amount = typeof value === "string" ? Number(value) : value;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) {
    throw new Error(`${label} must be a valid positive amount.`);
  }
  return amount;
}

export function parseAssetDraft(payload: unknown): AssetDraft {
  if (!payload || typeof payload !== "object") {
    throw new Error("Request body must be an object.");
  }

  const data = payload as Record<string, unknown>;
  return {
    name: requireString(data.name, "Asset name"),
    category: requireString(data.category, "Category"),
    serialNumber: requireString(data.serialNumber, "Serial number"),
    acquisitionDate: requireString(data.acquisitionDate, "Acquisition date"),
    acquisitionCost: requireNumber(data.acquisitionCost, "Acquisition cost"),
    condition: requireCondition(data.condition),
    department: requireString(data.department, "Department"),
    location: requireString(data.location, "Location"),
    shared: requireBoolean(data.shared, "Shared"),
    notes: typeof data.notes === "string" ? data.notes : "",
    status: optionalStatus(data.status),
  };
}
