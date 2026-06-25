# Cracked App Audit - 2026-06-25

## Audit Scope

Product: Cracked, a local Vite/React placement-prep app.

Mode: combined UX, visual, accessibility, and light implementation audit.

Capture tool: Codex in-app browser, mobile viewport `390 x 844`.

Fresh evidence folder: `/Users/ahmedwafi/Documents/learning app/product-audit-2026-06-25`.

Verification also performed:

- `npm run build` passed.
- Browser console errors/warnings during the audited flow: none captured.
- Source inspection for navigation state, mobile layout, AI affordances, and dictation cleanup.

## Captured Steps

1. First-run course setup - healthy.
   Evidence: `01-first-run-setup-mobile.png`.
   The setup screen is clear, content-specific, and makes the subject mix understandable. The selected-state styling is strong. Risk: all subjects are selected by default, so the page is long on mobile before the user makes any meaningful choice.

2. Today dashboard - mostly healthy.
   Evidence: `02-today-dashboard-top-mobile.png`.
   The main learning loop is obvious, with Start Session, DSA, OA, streak, and plan sections. The visual tone is polished and consistent. Risk: the dashboard says `8 practice atoms ready`, while the reminder card says `7 questions planned`; this is explainable as MCQ daily goal plus DSA, but to a learner it reads like conflicting counts.

3. MCQ question - needs mobile spacing work.
   Evidence: `03-mcq-question-mobile.png`.
   The prompt, difficulty, confidence control, and answer options are strong. Risk: the fixed bottom tab bar covers the lower part of the card, so option D and the "I don't know" escape path can be partly hidden without scrolling.

4. MCQ answer feedback - healthy feedback, weak action placement.
   Evidence: `04-mcq-answer-feedback-mobile.png`, `04b-mcq-answer-action-obscured-mobile.png`.
   Correct and wrong answers are visually distinct, and the reveal is easy to understand after scrolling. Risk: the "See explanation" action sits near the bottom navigation zone and is not visible in the first answer viewport.

5. MCQ explanation and follow-up input - strong learning design.
   Evidence: `05-mcq-explanation-mobile.png`, `06-follow-up-input-mobile.png`.
   The explanation names the misconception, explains the correct concept, and gives a memory hook. Follow-up input expands cleanly and uses a 16px input size. Limit: I verified the UI affordance but did not send a live AI request.

6. Full lesson - good content, poor initial scroll behavior.
   Evidence: `07-full-lesson-mobile.png`, `07b-full-lesson-top-mobile.png`.
   The lesson is interview-useful: compact explanation, real example, and interview answer. Risk: the new screen opened at the previous scroll position instead of the top, landing mid-lesson.

7. DSA prompt and draft - strong concept scaffolding.
   Evidence: `08-dsa-prompt-mobile.png`, `08b-dsa-prompt-top-mobile.png`.
   The prompt gives useful hints before the draft box, and the 16px textarea avoids iOS zoom risk. Risk: this screen also inherited scroll position on navigation.

8. DSA model answer and self-rating - strong learning model, cramped controls.
   Evidence: `09-dsa-model-answer-mobile.png`, `09b-dsa-model-answer-rating-mobile.png`, `09c-dsa-rating-controls-mobile.png`.
   The model answer plus rubric checklist is one of the best parts of the app. Risk: self-rating buttons sit close to the bottom tab bar and require extra scrolling to use comfortably.

9. Progress dashboard - data-rich but too dense on mobile.
   Evidence: `10-progress-mobile.png`.
   The top metrics are useful, and coverage/mastery is meaningful. Risk: the full subject/concept map is very dense on mobile and needs progressive disclosure, filters, or collapsed subject sections.

10. Settings - healthy controls with minor clarity issues.
    Evidence: `11-settings-mobile.png`.
    Goal, subject selection, interview mode, nudge, rebuild, and export are exposed in one place. Risk: "Daily nudge" shows a time but no time-editing control, and "Rebuild set" is a destructive-ish action without a confirmation or explanation of what changes.

## Strengths

1. The app has a strong learning loop: setup, daily set, immediate answer feedback, targeted explanation, full lesson, DSA self-rating, and progress.

2. The content is interview-oriented rather than generic. MCQ explanations distinguish misconceptions, and full lessons include interview-answer phrasing.

3. The visual identity is cohesive: warm paper background, strong typographic hierarchy, consistent cards, and the Flame Mark direction is visible in the top bar.

4. The fixed top bar and persistent back button are implemented, matching the durable app direction.

5. The DSA dictation cleanup logic is present in code: `stopVoiceDraft` clears recognition state, and listeners stop dictation on `visibilitychange`, `pagehide`, `beforeunload`, and `freeze` (`src/App.jsx:1638-1687`).

6. iOS input zoom mitigation is present in CSS: mobile `input`, `textarea`, and `select` are forced to `16px`, and AI follow-up inputs also keep `16px` (`src/styles.css:2409-2413`, `src/styles.css:2744-2752`).

## UX Risks

1. Route changes keep the previous scroll position.
   Evidence: full lesson, DSA, and progress opened lower than expected.
   Implementation pointer: route rendering switches on `view` in `src/App.jsx:901-1045`, but there is no route-level scroll reset. This causes a learner to land mid-screen after navigating from a long card.
   Recommendation: add a `useEffect` on `view` and relevant substate (`currentIndex`, `lessonQuestionId`, `prompt?.id`) that scrolls the main document or active scroll container to top after view changes. Preserve scroll only for true back-to-previous-position behavior if intentionally designed.

2. The fixed mobile tab bar competes with core learning controls.
   Evidence: MCQ option/action states and DSA rating controls.
   Implementation pointer: `.mobile-tabbar` is fixed with high z-index (`src/styles.css:2467-2482`), while only `.question-screen` has explicit mobile bottom padding (`src/styles.css:2526-2528`). DSA, lesson, progress, and settings have dense inner content but no screen-specific safe action space.
   Recommendation: create a shared mobile content bottom inset token for all active screens, and give action-heavy panels their own bottom padding/margin so the last control clears the tab bar by at least 16-24px.

3. "Atoms" and "questions planned" use different counting models.
   Evidence: dashboard shows `8 practice atoms ready`, reminder says `7 questions planned`.
   Implementation pointer: `totalAtoms = total + DSA` at `src/App.jsx:1258-1261`; reminder uses `settings.dailyGoal` at `src/App.jsx:1380-1385`.
   Recommendation: rename the reminder copy to "7 MCQs planned" or make both cards use one shared count label, such as "7 MCQs + 1 DSA".

4. Progress is too dense for repeated mobile use.
   Evidence: `10-progress-mobile.png`, DOM contains every active subject and every concept.
   Implementation pointer: `ProgressView` renders all subject blocks and concept cells in one long page (`src/App.jsx:2117-2244`).
   Recommendation: collapse subjects by default, show top weak concepts first, and move the full concept grid behind subject drill-down.

5. AI retry can lose the original prompt after an error.
   Evidence: code inspection.
   Implementation pointer: `AiPanel` retry calls `trigger()` without the last prompt at `src/App.jsx:2484-2486`, while follow-up mode depends on the submitted question.
   Recommendation: store the last prompt in component state and retry with that value.

6. Settings has a few controls whose result is not fully explained.
   Evidence: `11-settings-mobile.png`.
   Recommendation: add short result copy for "Rebuild set" and either add time editing for Daily nudge or make it clear that the time is fixed for now.

## Accessibility Risks

1. Mobile bottom navigation can obscure focus targets and final controls.
   This affects motor accessibility and keyboard/switch navigation because lower controls can move under a fixed overlay. Needs manual keyboard/focus testing on device.

2. Some interactive controls rely heavily on color to show state.
   Course cards, answer correctness, toggle chips, and progress cells use color strongly. They also include some text/icons, which helps, but contrast and non-color state should be checked with an automated contrast pass.

3. Progress concept cells are mostly visual/read-only spans.
   They expose text, but the dense grid may not communicate hierarchy well to screen readers. Consider semantic grouped lists with headings and concise summaries.

4. The app has focus-visible styling and accessible names for the main icon buttons, which is good. Keyboard traversal was not fully verified in this run.

5. Microphone permission behavior was not exercised in the browser because permission prompts should be handled carefully. Code cleanup for hidden/unloaded states was verified by inspection, not by an actual device backgrounding test.

## Recommendations

1. High priority: fix scroll reset on view changes.

2. High priority: create a shared mobile safe-area/action inset so the tab bar never covers option buttons, explanation actions, lesson actions, or rating controls.

3. High priority: clarify daily counts as "MCQs" versus "practice atoms".

4. Medium priority: restructure Progress into "Today summary", "Weak areas", and collapsible subject detail.

5. Medium priority: add an AI retry state fix and a visible disabled/offline state if the proxy is unavailable.

6. Medium priority: add confirmation or undo copy for "Rebuild set".

7. Medium priority: run a device pass on iOS Safari/Capacitor for microphone stop-on-background, viewport zoom, and safe-area overlap.

8. Low priority: reduce initial setup length by grouping optional courses or adding quick presets.

## Evidence Limits

This audit used screenshots and DOM/source inspection. It does not claim full WCAG compliance. I did not test a real iOS device, VoiceOver, keyboard-only traversal, live microphone permission behavior, or successful external AI proxy responses.
