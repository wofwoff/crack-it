# CrackIt Question Bank Audit — 2026-07-01

Scope: all 96 MCQs in `src/content.js` (`QUESTIONS` array, all 7 subjects) plus the 9-entry `INTERACTIVE_QUESTIONS` array. DSA prompts were not included in this pass.

Checked per question: factual correctness of stem/options/explanations, whether `correctIndex` is actually right, distractor plausibility and uniqueness of the correct answer, interview relevance, and internal consistency between `correctIndex`, `lesson`, `remember`, and `interviewAnswer`.

## Result

| Subject | Count | OK | Issues found |
|---|---|---|---|
| DBMS | 16 | 16 | 0 |
| OS | 13 | 13 | 0 (1 very minor nitpick, not fixed — see below) |
| CN | 13 | 13 | 0 |
| OOP | 12 | 12 | 0 |
| CPP | 12 | 11 | 1 — fixed |
| PYTHON | 12 | 12 | 0 |
| OA | 18 | 16 | 2 — 1 fixed, 1 minor (not fixed) |
| INTERACTIVE_QUESTIONS | 9 | 9 | 0 (1 very minor nitpick, not fixed) |
| **Total** | **105** | **102 clean** | **2 real errors, both fixed** |

Overall the bank is unusually solid — distractor `fix` text is technically precise rather than just plausible-sounding, and `interviewAnswer`/`lesson` fields tracked `correctIndex` consistently everywhere. Only two questions had an actual factual/logical defect, both now fixed in `src/content.js`.

## Fixed

**`q-cpp-copy-001`** (Copy Constructor / shallow copy double-free)
The stem said the program "crashes with a heap corruption error," but the `Buffer` class as written had **no destructor at all** — so nothing would ever call `delete[]`, meaning the real outcome is a silent memory leak, not a crash. The double-free claim only holds if a destructor exists to do the freeing twice.
Fix: added `~Buffer() { delete[] data; }` to the class in the stem, and adjusted the correct option, lesson, remember, and interviewAnswer to drop the conditional ("would double-free") language now that the destructor is real and the double-free actually happens.

**`q-oa-conclusion-001`** (Statement Conclusions)
Statement gave a sufficient condition ("solve ≥70% → shortlisted"). Conclusion II asserted the converse ("below 70% → not shortlisted"), which doesn't follow from a one-directional rule — the company could shortlist via other unstated criteria. The question marked "Both I and II follow" as correct, which is the classic converse-error mistake, not a valid deduction.
Fix: changed `correctIndex` to "Only I follows," rewrote the now-wrong "Both" option's `fix` to explain the converse error, and updated proTip/lesson/remember/interviewAnswer to teach the sufficient-vs-necessary distinction directly (useful as a general statement-conclusion principle, not just for this question).

## Noted but not changed (low severity, judgment calls)

- **`q-os-contextswitch-001`** — stem describes "hundreds of runnable threads" and says memory maps are saved/restored on every switch; that's only true across process switches, not same-process thread switches. Common interview-level simplification, didn't change `correctIndex` or the core lesson.
- **`q-oa-input-001`** — relies on an implicit "unplaced words keep their original relative order" convention for the word-arrangement-machine puzzle. Standard in this question archetype (TCS/IBPS-style), but the stem could state it explicitly to remove ambiguity for someone unfamiliar with the format.
- **`iq-bucket-memory`** (INTERACTIVE_QUESTIONS) — phrasing loosely conflates C++ `new`/`delete` with C `malloc`/`free` as if interchangeable. Doesn't affect the bucket placement (both are heap-allocated), just imprecise wording.

None of these affect `correctIndex` or change the right answer, so I left them as-is rather than touching content that isn't actually wrong.
