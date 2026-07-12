# Codex task: Maha — Organization, Assets and Allocation

You are working on the AssetFlow repository:

`https://github.com/Hiten-dev-ai/assetflow`

You are **Turn 3** in a strict sequential workflow. Do not edit or push until both of these handoffs are confirmed:

1. PSujith completes Turn 1 and pushes booking/maintenance.
2. Hiten completes Turn 2, integrates PSujith's work, pushes, and explicitly tells you to begin.

Work directly on `main`; do not create a feature branch. Once Hiten authorizes Turn 3, follow the instructions below.

## Before editing

```bash
git clone https://github.com/Hiten-dev-ai/assetflow.git
cd assetflow
git checkout main
git pull origin main
npm install
git config user.name "Maha-ait"
git config user.email "YOUR_GITHUB_EMAIL"
```

If already cloned, still run `git checkout main` and `git pull origin main`. Inspect the current routes, `db/schema.ts`, `app/globals.css`, `CONTRIBUTING.md`, dashboard, and PSujith's completed modules before changing anything.

## Objective

Build organization setup, asset registration, the asset directory, and allocation/transfer/return workflows as a polished extension of the existing AssetFlow UI.

## Required routes

- `/organization` — tabs for Departments, Asset Categories, and Employee Directory
- `/assets` — searchable/filterable asset directory
- `/assets/new` — asset-registration form
- `/assets/[id]` — asset details, lifecycle, allocation history and maintenance history
- `/allocations` — active allocations, overdue returns and transfer requests

## Organization requirements

- Create, edit and deactivate departments.
- Support optional parent departments and Department Head assignment.
- Create and edit asset categories with optional category-specific fields.
- Employee Directory shows name, email, department, role and status.
- Signup always creates an `EMPLOYEE`.
- Only Admins may promote an employee to `DEPARTMENT_HEAD` or `ASSET_MANAGER`.
- Never add a role selector to signup.

## Asset requirements

- Register name, category, serial number, acquisition date/cost, condition, location and shared/bookable flag.
- Generate unique tags in `AF-0001` format.
- Use the exact lifecycle values from `db/schema.ts`.
- Search/filter by tag, serial number, category, status, department and location.
- Asset details must show allocation history and the maintenance history created by PSujith's module.

## Allocation requirements

- Allocate an available asset to either an employee or department.
- Support an optional expected return date.
- Never allow two active allocations for the same asset.
- If blocked, show the current holder and offer a transfer request.
- Transfer flow:

```text
REQUESTED → APPROVED → REALLOCATED
```

- Asset Managers or relevant Department Heads approve transfers.
- Returning an asset records condition check-in notes, closes the allocation, and changes the asset to `AVAILABLE`.
- Past expected-return dates must display as overdue and feed the dashboard.
- Create notification and activity-log records for allocation, transfer and return actions.

## Shared contracts

Use the existing `departments`, `employees`, `assetCategories`, `assets`, `allocations`, `notifications`, and `activityLogs` tables. Add feature services and reusable components under:

```text
app/features/organization/
app/features/assets/
app/features/allocations/
```

Do not break the booking or maintenance modules. Preserve the `shared` asset field because PSujith's booking module depends on it. Asset detail pages must consume maintenance history without renaming its fields.

Reuse the existing palette, typography, panels, tables, badges and responsive layout. Do not replace the dashboard or globally redesign the product.

## Acceptance scenario

1. Create an Electronics category and Design department.
2. Register a laptop and confirm its generated asset tag.
3. Allocate it to Priya with an expected return date.
4. Attempt to allocate it to Raj and prove the action is blocked.
5. Request and approve a transfer to Raj.
6. Return it with condition notes and confirm it becomes `AVAILABLE`.
7. Confirm its detail page shows allocation and maintenance history.

## Commit expectations

Make separate, meaningful commits under your GitHub identity:

```text
feat(org): add department and category management
feat(org): add employee role administration
feat(assets): add registration and generated tags
feat(assets): add searchable directory and detail view
feat(allocation): prevent active double allocation
feat(transfer): add transfer approval workflow
feat(return): capture condition and release asset
```

## Finish and hand off

```bash
npm run build
git status
git push origin main
git log -1 --oneline
```

Do not use force push. If the push is rejected, stop and contact Hiten rather than overwriting newer work.

Send the team: **“Maha Turn 3 complete. Latest commit: `<commit-id>`. Final integration can begin.”** Then stop editing the repository.
