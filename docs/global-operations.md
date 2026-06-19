# Global Operations

The global operations layer covers bureau management, crisis coverage, platform health, and disaster recovery planning.

## Data model

- `Bureau` stores country and city coverage hubs.
- `BureauAssignment` stores task assignments for correspondents and desk editors.
- `CrisisEvent` and `CrisisUpdate` power the breaking-news command-center flow.
- `PlatformHealthSnapshot` tracks region-by-region operational health.
- `DisasterRecoveryPlan` stores recovery objectives and reference plans.

## UI and APIs

- `/dashboard/operations` exposes the operator view.
- `/api/rest/operations/bureaus` manages bureau records.
- `/api/rest/operations/crisis` manages live crisis events and updates.
- `/api/rest/operations/health` returns health snapshots for dashboards.

## Notes

- Crisis coverage should remain editorially controllable by editors, not just engineers.
- Platform health data should be sampled and aggregated outside the request path in production.
