# Contributor brief — PSujith-Kumar

## Mission

Build shared-resource booking and maintenance approval on branch `feature/booking-maintenance`.

## Required screens

1. `/bookings`: resource selector, day/week calendar, create/reschedule/cancel booking.
2. `/maintenance`: request list with role-aware actions and filters.
3. `/maintenance/new`: asset, issue, priority, and attachment placeholder.
4. `/maintenance/[id]`: workflow timeline and technician assignment.

## Required business rules

- Only assets marked `shared` can be booked.
- Reject a booking when `newStart < existingEnd && newEnd > existingStart` for the same asset.
- Adjacent slots are valid: 09:00–10:00 and 10:00–11:00 do not overlap.
- Maintenance moves `PENDING → APPROVED/REJECTED → TECHNICIAN_ASSIGNED → IN_PROGRESS → RESOLVED`.
- Approval changes the asset to `UNDER_MAINTENANCE`; resolution changes it back to `AVAILABLE` unless it has another terminal status.
- Only Asset Managers approve or reject maintenance.

## Shared contracts

Use the existing `assets`, `bookings`, `maintenanceRequests`, `notifications`, and `activityLogs` tables. Put overlap and transition logic in feature services, not React components. Do not rename shared schema fields.

## Acceptance test

Book Room B2 from 09:00–10:00, prove 09:30–10:30 is rejected, and prove 10:00–11:00 succeeds. Then raise a maintenance request, approve it, assign a technician, start work, resolve it, and verify the asset status changes at approval and resolution.

## Suggested commits

1. `feat(bookings): add shared-resource calendar`
2. `feat(bookings): reject overlapping time slots`
3. `feat(bookings): add reschedule and cancellation`
4. `feat(maintenance): add request form and queue`
5. `feat(maintenance): enforce approval transitions`
6. `feat(maintenance): sync asset status and notifications`
