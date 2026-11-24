# CENTINELLia Enterprise — Defensive Intelligence
© 2026 Beacon of the Eagle LLC. All rights reserved.

This is an enterprise engineering foundation, not a deployed SIEM or verified capacity claim. The GitHub Pages client remains a local workspace; do not upload corporate evidence to a public repository.

## Target architecture
Corporate Android/iOS endpoints, Windows/Linux servers, cloud and network devices -> authorized collectors -> authenticated ingestion gateway -> durable queue -> bounded batch workers -> PostgreSQL (inventory, cases, findings and hot events) -> object storage for encrypted evidence and cold event archives. Introduce a dedicated columnar analytics store when benchmark evidence warrants it. Keep tenants isolated in every layer.

## Database foundation
Apply db/001_schema.sql once to a fresh PostgreSQL database as a migration owner. It creates tenant-aware foreign keys, row policies, time partitions, query indexes, assessments with authorization scope, findings and audit records. No application role is provisioned: create a dedicated non-owner, non-BYPASSRLS API role with only required privileges; never grant direct client SQL or partition access. Use verified membership and transaction-local tenant settings; reset pooled connections. Audit events require restricted insert-only grants and external immutable retention for production. Schedule partition creation before month boundaries and retention only after policy approval. The database does not yet enforce assessment approval/expiration at every operation; implement that in the API.

## Ethical hacker support
Authorized engagement register: owner approval, scope, dates, rules of engagement. Defensive workflow: import approved scanner findings, classify CVEs, validate evidence, correlate supplied logs, prioritize remediation and record retest results. Do not run scans against third-party systems without permission. AI advises only; no autonomous exploitation or system changes.

## Scale acceptance gates (targets, not results)
- Initial benchmark: 100 million synthetic events, 10,000 assets, 100 concurrent analysts; test 1,000 events/sec sustained with p95 filtered query latency under 2 seconds for bounded time windows.
- Expansion benchmark: one billion archived events; determine hot retention and analytical storage by measured cost and latency.
- Verify isolation across tenants, ingestion idempotency, backpressure, restore drills, key rotation, audit integrity and mobile UI.
- Use cursor pagination on (occurred_at,id), bounded query windows, batch writes, queue dead-letter handling and monitoring.
- No production credentials, confidential logs or evidence in GitHub. Encrypt traffic and storage; use MFA, RBAC, managed secrets and documented retention.

## Current limitations
SQL is a draft migration, not executed here. No production API, queue, cloud database, automated scanner, live AI, or performance guarantee is included. The existing local workspace remains intact. Next step: provision a private environment, implement the authenticated API and run integration/load tests.
