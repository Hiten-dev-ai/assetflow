/** Backend-facing booking contract. Domain rules live in the shared service. */
export { BookingRuleError, cancelBooking, createBooking, overlaps, rescheduleBooking, validateBooking } from "../../features/bookings/service";
export type { BookableAsset, Booking, BookingDraft, BookingStatus } from "../../features/bookings/service";
