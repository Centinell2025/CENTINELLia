# CENTINELL AI 1 privacy policy

Effective November 24, 2026. Version 1.2.0. Publisher: Beacon of the Eagle LLC. Contact: centinellsuite@gmail.com.

## Local investigation tools

Cases, observations, evidence metadata, SHA-256 fingerprints you attach, event timelines, priorities, statuses, and checklist progress are stored locally in the Android app or the browser where you use the web workspace. The Android and web stores are separate. No automatic synchronization is provided. Core tools include no advertising or tracking SDK and do not upload case records.

Local records do not have an additional application encryption layer. The Android application sandbox applies. Android cloud backup and device transfer are excluded by the application configuration. Browser storage follows the browser's behavior. Export records you need before clearing storage, changing devices, or uninstalling.

## Selected files and exports

Hashing reads only the file you select, locally, without executing or uploading it. The original file is not copied into the evidence inventory. You can choose to attach its name and fingerprint to a case. Reports, JSON backups, CSV, and printed/PDF output are readable without a password. You choose their destination; a cloud document or print provider you choose may process the export under its own terms.

## Optional AI consultation

AI is a separately configured feature of the private hosted web workspace. The Android app opens that workspace in a browser and does not copy its local case records there. The hosted workspace uses its platform's authorized sign-in and access policy.

Only after you select Send question does the web workspace send your question through its authenticated server route to the configured OpenAI API. The selected case report is included only if you explicitly check the option to include it. Original files are never attached by this feature. The question is limited to 4,000 characters and selected case context to 12,000 characters.

The app does not store an AI API credential in the HTML, JavaScript bundle, or local case storage. Credentials belong in the hosted runtime secret configuration. The server does not maintain a case database or intentionally log consultation bodies. The API request uses `store: false`; the AI provider and hosting platform may still process or retain technical data under their own applicable policies. No zero-retention guarantee is made by this app. Review the applicable provider terms before submitting sensitive records.

AI responses remain in the current session unless you choose to save one as an explicitly unverified case observation. AI output is not an established finding. When no provider is configured, the interface says that setup is required and does not generate a simulated response.

## Deletion and retention

Delete individual cases or all local records from Settings. Uninstalling or clearing Android app data removes the local workspace. Clearing the browser's site data removes the web workspace's local records. Exported files remain wherever you saved them and must be removed separately. Deleting local records does not delete a consultation already sent to an external provider; its terms and data controls apply. No server-side case account or synchronized case database is created by this version.

## Audience and contact

This professional utility is intended for adults handling authorized records. It is not designed for children. Contact centinellsuite@gmail.com with privacy questions.

## Infrastructure inventory
Asset names, device classes, platforms, responsible teams, sites, manually recorded status and notes are saved in a separate local browser or application storage key. Inventory JSON exports are readable text. Deleting all cases does not delete inventory; remove inventory records individually or clear application/site data. The public web app may cache static application files for offline use, not API responses or case data. Do not include confidential information in public demonstrations.
