import { createBooking, type BookableAsset, type Booking, type BookingDraft } from "./bookingService";

export function createBookingController(asset: BookableAsset, draft: BookingDraft, existing: Booking[]) {
  return createBooking(asset, draft, existing);
}
