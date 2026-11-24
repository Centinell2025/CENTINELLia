# CENTINELLia 1.1.0 validation

Tested app source: `1a75a5bbe108d7ac611a275bf3afed6db70ed358`.
Workflow: https://github.com/Centinell2025/CENTINELLia/actions/runs/45486667489

All three jobs passed: core/gateway tests and Android build, browser UI flows, and Android 16 emulator checks.

- 13 tests cover legacy backup migration, evidence metadata, event chronology and report order, invalid dates and hashes, spreadsheet formula escaping, local counts, authenticated AI routes, strict request types and sizes, origin checks, explicit context forwarding, provider failures, and request pacing. AI gateway tests use a mock provider and make no live paid inference calls.
- Browser flows cover case/observation/checklist persistence, SHA-256 known vectors, indicator extraction, evidence validation and save, UTC event ordering, report preview and download, local Base64 decoding, backup import, duplicate IDs, deletion controls, storage failure, mobile/desktop layout, the portable HTML file, and AI context opt-in with clearly test-only responses.
- Android 16 emulator passed install, offline launch, native file selection, SHA-256 of the three-byte fixture `abc`, and restart.
- Android lint and compilation passed. The signed owner-delivered AAB was verified, with app bytes identical to the CI release and the same upload key used for 1.0.

Not claimed as tested: live inference without an approved API credential, physical-device coverage, external cloud document providers, and the interactive Android print/PDF dialog. These remain internal release checks before Google Play submission. The hosted AI service remains unconfigured until the owner authorizes its separate API connection. No Google Play publication has been performed.
