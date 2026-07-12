export type LifecycleStatus = "Available" | "Allocated" | "Reserved" | "Under Maintenance" | "Lost" | "Retired" | "Disposed";
export type AssetCondition = "Excellent" | "Good" | "Fair" | "Needs Service" | "Damaged";

export type HistoryEntry = {
  date: string;
  title: string;
  detail: string;
};

export type AssetDirectoryRecord = {
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

export const assetStorageKey = "assetflow-assets";

export const seedAssetDirectory: AssetDirectoryRecord[] = [
  {
    tag: "AF-0001",
    name: "Dell Latitude 7440",
    category: "Laptop",
    serialNumber: "DL-7440-IN-9021",
    acquisitionDate: "2025-01-18",
    acquisitionCost: 1290,
    status: "Allocated",
    department: "Engineering",
    location: "Bengaluru HQ",
    condition: "Good",
    shared: false,
    qrCode: "QR-AF-0001-DL7440",
    notes: "Issued with charger and privacy screen.",
    lastUpdated: "Today, 10:10",
    recentActivity: "Allocated to Priya Shah",
    allocationHistory: [{ date: "Mar 12, 2026", title: "Allocated to Priya Shah", detail: "Engineering laptop handoff completed." }],
    maintenanceHistory: [{ date: "May 03, 2026", title: "Battery diagnostic", detail: "Battery health at 88 percent." }],
  },
  {
    tag: "AF-0002",
    name: "Conference Room B2",
    category: "Room",
    serialNumber: "ROOM-B2-HQ",
    acquisitionDate: "2024-09-01",
    acquisitionCost: 0,
    status: "Available",
    department: "Facilities",
    location: "Room B2",
    condition: "Excellent",
    shared: true,
    qrCode: "QR-AF-0002-ROOMB2",
    notes: "Bookable shared room with VC screen, whiteboard, and six seats.",
    lastUpdated: "Today, 09:30",
    recentActivity: "Released after morning booking",
    allocationHistory: [],
    maintenanceHistory: [{ date: "Jun 28, 2026", title: "VC system check", detail: "HDMI and camera tested successfully." }],
  },
  {
    tag: "AF-0003",
    name: "Epson EB-X49 Projector",
    category: "Projector",
    serialNumber: "EP-X49-4472",
    acquisitionDate: "2023-11-14",
    acquisitionCost: 620,
    status: "Under Maintenance",
    department: "Operations",
    location: "HQ Floor 2",
    condition: "Needs Service",
    shared: true,
    qrCode: "QR-AF-0003-EPSON",
    notes: "Lamp flicker reported after repeated training-room usage.",
    lastUpdated: "Yesterday, 16:45",
    recentActivity: "Maintenance request approved",
    allocationHistory: [],
    maintenanceHistory: [{ date: "Jul 11, 2026", title: "Lamp service approved", detail: "Moved to under maintenance." }],
  },
  {
    tag: "AF-0004",
    name: "Toyota Innova Fleet Car",
    category: "Vehicle",
    serialNumber: "KA-05-AF-1842",
    acquisitionDate: "2024-04-20",
    acquisitionCost: 28500,
    status: "Reserved",
    department: "Operations",
    location: "Bengaluru HQ",
    condition: "Good",
    shared: true,
    qrCode: "QR-AF-0004-INNOVA",
    notes: "Shared transport vehicle.",
    lastUpdated: "Today, 08:05",
    recentActivity: "Reserved for client visit",
    allocationHistory: [],
    maintenanceHistory: [{ date: "Jun 15, 2026", title: "Standard service", detail: "Oil change and tire check completed." }],
  },
  {
    tag: "AF-0005",
    name: "Ergonomic Office Chair",
    category: "Furniture",
    serialNumber: "CHR-ERG-1188",
    acquisitionDate: "2022-08-10",
    acquisitionCost: 180,
    status: "Available",
    department: "Design",
    location: "Warehouse",
    condition: "Fair",
    shared: false,
    qrCode: "QR-AF-0005-CHAIR",
    notes: "Spare chair available for workstation setup.",
    lastUpdated: "Jul 10, 2026",
    recentActivity: "Moved to warehouse",
    allocationHistory: [],
    maintenanceHistory: [],
  },
];

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readAssetDirectory() {
  if (!hasStorage()) return seedAssetDirectory;

  try {
    const parsed = JSON.parse(localStorage.getItem(assetStorageKey) ?? "[]") as unknown;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed as AssetDirectoryRecord[] : seedAssetDirectory;
  } catch {
    return seedAssetDirectory;
  }
}

export function writeAssetDirectory(records: AssetDirectoryRecord[]) {
  if (!hasStorage()) return;
  localStorage.setItem(assetStorageKey, JSON.stringify(records));
}
