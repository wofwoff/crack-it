# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

CrackIt — a single-page React app for spaced-repetition practice of CS fundamentals (DBMS, OS, CN, OOP) and DSA logic drills, wrapped with Capacitor for iOS. There is no backend; all state lives in `localStorage` on the device.

## Commands

```bash
npm run dev          # vite dev server on 127.0.0.1
npm run build         # production build to dist/
npm run preview       # preview the production build
npm run ios:assets    # regenerate iOS app icon/splash from scripts/generate-ios-assets.mjs
npm run ios:prepare   # build + ios:assets + cap copy ios (use after ordinary UI changes)
npm run ios:sync      # build + ios:assets + cap sync ios (use after adding/changing Capacitor plugins or native config)
npm run ios:open      # open the Xcode project
```

There is no test suite or linter configured in this repo.

Per [AGENTS.md](AGENTS.md): run the dev server yourself and open the preview in-app rather than telling the user how to start it.

## Architecture

The app is intentionally a flat, three-file prototype rather than a multi-route/multi-module app:

- [src/App.jsx](src/App.jsx) — everything: state shape, scheduling/spaced-repetition logic, and all screen components (`CourseSetupView`, `TodayView`, `QuestionView`, `DsaView`, `LessonView`, `SummaryView`, `ProgressView`, `SettingsView`). Navigation is a single `view` string in component state, not a router.
- [src/content.js](src/content.js) — the content bank: `QUESTIONS` (MCQs with `{ id, subject, concept, difficulty, stem, options[{text, sub, fix}], correctIndex, proTip, lesson }`) and `DSA_PROMPTS` (self-graded logic drills). The correct MCQ option has `fix: ""`; every distractor explains why it's wrong in `fix`.
- [src/styles.css](src/styles.css) — all styling, no CSS modules/Tailwind.

### State and persistence

- All app state (progress, streaks, concept mastery, settings) is persisted to `localStorage` under `STORAGE_KEY = "placement-prep-v2"`.
- `STATE_SCHEMA_VERSION` gates migrations — bump it and add migration logic in App.jsx when changing the persisted shape, so existing users' local state doesn't break.
- `CONTENT_BANK_SIGNATURE` (built from `QUESTIONS`/`DSA_PROMPTS` ids and lengths) is used to detect when the content bank changed since a user's last session, so the app can reconcile per-concept scheduling state without wiping progress.
- Spaced repetition lives per-concept (`questionConceptKey`/`dsaConceptKey` = `"<SUBJECT>:<concept>"`), tracking `ease`, `interval`, `dueAt`, `reps`, `lapses`, `mastery`.

### iOS packaging

- Capacitor config: [capacitor.config.json](capacitor.config.json) — `webDir: dist`, app id `com.wafi.placementprep`.
- Native project lives under `ios/App/`; web assets are copied into `ios/App/App/public` by the `ios:prepare`/`ios:sync` scripts (see [IOS.md](IOS.md) for full build/signing notes, including the local Xcode prerequisite).
- App icon source of truth: Option C, "Stacked Cards Mark", from `Logo Exploration.html` (see [AGENTS.md](AGENTS.md)).

## Design workflow notes (from AGENTS.md)

- Before substantial visual changes, use the Product Design plugin's `get-context` skill if the visual source is unclear or stale.
- When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.
- Durable, prototype-specific design decisions and feedback from the user should be recorded in [AGENTS.md](AGENTS.md), not lost in conversation.
