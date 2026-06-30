# Mobile Implementation Guide

This guide explains the best path to start a mobile implementation for this
React + Vite game so it can eventually ship on Android and the Apple App Store.

## Recommendation

Use a phased web-to-native approach:

1. Make the current web game mobile-ready first.
2. Add PWA basics so the game behaves like an installable mobile app on the web.
3. Wrap the existing React + Vite app with Capacitor for Android and iOS.
4. Add native-only features through Capacitor plugins only when needed.
5. Prepare store builds after the mobile web experience is stable.

This is the best fit for the current codebase because the game is already a
browser-based React app with canvas gameplay, Firebase, Vite build output, and
web UI screens. Rewriting the game in React Native, Kotlin, Swift, Unity, or
another stack would add a lot of cost before the mobile UX is proven.

## Why Capacitor First

Capacitor is designed to add Android and iOS projects to an existing modern web
app. The official Capacitor docs say an existing web app needs:

- a `package.json`
- a built web assets directory such as `dist` or `www`
- an `index.html` at the root of the built web assets directory

This app already matches that shape:

- `client/package.json`
- Vite build output in `client/dist`
- `client/dist/index.html` after `npm run build`

Capacitor official docs:

```text
https://capacitorjs.com/docs/getting-started
https://capacitorjs.com/docs/getting-started/environment-setup
```

## What Not To Do First

Do not start by rewriting the whole game as a native mobile app.

Avoid these as first moves:

- React Native rewrite
- native Swift/Kotlin rewrite
- Unity rewrite
- separate mobile-only gameplay engine
- duplicating all UI screens into a second app

Those paths may make sense much later if the game needs heavy native features,
but they are too expensive before proving the mobile controls, screen layout,
performance, login, save flow, audio behavior, and store packaging.

## Phase 1: Mobile Web Hardening

Before adding native wrappers, make the web app feel good on mobile screens.

Work items:

- Audit every screen at common phone widths: 360px, 375px, 390px, 414px, 430px.
- Audit landscape and portrait behavior.
- Make the game canvas resize cleanly.
- Ensure text does not overlap or overflow.
- Ensure shop, closet, leaderboard, map select, settings, and game over screens
  are usable with touch.
- Increase tap targets to mobile-friendly sizes.
- Avoid hover-only interactions.
- Make modals, banners, and menus fit under mobile safe areas.
- Test audio start behavior after a user gesture.
- Test typing/solver inputs with mobile keyboards.
- Decide whether the main game is portrait-only, landscape-only, or both.

For this game, the hard part is not packaging. The hard part is making the
gameplay and UI feel intentional on a phone.

## Phase 2: PWA Foundation

Add PWA basics before native wrappers.

Work items:

- Add a web app manifest.
- Add mobile app icons.
- Add theme color and background color.
- Add a proper viewport meta setup.
- Add a service worker only when caching behavior is understood.
- Decide what should work offline and what must require the server.
- Add installability checks.

Recommended files:

```text
client/public/manifest.webmanifest
client/public/icons/
client/index.html
```

Possible package:

```text
vite-plugin-pwa
```

Do not over-cache API responses, player records, shop state, or auth state. The
game has accounts and server-backed progression, so stale data can create bugs.

## Phase 3: Add Capacitor

Run Capacitor from the `client` directory because that is the actual Vite app.

Expected setup:

```powershell
cd client
npm install @capacitor/core
npm install -D @capacitor/cli
npx cap init
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
npm run build
npx cap sync
```

Recommended Capacitor config shape:

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.deadkeys.game',
  appName: 'Dead Keys',
  webDir: 'dist',
};

export default config;
```

Pick the final `appId` carefully. On Android, package names are unique and
permanent in Play Console once published.

## Platform Tooling Requirements

Android:

- Android Studio
- Android SDK
- Android emulator or real Android test device
- Google Play developer account when ready to publish

iOS:

- macOS
- Xcode
- Xcode Command Line Tools
- real iPhone/iPad testing if possible
- Apple Developer Program account when ready to ship

Capacitor's current environment setup docs say Capacitor supports Android, iOS,
and Web targets, and lists platform tooling for Android Studio/SDK and
Xcode/Command Line Tools:

```text
https://capacitorjs.com/docs/getting-started/environment-setup
```

## Suggested Repo Layout

Because the Vite app is inside `client`, keep native app projects under
`client`:

```text
client/
  android/
  ios/
  capacitor.config.ts
  package.json
  src/
  dist/
server/
```

Do not put native projects at the repo root unless the frontend is moved there.
Keeping Capacitor inside `client` makes `webDir: 'dist'` simple and keeps native
sync tied to the frontend build.

## Scripts To Add Later

Add scripts after Capacitor is installed:

```json
{
  "scripts": {
    "mobile:sync": "npm run build && cap sync",
    "android": "npm run build && cap open android",
    "ios": "npm run build && cap open ios"
  }
}
```

Windows can build and open Android Studio. iOS still requires macOS/Xcode or a
cloud build setup.

## Mobile Gameplay Concerns

This game has Typing Defense and solver modes. The mobile product decision is:

- Mobile and iPad-class touch devices should not show or offer Typing Defense.
- Mobile and iPad-class touch devices should answer solver modes by speech.
- Keyboard/pointer desktop experiences should keep the current desktop/web
  experience with no behavior changes, even if the browser window is small.

This means the first mobile implementation should be a gated mobile experience,
not a global gameplay rewrite.

Recommended gate:

```ts
const isNativeMobileShell = Capacitor.isNativePlatform();
const isTouchFirst = window.matchMedia('(pointer: coarse)').matches;
const hasDesktopPointer = window.matchMedia('(pointer: fine)').matches;
const isTabletOrSmallerViewport = Math.max(window.innerWidth, window.innerHeight) <= 1366;

const mobileSpeechExperience =
  isNativeMobileShell || (isTouchFirst && !hasDesktopPointer && isTabletOrSmallerViewport);
```

Use one shared helper for this instead of scattering viewport checks throughout
the app. Do not base the product behavior on screen size alone. Screen size is a
guardrail, not the main signal.

The intent should stay clear:

```text
native Android/iOS shell: mobile solver speech experience
touch-first phone/tablet web: mobile solver speech experience
keyboard/mouse/trackpad desktop web: existing desktop experience unchanged
```

Avoid using only user-agent sniffing. Prefer platform/native-shell signals,
pointer capability, and viewport as a final guardrail. This avoids breaking small
laptop windows, browser split-screen, foldables, tablets with keyboards, browser
zoom, and external displays.

Typing Defense:

- Do not include Typing Defense in the mobile/iPad-class experience.
- Hide or disable the Typing Defense mode option when `mobileSpeechExperience`
  is true.
- If a mobile/iPad-class user deep-links or resumes into Typing Defense, route
  them back to mode/map selection with a short mobile-only message.
- Do not remove Typing Defense from desktop or large screens.
- Do not change desktop keyboard input behavior.

Solver Modes:

- Solver modes stay available on mobile/iPad-class devices.
- The answer input should be speech-first on mobile.
- Speech recognition should produce text and feed the existing solver answer
  validation path.
- The solver scoring, answer correctness rules, zombie kill logic, streak logic,
  WPM logic, coins, and leaderboard behavior should not change.
- Keep the current typed input path for desktop keyboard/pointer experiences.
- Consider a manual fallback only if required for accessibility or speech
  permission denial, but do not make mobile gameplay depend on the keyboard.

Speech Input Architecture:

- Create a small speech adapter instead of wiring browser/native speech APIs
  directly into the game screen.
- The game should only receive normalized transcript text and status events.
- The adapter should expose states like `idle`, `listening`, `processing`,
  `matched`, `no-match`, `permission-denied`, and `unsupported`.
- Keep solver answer matching centralized in the existing game logic.
- Do not duplicate answer validation inside the speech layer.

Recommended interface shape:

```ts
type SpeechAnswerState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'matched'
  | 'no-match'
  | 'permission-denied'
  | 'unsupported';

interface SpeechAnswerAdapter {
  supported: boolean;
  state: SpeechAnswerState;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  reset: () => void;
}
```

Recommended event flow:

```text
User taps mic
-> request microphone/speech permission if needed
-> listen for one answer phrase
-> receive transcript
-> normalize transcript
-> submit transcript through existing solver answer path
-> show matched/no-match state
-> return to idle/listening depending on game mode
```

Transcript normalization should be conservative:

- lowercase
- trim whitespace
- remove simple punctuation
- normalize common spoken math words if solver answers use numbers
- do not make answers easier than typed desktop answers

Example normalization:

```ts
function normalizeSpeechAnswer(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[.,!?]/g, '')
    .replace(/\s+/g, ' ');
}
```

Speech Recognition Platform Strategy:

- Do not rely on Web Speech API as the final app-store speech solution.
- Browser support for speech recognition is inconsistent, especially across
  mobile browsers and webviews.
- For native Android/iOS builds, use Capacitor plus a speech-recognition plugin
  or a small native bridge to Android/iOS speech APIs.
- Keep the speech layer behind an adapter so the implementation can switch
  between web prototype, Capacitor plugin, Android native, and iOS native without
  rewriting game logic.

Useful official references:

```text
https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
https://developer.android.com/reference/kotlin/android/speech/SpeechRecognizer
https://developer.apple.com/documentation/speech/asking-permission-to-use-speech-recognition
https://developer.apple.com/documentation/speech/sfspeechrecognizer
```

Important Android note:

- Android's `SpeechRecognizer` requires `RECORD_AUDIO`.
- Android docs warn that speech recognition may stream audio to remote servers
  and is not meant for continuous always-on recognition because of battery and
  bandwidth cost.

Important iOS note:

- iOS speech recognition requires explicit speech recognition authorization.
- It also requires microphone permission.
- App Store privacy disclosures must match how speech/audio is used.

Canvas Gameplay:

- Test frame rate on low/mid Android devices.
- Check canvas scaling for device pixel ratio.
- Keep effects controlled so mobile GPUs do not struggle.
- Avoid huge animated background layers.
- Make sure mobile speech UI overlays do not cover enemies, answer prompts, or
  the survivor's firing line.

Audio:

- Mobile browsers and native webviews often require a user gesture before audio
  starts.
- Test gunshots, music, mute state, and resume behavior on real devices.

## Native Features To Defer

Do not start with native plugins unless the app truly needs them.

Defer:

- push notifications
- in-app purchases
- ads
- native share sheets
- haptics
- deep links
- app tracking permission prompts

Add these after the base app installs, runs, saves progress, logs in, and plays
well on real devices.

Do not defer speech recognition for the mobile solver build. Speech recognition
is part of the proposed mobile gameplay, so it should be planned as a core
mobile feature after the mobile layout gate is in place.

## Store Publishing Notes

Android:

- Google Play uses Android App Bundles for publishing.
- New apps on Google Play are required to publish with Android App Bundles.
- Play Console app setup includes app/game type, free/paid status, contact
  email, declarations, store listing, testing, and release setup.

Official Google docs:

```text
https://developer.android.com/guide/app-bundle
https://support.google.com/googleplay/android-developer/answer/9859152
```

iOS:

- Use Xcode archives for TestFlight and App Store distribution.
- TestFlight should be used before App Store release.
- Store submission needs app metadata, screenshots, privacy answers, build
  upload, review, and release management.

Official Apple docs:

```text
https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases
https://developer.apple.com/app-store/submitting/
```

## App Store Review Risks To Plan For

Plan these early:

- Privacy policy URL.
- Account deletion flow if accounts are supported.
- Clear support contact.
- Accurate age rating.
- Accurate data collection disclosures.
- No misleading "earn money" or gambling-like claims.
- If monetization is added later, understand Apple/Google payment rules before
  implementing it.

## Best First Milestone

The first serious milestone should not be "submitted to the App Store."

Better first milestone:

```text
The current web app runs as a mobile-friendly PWA and as a Capacitor Android
debug build on a real Android device. Mobile/iPad-class users do not see Typing
Defense, solver modes can accept speech answers through a gated speech adapter,
desktop/larger-than-iPad screens behave exactly as before, login/save works, no
layout overlap exists, audio starts correctly after user input, and there are no
critical console errors.
```

After that:

1. Add iOS wrapper on a Mac.
2. Test on a real iPhone.
3. Create real app icons/splash screens.
4. Build internal Android test release.
5. Build TestFlight release.
6. Fix platform-specific issues.
7. Prepare store listings.

## Next Store-Ready Work

After the mobile web experience is stable, the next work should move in this
order. This keeps cost down and avoids building native store assets before the
core mobile game is proven.

1. Lock the mobile product scope.
   - Mobile/native builds should launch directly into the solver-speech product:
     Riddle, Math, and Trivia Defense only.
   - Typing Defense remains desktop/web only.
   - Keep score, coins, upgrades, cosmetics, maps, and leaderboard behavior
     shared with the existing app.

2. Replace the web speech prototype with a store-safe speech adapter.
   - Keep the current game-facing adapter contract.
   - Add a Capacitor/native implementation behind that adapter.
   - Android should use `RECORD_AUDIO` and the platform speech recognizer or a
     well-maintained Capacitor plugin.
   - iOS should request both microphone permission and speech recognition
     authorization.
   - Add clear permission fallback UI for denied or unavailable speech.

3. Add Capacitor only after mobile web validation passes.
   - Add `capacitor.config.ts` in `client`.
   - Use `webDir: 'dist'`.
   - Choose the final app id/package name before publishing.
   - Add Android first from Windows, then add iOS from macOS/Xcode.

4. Create production mobile assets.
   - App icon in all required sizes.
   - Splash screen assets.
   - Store screenshots for common phone sizes.
   - Short store description, full description, keywords, category, and support
     URL.
   - A real privacy policy URL.

5. Prepare compliance and account flows.
   - Account deletion must be available if accounts are supported.
   - Privacy disclosures must cover account data, gameplay records, purchases,
     speech/microphone use, ads, analytics, and crash reporting.
   - Age rating should match the zombie theme, cosmetic shop, ads, and any
     future monetization.
   - If real-money purchases are added, confirm Apple/Google payment rules
     before implementation.

6. Build native release infrastructure.
   - Use separate dev/staging/prod environment config.
   - Keep signing keys and Apple credentials out of Git.
   - Add repeatable build scripts for `cap sync`, Android bundle generation, and
     iOS archive creation.
   - Add crash reporting and basic client version reporting before public tests.

7. Test on real devices before store upload.
   - Low/mid Android phone.
   - Modern Android phone.
   - iPhone with current iOS.
   - Older supported iPhone if possible.
   - iPad only if iPad support is intentional.
   - Test login, guest progress, speech permission, denied permission, audio
     start/resume, map rendering, game over, shop, closet, leaderboard, and
     network loss.

8. Use staged releases.
   - Android internal testing first.
   - Android closed/open testing if needed.
   - iOS TestFlight before App Store review.
   - Fix platform-specific issues before production release.

Do not submit to stores until native speech, privacy disclosures, account
deletion, release signing, real-device testing, and store listing assets are all
complete.

## Recommended Initial Task Prompt

Use this when asking a coding agent to start mobile work:

```text
Start the mobile implementation without rewriting the app.

This is a React + Vite browser game in client/. Use a web-first mobile approach:
1. Audit and fix mobile layout issues in the existing web app.
2. Add PWA foundation files.
3. Prepare for Capacitor, but do not add native Android/iOS projects until the
   mobile web experience builds cleanly and is usable.

Product rules:
- Mobile and iPad-class touch devices should not offer Typing Defense.
- Mobile and iPad-class touch devices should answer solver modes with speech.
- Keyboard/mouse/trackpad desktop experiences must keep the current behavior
  unchanged, even if the browser window is small.
- Do not use screen size alone to decide gameplay mode. Use native shell status,
  pointer capability, and viewport as a guardrail.
- Gate mobile behavior behind one shared helper, such as mobileSpeechExperience.
- Do not scatter viewport checks through unrelated components.

Do not change gameplay balance, scoring, coins, leaderboard behavior, auth data,
or server APIs unless needed for mobile compatibility.

Check:
- 360x740 portrait
- 390x844 portrait
- 430x932 portrait
- 768x1024 iPad portrait
- 1024x768 iPad landscape
- 1024x1366 iPad Pro portrait
- 844x390 landscape
- desktop still works
- desktop keyboard/mouse/trackpad experiences still use Typing Defense and typed
  solver input as they do today, including small browser windows

Run:
- npm test
- npm run build

Document remaining mobile blockers before adding Capacitor.
```

## When To Choose A Native Rewrite Instead

Only consider React Native, Swift/Kotlin, Unity, or another native game stack if:

- canvas performance is unacceptable after optimization
- mobile keyboard gameplay cannot be made fun
- the app needs heavy native features
- store policies reject the webview approach for the final product
- the game design changes into something much more native/3D/physics-heavy

Until then, Capacitor is the lower-risk path because it preserves the existing
React/Vite game and lets the team learn mobile constraints before committing to a
rewrite.
