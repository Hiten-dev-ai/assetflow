"use client";

import { CheckCircle2, Eye, FileText, Plus, Search, Upload, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { FeatureShell } from "../../components/FeatureShell";
import { recordActivity } from "../../lib/activityLog";

type LifecycleStatus = "Available" | "Allocated" | "Reserved" | "Under Maintenance" | "Lost" | "Retired" | "Disposed";
type AssetCondition = "Excellent" | "Good" | "Fair" | "Needs Service" | "Damaged";

type HistoryEntry = {
  date: string;
  title: string;
  detail: string;
};

type AssetRecord = {
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

type AssetForm = {
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
};

const statuses: LifecycleStatus[] = ["Available", "Allocated", "Reserved", "Under Maintenance", "Lost", "Retired", "Disposed"];
const conditions: AssetCondition[] = ["Excellent", "Good", "Fair", "Needs Service", "Damaged"];
const categories = ["Laptop", "Projector", "Furniture", "Vehicle", "Room", "Shared Lab Kit", "Equipment"];
const departments = ["Engineering", "Design", "Marketing", "Operations", "Finance", "Facilities", "IT"];
const locations = ["Bengaluru HQ", "HQ Floor 2", "Room B2", "Warehouse", "Chennai Office", "Mumbai Office"];

const seedAssets: AssetRecord[] = [
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
    notes: "Issued with charger and privacy screen. Eligible for battery health check in Q4.",
    lastUpdated: "Today, 10:10",
    recentActivity: "Allocated to Priya Shah",
    allocationHistory: [
      { date: "Mar 12, 2026", title: "Allocated to Priya Shah", detail: "Engineering laptop handoff completed with charger." },
      { date: "Jan 22, 2026", title: "Returned by Arjun Nair", detail: "Condition marked good after inspection." },
    ],
    maintenanceHistory: [
      { date: "May 03, 2026", title: "Battery diagnostic", detail: "Battery health at 88 percent. No repair required." },
    ],
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
    allocationHistory: [
      { date: "Jul 07, 2026", title: "Reserved by Procurement", detail: "One hour vendor review session." },
      { date: "Jul 06, 2026", title: "Reserved by Design", detail: "Sprint planning room booking completed." },
    ],
    maintenanceHistory: [
      { date: "Jun 28, 2026", title: "VC system check", detail: "HDMI and camera tested successfully." },
    ],
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
    allocationHistory: [
      { date: "Jun 18, 2026", title: "Booked by HR", detail: "Used for onboarding presentation." },
    ],
    maintenanceHistory: [
      { date: "Jul 11, 2026", title: "Lamp service approved", detail: "Moved to under maintenance and technician assigned." },
      { date: "Apr 08, 2026", title: "Lens cleaning", detail: "Routine cleaning completed." },
    ],
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
    notes: "Shared transport vehicle. Requires manager approval for overnight booking.",
    lastUpdated: "Today, 08:05",
    recentActivity: "Reserved for client visit",
    allocationHistory: [
      { date: "Jul 12, 2026", title: "Reserved by Sales", detail: "Client pickup window blocked for 2:00 PM to 5:00 PM." },
      { date: "Jul 03, 2026", title: "Returned by Admin team", detail: "Fuel card and keys returned." },
    ],
    maintenanceHistory: [
      { date: "Jun 15, 2026", title: "Standard service", detail: "Oil change and tire check completed." },
    ],
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
    allocationHistory: [
      { date: "Jun 30, 2026", title: "Returned by Design", detail: "Moved from Floor 3 studio to warehouse." },
    ],
    maintenanceHistory: [],
  },
];

function emptyForm(): AssetForm {
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

function statusClass(status: LifecycleStatus) {
  return status.toLowerCase().replace(/\s+/g, "-");
}

function unique(values: string[]) {
  return [...new Set(values)].sort((first, second) => first.localeCompare(second));
}

function nextAssetTag(assets: AssetRecord[]) {
  const highest = assets.reduce((max, asset) => {
    const numeric = Number(asset.tag.replace("AF-", ""));
    return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
  }, 0);
  return `AF-${String(highest + 1).padStart(4, "0")}`;
}

function formatCurrency(amount: number) {
  if (amount === 0) return "Not capitalized";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

export default function AssetsPage() {
  const [assets, setAssets] = useState(seedAssets);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    category: "All",
    status: "All",
    department: "All",
    location: "All",
    shared: "All",
    condition: "All",
  });
  const [form, setForm] = useState<AssetForm>(() => emptyForm());
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filterOptions = useMemo(() => ({
    categories: unique([...categories, ...assets.map((asset) => asset.category)]),
    departments: unique([...departments, ...assets.map((asset) => asset.department)]),
    locations: unique([...locations, ...assets.map((asset) => asset.location)]),
  }), [assets]);

  const visibleAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return assets.filter((asset) => {
      const searchable = [
        asset.tag,
        asset.name,
        asset.serialNumber,
        asset.qrCode,
        asset.category,
        asset.department,
        asset.location,
      ].join(" ").toLowerCase();

      return (!normalizedQuery || searchable.includes(normalizedQuery))
        && (filters.category === "All" || asset.category === filters.category)
        && (filters.status === "All" || asset.status === filters.status)
        && (filters.department === "All" || asset.department === filters.department)
        && (filters.location === "All" || asset.location === filters.location)
        && (filters.condition === "All" || asset.condition === filters.condition)
        && (filters.shared === "All" || (filters.shared === "Bookable" ? asset.shared : !asset.shared));
    });
  }, [assets, filters, query]);

  const selectedAsset = assets.find((asset) => asset.tag === selectedTag) ?? null;
  const dialogOpen = creating || Boolean(selectedAsset);

  useEffect(() => {
    document.body.classList.toggle("assetflow-dialog-open", dialogOpen);
    return () => document.body.classList.remove("assetflow-dialog-open");
  }, [dialogOpen]);

  function updateFilter(key: keyof typeof filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function openCreateModal() {
    setForm(emptyForm());
    setFormError("");
    setCreating(true);
  }

  function closeCreateModal() {
    setCreating(false);
    setFormError("");
  }

  function submitAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const requiredFields: Array<[keyof AssetForm, string]> = [
      ["name", "Asset name"],
      ["category", "Category"],
      ["serialNumber", "Serial number"],
      ["acquisitionDate", "Acquisition date"],
      ["acquisitionCost", "Acquisition cost"],
      ["department", "Department"],
      ["location", "Location"],
    ];
    const missing = requiredFields.find(([field]) => !String(form[field]).trim());
    const acquisitionCost = Number(form.acquisitionCost);

    if (missing) {
      setFormError(`${missing[1]} is required.`);
      return;
    }

    if (!Number.isFinite(acquisitionCost) || acquisitionCost < 0) {
      setFormError("Acquisition cost must be a valid positive amount.");
      return;
    }

    const tag = nextAssetTag(assets);
    const newAsset: AssetRecord = {
      tag,
      name: form.name.trim(),
      category: form.category.trim(),
      serialNumber: form.serialNumber.trim(),
      acquisitionDate: form.acquisitionDate,
      acquisitionCost,
      status: "Available",
      department: form.department.trim(),
      location: form.location.trim(),
      condition: form.condition,
      shared: form.shared,
      qrCode: `QR-${tag}-${form.serialNumber.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) || "ASSET"}`,
      notes: form.notes.trim() || "No notes added.",
      lastUpdated: "Just now",
      recentActivity: "Created in asset directory",
      allocationHistory: [],
      maintenanceHistory: [],
    };

    setAssets((current) => [...current, newAsset]);
    setSelectedTag(tag);
    setCreating(false);
    setToast(`${tag} was added to the asset directory.`);
    recordActivity({
      kind: "Asset",
      title: `${tag} registered`,
      description: `${newAsset.name} added to ${newAsset.department}.`,
      actor: "Asset registry",
      target: tag,
      severity: "Success",
    });
  }

  return <FeatureShell title="Assets" actions={<button className="button primary" onClick={openCreateModal}><Plus size={15} />New Asset</button>}>
    <section className="asset-summary-grid">
      <article><span>Total assets</span><strong>{assets.length}</strong><small>{visibleAssets.length} visible</small></article>
      <article><span>Bookable</span><strong>{assets.filter((asset) => asset.shared).length}</strong><small>Shared resources</small></article>
      <article><span>Available</span><strong>{assets.filter((asset) => asset.status === "Available").length}</strong><small>Ready for use</small></article>
      <article><span>Needs attention</span><strong>{assets.filter((asset) => ["Under Maintenance", "Lost"].includes(asset.status)).length}</strong><small>Maintenance or exceptions</small></article>
    </section>

    {toast && <div className="asset-toast" role="status"><CheckCircle2 size={15} />{toast}<button type="button" onClick={() => setToast("")} aria-label="Dismiss notification"><X size={14} /></button></div>}

    <section className="asset-directory-controls">
      <label className="asset-search">
        <Search size={15} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tag, name, serial, QR, category, department, or location" />
      </label>
      <div className="asset-filters">
        <select value={filters.category} onChange={(event) => updateFilter("category", event.target.value)} aria-label="Filter by category"><option>All</option>{filterOptions.categories.map((value) => <option key={value}>{value}</option>)}</select>
        <select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)} aria-label="Filter by lifecycle status"><option>All</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select>
        <select value={filters.department} onChange={(event) => updateFilter("department", event.target.value)} aria-label="Filter by department"><option>All</option>{filterOptions.departments.map((value) => <option key={value}>{value}</option>)}</select>
        <select value={filters.location} onChange={(event) => updateFilter("location", event.target.value)} aria-label="Filter by location"><option>All</option>{filterOptions.locations.map((value) => <option key={value}>{value}</option>)}</select>
        <select value={filters.shared} onChange={(event) => updateFilter("shared", event.target.value)} aria-label="Filter by shared status"><option>All</option><option>Bookable</option><option>Not bookable</option></select>
        <select value={filters.condition} onChange={(event) => updateFilter("condition", event.target.value)} aria-label="Filter by condition"><option>All</option>{conditions.map((value) => <option key={value}>{value}</option>)}</select>
      </div>
    </section>

    <section className="clean-panel table-panel asset-table-panel">
      <table className="clean-table asset-table">
        <thead>
          <tr>
            <th>Asset Tag</th>
            <th>Asset</th>
            <th>Category</th>
            <th>Status</th>
            <th>Department / Location</th>
            <th>Condition</th>
            <th>Bookable</th>
            <th>Recent activity</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {visibleAssets.map((asset) => <tr key={asset.tag}>
            <td><strong>{asset.tag}</strong></td>
            <td><strong>{asset.name}</strong><small>{asset.serialNumber}</small></td>
            <td>{asset.category}</td>
            <td><span className={`status ${statusClass(asset.status)}`}>{asset.status}</span></td>
            <td><strong>{asset.department}</strong><small>{asset.location}</small></td>
            <td>{asset.condition}</td>
            <td><span className={asset.shared ? "bookable-pill yes" : "bookable-pill"}>{asset.shared ? "Shared" : "No"}</span></td>
            <td><strong>{asset.lastUpdated}</strong><small>{asset.recentActivity}</small></td>
            <td><button type="button" className="row-action" onClick={() => setSelectedTag(asset.tag)}><Eye size={13} />View details</button></td>
          </tr>)}
        </tbody>
      </table>
      {visibleAssets.length === 0 && <p className="empty-copy">No assets match the current search and filters.</p>}
    </section>

    {creating && <div className="asset-modal-backdrop" role="presentation">
      <section className="asset-modal" role="dialog" aria-modal="true" aria-labelledby="new-asset-title">
        <header>
          <div><p>Asset registration</p><h2 id="new-asset-title">New Asset</h2></div>
          <button type="button" onClick={closeCreateModal} aria-label="Close new asset form"><X size={17} /></button>
        </header>
        <form className="asset-form" onSubmit={submitAsset}>
          <label><span>Asset name</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Dell Latitude 7440" required /></label>
          <label><span>Category</span><input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Laptop, Vehicle, Room" list="asset-categories" required /></label>
          <label><span>Serial number</span><input value={form.serialNumber} onChange={(event) => setForm({ ...form, serialNumber: event.target.value })} placeholder="SN-2048-IN" required /></label>
          <label><span>Acquisition date</span><input type="date" value={form.acquisitionDate} onChange={(event) => setForm({ ...form, acquisitionDate: event.target.value })} required /></label>
          <label><span>Acquisition cost</span><input type="number" min="0" step="1" value={form.acquisitionCost} onChange={(event) => setForm({ ...form, acquisitionCost: event.target.value })} placeholder="1250" required /></label>
          <label><span>Condition</span><select value={form.condition} onChange={(event) => setForm({ ...form, condition: event.target.value as AssetCondition })}>{conditions.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Department</span><input value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} placeholder="Engineering" list="asset-departments" required /></label>
          <label><span>Location</span><input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Bengaluru HQ" list="asset-locations" required /></label>
          <label className="asset-toggle"><input type="checkbox" checked={form.shared} onChange={(event) => setForm({ ...form, shared: event.target.checked })} /><span>Shared / bookable resource</span></label>
          <label className="asset-notes"><span>Notes</span><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Lifecycle notes, warranty details, accessories, ownership context" /></label>
          <div className="asset-upload-placeholder"><Upload size={17} /><strong>Photo or documents</strong><span>Placeholder for asset photos, invoices, warranty files, or QR labels.</span></div>
          <datalist id="asset-categories">{categories.map((value) => <option value={value} key={value} />)}</datalist>
          <datalist id="asset-departments">{departments.map((value) => <option value={value} key={value} />)}</datalist>
          <datalist id="asset-locations">{locations.map((value) => <option value={value} key={value} />)}</datalist>
          {formError && <p className="asset-form-error" role="alert">{formError}</p>}
          <footer><button type="button" className="button" onClick={closeCreateModal}>Cancel</button><button type="submit" className="button primary">Create Asset</button></footer>
        </form>
      </section>
    </div>}

    {selectedAsset && <div className="asset-detail-backdrop" role="presentation">
      <aside className="asset-detail-panel" role="dialog" aria-modal="false" aria-labelledby="asset-detail-title">
        <header>
          <div><p>{selectedAsset.tag}</p><h2 id="asset-detail-title">{selectedAsset.name}</h2></div>
          <button type="button" onClick={() => setSelectedTag(null)} aria-label="Close asset details"><X size={17} /></button>
        </header>
        <div className="asset-detail-status">
          <span className={`status ${statusClass(selectedAsset.status)}`}>{selectedAsset.status}</span>
          <span className={selectedAsset.shared ? "bookable-pill yes" : "bookable-pill"}>{selectedAsset.shared ? "Shared / bookable" : "Not bookable"}</span>
        </div>
        <dl className="asset-detail-grid">
          <div><dt>Category</dt><dd>{selectedAsset.category}</dd></div>
          <div><dt>Serial number</dt><dd>{selectedAsset.serialNumber}</dd></div>
          <div><dt>Acquisition date</dt><dd>{selectedAsset.acquisitionDate}</dd></div>
          <div><dt>Acquisition cost</dt><dd>{formatCurrency(selectedAsset.acquisitionCost)}</dd></div>
          <div><dt>Department</dt><dd>{selectedAsset.department}</dd></div>
          <div><dt>Location</dt><dd>{selectedAsset.location}</dd></div>
          <div><dt>Condition</dt><dd>{selectedAsset.condition}</dd></div>
          <div><dt>Last updated</dt><dd>{selectedAsset.lastUpdated}</dd></div>
        </dl>
        <section className="asset-identifier-card"><div className="qr-placeholder">{selectedAsset.tag}</div><div><strong>{selectedAsset.qrCode}</strong><span>QR / asset identifier placeholder</span></div></section>
        <section className="asset-document-card"><FileText size={17} /><div><strong>Photo and documents</strong><span>Asset image, invoice, warranty, and ownership files appear here.</span></div></section>
        <section className="asset-notes-card"><h3>Notes</h3><p>{selectedAsset.notes}</p></section>
        <HistorySection title="Allocation history" entries={selectedAsset.allocationHistory} empty="No allocation history has been recorded yet." />
        <HistorySection title="Maintenance history" entries={selectedAsset.maintenanceHistory} empty="No maintenance history has been recorded yet." />
      </aside>
    </div>}
  </FeatureShell>;
}

function HistorySection({ title, entries, empty }: { title: string; entries: HistoryEntry[]; empty: string }) {
  return <section className="asset-history">
    <h3>{title}</h3>
    {entries.length > 0 ? entries.map((entry) => <article key={`${entry.date}-${entry.title}`}>
      <time>{entry.date}</time>
      <strong>{entry.title}</strong>
      <p>{entry.detail}</p>
    </article>) : <p className="asset-history-empty">{empty}</p>}
  </section>;
}
