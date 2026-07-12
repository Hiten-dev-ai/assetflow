import { createBookingController } from "../features/bookings/bookingController";
export { createBookingController };

/** Framework-neutral route registration seam for an API adapter. */
export function registerBookingRoutes(router: { post: (path: string, handler: typeof createBookingController) => void }) {
  router.post("/bookings", createBookingController);
}
