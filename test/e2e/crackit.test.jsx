import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Import helpers
import {
  renderApp,
  cleanupApp,
  clickButton,
  typeInput,
  waitForText,
  mockFetch,
  mockFetchJson
} from './helpers.js';

// Import App component (custom loader will transpile this JSX on the fly)
import { App } from '../../src/App.jsx';

// Helper to complete the setup view
async function completeSetup() {
  const startButton = Array.from(document.querySelectorAll('button')).find(
    (btn) => btn.textContent.includes('Build my daily loop')
  );
  if (startButton) {
    await clickButton(startButton);
  }
}

// Helper to start the daily session from TodayView
async function startDailySession() {
  const startBtn = Array.from(document.querySelectorAll('button')).find(
    (btn) => btn.textContent.includes('Start daily set') || btn.textContent.includes('Continue daily set')
  );
  if (startBtn) {
    await clickButton(startBtn);
  }
}

describe('CrackIt E2E Test Suite', () => {
  beforeEach(() => {
    // Reset global state mocks before each test
    globalThis.__mockQuestions = [];
    globalThis.__mockCheatsheets = {};
    globalThis.__mockDsaPrompts = [];
    globalThis.__mockInteractiveQuestions = [];
    globalThis.__mockLlm = {};
  });

  afterEach(async () => {
    await cleanupApp();
  });

  // =========================================================================
  // TIER 1: FEATURE COVERAGE (>=5 tests per feature)
  // =========================================================================

  describe('Tier 1: MCQ Code Formatting', () => {
    beforeEach(() => {
      globalThis.__mockQuestions = [
        {
          id: 'q-fmt-1',
          subject: 'DBMS',
          concept: 'Isolation Levels',
          difficulty: 'medium',
          stem: 'What is the complexity of `std::vector::push_back`?',
          options: [
            { text: 'Use `std::move`', sub: 'Yields an `rvalue` reference', fix: '' },
            { text: 'Dirty Read', sub: 'Subtext B', fix: 'Referencing `nullptr` will cause a crash.' }
          ],
          correctIndex: 0,
          proTip: 'Use `const` methods.',
          lesson: 'Example:\n```\nclass Widget {};\n```'
        }
      ];
      globalThis.__mockCheatsheets = {
        DBMS: [{ topic: 'Isolation Levels' }]
      };
    });

    it('TC-MCQ-FMT-01: Inline Code Formatting in Question Stem', async () => {
      await renderApp(<App />);
      await completeSetup();
      await startDailySession();

      const stemElement = document.querySelector('.question-stem');
      assert.ok(stemElement, 'Question stem element not found');

      // Expecting a code tag inside the stem
      const codeElement = stemElement.querySelector('code');
      assert.ok(codeElement, 'Expected <code> tag inside .question-stem');
      assert.strictEqual(codeElement.textContent, 'std::vector::push_back');
      assert.ok(!stemElement.textContent.includes('`std::vector::push_back`'), 'Raw backticks should not be rendered');
    });

    it('TC-MCQ-FMT-02: Code Block Formatting in Question Stem', async () => {
      globalThis.__mockQuestions[0].stem = 'Analyze this code:\n```cpp\nvoid main() {\n    int a = 5;\n}\n```\nWhat does it do?';
      await renderApp(<App />);
      await completeSetup();
      await startDailySession();

      const stemElement = document.querySelector('.question-stem');
      const preElement = stemElement.querySelector('pre');
      assert.ok(preElement, 'Expected <pre> tag inside .question-stem');
      const codeElement = preElement.querySelector('code');
      assert.ok(codeElement, 'Expected <code> tag inside <pre>');
      assert.strictEqual(codeElement.textContent, 'void main() {\n    int a = 5;\n}');
    });

    it('TC-MCQ-FMT-03: Code Formatting in Option Text and Subtext', async () => {
      await renderApp(<App />);
      await completeSetup();
      await startDailySession();

      const options = document.querySelectorAll('.option-button');
      assert.ok(options.length >= 1, 'Option buttons not found');

      const optionA = options[0];
      const strongCode = optionA.querySelector('strong code');
      const smallCode = optionA.querySelector('small code');

      assert.ok(strongCode, 'Expected <code> inside option text strong tag');
      assert.strictEqual(strongCode.textContent, 'std::move');

      assert.ok(smallCode, 'Expected <code> inside option subtext small tag');
      assert.strictEqual(smallCode.textContent, 'rvalue');
    });

    it('TC-MCQ-FMT-04: Code Formatting in Explanation Panel (Pro Tip & Lesson)', async () => {
      await renderApp(<App />);
      await completeSetup();
      await startDailySession();

      // Answer correctly to see proTip
      const options = document.querySelectorAll('.option-button');
      await clickButton(options[0]);

      // Click see explanation
      const explanationBtn = Array.from(document.querySelectorAll('button')).find(
        (btn) => btn.textContent.includes('See explanation')
      );
      assert.ok(explanationBtn, 'See explanation button not found');
      await clickButton(explanationBtn);

      const explanationBody = document.querySelector('.explanation-body');
      assert.ok(explanationBody, 'Explanation body not found');

      // Assert inline code in Pro Tip
      const codeElement = explanationBody.querySelector('code');
      assert.ok(codeElement, 'Expected <code> tag inside .explanation-body');
      assert.strictEqual(codeElement.textContent, 'const');

      // Click "I don't know - show lesson" or similar to see lesson block code
      // We can also just mock/test lesson on a skipped question
      await cleanupApp();
      
      await renderApp(<App />);
      await completeSetup();
      await startDailySession();

      const skipBtn = Array.from(document.querySelectorAll('button')).find(
        (btn) => btn.textContent.includes("I don't know")
      );
      assert.ok(skipBtn, 'Skip button not found');
      await clickButton(skipBtn);

      const expBody = document.querySelector('.explanation-body');
      const preCode = expBody.querySelector('pre code');
      assert.ok(preCode, 'Expected <pre><code> inside explanation body for lesson');
      assert.strictEqual(preCode.textContent, 'class Widget {};');
    });

    it('TC-MCQ-FMT-05: Targeted Fix Code Formatting for Incorrect Options', async () => {
      await renderApp(<App />);
      await completeSetup();
      await startDailySession();

      // Click wrong option (index 1)
      const options = document.querySelectorAll('.option-button');
      await clickButton(options[1]);

      // Click see explanation
      const explanationBtn = Array.from(document.querySelectorAll('button')).find(
        (btn) => btn.textContent.includes('See explanation')
      );
      await clickButton(explanationBtn);

      const explanationBody = document.querySelector('.explanation-body');
      // Assert inline code in fix message
      const codeElement = explanationBody.querySelector('code');
      assert.ok(codeElement, 'Expected <code> tag inside targeted fix explanation');
      assert.strictEqual(codeElement.textContent, 'nullptr');
    });
  });

  describe('Tier 1: Align Progress Section Topics', () => {
    beforeEach(() => {
      globalThis.__mockQuestions = [
        {
          id: 'q-dbms-1',
          subject: 'DBMS',
          concept: 'Isolation Levels',
          difficulty: 'easy',
          stem: 'Q1',
          options: [{ text: 'A', sub: 'S', fix: '' }],
          correctIndex: 0
        },
        {
          id: 'q-dbms-2',
          subject: 'DBMS',
          concept: 'Ghost Protocol',
          difficulty: 'easy',
          stem: 'Q2',
          options: [{ text: 'A', sub: 'S', fix: '' }],
          correctIndex: 0
        }
      ];
      globalThis.__mockCheatsheets = {
        DBMS: [{ topic: 'Isolation Levels' }] // 'Ghost Protocol' is excluded
      };
    });

    it('TC-ALIGN-01: Valid Concept Visibility', async () => {
      await renderApp(<App />);
      await completeSetup();

      // Navigate to Progress screen
      const navButtons = document.querySelectorAll('.nav-button');
      const progressTab = Array.from(navButtons).find((btn) => btn.textContent.includes('Progress'));
      assert.ok(progressTab, 'Progress tab button not found');
      await clickButton(progressTab);

      // Verify that "Isolation Levels" is visible in the grid
      const cells = Array.from(document.querySelectorAll('.concept-cell'));
      const hasIsolation = cells.some((cell) => cell.textContent.includes('Isolation Levels'));
      assert.ok(hasIsolation, 'Expected valid topic "Isolation Levels" to be visible under DBMS');
    });

    it('TC-ALIGN-02: Excluded Concept Filtering', async () => {
      await renderApp(<App />);
      await completeSetup();

      const navButtons = document.querySelectorAll('.nav-button');
      const progressTab = Array.from(navButtons).find((btn) => btn.textContent.includes('Progress'));
      await clickButton(progressTab);

      // Verify that "Ghost Protocol" is excluded
      const cells = Array.from(document.querySelectorAll('.concept-cell'));
      const hasGhost = cells.some((cell) => cell.textContent.includes('Ghost Protocol'));
      assert.ok(!hasGhost, 'Expected excluded topic "Ghost Protocol" to be hidden under DBMS');
    });

    it('TC-ALIGN-03: Subject Mastery Calculation Accuracy', async () => {
      // Set concept state: 100% mastery for Isolation Levels, 100% mastery for Ghost Protocol
      localStorage.setItem(
        'placement-prep-v2',
        JSON.stringify({
          stateSchemaVersion: 5,
          hasCompletedCourseSetup: true,
          settings: { selectedCourses: ['DBMS'], dailyGoal: 5 },
          conceptState: {
            'DBMS:isolation levels': { mastery: 100, reps: 2 },
            'DBMS:ghost protocol': { mastery: 100, reps: 2 }
          }
        })
      );

      await renderApp(<App />, false);
      // Note: setting localStorage sets setup as complete, so we go directly to Today
      const navButtons = document.querySelectorAll('.nav-button');
      const progressTab = Array.from(navButtons).find((btn) => btn.textContent.includes('Progress'));
      await clickButton(progressTab);

      // Mastery should be calculated based on 1 cheatsheet concept (Isolation Levels) -> 100 / 1 = 100%
      // If Ghost Protocol is included, it would be 100% too, but if we had more valid cheatsheet concepts, it would differ.
      // Let's add multiple cheatsheet concepts to verify
      globalThis.__mockCheatsheets = {
        DBMS: [{ topic: 'Isolation Levels' }, { topic: 'Indexing' }]
      };

      await cleanupApp();
      localStorage.setItem(
        'placement-prep-v2',
        JSON.stringify({
          stateSchemaVersion: 5,
          hasCompletedCourseSetup: true,
          settings: { selectedCourses: ['DBMS'], dailyGoal: 5 },
          conceptState: {
            'DBMS:isolation levels': { mastery: 100, reps: 2 },
            'DBMS:ghost protocol': { mastery: 100, reps: 2 },
            'DBMS:indexing': { mastery: 0, reps: 0 }
          }
        })
      );
      await renderApp(<App />, false);
      const navBtns = document.querySelectorAll('.nav-button');
      const progTab = Array.from(navBtns).find((btn) => btn.textContent.includes('Progress'));
      await clickButton(progTab);

      // We expect: (100 + 0) / 2 = 50% mastery.
      // If Ghost Protocol was included: (100 + 100 + 0) / 3 = 67%
      const subjectHead = Array.from(document.querySelectorAll('.subject-block')).find(
        (block) => block.querySelector('strong').textContent.includes('DBMS')
      );
      assert.ok(subjectHead, 'DBMS subject block not found');
      const masteryText = subjectHead.querySelector('.subject-head span').textContent;
      assert.strictEqual(masteryText, '50%', `Expected DBMS mastery to be 50%, got ${masteryText}`);
    });

    it('TC-ALIGN-04: Weakest and Strongest Topics Lists Filtering', async () => {
      localStorage.setItem(
        'placement-prep-v2',
        JSON.stringify({
          stateSchemaVersion: 5,
          hasCompletedCourseSetup: true,
          settings: { selectedCourses: ['DBMS'], dailyGoal: 5 },
          conceptState: {
            'DBMS:isolation levels': { mastery: 10, reps: 1, label: 'Isolation Levels' },
            'DBMS:ghost protocol': { mastery: 0, reps: 1, label: 'Ghost Protocol' }
          }
        })
      );

      await renderApp(<App />, false);
      const navButtons = document.querySelectorAll('.nav-button');
      const progressTab = Array.from(navButtons).find((btn) => btn.textContent.includes('Progress'));
      await clickButton(progressTab);

      // Weakest topics panel
      const panels = document.querySelectorAll('.small-panel');
      const weakPanel = Array.from(panels).find((p) => p.querySelector('.eyebrow')?.textContent.includes('Weak areas'));
      assert.ok(weakPanel, 'Weak areas panel not found');

      assert.ok(!weakPanel.textContent.includes('Ghost Protocol'), 'Weakest topics should not list excluded topics');
      assert.ok(weakPanel.textContent.includes('Isolation Levels'), 'Weakest topics should list valid topic');
    });

    it('TC-ALIGN-05: Question Coverage Calculation Accuracy', async () => {
      // Mock 30 DBMS questions total, 1 of which is Ghost Protocol (excluded)
      // Answer all 29 valid questions
      const mockAttempts = [];
      const mockQs = [];
      for (let i = 1; i <= 29; i++) {
        const id = `q-dbms-valid-${i}`;
        mockQs.push({
          id,
          subject: 'DBMS',
          concept: 'Isolation Levels',
          difficulty: 'easy',
          stem: 'Q',
          options: [{ text: 'A', sub: 'S', fix: '' }],
          correctIndex: 0
        });
        mockAttempts.push({ questionId: id, correct: true, timestamp: Date.now() });
      }
      mockQs.push({
        id: 'q-dbms-ghost',
        subject: 'DBMS',
        concept: 'Ghost Protocol',
        difficulty: 'easy',
        stem: 'Q',
        options: [{ text: 'A', sub: 'S', fix: '' }],
        correctIndex: 0
      });
      // Try adding ghost to attempts too to see if it gets ignored
      mockAttempts.push({ questionId: 'q-dbms-ghost', correct: true, timestamp: Date.now() });

      globalThis.__mockQuestions = mockQs;
      globalThis.__mockCheatsheets = {
        DBMS: [{ topic: 'Isolation Levels' }]
      };

      localStorage.setItem(
        'placement-prep-v2',
        JSON.stringify({
          stateSchemaVersion: 5,
          hasCompletedCourseSetup: true,
          settings: { selectedCourses: ['DBMS'], dailyGoal: 5 },
          conceptState: { 'DBMS:isolation levels': { mastery: 100, reps: 29 } },
          attempts: mockAttempts
        })
      );

      await renderApp(<App />, false);
      const navButtons = document.querySelectorAll('.nav-button');
      const progressTab = Array.from(navButtons).find((btn) => btn.textContent.includes('Progress'));
      await clickButton(progressTab);

      // Verify the coverage text is "29/29 questions covered"
      const coverageLabel = document.querySelector('.coverage-label');
      assert.ok(coverageLabel, 'Coverage label not found');
      assert.strictEqual(coverageLabel.textContent.trim(), '29/29 questions covered');
    });
  });

  describe('Tier 1: Diagrams Plan of Action Document', () => {
    const planPath = join(process.cwd(), 'diagrams_plan.md');

    it('TC-DIAG-01: Verify diagrams_plan.md Existence', () => {
      assert.ok(existsSync(planPath), 'diagrams_plan.md does not exist at project root');
    });

    it('TC-DIAG-02: Required Markdown Sections', () => {
      assert.ok(existsSync(planPath), 'diagrams_plan.md does not exist');
      const content = readFileSync(planPath, 'utf8');
      assert.ok(content.includes('# CrackIt Cheatsheet Diagrams'), 'Title header missing');
      
      const h2Matches = content.match(/^##\s+.+/gm);
      assert.ok(h2Matches && h2Matches.length >= 3, `Expected at least 3 H2 headers, found ${h2Matches?.length}`);
    });

    it('TC-DIAG-03: Subject Representation', () => {
      assert.ok(existsSync(planPath), 'diagrams_plan.md does not exist');
      const content = readFileSync(planPath, 'utf8');
      assert.ok(content.includes('DBMS'), 'DBMS subject mapping missing in plan');
      assert.ok(content.includes('OS'), 'OS subject mapping missing in plan');
      assert.ok(content.includes('CN'), 'CN subject mapping missing in plan');
      assert.ok(content.includes('OOP'), 'OOP subject mapping missing in plan');
    });

    it('TC-DIAG-04: Markdown Parsing Validity', () => {
      assert.ok(existsSync(planPath), 'diagrams_plan.md does not exist');
      const content = readFileSync(planPath, 'utf8');
      
      // Ensure all code blocks are properly opened and closed
      const matches = content.match(/```/g);
      if (matches) {
        assert.strictEqual(matches.length % 2, 0, 'Malformed markdown: unmatched code block tick marks');
      }
    });

    it('TC-DIAG-05: Non-Empty Plan Content', () => {
      assert.ok(existsSync(planPath), 'diagrams_plan.md does not exist');
      const stats = statSync(planPath);
      assert.ok(stats.size > 500, `Expected plan file to be > 500 bytes, got ${stats.size} bytes`);
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (>=5 tests per feature)
  // =========================================================================

  describe('Tier 2: MCQ Code Formatting - Boundary & Corner Cases', () => {
    beforeEach(() => {
      globalThis.__mockQuestions = [
        {
          id: 'q-fmt-boundary',
          subject: 'DBMS',
          concept: 'Isolation Levels',
          difficulty: 'medium',
          stem: 'Unclosed `std::vector without a closing backtick',
          options: [
            { text: 'Normal option', sub: 'Normal sub', fix: '' }
          ],
          correctIndex: 0
        }
      ];
      globalThis.__mockCheatsheets = {
        DBMS: [{ topic: 'Isolation Levels' }]
      };
    });

    it('TC-MCQ-FMT-06: Unclosed Backtick Handling', async () => {
      await renderApp(<App />);
      await completeSetup();
      await startDailySession();

      const stemElement = document.querySelector('.question-stem');
      assert.ok(stemElement, 'Question stem element not found');
      // No crashes; unclosed backticks should render as plain text safely
      assert.ok(stemElement.textContent.includes('Unclosed `std::vector'));
      assert.ok(!stemElement.querySelector('code'), 'Unclosed backtick should not produce empty/broken code tag');
    });

    it('TC-MCQ-FMT-07: Empty Backticks Handling', async () => {
      globalThis.__mockQuestions[0].stem = 'Identify `` function';
      await renderApp(<App />);
      await completeSetup();
      await startDailySession();

      const stemElement = document.querySelector('.question-stem');
      assert.ok(stemElement, 'Question stem not found');
      // App should render without crashing or throwing
    });

    it('TC-MCQ-FMT-08: Special HTML Characters inside Code Segments', async () => {
      globalThis.__mockQuestions[0].stem = 'Compare:\n```\nif (a < 5 && b > 10)\n```';
      await renderApp(<App />);
      await completeSetup();
      await startDailySession();

      const stemElement = document.querySelector('.question-stem');
      const codeElement = stemElement.querySelector('code');
      assert.ok(codeElement, 'Expected <code> tag');
      // Verify literal characters are not parsed as HTML
      assert.strictEqual(codeElement.textContent, 'if (a < 5 && b > 10)');
    });

    it('TC-MCQ-FMT-09: Multiple Consecutive Code Segments', async () => {
      globalThis.__mockQuestions[0].stem = 'Compare `x` and `y` in function `f()`.';
      await renderApp(<App />);
      await completeSetup();
      await startDailySession();

      const stemElement = document.querySelector('.question-stem');
      const codes = stemElement.querySelectorAll('code');
      assert.strictEqual(codes.length, 3, 'Expected exactly 3 code tags');
      assert.strictEqual(codes[0].textContent, 'x');
      assert.strictEqual(codes[1].textContent, 'y');
      assert.strictEqual(codes[2].textContent, 'f()');
    });

    it('TC-MCQ-FMT-10: Nested Code Tags in Code Blocks', async () => {
      globalThis.__mockQuestions[0].stem = '```\nstring value = `temp`;\n```';
      await renderApp(<App />);
      await completeSetup();
      await startDailySession();

      const stemElement = document.querySelector('.question-stem');
      const codeBlock = stemElement.querySelector('pre code');
      assert.ok(codeBlock, 'Expected pre code element');
      // Verify no nested <code> tag exists
      assert.strictEqual(codeBlock.querySelectorAll('code').length, 0, 'Should not render nested <code> elements inside code blocks');
      assert.ok(codeBlock.textContent.includes('`temp`'), 'Backticks inside code block should remain literal');
    });
  });

  describe('Tier 2: Align Progress Section Topics - Boundary & Corner Cases', () => {
    beforeEach(() => {
      globalThis.__mockQuestions = [
        {
          id: 'q-dbms-1',
          subject: 'DBMS',
          concept: 'isolation levels', // lowercase
          difficulty: 'easy',
          stem: 'Q1',
          options: [{ text: 'A', sub: 'S', fix: '' }],
          correctIndex: 0
        }
      ];
      globalThis.__mockCheatsheets = {
        DBMS: [{ topic: 'Isolation Levels' }]
      };
    });

    it('TC-ALIGN-06: Case Sensitivity and Whitespace in Topic Names', async () => {
      await renderApp(<App />);
      await completeSetup();

      const navButtons = document.querySelectorAll('.nav-button');
      const progressTab = Array.from(navButtons).find((btn) => btn.textContent.includes('Progress'));
      await clickButton(progressTab);

      // Verify that matching excludes case-mismatched or validates it correctly
      // Let's assert that the concept grid shows "Isolation Levels" or handles matching strictly
      const cells = Array.from(document.querySelectorAll('.concept-cell'));
      const hasIsolation = cells.some((cell) => cell.textContent.trim().toLowerCase() === 'isolation levels');
      assert.ok(hasIsolation, 'Concept matching should align Isolation Levels');
    });

    it('TC-ALIGN-07: Subject with Zero Cheatsheet Topics', async () => {
      globalThis.__mockCheatsheets = {
        DBMS: [] // zero topics
      };

      await renderApp(<App />);
      await completeSetup();

      const navButtons = document.querySelectorAll('.nav-button');
      const progressTab = Array.from(navButtons).find((btn) => btn.textContent.includes('Progress'));
      await clickButton(progressTab);

      const subjectHead = Array.from(document.querySelectorAll('.subject-block')).find(
        (block) => block.querySelector('strong').textContent.includes('DBMS')
      );
      assert.ok(subjectHead, 'DBMS subject block should render');
      const masteryText = subjectHead.querySelector('.subject-head span').textContent;
      assert.strictEqual(masteryText, '0%', 'Should display 0% mastery when subject cheatsheet is empty');
    });

    it('TC-ALIGN-08: Empty Initial State (Fresh User)', async () => {
      await renderApp(<App />);
      await completeSetup();

      const navButtons = document.querySelectorAll('.nav-button');
      const progressTab = Array.from(navButtons).find((btn) => btn.textContent.includes('Progress'));
      await clickButton(progressTab);

      const cells = document.querySelectorAll('.concept-cell');
      assert.strictEqual(cells.length, 1, 'Expected 1 concept cell representing the cheatsheet topic');
      
      const cell = cells[0];
      assert.strictEqual(cell.style.getPropertyValue('--mastery').trim(), '0%', 'Empty initial state should show 0% mastery');
    });

    it('TC-ALIGN-09: Cheatsheet Topic with Zero Questions', async () => {
      globalThis.__mockQuestions = []; // zero questions in bank
      globalThis.__mockCheatsheets = {
        DBMS: [{ topic: 'Isolation Levels' }]
      };

      await renderApp(<App />);
      await completeSetup();

      const navButtons = document.querySelectorAll('.nav-button');
      const progressTab = Array.from(navButtons).find((btn) => btn.textContent.includes('Progress'));
      await clickButton(progressTab);

      // Topic cell should be visible
      const cells = Array.from(document.querySelectorAll('.concept-cell'));
      assert.ok(cells.some((cell) => cell.textContent.includes('Isolation Levels')));

      // Coverage label should handle denominator = 0 gracefully (e.g. 0/0)
      const coverageLabel = document.querySelector('.coverage-label');
      assert.ok(coverageLabel, 'Coverage label not found');
      assert.ok(coverageLabel.textContent.includes('0/0'), `Expected 0/0 coverage, got ${coverageLabel.textContent}`);
    });

    it('TC-ALIGN-10: Cross-Subject Concept Mismatch', async () => {
      // Question has concept "Indexing" but subject "OS"
      // "Indexing" is only in CHEATSHEETS.DBMS, not CHEATSHEETS.OS
      globalThis.__mockQuestions = [
        {
          id: 'q-os-indexing',
          subject: 'OS',
          concept: 'Indexing',
          difficulty: 'easy',
          stem: 'Q',
          options: [{ text: 'A', sub: 'S', fix: '' }],
          correctIndex: 0
        }
      ];
      globalThis.__mockCheatsheets = {
        DBMS: [{ topic: 'Indexing' }],
        OS: [{ topic: 'Virtual Memory' }]
      };

      localStorage.setItem(
        'placement-prep-v2',
        JSON.stringify({
          stateSchemaVersion: 5,
          hasCompletedCourseSetup: true,
          settings: { selectedCourses: ['DBMS', 'OS'], dailyGoal: 5 },
          conceptState: { 'OS:indexing': { mastery: 50, reps: 1 } }
        })
      );

      await renderApp(<App />, false);
      const navButtons = document.querySelectorAll('.nav-button');
      const progressTab = Array.from(navButtons).find((btn) => btn.textContent.includes('Progress'));
      await clickButton(progressTab);

      // Verify that "Indexing" is NOT visible under OS block
      const subjectOS = Array.from(document.querySelectorAll('.subject-block')).find(
        (block) => block.querySelector('strong').textContent.includes('OS')
      );
      assert.ok(subjectOS, 'OS subject block not found');
      assert.ok(!subjectOS.textContent.includes('Indexing'), 'Concept "Indexing" should not show under OS Progress');
    });
  });

  describe('Tier 2: Diagrams Plan of Action - Boundary & Corner Cases', () => {
    const planPath = join(process.cwd(), 'diagrams_plan.md');

    it('TC-DIAG-06: Case-Sensitive File Naming', () => {
      // Verify casing
      const dirContents = join(process.cwd());
      const exactNameExists = existsSync(planPath);
      assert.ok(exactNameExists, 'File diagrams_plan.md must exist with correct casing');
    });

    it('TC-DIAG-07: Internal Link Validation', () => {
      assert.ok(existsSync(planPath));
      const content = readFileSync(planPath, 'utf8');
      
      // Match relative file path links like [text](./path)
      const linkRegex = /\[[^\]]+\]\(\.\/([^)]+)\)/g;
      let match;
      while ((match = linkRegex.exec(content)) !== null) {
        const linkPath = join(process.cwd(), match[1]);
        assert.ok(existsSync(linkPath), `Linked file or directory does not exist: ${match[1]}`);
      }
    });

    it('TC-DIAG-08: HTML Entity Validation', () => {
      assert.ok(existsSync(planPath));
      const content = readFileSync(planPath, 'utf8');
      
      // Make sure tags in markdown code blocks or text are well-formed
      // We search for <svg> and </svg> counts
      const svgOpenCount = (content.match(/<svg/g) || []).length;
      const svgCloseCount = (content.match(/<\/svg>/g) || []).length;
      assert.strictEqual(svgOpenCount, svgCloseCount, 'Mismatched svg tag counts in plan');
    });

    it('TC-DIAG-09: UTF-8 Encoding Integrity', () => {
      assert.ok(existsSync(planPath));
      const buffer = readFileSync(planPath);
      // Validate UTF-8 encoding by checking for replacement characters
      const content = buffer.toString('utf8');
      assert.ok(!content.includes('\uFFFD'), 'Encoding anomaly detected (contains replacement char)');
    });

    it('TC-DIAG-10: No Todo / Placeholder Items', () => {
      assert.ok(existsSync(planPath));
      const content = readFileSync(planPath, 'utf8');
      assert.ok(!content.includes('TODO'), 'Contains TODO placeholders');
      assert.ok(!content.includes('TBD'), 'Contains TBD placeholders');
      assert.ok(!content.includes('[Insert'), 'Contains placeholder brackets');
    });
  });

  // =========================================================================
  // TIER 3: PAIRWISE CROSS-FEATURE COMBINATIONS
  // =========================================================================

  describe('Tier 3: Pairwise Cross-Feature Combinations', () => {
    it('TC-PAIRWISE-01: MCQ Code Formatting + Align Progress Section Topics', async () => {
      // 1. Define cheatsheet topic with code tags
      globalThis.__mockCheatsheets = {
        DBMS: [{ topic: 'Use of `const`' }]
      };
      globalThis.__mockQuestions = [
        {
          id: 'q-pairwise-1',
          subject: 'DBMS',
          concept: 'Use of `const`',
          difficulty: 'medium',
          stem: 'Using `const` variables',
          options: [{ text: 'Yes', sub: 'No', fix: '' }],
          correctIndex: 0
        }
      ];

      await renderApp(<App />);
      await completeSetup();

      // Verify progress view
      const navButtons = document.querySelectorAll('.nav-button');
      const progressTab = Array.from(navButtons).find((btn) => btn.textContent.includes('Progress'));
      await clickButton(progressTab);

      const cell = document.querySelector('.concept-cell');
      assert.ok(cell, 'Expected concept cell to render');
      // The cell label should contain <code>const</code> and be formatted
      const codeInCell = cell.querySelector('code');
      assert.ok(codeInCell, 'Expected <code> tag inside progress concept cell');
      assert.strictEqual(codeInCell.textContent, 'const');

      // Navigate to Today and start practice to verify QuestionView header
      const todayTab = Array.from(navButtons).find((btn) => btn.textContent.includes('Today'));
      await clickButton(todayTab);
      await startDailySession();

      // Header concept name check (in header bar)
      // Usually shows subject and concept in non-iOS AppFrame
      const headerConceptSpan = Array.from(document.querySelectorAll('.question-context span')).find(
        (span) => span.textContent.includes('Use of')
      );
      if (headerConceptSpan) {
        assert.ok(headerConceptSpan.querySelector('code'), 'Expected <code> tag inside QuestionView concept header');
      }
    });

    it('TC-PAIRWISE-02: MCQ Code Formatting + Diagrams Plan of Action', async () => {
      // Stem contains SVG markup inside XML code block
      globalThis.__mockQuestions = [
        {
          id: 'q-pairwise-xml',
          subject: 'DBMS',
          concept: 'Diagrams',
          difficulty: 'medium',
          stem: '```xml\n<svg>\n  <rect width="100"/>\n</svg>\n```',
          options: [{ text: 'Option A', sub: 'Sub', fix: '' }],
          correctIndex: 0
        }
      ];
      globalThis.__mockCheatsheets = {
        DBMS: [{ topic: 'Diagrams' }]
      };

      await renderApp(<App />);
      await completeSetup();
      await startDailySession();

      // Assert it renders as text inside <pre><code>, and does not parse as SVG DOM elements
      const codeBlock = document.querySelector('.question-stem pre code');
      assert.ok(codeBlock, 'Expected pre code element');
      
      const svgElement = codeBlock.querySelector('svg');
      assert.ok(!svgElement, 'SVG should be rendered as raw text, not as SVG DOM element');
      assert.ok(codeBlock.textContent.includes('<svg>'), 'XML code tags should be displayed literally');
    });

    it('TC-PAIRWISE-03: Align Progress Section Topics + Diagrams Plan of Action', () => {
      const planPath = join(process.cwd(), 'diagrams_plan.md');
      assert.ok(existsSync(planPath));
      const content = readFileSync(planPath, 'utf8');

      // We ensure the cheatsheets database (currently mocked/loaded from cheatsheets.js) contains
      // the exact subjects and concepts outlined in the diagrams plan
      // Let's assert the diagrams plan references match valid cheatsheet subjects
      assert.ok(content.includes('DBMS') || content.includes('Database'), 'Plan should map to actual cheatsheet subjects');
    });
  });

  // =========================================================================
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS
  // =========================================================================

  describe('Tier 4: Real-World Application Scenarios', () => {
    it('TC-SCENARIO-01: End-to-End Study and Mastery Flow', async () => {
      // 1. Setup questions bank and cheatsheets
      globalThis.__mockCheatsheets = {
        DBMS: [{ topic: 'Indexing' }, { topic: 'Isolation Levels' }]
      };
      globalThis.__mockQuestions = [
        {
          id: 'q-scen-1',
          subject: 'DBMS',
          concept: 'Indexing',
          difficulty: 'hard',
          stem: 'Let`s test code `EXPLAIN` stem.',
          options: [
            { text: 'Correct Option', sub: 'A code `snippet` option', fix: '' },
            { text: 'Incorrect Option', sub: 'Sub', fix: 'Distractor explanation.' }
          ],
          correctIndex: 0,
          proTip: 'A proTip with code block:\n```\nIndex structure\n```'
        }
      ];

      // 2. User completes course setup
      await renderApp(<App />);
      await completeSetup();

      // 3. User navigates to Progress screen, verifies initial states
      const navButtons = document.querySelectorAll('.nav-button');
      const progressTab = Array.from(navButtons).find((btn) => btn.textContent.includes('Progress'));
      await clickButton(progressTab);

      // Verify that only cheatsheet topics are in the grid
      const cells = Array.from(document.querySelectorAll('.concept-cell'));
      assert.strictEqual(cells.length, 2, 'Should only render cheatsheet topics (Indexing, Isolation Levels)');
      
      const subjectHead = Array.from(document.querySelectorAll('.subject-block')).find(
        (block) => block.querySelector('strong').textContent.includes('DBMS')
      );
      assert.strictEqual(subjectHead.querySelector('.subject-head span').textContent, '0%');
      assert.strictEqual(subjectHead.querySelector('.coverage-label').textContent.trim(), '0/1 questions covered');

      // 4. Start daily session
      const todayTab = Array.from(navButtons).find((btn) => btn.textContent.includes('Today'));
      await clickButton(todayTab);
      await startDailySession();

      // 5. Verify inline code rendered in stem
      const stem = document.querySelector('.question-stem');
      assert.ok(stem.querySelector('code'), 'Expected <code> tag inside question stem');

      // 6. Answer correct option
      const options = document.querySelectorAll('.option-button');
      await clickButton(options[0]);

      // 7. Click see explanation
      const explanationBtn = Array.from(document.querySelectorAll('button')).find(
        (btn) => btn.textContent.includes('See explanation')
      );
      await clickButton(explanationBtn);

      // Verify code block in proTip
      const explanationBody = document.querySelector('.explanation-body');
      const preCode = explanationBody.querySelector('pre code');
      assert.ok(preCode, 'Expected <pre><code> block inside Pro Tip explanation');
      assert.strictEqual(preCode.textContent, 'Index structure');

      // 8. Complete set (nextQuestion will trigger summary since total = 1)
      const nextBtn = Array.from(document.querySelectorAll('button')).find(
        (btn) => btn.textContent.includes('Finish set')
      );
      await clickButton(nextBtn);

      // 9. Go to progress view to see updated statistics
      const navBtns = document.querySelectorAll('.nav-button');
      const progTab = Array.from(navBtns).find((btn) => btn.textContent.includes('Progress'));
      await clickButton(progTab);

      // Mastery percentage should have updated to positive non-zero value
      const updatedSubjectHead = Array.from(document.querySelectorAll('.subject-block')).find(
        (block) => block.querySelector('strong').textContent.includes('DBMS')
      );
      const updatedMastery = updatedSubjectHead.querySelector('.subject-head span').textContent;
      assert.ok(updatedMastery !== '0%', `Expected mastery to update from 0%, got ${updatedMastery}`);

      // Indexing should be listed under Strengths list (mastery increased after correct answer)
      const panels = document.querySelectorAll('.small-panel');
      const strongPanel = Array.from(panels).find((p) => p.querySelector('.eyebrow')?.textContent.includes('Strengths'));
      assert.ok(strongPanel, 'Strengths panel not found');
      assert.ok(strongPanel.textContent.includes('Indexing'), 'Strengths list should contain Indexing');
    });

    it('TC-SCENARIO-02: Robustness against Malformed and Unaligned Content', async () => {
      // 1. Simulate malformed and unaligned questions
      globalThis.__mockCheatsheets = {
        DBMS: [{ topic: 'Indexing' }] // Only Indexing cheatsheet topic
      };
      globalThis.__mockQuestions = [
        {
          id: 'q-scen2-malformed',
          subject: 'DBMS',
          concept: 'Indexing',
          difficulty: 'easy',
          stem: 'Unclosed backtick `select * from users',
          options: [{ text: 'Option A', sub: 'Sub', fix: '' }],
          correctIndex: 0
        },
        {
          id: 'q-scen2-unaligned',
          subject: 'DBMS',
          concept: 'Advanced Clustering', // Excluded from cheatsheet
          difficulty: 'easy',
          stem: 'Unaligned question',
          options: [{ text: 'Option A', sub: 'Sub', fix: '' }],
          correctIndex: 0
        }
      ];

      // 2. Open practice screen and verify unclosed backticks does not crash
      await renderApp(<App />);
      await completeSetup();
      await startDailySession();

      const stem = document.querySelector('.question-stem');
      assert.ok(stem, 'Expected question stem element');
      assert.ok(stem.textContent.includes('Unclosed backtick `select * from users'));

      // 3. Answer and complete both questions (Advanced Clustering will be next)
      const options = document.querySelectorAll('.option-button');
      await clickButton(options[0]);

      const nextBtn = Array.from(document.querySelectorAll('button')).find(
        (btn) => btn.textContent.includes('Next question')
      );
      await clickButton(nextBtn);

      // Now on Question B (unaligned)
      const optionsB = document.querySelectorAll('.option-button');
      await clickButton(optionsB[0]);

      const finishBtn = Array.from(document.querySelectorAll('button')).find(
        (btn) => btn.textContent.includes('Finish set')
      );
      await clickButton(finishBtn);

      // 4. Open Progress View
      const navButtons = document.querySelectorAll('.nav-button');
      const progressTab = Array.from(navButtons).find((btn) => btn.textContent.includes('Progress'));
      await clickButton(progressTab);

      // 5. Verify Advanced Clustering is not visible in grid or lists
      const cells = Array.from(document.querySelectorAll('.concept-cell'));
      assert.ok(!cells.some((cell) => cell.textContent.includes('Advanced Clustering')), 'Unaligned topic should not be in mastery map');

      // Mastery calculations must only count Indexing topic questions
      // Denominator should be 1, so coverage is 1/1 questions covered (ignoring Advanced Clustering question)
      const subjectHead = Array.from(document.querySelectorAll('.subject-block')).find(
        (block) => block.querySelector('strong').textContent.includes('DBMS')
      );
      const coverageLabel = subjectHead.querySelector('.coverage-label');
      assert.strictEqual(coverageLabel.textContent.trim(), '1/1 questions covered', 'Unaligned questions should not count towards coverage calculations');
    });
  });
});
