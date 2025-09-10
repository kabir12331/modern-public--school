# Modern Public School — Cordova wrapper (ready-to-build)

This folder contains a Cordova-ready project that wraps your web app (the `public/` files) into a mobile WebView.

## What I prepared for you (in this zip)
- `www/` — your web app (index.html, admin.html, teacher.html, student.html, styles.css, app.js)
- `config.xml` — Cordova config skeleton
- `README_BUILD.txt` — step-by-step instructions to build an Android APK locally or with GitHub Actions.

## Build locally (recommended)
1. Install Node.js and npm.
2. Install Cordova CLI:
   ```
   npm install -g cordova
   ```
3. Create an Android platform (from inside this project folder):
   ```
   cordova platform add android
   cordova prepare android
   cordova build android --release
   ```
   The unsigned APK will be at `platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk`.

4. Sign and align the APK using `jarsigner` and `zipalign` from Android SDK build-tools.

## Build on GitHub Actions (CI)
- Create a repository, push this project.
- Add a GitHub Actions workflow that installs Node, Cordova, Android SDK, and runs `cordova build android --release`.
- You'll need to add keystore and signing keys as encrypted secrets.

## Important notes
- This environment couldn't compile the APK directly (requires Android SDK / build tools).
- If you want, I can generate a GitHub Actions workflow file for you (you can paste into `.github/workflows/android.yml`) to build automatically on push and produce an APK artifact.