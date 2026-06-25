# Answer Page Audit Notes

Scope: mobile answer states for Cracked on the local Vite preview.

Screenshots:
- 01-today-mobile.png: Today dashboard before entering practice.
- 02-mcq-answer-selected-mobile.png: MCQ after selecting a wrong option.
- 03-mcq-explanation-mobile.png: MCQ explanation reveal.
- 04-full-lesson-mobile.png: Full lesson page.
- 05-dsa-draft-mobile.png: DSA prompt/draft state.
- 06-dsa-model-answer-mobile.png: DSA after reveal at original scroll position.
- 07-dsa-model-answer-scrolled-mobile.png: DSA model answer after scrolling down.

Key observations:
- MCQ answer feedback is immediate and clear through red/green option states, but the explanation CTA can sit below the first mobile viewport on long questions.
- The explanation page has useful layers: targeted fix, correct-answer rationale, remember callout, AI re-explain, follow-up, full lesson, and next question.
- The full lesson is readable but thin: one concept paragraph plus an interview-answer callout, with little active recall or misconception repair.
- DSA has a strong practice loop: prompt, hints, draft, voice input, model answer, rubric, and self-rating.
- DSA reveal can happen below the visible area; after tapping reveal, the learner may not immediately see the model answer unless they scroll.
- Bottom tab navigation can compete with the answer-page primary actions on mobile.

Evidence limits:
- This audit used current local app content and mobile screenshots. It did not test screen readers, keyboard-only operation, or actual microphone permission behavior.
