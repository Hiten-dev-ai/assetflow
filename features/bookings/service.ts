export type BookingStatus = "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";

export type BookableAsset = {
  id: number;
  name: string;
  shared: boolean;
};

export type Booking = {
  id: number;
  assetId: number;
  employeeId: number;
  startAt: Date;
  endAt: Date;
  purpose?: string;
  status: BookingStatus;
};

export type BookingDraft = Omit<Booking, "id" | "status">;

export class BookingRuleError extends Error {}

export function overlaps(
  newStart: Date,
  newEnd: Date,
  existingStart: Date,
  existingEnd: Date,
) {
  return newStart < existingEnd && newEnd > existingStart;
}

export function validateBooking(
  asset: BookableAsset,
  draft: BookingDraft,
  existing: Booking[],
  ignoredBookingId?: number,
) {
  if (!asset.shared) throw new BookingRuleError("Only shared assets can be booked.");
  if (draft.endAt <= draft.startAt) throw new BookingRuleError("End time must be after start time.");
  const conflict = existing.find(
    (booking) =>
      booking.id !== ignoredBookingId &&
      booking.assetId === draft.assetId &&
      booking.status !== "CANCELLED" &&
      overlaps(draft.startAt, draft.endAt, booking.startAt, booking.endAt),
  );
  if (conflict) throw new BookingRuleError("This resource is already booked for part of that time.");
}

export function createBooking(asset: BookableAsset, draft: BookingDraft, existing: Booking[]) {
  validateBooking(asset, draft, existing);
  return { ...draft, id: Math.max(0, ...existing.map((booking) => booking.id)) + 1, status: "UPCOMING" as const };
}

export function rescheduleBooking(
  asset: BookableAsset,
  booking: Booking,
  startAt: Date,
  endAt: Date,
  existing: Booking[],
) {
  if (booking.status === "CANCELLED" || booking.status === "COMPLETED") {
    throw new BookingRuleError("Only active bookings can be rescheduled.");
  }
  const draft = { ...booking, startAt, endAt };
  validateBooking(asset, draft, existing, booking.id);
  return draft;
}

export function cancelBooking(booking: Booking): Booking {
  if (booking.status === "COMPLETED") throw new BookingRuleError("Completed bookings cannot be cancelled.");
  return { ...booking, status: "CANCELLED" };
}
