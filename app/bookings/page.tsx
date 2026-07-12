"use client";

import { CalendarDays, CheckCircle2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FeatureShell } from "../../components/FeatureShell";
import type { AssetRecord } from "../../lib/assets";
import type { BookingRecord } from "../../lib/erpStore";

type AssetOption = AssetRecord & { id?: string };

async function readApi<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as T & { error?: string };
  if (!response.ok) throw new Error(payload?.error ?? "Unable to complete booking action.");
  return payload;
}

function localValue(date: Date) {
  const copy = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return copy.toISOString().slice(0, 16);
}

function prettyTime(value: string) {
  return new Date(value).toLocaleString([], { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function BookingsPage() {
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [assetId, setAssetId] = useState("");
  const [startAt, setStartAt] = useState(() => localValue(new Date(Date.now() + 60 * 60 * 1000)));
  const [endAt, setEndAt] = useState(() => localValue(new Date(Date.now() + 2 * 60 * 60 * 1000)));
  const [purpose, setPurpose] = useState("Team session");
  const [view, setView] = useState<"day" | "week">("day");
  const [message, setMessage] = useState("Adjacent slots are allowed; overlaps are blocked.");

  async function load() {
    try {
      const [nextAssets, nextBookings] = await Promise.all([
        readApi<AssetRecord[]>(await fetch("/api/assets", { cache: "no-store" })),
        readApi<BookingRecord[]>(await fetch("/api/bookings", { cache: "no-store" })),
      ]);
      const bookable = nextAssets.filter((asset) => asset.shared);
      setAssets(bookable);
      setBookings(nextBookings);
      setAssetId((current) => current || bookable[0]?.tag || "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load bookings.");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const selectedAsset = assets.find((asset) => asset.tag === assetId || asset.id === assetId) ?? assets[0];
  const visible = useMemo(() => bookings.filter((booking) => booking.assetId === selectedAsset?.id || booking.assetTag === selectedAsset?.tag), [bookings, selectedAsset]);

  async function create() {
    if (!selectedAsset) return;
    try {
      const payload = await readApi<{ bookings: BookingRecord[] }>(await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: selectedAsset.id ?? selectedAsset.tag, startAt, endAt, purpose }),
      }));
      setBookings(payload.bookings);
      setMessage("Booking confirmed.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create booking.");
    }
  }

  async function cancel(id: string) {
    try {
      setBookings(await readApi<BookingRecord[]>(await fetch(`/api/bookings/${id}/cancel`, { method: "POST" })));
      setMessage("Booking cancelled.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not cancel booking.");
    }
  }

  async function move(booking: BookingRecord) {
    const start = new Date(booking.startAt).getTime() + 60 * 60 * 1000;
    const end = new Date(booking.endAt).getTime() + 60 * 60 * 1000;
    try {
      setBookings(await readApi<BookingRecord[]>(await fetch(`/api/bookings/${booking.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startAt: new Date(start).toISOString(), endAt: new Date(end).toISOString() }),
      })));
      setMessage("Booking moved one hour later.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not reschedule booking.");
    }
  }

  return <FeatureShell title="Shared-resource bookings" actions={<div className="segmented"><button className={view === "day" ? "selected" : ""} onClick={() => setView("day")}>Day</button><button className={view === "week" ? "selected" : ""} onClick={() => setView("week")}>Week</button></div>}>
    {message && <div className="asset-toast" role="status"><CheckCircle2 size={15} />{message}<button type="button" onClick={() => setMessage("")} aria-label="Dismiss"><X size={14} /></button></div>}
    <section className="feature-grid">
      <article className="feature-panel form-card">
        <p className="eyebrow accent">New booking</p><h2>Reserve a resource</h2>
        <label>Resource<select value={selectedAsset?.id ?? selectedAsset?.tag ?? ""} onChange={(event) => setAssetId(event.target.value)}>{assets.map((asset) => <option value={asset.id ?? asset.tag} key={asset.tag}>{asset.name} - {asset.tag}</option>)}</select></label>
        <div className="field-row"><label>Start<input type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} /></label><label>End<input type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} /></label></div>
        <label>Purpose<input value={purpose} onChange={(event) => setPurpose(event.target.value)} /></label>
        <button className="primary-button wide" type="button" onClick={create}>Create booking</button>
      </article>
      <article className="feature-panel calendar-card">
        <div className="section-heading"><div><p className="eyebrow">{view} calendar</p><h2>{selectedAsset?.name ?? "Bookable resources"}</h2></div><CalendarDays size={22} /></div>
        <div className="calendar-grid" aria-label={`${view} booking calendar`}>
          {Array.from({ length: view === "day" ? 12 : 36 }, (_, index) => {
            const booking = visible[index % Math.max(visible.length, 1)];
            return <div className="calendar-slot" key={index}><small>{index % 3 === 0 ? `${String(8 + Math.floor(index / 3)).padStart(2, "0")}:00` : ""}</small>{booking && index < visible.length && <span className="calendar-booking">{booking.purpose} - {booking.status}</span>}</div>;
          })}
        </div>
        <div className="booking-list">{visible.map((booking) => <div className={`booking-row ${booking.status === "CANCELLED" ? "cancelled" : ""}`} key={booking.id}>
          <time>{prettyTime(booking.startAt)}<small>{prettyTime(booking.endAt)}</small></time>
          <span><strong>{booking.purpose}</strong><small>{booking.assetName} - {booking.employeeName} - {booking.status}</small></span>
          {booking.status !== "CANCELLED" && booking.status !== "COMPLETED" && <div><button onClick={() => move(booking)}>Reschedule</button><button onClick={() => cancel(booking.id)}>Cancel</button></div>}
        </div>)}</div>
        {visible.length === 0 && <p className="empty-copy">No bookings for this resource yet.</p>}
      </article>
    </section>
  </FeatureShell>;
}
