# Contributor brief — Maha-ait

## Mission

Build the complete asset registry, organization setup, and allocation/transfer experience on branch `feature/assets-allocation`.

## Required screens

1. `/organization`: three tabs for Departments, Asset Categories, and Employee Directory.
2. `/assets`: searchable asset directory and asset-registration form.
3. `/assets/[id]`: asset profile with lifecycle state, allocation history, and maintenance-history placeholder.
4. `/allocations`: allocate, return, and request transfer.

## Required business rules

- New asset tags use `AF-0001` style identifiers.
- Asset lifecycle values must match `db/schema.ts`.
- An asset with an active allocation cannot be allocated again.
- A blocked allocation shows the current holder and offers a transfer request.
- Returning an asset records condition notes and changes it to `AVAILABLE`.
- Only Admins assign roles. Signup must never expose a role selector.

## Shared contracts

Use the existing `departments`, `employees`, `assetCategories`, `assets`, and `allocations` tables. Add service functions under `app/features/assets/`; keep route components thin. Do not edit dashboard styling globally unless required for a reusable design token.

## Acceptance test

Register an asset, allocate it to Priya, prove a second allocation is blocked, initiate a transfer to Raj, approve it, then return it with condition notes. The asset history must show every step.

## Suggested commits

1. `feat(org): add departments and category management`
2. `feat(assets): add registration and generated tags`
3. `feat(assets): add searchable directory and detail view`
4. `feat(allocation): prevent active double allocation`
5. `feat(transfer): add request and approval flow`
6. `feat(return): capture check-in condition and release asset`
