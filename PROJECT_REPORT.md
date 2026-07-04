# CrackIt Project Report

Generated from the current repository at `/Users/ahmedwafi/Documents/projects/learning app`.

## Executive Summary

CrackIt is a placement-prep learning app for computer science interview practice. It is built as a React/Vite single-page app with local progress persistence, optional cloud progress sync, optional Vertex AI tutoring/generation, Capacitor iOS packaging, and a custom native macOS wrapper.

The core product is not a generic quiz app. It is a daily retrieval-practice system for CS fundamentals, DSA reasoning, logical aptitude, interactive concept drills, cheat sheets, answer explanations, and application-level interview questions.

The repository currently contains 84 tracked files. The main source code lives in:

- `src/App.jsx`: primary application logic, state, navigation, scheduling, views, and learning flows.
- `src/content.js`: MCQs, DSA prompts, and interactive challenges.
- `src/cheatsheets.js`: subject and concept reference material.
- `src/llm.js`: frontend AI helper layer.
- `src/sync.js`: frontend cloud progress sync layer.
- `backend/server.js`: Express backend for progress snapshots and Vertex AI proxying.
- `src/styles.css`: all visual styling, responsive behavior, motion, and mobile-safe layout rules.

The current app has outgrown older documentation. `CLAUDE.md` still says there is no backend and all state lives only in `localStorage`, but the actual code now includes a backend, SQLite progress snapshots, optional GCS persistence, and AI proxy endpoints.

## Product Purpose

CrackIt helps a CS student prepare for product-company interviews through short daily practice loops.

The intended learner workflow is:

1. Choose subjects and daily MCQ pace.
2. Complete a daily MCQ set drawn from selected subjects.
3. Get immediate correctness feedback.
4. Review targeted explanations, misconception fixes, memory hooks, and full lessons.
5. Practice DSA through self-graded explanation prompts.
6. Use cheat sheets and extra practice outside the daily count.
7. Generate situational interview questions with AI when AI is configured.
8. Track mastery, activity, streaks, coverage, and sync progress across devices.

The product is tuned for interview readiness rather than broad academic coverage. Question stems and explanations repeatedly frame concepts as debugging clues, tradeoffs, production behavior, system design reasoning, or coding interview logic.

## Content Inventory

The current content bank contains:

- 96 MCQs.
- 13 DSA self-graded prompts.
- 9 interactive challenges.
- Cheat-sheet coverage for DBMS, OS, CN, OOP, CPP, PYTHON, Logical Aptitude, and DSA.

MCQ distribution:

| Subject | Questions | Concepts |
| --- | ---: | ---: |
| DBMS | 16 | 12 |
| OS | 13 | 12 |
| CN | 13 | 13 |
| OOP | 12 | 12 |
| CPP | 12 | 12 |
| PYTHON | 12 | 12 |
| OA / Logical Aptitude | 18 | 18 |

Difficulty distribution:

| Difficulty | Count |
| --- | ---: |
| Easy | 20 |
| Medium | 48 |
| Hard | 28 |

`src/content.js` stores MCQs with:

- `id`
- `subject`
- `concept`
- `difficulty`
- `stem`
- `options`
- `correctIndex`
- `proTip`
- `lesson`

Each MCQ option includes `text`, `sub`, and `fix`. Correct options typically have an empty `fix`; wrong options explain the misconception. This supports the answer feedback UI directly.

DSA prompts include:

- `id`
- `concept`
- `difficulty`
- `prompt`
- `hints`
- `modelAnswer`
- `rubric`

Interactive challenges support ordering, categorization, and cloze-style exercises.

## User-Facing Learning Surfaces

### First-Run Setup

`CourseSetupView` lets the learner choose course areas and a daily goal. Course options include:

- DBMS
- OS
- CN
- OOP
- CPP
- PYTHON
- Logical Aptitude
- DSA Logic

The default configuration selects all courses and uses a daily MCQ goal of 7.

### Today Dashboard

`TodayView` is the main home surface after setup. It shows:

- Daily MCQ set progress.
- Streak and activity signals.
- Current course mix.
- DSA drill entry point.
- Logical Aptitude entry point when enabled.
- Application interview lab entry point.
- Extra practice and progress navigation.

Daily counts intentionally apply only to the configured MCQ daily set. DSA, Logical Aptitude extra practice, generated interview questions, and extra subject practice do not inflate the daily numerator or denominator.

### MCQ Question Player

`QuestionView` handles daily questions, extra practice questions, and generated interview questions. It supports:

- A progress segment row.
- Subject/concept/difficulty pills.
- Confidence selection.
- Four-option MCQ answering.
- Wrong/correct visual feedback.
- Blank or "I don't know" attempts.
- Explanation reveal.
- Full lesson navigation.
- Optional AI explanation and follow-up.

The UI uses a card/flip/reveal metaphor with clearly perceptible answer-to-explanation transitions.

### DSA Logic Practice

`DsaView` is a self-graded DSA reasoning surface. It asks the learner to write the algorithmic approach, reveal a model answer, compare against a rubric, and rate the attempt.

It also includes optional voice dictation through the browser-native `SpeechRecognition` or `webkitSpeechRecognition` API. The implementation includes lifecycle cleanup so dictation stops when the page is hidden, unloaded, frozen, or exited.

### Cheat Sheets

`CheatsheetView` uses `src/cheatsheets.js` to present subject-level reference material. It supports:

- Reader mode.
- Board/grid mode on desktop.
- Mobile accordion behavior.
- Topic-level practice entry points.
- DSA prompt launching by concept.

### Extra Practice

`PracticeSetupView` lists subject cards with coverage and mastery. It can start extra MCQ practice for a subject, launch DSA practice, or open a cheat sheet.

Extra practice attempts are stored separately from daily attempts by using the `source` field.

### Interactive Challenges

`InteractiveListView` and `InteractivePlayView` render the 9 challenge-style questions from `INTERACTIVE_QUESTIONS`. Supported modes include:

- Ordering.
- Categorization.
- Cloze blanks.

Attempts are stored under `interactiveAttempts`.

### Progress and Settings

`ProgressView` combines analytics and settings. It shows:

- Accuracy.
- Streak.
- DSA reps.
- Subject coverage.
- DSA concept status.
- Activity levels.
- Progress sync status and sync ID loading/copying.
- Daily goal controls.
- Course toggles.
- Daily set regeneration.

There is no separate route library. Navigation is a single `view` state string inside `App`.

## Frontend Architecture

The frontend is intentionally flat. `src/App.jsx` owns most behavior:

- State initialization and migration.
- Daily set scheduling.
- Spaced-repetition memory updates.
- Local storage persistence.
- Cloud sync orchestration.
- View navigation.
- MCQ attempt recording.
- DSA attempt recording.
- Interview question generation state.
- Practice and cheat-sheet flows.
- UI components.

This keeps the prototype easy to move quickly, but it also means `src/App.jsx` is now a large integration hub at over 4,000 lines.

`src/main.jsx` only mounts the React app:

- imports React.
- imports `createRoot`.
- imports `App`.
- imports `styles.css`.

`src/styles.css` is the single styling layer. There are no CSS modules, Tailwind config, or component-scoped styles.

## State Model

Primary browser state is stored in `localStorage` under:

```text
placement-prep-v2
```

The active schema version is:

```text
STATE_SCHEMA_VERSION = 5
```

State includes:

- `settings`
- `attempts`
- `dsaAttempts`
- `interactiveAttempts`
- `conceptState`
- `streak`
- `dailySet`
- `hasCompletedCourseSetup`
- `contentBankSignature`
- `stateSchemaVersion`

`CONTENT_BANK_SIGNATURE` is built from question counts, prompt counts, interactive counts, and IDs. It is used to detect content changes and avoid trusting stale daily sets after the bank changes.

`normalizeSavedState` handles loading old or incomplete saved state. If schema or content signatures do not match, it creates or reconciles fresh state while preserving compatible user progress where possible.

## Scheduling and Mastery Logic

Daily MCQ selection is handled by `composeDailySet`.

The scheduler:

- Uses selected courses.
- Excludes Logical Aptitude from the ordinary daily MCQ queue.
- Groups questions by subject.
- Sorts by due concepts, low mastery, and fewer reps.
- Alternates across subject queues until the daily goal is reached.

Concept scheduling is per concept, not per individual question. Concept keys are:

```text
<SUBJECT>:<concept>
DSA:<concept>
```

The spaced-repetition model stores:

- `ease`
- `interval`
- `dueAt`
- `reps`
- `lapses`
- `mastery`
- `lastOutcome`

`updateMemoryState` adjusts the concept state after correct, wrong, blank, or self-rated DSA outcomes. Correct answers increase mastery, ease, interval, and reps. Wrong/blank outcomes lower mastery, increase lapses, and shorten the interval.

## AI Implementation

AI is optional and enabled only when:

```text
VITE_VERTEX_PROXY_URL
VITE_VERTEX_PROXY_SECRET
VITE_ENABLE_AI_TOOLS=true
```

The frontend does not call Vertex AI directly. It calls the backend through `src/llm.js`.

Frontend AI helpers:

- `generateApplicationInterviewQuestions`
- `explainWrongMcqAnswer`
- `gradeDsaAnswer`
- `explainDsaMistake`
- `followUpQuestion`

AI-generated interview questions are constrained by prompt to be:

- Situational.
- Application-level.
- Scoped to selected subjects and concepts.
- Not trivia, definition recall, or textbook-only questions.

Generated question JSON is normalized into the same MCQ shape as static questions, so the existing `QuestionView` can render generated interview questions.

The current backend model defaults are:

```text
VERTEX_MODEL = gemini-2.5-flash
VERTEX_QUESTION_GENERATOR_MODEL = gemini-2.5-pro
GCP_LOCATION = us-central1
```

## Backend Architecture

The backend is an Express service in `backend/server.js`.

It provides:

- `GET /health`
- `GET /progress/:syncId`
- `PUT /progress/:syncId`
- `POST /generate`
- `POST /generate-question-set`

The service uses:

- Express 4.
- Node's built-in `node:sqlite` `DatabaseSync`.
- `@google-cloud/vertexai`.
- Optional `@google-cloud/storage`.

Progress snapshots are stored in SQLite:

```sql
CREATE TABLE progress_snapshots (
  sync_id TEXT PRIMARY KEY,
  state_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

The repo includes a small SQLite file at:

```text
backend/data/cracked-progress.sqlite
```

It is 12 KB and currently contains the progress snapshot schema.

### Backend Auth and CORS

The backend uses a shared secret header:

```text
x-app-secret
```

AI endpoints require the shared secret. Progress endpoints currently bypass backend secret enforcement in the global auth middleware, but `src/sync.js` still sends `x-app-secret` when configured. If this becomes more than a personal prototype, progress endpoints should enforce auth or move to a per-user auth model.

CORS is permissive:

```text
Access-Control-Allow-Origin: *
```

This is convenient for prototype deployment and multi-device testing. It is not a production-grade access policy.

### Optional GCS Persistence

If `GCS_BUCKET_NAME` is set, the backend:

1. Downloads `cracked-progress.sqlite` from the bucket at startup if it exists.
2. Writes progress locally.
3. Uploads the SQLite file back to GCS after progress updates.

This is a pragmatic single-user persistence path. It is not a high-concurrency database design.

## Progress Sync

Frontend sync is implemented in `src/sync.js`.

Important keys:

```text
cracked-progress-sync-id
cracked-progress-local-updated-at
```

The app creates sync IDs in this form:

```text
CRK-XXXX-XXXX
```

Startup sync compares local and remote timestamps:

- If remote is newer, load remote.
- If local is newer, push local.
- If no remote exists and local exists, seed remote.

After initial sync, local changes are pushed after a short debounce. Backgrounding the page also tries to save progress.

The conflict model is last-write-wins.

## Deployment Implementation

### Frontend Container

The root `Dockerfile` builds the Vite app with Node 20 Alpine, then serves `dist` through Nginx on port 8080.

Build-time Vite variables are passed through Docker build args:

- `VITE_PROGRESS_SYNC_URL`
- `VITE_VERTEX_PROXY_URL`
- `VITE_VERTEX_PROXY_SECRET`
- `VITE_ENABLE_AI_TOOLS`

`cloudbuild.yaml` builds and tags:

```text
us-central1-docker.pkg.dev/$PROJECT_ID/cracked/cracked-frontend
```

### Backend Container

`backend/Dockerfile` uses `node:24-slim` because `backend/server.js` depends on Node's built-in SQLite module.

The backend image runs:

```text
node server.js
```

## Native iOS Implementation

iOS is handled through Capacitor.

Key files:

- `capacitor.config.json`
- `ios/App/App.xcodeproj/project.pbxproj`
- `ios/App/App/Info.plist`
- `ios/App/App/AppDelegate.swift`
- `ios/App/CapApp-SPM/Package.swift`

App metadata:

- App name: `CrackIt`
- App ID: `com.wafi.placementprep`
- Web directory: `dist`
- iOS platform package: Capacitor Swift PM 8.4.1

Native permissions include:

- `NSMicrophoneUsageDescription`
- `NSSpeechRecognitionUsageDescription`

These support DSA voice dictation.

The expected web-to-iOS refresh commands are:

```bash
npm run ios:prepare
npm run ios:sync
```

`ios:prepare` builds the web app, regenerates iOS assets, and copies the web bundle into the iOS project.

## Native macOS Implementation

The macOS wrapper is custom Swift/AppKit code in:

```text
macos/CrackIt/CrackIt.swift
```

`scripts/build-mac-app.mjs` packages it by:

1. Verifying `dist/index.html` exists.
2. Creating `build/mac/CrackIt.app`.
3. Copying `dist` into the app bundle resources.
4. Creating an `.icns` from the generated iOS app icon.
5. Compiling the Swift wrapper with `swiftc`.
6. Applying ad-hoc codesigning.

The native Swift wrapper creates a `WKWebView` and serves the bundled web app through a local static HTTP server.

Important detail: the local server uses a stable port:

```text
127.0.0.1:41730
```

That stable origin is important because WKWebView persistence depends on origin. Random local ports would make each launch look like a different app to `localStorage`.

## Design and UX System

The visual system is warm, paper-like, and study-focused.

Core design traits:

- Background: warm off-white/paper.
- Accent: amber/orange flame color.
- Text: dark ink-like foreground.
- Fonts: Lora for display/serif moments and Outfit for UI.
- Fixed top bar with persistent back button.
- Mobile bottom tab bar.
- Smooth state transitions and answer reveal animations.
- Safe-area handling for iOS/mobile.
- 16px or larger input text to avoid iOS viewport zoom.

`AGENTS.md` records durable product/design decisions. Current decisions include:

- Use Option D, "Flame Mark", as app icon direction.
- Keep top bar fixed and include a persistent back button.
- Use perceptible transitions for app state changes.
- Stop DSA dictation immediately on background/close/hide/unload.
- Hide unfinished or placeholder learning affordances.
- Keep generated interview questions situational and scoped.
- Keep daily counts scoped to configured MCQs only.
- Present OA as Logical Aptitude or Aptitude Reasoning in user-facing copy.

`scripts/generate-ios-assets.mjs` currently generates Flame Mark icon and splash assets, matching the durable Option D direction.

## Dependencies

Frontend runtime dependencies:

- React 19.2.0
- React DOM 19.2.0
- Vite 6.4.2
- `@vitejs/plugin-react` 5.0.4
- Capacitor 8.4.1
- `lucide-react` 1.21.0

Frontend dev dependency:

- `sharp` 0.34.5

Backend dependencies:

- Express 4.21.2
- `@google-cloud/vertexai` 1.9.3
- `@google-cloud/storage` 7.14.0

iOS Swift package:

- `capacitor-swift-pm` 8.4.1

## Commands

Root app commands:

```bash
npm run dev
npm run build
npm run preview
npm run ios:assets
npm run ios:prepare
npm run ios:sync
npm run ios:open
npm run mac:build
npm run mac:open
```

Backend command:

```bash
cd backend
npm start
```

There is no configured test suite, lint command, formatter command, or type-check command.

## Repository Artifacts

The repo tracks several non-source artifacts:

- iOS app icon PNG.
- iOS splash PNGs.
- Screenshot-based audit artifacts under `product-audit-*`.
- SQLite progress database under `backend/data`.
- Bundled logo exploration HTML.
- Package lockfiles.

These are useful for a prototype because they preserve current visual evidence and runnable native assets. They also make the repo heavier and blur the line between source and generated output.

## Current Risks and Gaps

### 1. Stale Documentation

`CLAUDE.md` says the app has no backend and that all state is local-only. Current code disproves that. It should be updated to describe:

- `backend/server.js`
- progress sync
- Vertex proxying
- SQLite/GCS storage
- Cloud Run split between frontend and backend

It also mentions Option C for app icon direction, while `AGENTS.md` and the asset generator use Option D.

### 2. Secret Exposure Model

Vite bakes `VITE_VERTEX_PROXY_SECRET` and `VITE_PROGRESS_SYNC_SECRET` into the frontend bundle. That is acceptable only as a personal prototype gate, not as real security. Any user with the frontend bundle can inspect the secret.

For production, use real auth, per-user identity, or a server-owned session model.

### 3. Progress Endpoint Auth

The backend auth middleware explicitly skips `/progress/*`. That makes sync IDs the primary access boundary for progress data. Sync IDs are random-ish but not a full auth system.

For personal use, this may be enough. For multi-user deployment, protect progress endpoints.

### 4. Large Monolithic App Component

`src/App.jsx` is doing too much. The current structure is fast for a prototype, but ongoing feature work will get harder.

Good extraction candidates:

- scheduling/state model
- sync orchestration
- MCQ player
- DSA view
- progress/settings
- interactive challenge engine

### 5. No Tests

There is no automated coverage for:

- scheduling behavior
- state migrations
- sync conflict behavior
- AI response normalization
- DSA dictation cleanup
- content shape validation

Given the amount of persisted user state, migrations and scheduler behavior deserve tests first.

### 6. Prototype Backend Storage

SQLite plus optional whole-file GCS upload is simple and works for personal use. It is not ideal for concurrent writes or many users.

A hosted database would be cleaner if this becomes a shared app.

### 7. Generated Artifact Noise

`Logo Exploration.html` is very large and bundled. It is useful as design evidence, but it is not friendly to grep/search and can flood command output.

## Suggested Next Technical Steps

1. Update `CLAUDE.md` so future agents do not make wrong assumptions about backend and icon direction.
2. Add a lightweight content validator script for `QUESTIONS`, `DSA_PROMPTS`, `INTERACTIVE_QUESTIONS`, and `CHEATSHEETS`.
3. Add scheduler/state tests around `composeDailySet`, `updateMemoryState`, and migration behavior.
4. Split `src/App.jsx` into focused modules once the next substantial feature begins.
5. Harden progress sync if the app is exposed beyond personal use.
6. Move secret-like frontend gates away from public Vite env vars if AI endpoints become shared.
7. Decide whether tracked screenshots and generated logo bundles should stay in the main repo or move to a design/audit archive.

## Bottom Line

CrackIt is a working, single-user-first interview-prep product with a polished React frontend, a real content bank, offline local state, optional cloud sync, optional Vertex AI help, and native iOS/macOS packaging paths.

The project's strongest implementation choices are:

- Content and UI shape are tightly connected.
- Daily progress semantics are carefully scoped.
- DSA dictation has lifecycle cleanup.
- Native macOS uses a stable origin to preserve local progress.
- AI generation reuses the existing MCQ renderer instead of creating a separate answer model.

The main engineering debt is not missing functionality. It is consolidation: stale docs, monolithic frontend code, limited auth, and no tests around the stateful parts that now matter most.
