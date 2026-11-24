# Google Play release preparation

Package: `com.beaconoftheeagle.centinellia`
Version: 1.0.0 (1). Minimum Android 8.0; target Android 16 / API 36.

## Build and sign

1. Check the Android build workflow. Download its debug APK and unsigned AAB. A successful build is not the same as a completed Android device test.
2. Test the debug APK on Android, including the native document picker, large-file hashing, cancelling a picker, exporting, importing, keyboard insets, and rotation. Reopening the application must preserve saved cases. Test current Android 16 and an older supported version.
3. Create or securely select the publisher's upload signing key in Android Studio. Do not place it in the repository. For command-line signing, create an ignored `keystore.properties` file with `storeFile`, `storePassword`, `keyAlias`, and `keyPassword` entries. Retain a secure backup of the key and credentials.
4. Build a signed release AAB using `gradle bundleRelease`. Confirm the package and signing certificate. Enroll in or use Play App Signing in Play Console as appropriate for the new application.

## Store materials and declarations

- Review `LISTING.md`, the in-app copy, and `PRIVACY.md` together so claims match the final binary.
- Publish the privacy policy at a stable public web URL. A raw Markdown file is a draft source for that page.
- Produce a 512 × 512 store icon, a 1024 × 500 feature graphic, and required phone screenshots from the tested app. The repository includes illustrative Chromium screenshots with labeled training records; replace or verify these on Android before store submission.
- App access: no login or account required.
- Ads: this build contains no ads.
- Proposed target audience: 18 and over. Complete the actual IARC content-rating questionnaire.
- Data safety draft: the app has no network permission or collection SDK and the publisher receives no app data. Records are processed locally. Exports are user-initiated through Android's document picker. Review the current form's definitions, including user-directed sharing exemptions, before submitting a declaration.
- Account deletion: no app account exists. Local deletion is provided in Settings.
- No sensitive device, location, contacts, camera, microphone, or broad file-storage permissions are requested by the manifest.
- Decide pricing and distribution countries before publishing. No sales or income is implied by creating a listing.

## Submission

Create a new Play Console app under Beacon of the Eagle LLC, configure its listing and declarations, and upload the signed AAB to an internal testing track first. Review pre-launch results, correct any issues, and then prepare a production release. This repository does not automatically upload or publish anything to Google Play. Google determines approval.

API policy checked November 24, 2026: https://developer.android.com/google/play/requirements/target-sdk
