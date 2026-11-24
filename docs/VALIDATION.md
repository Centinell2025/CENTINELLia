# CENTINELLia 1.0.0 validation

Validated Android source: `69752cf462f8c59b82945d925026ab193c231714`.
CI run: https://github.com/Centinell2025/CENTINELLia/actions/runs/45481524583

- Five core tests passed: case/backup preservation, invalid imports, duplicate IDs, indicator normalization and bounds, and safe text handling.
- Shared UI tests passed on mobile and desktop viewports: persistence after reload, saved checklist progress, known-vector text/file hashing, hash comparison, indicator extraction, report download, backup import and duplicate handling, deletion cancellation/confirmation, storage failure, layout overflow, and the standalone HTML preview.
- Android lint completed without errors. Debug APK and release AAB compiled for API 36. Remaining lint warnings concern a newer optional SDK/Gradle release and the deliberately enabled JavaScript in the restricted, packaged-content WebView.
- Android 16 emulator passed install, offline packaged-page launch, native document selection, SHA-256 of the three-byte file `abc`, and restart. The digest was `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`.
- System bars and the keyboard are excluded from the WebView viewport through a native container. Cloud backup and device transfer exclusions are explicitly declared for Android 12+.
- The owner-delivered release AAB was signed outside the repository with an upload key. JAR verification passed and all packaged app bytes match the unsigned CI release. The key and its credentials are kept out of GitHub.

Limits: this is an emulator and shared-browser test result, not full physical-device coverage. Export destinations, cloud document providers, cancellation, large-file performance, rotation, and older supported Android versions should be checked during internal Play testing. No Google Play upload, approval, pricing choice, or production publication has been performed. The 1.0.0 app does not connect to an AI model.
