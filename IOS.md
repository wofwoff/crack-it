# iOS Build Notes

CrackIt is wrapped with Capacitor for iOS.

## App Metadata

- App name: `CrackIt`
- Bundle identifier: `com.wafi.placementprep`
- Web bundle: `dist`
- Native project: `ios/App/App.xcodeproj`
- Generated native web assets: `ios/App/App/public`
- App icon and launch assets: `ios/App/App/Assets.xcassets`

## Commands

```bash
npm run ios:assets
npm run ios:prepare
npm run ios:sync
npm run ios:open
```

Use `npm run ios:prepare` after ordinary UI changes. It builds the Vite app, regenerates iOS assets, and copies the web bundle into the native project.

Use `npm run ios:sync` after adding Capacitor plugins or changing native-facing Capacitor config.

## Local Machine Prerequisite

This machine currently has Command Line Tools selected:

```text
/Library/Developer/CommandLineTools
```

To build/run on an iPhone, install full Xcode at `/Applications/Xcode.app`, then run:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
xcodebuild -version
npm run ios:open
```

After opening Xcode, choose a signing team, connect the iPhone, trust the device, and run the app once from Xcode. iPhone Developer Mode may only appear after that first Xcode/device flow.
