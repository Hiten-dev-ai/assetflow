"use client";

import { CheckCircle2, Eye, FileText, Plus, Search, Upload, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { FeatureShell } from "../../components/FeatureShell";
import { recordActivity } from "../../lib/activityLog";
import { readAssetCategories, readDepartments } from "../../lib/organizationDirectory";
import {
  type AssetCondition,
  type AssetDraft,
  type AssetForm,
  type AssetRecord,
  type HistoryEntry,
  categories,
  conditions,
  departments,
  emptyAssetForm,
  formatCurrency,
  locations,
  statusClass,
  statuses,
  unique,
} from "../../lib/assets";

export default function AssetsPage() {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    category: "All",
    status: "All",
    department: "All",
    location: "All",
    shared: "All",
    condition: "All",
  });
  const [form, setForm] = useState<AssetForm>(() => emptyAssetForm());
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [masterCategories] = useState(() => readAssetCategories().filter((category) => category.status === "Active").map((category) => category.name));
  const [masterDepartments] = useState(() => readDepartments().filter((department) => department.status === "Active").map((department) => department.name));

  const filterOptions = useMemo(() => ({
    categories: unique([...categories, ...masterCategories, ...assets.map((asset) => asset.category)]),
    departments: unique([...departments, ...masterDepartments, ...assets.map((asset) => asset.department)]),
    locations: unique([...locations, ...assets.map((asset) => asset.location)]),
  }), [assets, masterCategories, masterDepartments]);

  const loadAssets = useCallback(async (preferredTag?: string | null) => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await fetch("/api/assets", { cache: "no-store" });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Unable to load assets.");
      }

      const nextAssets = (await response.json()) as AssetRecord[];
      setAssets(nextAssets);

      if (preferredTag !== undefined) {
        setSelectedTag(preferredTag);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load assets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAssets();
  }, [loadAssets]);

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
  const isEditing = editingTag !== null;
  const dialogOpen = creating || Boolean(selectedAsset);

  useEffect(() => {
    document.body.classList.toggle("assetflow-dialog-open", dialogOpen);
    return () => document.body.classList.remove("assetflow-dialog-open");
  }, [dialogOpen]);

  function updateFilter(key: keyof typeof filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function openCreateModal() {
    setEditingTag(null);
    setForm(emptyAssetForm());
    setFormError("");
    setCreating(true);
  }

  function openEditModal(asset: AssetRecord) {
    setEditingTag(asset.tag);
    setForm({
      name: asset.name,
      category: asset.category,
      serialNumber: asset.serialNumber,
      acquisitionDate: asset.acquisitionDate,
      acquisitionCost: String(asset.acquisitionCost),
      condition: asset.condition,
      department: asset.department,
      location: asset.location,
      shared: asset.shared,
      notes: asset.notes,
    });
    setFormError("");
    setCreating(true);
  }

  function closeCreateModal() {
    setCreating(false);
    setFormError("");
    setEditingTag(null);
  }

  async function submitAsset(event: FormEvent<HTMLFormElement>) {
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

    const draft: AssetDraft = {
      name: form.name.trim(),
      category: form.category.trim(),
      serialNumber: form.serialNumber.trim(),
      acquisitionDate: form.acquisitionDate,
      acquisitionCost,
      condition: form.condition,
      department: form.department.trim(),
      location: form.location.trim(),
      shared: form.shared,
      notes: form.notes.trim(),
    };

    try {
      const endpoint = editingTag ? `/api/assets/${encodeURIComponent(editingTag)}` : "/api/assets";
      const method = editingTag ? "PATCH" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to save asset.");
      }

      const savedAsset = payload as AssetRecord;
      const wasEditing = editingTag !== null;
      setCreating(false);
      setToast(wasEditing ? `${savedAsset.tag} was updated.` : `${savedAsset.tag} was added to the asset directory.`);
      setEditingTag(null);
      recordActivity({
        kind: "Asset",
        title: wasEditing ? `${savedAsset.tag} updated` : `${savedAsset.tag} registered`,
        description: `${savedAsset.name} ${wasEditing ? "updated in" : "added to"} ${savedAsset.department}.`,
        actor: "Asset registry",
        target: savedAsset.tag,
        severity: "Success",
      });
      await loadAssets(savedAsset.tag);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save asset.");
    }
  }

  async function removeAsset(asset: AssetRecord) {
    if (!window.confirm(`Delete ${asset.tag} - ${asset.name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/assets/${encodeURIComponent(asset.tag)}`, { method: "DELETE" });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to delete asset.");
      }

      setToast(`${asset.tag} was deleted.`);
      await loadAssets(null);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Unable to delete asset.");
    }
  }

  return <FeatureShell title="Assets" actions={<button className="button primary" onClick={openCreateModal}><Plus size={15} />New Asset</button>}>
    <section className="asset-summary-grid">
      <article><span>Total assets</span><strong>{assets.length}</strong><small>{visibleAssets.length} visible</small></article>
      <article><span>Bookable</span><strong>{assets.filter((asset) => asset.shared).length}</strong><small>Shared resources</small></article>
      <article><span>Available</span><strong>{assets.filter((asset) => asset.status === "Available").length}</strong><small>Ready for use</small></article>
      <article><span>Needs attention</span><strong>{assets.filter((asset) => ["Under Maintenance", "Lost"].includes(asset.status)).length}</strong><small>Maintenance or exceptions</small></article>
    </section>

    {loadError && <div className="notice danger" role="alert">{loadError}</div>}

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
      {loading && <p className="empty-copy">Loading asset records...</p>}
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
      {!loading && visibleAssets.length === 0 && <p className="empty-copy">No assets match the current search and filters.</p>}
    </section>

    {creating && <div className="asset-modal-backdrop" role="presentation">
      <section className="asset-modal" role="dialog" aria-modal="true" aria-labelledby="new-asset-title">
        <header>
          <div><p>{isEditing ? "Asset update" : "Asset registration"}</p><h2 id="new-asset-title">{isEditing ? "Edit Asset" : "New Asset"}</h2></div>
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
          <datalist id="asset-categories">{filterOptions.categories.map((value) => <option value={value} key={value} />)}</datalist>
          <datalist id="asset-departments">{filterOptions.departments.map((value) => <option value={value} key={value} />)}</datalist>
          <datalist id="asset-locations">{locations.map((value) => <option value={value} key={value} />)}</datalist>
          {formError && <p className="asset-form-error" role="alert">{formError}</p>}
          <footer><button type="button" className="button" onClick={closeCreateModal}>Cancel</button><button type="submit" className="button primary">{isEditing ? "Save Changes" : "Create Asset"}</button></footer>
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
        <footer className="asset-detail-actions"><button type="button" className="button" onClick={() => openEditModal(selectedAsset)}>Edit asset</button><button type="button" className="button" onClick={() => removeAsset(selectedAsset)}>Delete asset</button></footer>
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
