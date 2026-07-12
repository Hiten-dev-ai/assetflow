# Contributing to AssetFlow

## Rules

1. Pull the latest `main` before creating your feature branch.
2. Do not modify `db/schema.ts` without discussing the change first; it is the shared data contract.
3. Keep feature UI in its own route and reusable components inside a feature-named directory.
4. Never assign elevated roles during signup. New accounts are Employees only.
5. Open a pull request into `main`; do not push feature work directly to `main`.

## Commit format

Use small commits such as:

```text
feat(assets): add searchable asset directory
fix(allocation): prevent active double allocation
test(bookings): cover adjacent and overlapping slots
docs(maintenance): document workflow transitions
```

Before opening a pull request, run `npm run build` and describe the tested workflow in the PR body.
