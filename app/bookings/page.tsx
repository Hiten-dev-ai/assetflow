"use client";

import { useMemo, useState } from "react";
import { FeatureShell } from "../../components/FeatureShell";
import { Booking, BookingRuleError, cancelBooking, createBooking, rescheduleBooking } from "../../features/bookings/service";

const assets = [{ id: 1, name: "Room B2", shared: true }, { id: 2, name: "Room Atlas", shared: true }, { id: 3, name: "Finance Laptop", shared: false }];
const base = "2026-07-13";
const at = (time: string) => new Date(`${base}T${time}:00`);
const initial: Booking[] = [{ id: 1, assetId: 1, employeeId: 7, startAt: at("09:00"), endAt: at("10:00"), purpose: "Planning", status: "UPCOMING" }];

export default function BookingsPage() {
  const [assetId, setAssetId] = useState(1);
  const [bookings, setBookings] = useState(initial);
  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("11:00");
  const [purpose, setPurpose] = useState("Team session");
  const [view, setView] = useState<"day" | "week">("day");
  const [message, setMessage] = useState("Adjacent slots are allowed.");
  const asset = assets.find((item) => item.id === assetId)!;
  const visible = useMemo(() => bookings.filter((booking) => booking.assetId === assetId), [bookings, assetId]);

  function submit() {
    try {
      const next = createBooking(asset, { assetId, employeeId: 7, startAt: at(start), endAt: at(end), purpose }, bookings);
      setBookings([...bookings, next]); setMessage("Booking confirmed.");
    } catch (error) { setMessage(error instanceof BookingRuleError ? error.message : "Could not create booking."); }
  }
  function cancel(item: Booking) { setBookings(bookings.map((booking) => booking.id === item.id ? cancelBooking(booking) : booking)); }
  function move(item: Booking) {
    try {
      const moved = rescheduleBooking(asset, item, new Date(item.startAt.getTime() + 60 * 60 * 1000), new Date(item.endAt.getTime() + 60 * 60 * 1000), bookings);
      setBookings(bookings.map((booking) => booking.id === item.id ? moved : booking)); setMessage("Booking moved one hour later.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not reschedule."); }
  }
  return <FeatureShell title="Shared-resource bookings" actions={<div className="segmented"><button className={view === "day" ? "selected" : ""} onClick={() => setView("day")}>Day</button><button className={view === "week" ? "selected" : ""} onClick={() => setView("week")}>Week</button></div>}>
    <section className="feature-grid">
      <article className="feature-panel form-card"><p className="eyebrow accent">New booking</p><h2>Reserve a resource</h2>
        <label>Resource<select value={assetId} onChange={(event) => setAssetId(Number(event.target.value))}>{assets.map((item) => <option value={item.id} key={item.id}>{item.name}{!item.shared ? " (not shared)" : ""}</option>)}</select></label>
        <div className="field-row"><label>Start<input type="time" value={start} onChange={(event) => setStart(event.target.value)} /></label><label>End<input type="time" value={end} onChange={(event) => setEnd(event.target.value)} /></label></div>
        <label>Purpose<input value={purpose} onChange={(event) => setPurpose(event.target.value)} /></label><button className="primary-button wide" onClick={submit}>Create booking</button><p className="form-message" role="status">{message}</p>
      </article>
      <article className="feature-panel calendar-card"><div className="section-heading"><div><p className="eyebrow">{view} calendar</p><h2>Monday, 13 July</h2></div><select value={assetId} onChange={(event) => setAssetId(Number(event.target.value))}>{assets.filter((item) => item.shared).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></div>
        <div className="booking-list">{visible.map((item) => <div className={`booking-row ${item.status === "CANCELLED" ? "cancelled" : ""}`} key={item.id}><time>{item.startAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}<small>{item.endAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></time><span><strong>{item.purpose}</strong><small>{asset.name} · {item.status}</small></span>{item.status !== "CANCELLED" && <div><button onClick={() => move(item)}>+1 hour</button><button onClick={() => cancel(item)}>Cancel</button></div>}</div>)}</div>
      </article>
    </section>
  </FeatureShell>;
}
