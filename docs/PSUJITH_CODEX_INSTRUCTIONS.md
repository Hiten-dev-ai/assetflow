# Codex task: PSujith — Booking and Maintenance

You are working on the AssetFlow repository:

`https://github.com/Hiten-dev-ai/assetflow`

You are **Turn 1** in a strict sequential workflow. You may begin immediately. Work directly on `main`; do not create a feature branch. When finished, push all commits and stop editing so Hiten can take Turn 2.

## Before editing

```bash
git clone https://github.com/Hiten-dev-ai/assetflow.git
cd assetflow
git checkout main
git pull origin main
npm install
git config user.name "PSujith-Kumar"
git config user.email "YOUR_GITHUB_EMAIL"
```

Inspect the current routes, `db/schema.ts`, `app/globals.css`, `CONTRIBUTING.md`, and the dashboard before implementing. Preserve the existing Vinext/Next.js structure and visual language.

## Objective

Build the shared-resource booking and maintenance-management modules as a polished, responsive extension of the existing AssetFlow UI.

## Required routes

- `/bookings` — resource selector, booking list/calendar, status filters, cancel and reschedule actions
- `/bookings/new` — create a booking for a shared asset
- `/maintenance` — maintenance queue with role-aware filters and actions
- `/maintenance/new` — asset, issue description, priority and attachment placeholder
- `/maintenance/[id]` — request details, approval timeline and technician assignment

## Booking requirements

- Only assets with `shared = true` can be booked.
- Validate that start time is before end time.
- Prevent overlaps for the same asset using:

```text
newStart < existingEnd AND newEnd > existingStart
```

- Adjacent slots must be accepted. A booking from 09:00–10:00 must not block 10:00–11:00.
- Support `UPCOMING`, `ONGOING`, `COMPLETED`, and `CANCELLED`.
- Allow upcoming bookings to be cancelled or rescheduled.
- Show a clear conflict message containing the existing reservation time.
- Create notification and activity-log records for successful booking actions.

## Maintenance requirements

- Employees can raise requests against assets they hold.
- Use priorities `LOW`, `MEDIUM`, `HIGH`, and `CRITICAL`.
- Enforce this workflow:

```text
PENDING → APPROVED or REJECTED
APPROVED → TECHNICIAN_ASSIGNED
TECHNICIAN_ASSIGNED → IN_PROGRESS
IN_PROGRESS → RESOLVED
```

- Only an Asset Manager can approve or reject requests.
- Approval changes the asset status to `UNDER_MAINTENANCE`.
- Resolution changes it back to `AVAILABLE`, unless it has a terminal status such as `LOST`, `RETIRED`, or `DISPOSED`.
- Record notifications and activity logs for every transition.

## Shared contracts

Use the existing `assets`, `bookings`, `maintenanceRequests`, `notifications`, and `activityLogs` tables. Put overlap and workflow-transition logic in services under:

```text
app/features/bookings/
app/features/maintenance/
```

Keep route components focused on rendering and user interaction. Do not rename existing schema fields. If a schema change is absolutely necessary, make it small, generate a migration, and explain it in the commit.

Reuse the current palette, typography, panels, status pills, spacing and responsive behavior. Do not replace the dashboard or redesign the entire application.

## Acceptance scenarios

1. Book Room B2 from 09:00–10:00.
2. Attempt 09:30–10:30 and show that it is rejected.
3. Book 10:00–11:00 and show that it succeeds.
4. Cancel or reschedule an upcoming booking.
5. Raise a maintenance request.
6. Approve it and confirm the asset becomes `UNDER_MAINTENANCE`.
7. Assign a technician, start work and resolve it.
8. Confirm the asset returns to `AVAILABLE`.

## Commit expectations

Make separate, meaningful commits under your GitHub identity:

```text
feat(bookings): add shared-resource booking interface
feat(bookings): prevent overlapping reservations
feat(bookings): add cancellation and rescheduling
feat(maintenance): add request form and manager queue
feat(maintenance): enforce approval workflow
feat(maintenance): sync asset status and notifications
```

## Finish and hand off

```bash
npm run build
git status
git push origin main
git log -1 --oneline
```

Do not use force push. If the push is rejected, stop and tell Hiten rather than overwriting newer work.

Send the team: **“PSujith Turn 1 complete. Latest commit: `<commit-id>`. Hiten may begin Turn 2.”** Then stop editing the repository.
