import assert from "node:assert/strict";
import test from "node:test";
import { createBooking } from "../features/bookings/service.ts";
import { transitionMaintenance } from "../features/maintenance/service.ts";

test("booking acceptance: overlap fails and adjacent slot succeeds", () => {
  const asset = { id: 1, name: "Room B2", shared: true };
  const existing = [createBooking(asset, { assetId: 1, employeeId: 1, startAt: new Date("2026-07-13T09:00:00Z"), endAt: new Date("2026-07-13T10:00:00Z") }, [])];
  assert.throws(() => createBooking(asset, { assetId: 1, employeeId: 2, startAt: new Date("2026-07-13T09:30:00Z"), endAt: new Date("2026-07-13T10:30:00Z") }, existing), /already booked/);
  const adjacent = createBooking(asset, { assetId: 1, employeeId: 2, startAt: new Date("2026-07-13T10:00:00Z"), endAt: new Date("2026-07-13T11:00:00Z") }, existing);
  assert.equal(adjacent.status, "UPCOMING");
  assert.throws(() => createBooking({ ...asset, shared: false }, { assetId: 1, employeeId: 2, startAt: new Date("2026-07-14T10:00:00Z"), endAt: new Date("2026-07-14T11:00:00Z") }, existing), /Only shared assets/);
});

test("maintenance acceptance: full workflow syncs asset status", () => {
  let request = { id: 1, assetId: 1, requestedBy: 3, description: "Projector flickers", priority: "HIGH" as const, status: "PENDING" as const, createdAt: new Date() };
  const manager = { id: 2, role: "ASSET_MANAGER" as const };
  assert.throws(() => transitionMaintenance(request, "APPROVE", { id: 4, role: "EMPLOYEE" }, { assetStatus: "AVAILABLE" }), /Only Asset Managers/);
  let result = transitionMaintenance(request, "APPROVE", manager, { assetStatus: "AVAILABLE" });
  assert.equal(result.assetStatus, "UNDER_MAINTENANCE");
  request = result.request as typeof request;
  result = transitionMaintenance(request, "ASSIGN_TECHNICIAN", manager, { assetStatus: "UNDER_MAINTENANCE", technician: "Ravi" }); request = result.request as typeof request;
  result = transitionMaintenance(request, "START_WORK", manager, { assetStatus: "UNDER_MAINTENANCE" }); request = result.request as typeof request;
  result = transitionMaintenance(request, "RESOLVE", manager, { assetStatus: "UNDER_MAINTENANCE" });
  assert.equal(result.request.status, "RESOLVED");
  assert.equal(result.assetStatus, "AVAILABLE");
  assert.match(result.notification.type, /RESOLVED/);
  assert.equal(result.activityLog.action, "maintenance.resolve");
});
