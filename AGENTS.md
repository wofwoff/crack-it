# Prototype Instructions

Run the local server yourself and open the preview in the in-app browser. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Durable design decision: use Option D, "Flame Mark", from `Logo Exploration.html` as the iOS app icon direction for Cracked.

Durable design decision: keep the top bar fixed during app use and include a persistent back button in that bar.

Durable design decision: use smooth, clearly perceptible transitions for app state changes, especially question answer-to-explanation reveals.

Durable behavior decision: DSA microphone dictation must stop immediately when the app is backgrounded, closed, hidden, or unloaded.

Durable behavior decision: chatbot/follow-up inputs must never trigger iOS viewport zoom; keep editable text controls at 16px or larger, do not autofocus them, and do not use scale transforms on focused input containers or their reveal path.

Durable product decision: unfinished or placeholder learning affordances should be hidden or replaced with content-specific guidance instead of appearing as tappable features.

Durable product decision: AI-generated interview questions must be situational/application-level only, scoped to the user's selected Cracked subjects and concepts, especially for CSE fundamentals.

Durable product decision: daily session counts refer only to the configured MCQ daily set; DSA, logical aptitude, generated interview questions, and extra practice must not inflate the daily numerator or denominator.

Durable naming decision: the former OA section should be presented as Logical Aptitude or Aptitude Reasoning in user-facing copy, not as OA practice.
