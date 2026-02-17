# Mobile Release Pipeline

## Configured Files
- EAS profiles: `apps/mobile/eas.json`
- GitHub workflow: `.github/workflows/mobile-release.yml`

## Required Secret
- `EXPO_TOKEN` (GitHub Actions secret)

Generate token:
1. Run `npx expo login`
2. Run `npx expo whoami` to confirm account.
3. Create token in Expo account settings and store as `EXPO_TOKEN`.

## Build Profiles
- `preview`: internal Android APK for fast QA sharing.
- `staging`: internal distribution channel for staging validation.
- `production`: store-ready channel.

## How To Trigger
1. Open GitHub Actions.
2. Select `Mobile Release`.
3. Click `Run workflow`.
4. Choose:
   - `profile`: `preview` / `staging` / `production`
   - `platform`: `all` / `ios` / `android`

## Notes
- iOS production submission requires Apple credentials configured in Expo/EAS.
- Android production submission requires Google Play credentials configured in Expo/EAS.
