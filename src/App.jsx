import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  Check,
  ChevronLeft,
  ChevronRight,
  Code2,
  Download,
  Flame,
  Home,
  Lightbulb,
  Mic,
  MicOff,
  RotateCcw,
  Settings,
  Timer,
  X,
} from "lucide-react";
import { QUESTIONS, DSA_PROMPTS } from "./content";

const STORAGE_KEY = "placement-prep-v2";
const STATE_SCHEMA_VERSION = 3;
const SUBJECTS = ["DBMS", "OS", "CN", "OOP"];
const SUBJECT_META = {
  DBMS: { name: "DBMS", detail: "Transactions, indexes, normalization", accent: "#c87a28" },
  OS: { name: "OS", detail: "CPU, memory, locks, deadlocks", accent: "#d65a4a" },
  CN: { name: "CN", detail: "TCP/IP, TLS, HTTP, DNS", accent: "#2e8f82" },
  OOP: { name: "OOP", detail: "SOLID, patterns, design tradeoffs", accent: "#6e78d8" },
  DSA: { name: "DSA", detail: "Algorithm logic and complexity", accent: "#1a1714" },
};
const COURSE_OPTIONS = [
  {
    id: "DBMS",
    title: "DBMS",
    subtitle: "Transactions, SQL, indexing, normalization",
    type: "mcq",
  },
  {
    id: "OS",
    title: "Operating Systems",
    subtitle: "Scheduling, memory, locks, deadlocks",
    type: "mcq",
  },
  {
    id: "CN",
    title: "Computer Networks",
    subtitle: "TCP/IP, TLS, HTTP, DNS, caching",
    type: "mcq",
  },
  {
    id: "OOP",
    title: "OOP & Design",
    subtitle: "SOLID, patterns, composition, coupling",
    type: "mcq",
  },
  {
    id: "DSA",
    title: "DSA Logic",
    subtitle: "Explain the approach, compare, self-rate",
    type: "dsa",
  },
];
const CORRECT_POINTS = { correct: 1, wrong: 0, blank: 0 };
const CONTENT_BANK_SIGNATURE = [
  QUESTIONS.length,
  DSA_PROMPTS.length,
  QUESTIONS.map((question) => question.id).join(","),
  DSA_PROMPTS.map((prompt) => prompt.id).join(","),
].join("|");
const CALENDAR_LEVELS = [
  0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 2, 0,
  1, 0, 2, 1, 0, 1, 0, 2, 2, 1, 2, 0,
  2, 1, 3, 2, 2, 1, 0, 2, 3, 2, 3, 1,
  3, 2, 3, 2, 3, 2, 1, 3, 3, 2, 3, 3,
  2, 3, 3, 3, 3, 2, 2, 1, 2, 3, 2, 3,
];


function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function readableDate(date = new Date()) {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
}

function daysBetween(a, b) {
  const oneDay = 24 * 60 * 60 * 1000;
  const start = new Date(`${a}T00:00:00`);
  const end = new Date(`${b}T00:00:00`);
  return Math.round((end - start) / oneDay);
}

function clampPercent(value) {
  return Math.max(5, Math.min(100, Math.round(value)));
}

function questionConceptKey(question) {
  return `${question.subject}:${question.concept}`;
}

function dsaConceptKey(prompt) {
  return `DSA:${prompt.concept}`;
}

function uniqueMcqConceptsForSubject(subject) {
  const seen = new Set();
  return QUESTIONS.filter((question) => question.subject === subject).reduce((concepts, question) => {
    const key = questionConceptKey(question);
    if (!seen.has(key)) {
      seen.add(key);
      concepts.push({ key, label: question.concept, subject });
    }
    return concepts;
  }, []);
}

function defaultConceptState() {
  const subjectConceptCounts = {};
  const mcqState = QUESTIONS.reduce((acc, question, index) => {
    const key = questionConceptKey(question);
    if (acc[key]) return acc;
    const subjectIndex = subjectConceptCounts[question.subject] || 0;
    subjectConceptCounts[question.subject] = subjectIndex + 1;
    acc[key] = {
      label: question.concept,
      subject: question.subject,
      type: "mcq",
      ease: 2.5,
      interval: index % 3 === 0 ? 0 : index + 1,
      dueAt: index % 3 === 0 ? dateKey() : dateKey(new Date(Date.now() + index * 86400000)),
      reps: 0,
      lapses: 0,
      mastery: clampPercent(question.subject === "DBMS" ? 62 + (subjectIndex % 3) * 5 : 44 + (subjectIndex % 7) * 5),
      lastSeen: null,
    };
    return acc;
  }, {});
  return DSA_PROMPTS.reduce((acc, prompt, index) => {
    const key = dsaConceptKey(prompt);
    acc[key] = {
      label: prompt.concept,
      subject: "DSA",
      type: "dsa",
      ease: 2.5,
      interval: index + 1,
      dueAt: index === 0 ? dateKey() : dateKey(new Date(Date.now() + index * 86400000)),
      reps: 0,
      lapses: 0,
      mastery: clampPercent(42 + (index % 8) * 4),
      lastSeen: null,
    };
    return acc;
  }, mcqState);
}

function createInitialState() {
  return {
    settings: {
      dailyGoal: 7,
      activeSubjects: SUBJECTS,
      selectedCourses: COURSE_OPTIONS.map((course) => course.id),
      remindersEnabled: true,
      reminderTime: "9:00 AM",
      interviewMode: true,
    },
    hasCompletedCourseSetup: false,
    conceptState: defaultConceptState(),
    streak: {
      current: 3,
      longest: 12,
      lastActiveDate: dateKey(new Date(Date.now() - 86400000)),
      history: [
        { date: dateKey(new Date(Date.now() - 6 * 86400000)), completed: true },
        { date: dateKey(new Date(Date.now() - 5 * 86400000)), completed: true },
        { date: dateKey(new Date(Date.now() - 4 * 86400000)), completed: false },
        { date: dateKey(new Date(Date.now() - 3 * 86400000)), completed: true },
        { date: dateKey(new Date(Date.now() - 2 * 86400000)), completed: true },
        { date: dateKey(new Date(Date.now() - 86400000)), completed: true },
        { date: dateKey(), completed: false },
      ],
    },
    attempts: [],
    dsaAttempts: [],
    dailySet: null,
    contentBankSignature: CONTENT_BANK_SIGNATURE,
    stateSchemaVersion: STATE_SCHEMA_VERSION,
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return createInitialState();
    const hasCurrentContent = saved.contentBankSignature === CONTENT_BANK_SIGNATURE;
    const hasCurrentSchema = saved.stateSchemaVersion === STATE_SCHEMA_VERSION;
    return {
      ...createInitialState(),
      ...saved,
      contentBankSignature: CONTENT_BANK_SIGNATURE,
      stateSchemaVersion: STATE_SCHEMA_VERSION,
      settings: {
        ...createInitialState().settings,
        ...saved.settings,
        selectedCourses:
          saved.settings?.selectedCourses ||
          [...new Set([...(saved.settings?.activeSubjects || SUBJECTS), "DSA"])],
      },
      conceptState: hasCurrentSchema
        ? { ...defaultConceptState(), ...saved.conceptState }
        : defaultConceptState(),
      dsaAttempts: saved.dsaAttempts || [],
      dailySet: hasCurrentContent && hasCurrentSchema ? saved.dailySet : null,
    };
  } catch {
    return createInitialState();
  }
}

function composeDailySet(settings, conceptState) {
  const today = dateKey();
  const activeSubjects = settings.selectedCourses?.filter((course) => SUBJECTS.includes(course)) || settings.activeSubjects;
  const active = QUESTIONS.filter((question) => activeSubjects.includes(question.subject));
  const ranked = [...active].sort((a, b) => {
    const aState = conceptState[questionConceptKey(a)] || {};
    const bState = conceptState[questionConceptKey(b)] || {};
    const aDue = (aState.dueAt || today) <= today ? 0 : 1;
    const bDue = (bState.dueAt || today) <= today ? 0 : 1;
    if (aDue !== bDue) return aDue - bDue;
    return (aState.mastery || 0) - (bState.mastery || 0);
  });

  return {
    date: today,
    questionIds: ranked.slice(0, settings.dailyGoal).map((question) => question.id),
    completedAt: null,
    contentBankSignature: CONTENT_BANK_SIGNATURE,
  };
}

function nextDsaPrompt(settings, conceptState, attempts) {
  const hasDsa = settings.selectedCourses?.includes("DSA");
  if (!hasDsa) return null;
  const today = dateKey();
  const attemptedToday = new Set(
    attempts.filter((attempt) => attempt.date === today).map((attempt) => attempt.promptId),
  );
  return [...DSA_PROMPTS]
    .filter((prompt) => !attemptedToday.has(prompt.id))
    .sort((a, b) => {
      const aState = conceptState[dsaConceptKey(a)] || {};
      const bState = conceptState[dsaConceptKey(b)] || {};
      const aDue = (aState.dueAt || today) <= today ? 0 : 1;
      const bDue = (bState.dueAt || today) <= today ? 0 : 1;
      if (aDue !== bDue) return aDue - bDue;
      return (aState.mastery || 0) - (bState.mastery || 0);
    })[0] || DSA_PROMPTS[0];
}

function updateMemoryState(previous, outcome) {
  const qualityMap = {
    correct: 5,
    easy: 5,
    good: 4,
    hard: 3,
    wrong: 2,
    again: 1,
    blank: 1,
  };
  const quality = qualityMap[outcome] || 1;
  const nextEase = Math.max(1.3, previous.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  const failed = quality < 3;
  const nextReps = failed ? 0 : previous.reps + 1;
  const nextInterval = failed ? 1 : nextReps === 1 ? 1 : nextReps === 2 ? 6 : Math.round(previous.interval * nextEase);
  const nextDate = new Date(Date.now() + nextInterval * 86400000);
  const masteryShiftMap = {
    correct: 8,
    easy: 10,
    good: 7,
    hard: 2,
    wrong: -9,
    again: -10,
    blank: -14,
  };
  const masteryShift = masteryShiftMap[outcome] ?? -8;

  return {
    ...previous,
    ease: Number(nextEase.toFixed(2)),
    interval: nextInterval,
    dueAt: dateKey(nextDate),
    reps: nextReps,
    lapses: previous.lapses + (failed ? 1 : 0),
    mastery: clampPercent(previous.mastery + masteryShift),
    lastSeen: dateKey(),
  };
}

function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

export function App() {
  const [appState, setAppState] = useState(loadState);
  const [view, setView] = useState("today");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [cardSide, setCardSide] = useState("front");
  const [lessonQuestionId, setLessonQuestionId] = useState(null);

  useEffect(() => {
    setAppState((state) => {
      const today = dateKey();
      let nextState = state;

      if (
        state.stateSchemaVersion !== STATE_SCHEMA_VERSION ||
        state.contentBankSignature !== CONTENT_BANK_SIGNATURE ||
        !state.dailySet ||
        state.dailySet.date !== today ||
        state.dailySet.contentBankSignature !== CONTENT_BANK_SIGNATURE
      ) {
        const conceptState =
          state.stateSchemaVersion === STATE_SCHEMA_VERSION
            ? state.conceptState
            : defaultConceptState();
        nextState = {
          ...nextState,
          stateSchemaVersion: STATE_SCHEMA_VERSION,
          contentBankSignature: CONTENT_BANK_SIGNATURE,
          conceptState,
          dailySet: composeDailySet(state.settings, conceptState),
        };
      }

      if (state.streak.lastActiveDate && daysBetween(state.streak.lastActiveDate, today) > 1) {
        nextState = {
          ...nextState,
          streak: { ...nextState.streak, current: 0 },
        };
      }

      return nextState;
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  }, [appState]);

  const todaySet = useMemo(() => {
    const ids = appState.dailySet?.questionIds || [];
    return ids.map((id) => QUESTIONS.find((question) => question.id === id)).filter(Boolean);
  }, [appState.dailySet]);

  const todayAttempts = appState.attempts.filter((attempt) => attempt.date === dateKey());
  const todayDsaAttempts = appState.dsaAttempts.filter((attempt) => attempt.date === dateKey());
  const completedCount = new Set(todayAttempts.map((attempt) => attempt.questionId)).size;
  const currentQuestion = todaySet[currentIndex] || todaySet[0] || QUESTIONS[0];
  const currentDsaPrompt = nextDsaPrompt(appState.settings, appState.conceptState, appState.dsaAttempts);
  const currentAttempt = todayAttempts.find((attempt) => attempt.questionId === currentQuestion.id);
  const responseOutcome =
    selectedIndex === null
      ? null
      : selectedIndex === -1
        ? "blank"
        : selectedIndex === currentQuestion.correctIndex
          ? "correct"
          : "wrong";

  const accuracy =
    appState.attempts.length === 0
      ? 0
      : Math.round(
          (appState.attempts.reduce((sum, attempt) => sum + CORRECT_POINTS[attempt.outcome], 0) /
            appState.attempts.length) *
            100,
        );

  function resetQuestionUi(nextIndex = currentIndex) {
    setCurrentIndex(nextIndex);
    setSelectedIndex(null);
    setCardSide("front");
  }

  function startSession() {
    if (todaySet.length === 0) {
      setView("dsa");
      return;
    }
    const firstUnanswered = todaySet.findIndex(
      (question) => !todayAttempts.some((attempt) => attempt.questionId === question.id),
    );
    resetQuestionUi(firstUnanswered >= 0 ? firstUnanswered : 0);
    setView("question");
  }

  function recordAttempt(question, outcome, optionIndex) {
    setAppState((state) => {
      const existing = state.attempts.some(
        (attempt) => attempt.date === dateKey() && attempt.questionId === question.id,
      );
      if (existing) return state;

      const conceptKey = questionConceptKey(question);
      const previousConcept = state.conceptState[conceptKey] || defaultConceptState()[conceptKey];
      const conceptState = {
        ...state.conceptState,
        [conceptKey]: updateMemoryState(previousConcept, outcome),
      };

      return {
        ...state,
        conceptState,
        attempts: [
          ...state.attempts,
          {
            id: `${question.id}-${Date.now()}`,
            date: dateKey(),
            questionId: question.id,
            concept: question.concept,
            conceptKey,
            subject: question.subject,
            outcome,
            optionIndex,
            respondedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  function chooseOption(index) {
    if (selectedIndex !== null || currentAttempt) return;
    setSelectedIndex(index);
    recordAttempt(
      currentQuestion,
      index === currentQuestion.correctIndex ? "correct" : "wrong",
      index,
    );
  }

  function blankOut() {
    if (selectedIndex !== null || currentAttempt) return;
    setSelectedIndex(-1);
    setCardSide("back");
    recordAttempt(currentQuestion, "blank", null);
  }

  function finishTodayIfNeeded() {
    setAppState((state) => {
      const today = dateKey();
      const hasCompletedToday = state.dailySet?.completedAt;
      if (hasCompletedToday) return state;

      const lastActive = state.streak.lastActiveDate;
      const nextCurrent =
        lastActive === today ? state.streak.current : lastActive && daysBetween(lastActive, today) === 1 ? state.streak.current + 1 : 1;
      const nextHistory = [
        ...state.streak.history.filter((day) => day.date !== today),
        { date: today, completed: true },
      ].slice(-14);

      return {
        ...state,
        dailySet: { ...state.dailySet, completedAt: new Date().toISOString() },
        streak: {
          current: nextCurrent,
          longest: Math.max(state.streak.longest, nextCurrent),
          lastActiveDate: today,
          history: nextHistory,
        },
      };
    });
  }

  function nextQuestion() {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= todaySet.length) {
      finishTodayIfNeeded();
      setView("summary");
      return;
    }
    resetQuestionUi(nextIndex);
  }

  function openLesson(questionId = currentQuestion.id) {
    setLessonQuestionId(questionId);
    setView("lesson");
  }

  function completeCourseSetup(selectedCourses, dailyGoal = appState.settings.dailyGoal) {
    const safeCourses = selectedCourses.length ? selectedCourses : COURSE_OPTIONS.map((course) => course.id);
    const settings = {
      ...appState.settings,
      dailyGoal: Number(dailyGoal),
      selectedCourses: safeCourses,
      activeSubjects: safeCourses.filter((course) => SUBJECTS.includes(course)),
    };
    setAppState((state) => ({
      ...state,
      hasCompletedCourseSetup: true,
      settings,
      dailySet: composeDailySet(settings, state.conceptState),
    }));
    setView("today");
  }

  function openCourseSetup() {
    setView("setup");
  }

  function recordDsaAttempt(prompt, rating, draft) {
    setAppState((state) => {
      const conceptKey = dsaConceptKey(prompt);
      const previousConcept = state.conceptState[conceptKey] || defaultConceptState()[conceptKey];
      return {
        ...state,
        conceptState: {
          ...state.conceptState,
          [conceptKey]: updateMemoryState(previousConcept, rating),
        },
        dsaAttempts: [
          ...state.dsaAttempts,
          {
            id: `${prompt.id}-${Date.now()}`,
            date: dateKey(),
            promptId: prompt.id,
            concept: prompt.concept,
            conceptKey,
            outcome: rating,
            draft,
            respondedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  function regenerateSet() {
    setAppState((state) => ({
      ...state,
      dailySet: composeDailySet(state.settings, state.conceptState),
    }));
    resetQuestionUi(0);
    setView("today");
  }

  function updateGoal(nextGoal) {
    setAppState((state) => {
      const settings = {
        ...state.settings,
        dailyGoal: Number(nextGoal),
      };
      return {
        ...state,
        settings,
        dailySet: composeDailySet(settings, state.conceptState),
      };
    });
  }

  function toggleSubject(subject) {
    setAppState((state) => {
      const selectedCourses = state.settings.selectedCourses.includes(subject)
        ? state.settings.selectedCourses.filter((item) => item !== subject)
        : [...state.settings.selectedCourses, subject];
      const safeCourses = selectedCourses.length ? selectedCourses : [subject];
      const activeSubjects = safeCourses.filter((course) => SUBJECTS.includes(course));
      const safeActive = activeSubjects.length === 0 ? [subject] : activeSubjects;
      const settings = { ...state.settings, selectedCourses: safeCourses, activeSubjects: safeActive };
      return {
        ...state,
        settings,
        dailySet: composeDailySet(settings, state.conceptState),
      };
    });
  }

  function toggleCourse(courseId) {
    setAppState((state) => {
      const selectedCourses = state.settings.selectedCourses.includes(courseId)
        ? state.settings.selectedCourses.filter((item) => item !== courseId)
        : [...state.settings.selectedCourses, courseId];
      const safeCourses = selectedCourses.length ? selectedCourses : [courseId];
      const settings = {
        ...state.settings,
        selectedCourses: safeCourses,
        activeSubjects: safeCourses.filter((course) => SUBJECTS.includes(course)),
      };
      return {
        ...state,
        settings,
        dailySet: composeDailySet(settings, state.conceptState),
      };
    });
  }

  function updatePreference(key, value) {
    setAppState((state) => ({
      ...state,
      settings: {
        ...state.settings,
        [key]: value,
      },
    }));
  }

  return (
    <main className="app-shell">
      <section className="app-frame" aria-label="PlacementPrep application">
        {appState.hasCompletedCourseSetup && view !== "setup" && (
          <FrameTop
            view={view}
            setView={setView}
            completedCount={completedCount + todayDsaAttempts.length}
            totalCount={todaySet.length + (currentDsaPrompt ? 1 : 0)}
            streak={appState.streak}
            dsaEnabled={appState.settings.selectedCourses.includes("DSA")}
          />
        )}

        {(!appState.hasCompletedCourseSetup || view === "setup") && (
          <CourseSetupView
            selectedCourses={appState.settings.selectedCourses}
            onComplete={completeCourseSetup}
          />
        )}

        {appState.hasCompletedCourseSetup && view === "today" && (
          <TodayView
            todaySet={todaySet}
            attempts={todayAttempts}
            dsaAttempts={todayDsaAttempts}
            dsaPrompt={currentDsaPrompt}
            completedCount={completedCount}
            dsaEnabled={appState.settings.selectedCourses.includes("DSA")}
            settings={appState.settings}
            conceptState={appState.conceptState}
            streak={appState.streak}
            startSession={startSession}
            startDsa={() => setView("dsa")}
            openProgress={() => setView("progress")}
          />
        )}

        {appState.hasCompletedCourseSetup && view === "question" && (
          <QuestionView
            question={currentQuestion}
            total={todaySet.length}
            currentIndex={currentIndex}
            selectedIndex={selectedIndex}
            cardSide={cardSide}
            responseOutcome={responseOutcome}
            chooseOption={chooseOption}
            blankOut={blankOut}
            flip={() => setCardSide("back")}
            nextQuestion={nextQuestion}
            openLesson={openLesson}
            goToday={() => setView("today")}
          />
        )}

        {appState.hasCompletedCourseSetup && view === "dsa" && (
          <DsaView
            prompt={currentDsaPrompt}
            attempts={todayDsaAttempts}
            recordDsaAttempt={recordDsaAttempt}
            goToday={() => setView("today")}
            goProgress={() => setView("progress")}
          />
        )}

        {appState.hasCompletedCourseSetup && view === "lesson" && (
          <LessonView
            question={QUESTIONS.find((item) => item.id === lessonQuestionId) || currentQuestion}
            onBack={() => setView(cardSide === "back" ? "question" : "today")}
          />
        )}

        {appState.hasCompletedCourseSetup && view === "summary" && (
          <SummaryView
            todaySet={todaySet}
            attempts={todayAttempts}
            streak={appState.streak}
            accuracy={accuracy}
            goToday={() => setView("today")}
            openProgress={() => setView("progress")}
          />
        )}

        {appState.hasCompletedCourseSetup && view === "progress" && (
          <ProgressView
            conceptState={appState.conceptState}
            attempts={appState.attempts}
            dsaAttempts={appState.dsaAttempts}
            streak={appState.streak}
            accuracy={accuracy}
            selectedCourses={appState.settings.selectedCourses}
          />
        )}

        {appState.hasCompletedCourseSetup && view === "settings" && (
          <SettingsView
            settings={appState.settings}
            updateGoal={updateGoal}
            toggleSubject={toggleSubject}
            toggleCourse={toggleCourse}
            updatePreference={updatePreference}
            regenerateSet={regenerateSet}
            openCourseSetup={openCourseSetup}
          />
        )}
      </section>
    </main>
  );
}

function FrameTop({ view, setView, completedCount, totalCount, streak, dsaEnabled }) {
  const navItems = [
    { id: "today", label: "Today", icon: Home },
    ...(dsaEnabled ? [{ id: "dsa", label: "DSA", icon: Code2 }] : []),
    { id: "progress", label: "Progress", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];
  const navButtons = navItems.map((item) => {
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        className={classNames("nav-button", view === item.id && "active")}
        onClick={() => setView(item.id)}
      >
        <Icon size={16} aria-hidden="true" />
        <span>{item.label}</span>
      </button>
    );
  });

  return (
    <>
      <header className="frame-top">
        <button className="brand-button" onClick={() => setView("today")}>
          <span className="brand-mark">PP</span>
          <span>
            <span className="eyebrow">PlacementPrep</span>
            <span className="brand-title">Open Book</span>
          </span>
        </button>
        <nav className="top-nav top-nav-desktop" aria-label="Main navigation">
          {navButtons}
        </nav>
        <div className="top-stats">
          <span>{completedCount} / {totalCount || 0}</span>
          <span className="stat-divider" />
          <Flame size={16} aria-hidden="true" />
          <span>{streak.current}</span>
        </div>
      </header>
      <nav className="top-nav mobile-tabbar" aria-label="Mobile navigation">
        {navButtons}
      </nav>
    </>
  );
}

function CourseSetupView({ selectedCourses, onComplete }) {
  const [localSelection, setLocalSelection] = useState(selectedCourses);
  const [dailyGoal, setDailyGoal] = useState(7);
  const selectedMcqCount = localSelection.filter((course) => SUBJECTS.includes(course)).length;
  const readinessWeeks = Math.max(4, 12 - Math.round(dailyGoal / 2) - selectedMcqCount);

  function toggle(courseId) {
    setLocalSelection((current) => {
      const next = current.includes(courseId)
        ? current.filter((item) => item !== courseId)
        : [...current, courseId];
      return next.length ? next : current;
    });
  }

  return (
    <div className="screen setup-screen">
      <section className="setup-hero color-wash">
        <div className="step-dots" aria-label="Setup progress">
          <span className="active" />
          <span className="active" />
          <span />
          <span />
        </div>
        <p className="eyebrow">PlacementPrep setup</p>
        <h1>Set up your prep.</h1>
        <p>
          Choose the subjects, daily pace, and DSA mode that should appear in
          your placement loop.
        </p>
      </section>

      <section className="setup-board" aria-label="Course selection">
        <div className="setup-subjects">
          <div className="section-heading">
            <p className="eyebrow">Your subjects</p>
            <span>{localSelection.length} selected</span>
          </div>
          <div className="course-grid">
            {COURSE_OPTIONS.map((course) => {
              const selected = localSelection.includes(course.id);
              const Icon = course.type === "dsa" ? Code2 : BookOpen;
              const meta = SUBJECT_META[course.id];
              return (
                <button
                  key={course.id}
                  className={classNames("course-card", selected && "selected")}
                  style={{ "--course-accent": meta.accent }}
                  onClick={() => toggle(course.id)}
                >
                  <span className="course-icon">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>{course.title}</strong>
                    <small>{course.subtitle}</small>
                  </span>
                  <span className="course-check">{selected ? <Check size={18} /> : null}</span>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="setup-side">
          <div className="goal-card">
            <p className="eyebrow">Daily goal</p>
            <div className="goal-number">
              <span>{dailyGoal}</span>
              <small>questions/day</small>
            </div>
            <div className="stepper goal-stepper">
              <button
                className="icon-button"
                onClick={() => setDailyGoal((value) => Math.max(3, value - 1))}
                aria-label="Decrease daily goal"
              >
                -
              </button>
              <input
                type="range"
                min="3"
                max="10"
                value={dailyGoal}
                onChange={(event) => setDailyGoal(Number(event.target.value))}
                aria-label="Daily goal"
              />
              <button
                className="icon-button"
                onClick={() => setDailyGoal((value) => Math.min(10, value + 1))}
                aria-label="Increase daily goal"
              >
                +
              </button>
            </div>
          </div>
          <div className="readiness-card">
            <p className="eyebrow">Placement-ready in</p>
            <strong>~{readinessWeeks} weeks</strong>
            <span>Based on {selectedMcqCount} CS-core courses and DSA practice.</span>
          </div>
        </aside>
      </section>

      <section className="setup-summary">
        <div>
          <p className="eyebrow">Daily mix</p>
          <p>
            {dailyGoal} questions/day - {selectedMcqCount} MCQ courses
            {localSelection.includes("DSA") ? " + DSA self-graded practice" : ""}
          </p>
        </div>
        <button className="primary-button" onClick={() => onComplete(localSelection, dailyGoal)}>
          Build my daily loop
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}

function TodayView({
  todaySet,
  attempts,
  dsaAttempts,
  dsaPrompt,
  completedCount,
  dsaEnabled,
  settings,
  conceptState,
  streak,
  startSession,
  startDsa,
  openProgress,
}) {
  const total = todaySet.length;
  const totalAtoms = total + (dsaEnabled ? 1 : 0);
  const completedAtoms = completedCount + dsaAttempts.length;
  const percent = totalAtoms ? Math.round((completedAtoms / totalAtoms) * 100) : 0;
  const selectedSubjects = settings.selectedCourses.filter((course) => SUBJECTS.includes(course));
  const mix = SUBJECTS.map((subject) => {
    const questions = todaySet.filter((question) => question.subject === subject);
    const concepts = [...new Set(questions.map((question) => question.concept))];
    const states = uniqueMcqConceptsForSubject(subject)
      .map(({ key }) => conceptState[key])
      .filter(Boolean);
    const mastery = states.length
      ? Math.round(states.reduce((sum, state) => sum + state.mastery, 0) / states.length)
      : 0;
    return { subject, questions: questions.length, concepts, mastery };
  }).filter((item) => selectedSubjects.includes(item.subject));

  return (
    <div className="screen today-screen view-enter">
      <section className="hero-row">
        <div>
          <p className="eyebrow">PlacementPrep</p>
          <h1>Good morning.</h1>
        </div>
        <p className="date-label">{readableDate()}</p>
      </section>

      <section className="session-card dashboard-hero-card">
        <ProgressRing percent={percent} label={`${completedAtoms} / ${totalAtoms}`} />
        <div className="session-copy">
          <p className="eyebrow">Today's Session</p>
          <h2>{totalAtoms} practice atoms ready</h2>
          <p>
            Est. {Math.max(8, totalAtoms * 2)} min - {settings.selectedCourses.join(" - ")} - mixed difficulty
          </p>
          <div className="subject-chip-row" aria-label="Selected courses">
            {settings.selectedCourses.map((course) => (
              <span key={course} style={{ "--chip-accent": SUBJECT_META[course]?.accent }}>
                {course}
              </span>
            ))}
          </div>
        </div>
        <button className="primary-button" onClick={startSession}>
          {completedCount > 0 ? "Continue Session" : "Start Session"}
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </section>

      {dsaEnabled && dsaPrompt && (
        <section className="dsa-teaser">
          <div className="dsa-teaser-copy">
            <span className="course-icon">
              <Brain size={18} aria-hidden="true" />
            </span>
            <div>
              <p className="eyebrow">DSA logic drill</p>
              <h2>{dsaPrompt.concept}</h2>
              <p>{dsaPrompt.prompt}</p>
            </div>
          </div>
          <button className="dark-button" onClick={startDsa}>
            Practice DSA
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </section>
      )}

      <section className="streak-strip">
        <div className="streak-main">
          <Flame size={20} aria-hidden="true" />
          <strong>{streak.current}</strong>
          <span>day streak</span>
        </div>
        <span className="stat-divider" />
        <span>Longest: {streak.longest} days</span>
        <div className="history-dots" aria-label="Recent streak history">
          <span>Today</span>
          {streak.history.slice(-7).map((day) => (
            <span
              key={day.date}
              className={classNames("history-dot", day.completed && "done")}
              title={`${day.date}: ${day.completed ? "completed" : "open"}`}
            />
          ))}
        </div>
      </section>

      <section className="today-planner" aria-label="Daily plan">
        <article className="planner-card dark">
          <div>
            <p className="eyebrow">Focus window</p>
            <strong>{settings.interviewMode ? "Timed practice" : "Open practice"}</strong>
            <span>{settings.interviewMode ? "30 second pressure per question" : "Hints and lesson links enabled"}</span>
          </div>
          <Timer size={22} aria-hidden="true" />
        </article>
        <article className="planner-card amber">
          <div>
            <p className="eyebrow">Reminder</p>
            <strong>{settings.remindersEnabled ? settings.reminderTime : "Off"}</strong>
            <span>{settings.dailyGoal} questions planned</span>
          </div>
          <Bell size={22} aria-hidden="true" />
        </article>
      </section>

      <section className="mix-section">
        <div className="section-heading">
          <p className="eyebrow">Today's mix</p>
          <button className="text-button" onClick={openProgress}>View mastery</button>
        </div>
        <div className="mix-list">
          {mix.map((item) => (
            <div
              className="mix-row"
              key={item.subject}
              style={{ "--subject-accent": SUBJECT_META[item.subject].accent }}
            >
              <span className="subject-code">{item.subject}</span>
              <span className="concept-list">
                {item.concepts.length ? item.concepts.join(" - ") : "No questions today"}
              </span>
              <span className="mini-track" aria-hidden="true">
                <span style={{ width: `${item.mastery}%` }} />
              </span>
              <span className="mastery-value">{item.mastery}%</span>
            </div>
          ))}
        </div>
      </section>

      <section className="quick-grid" aria-label="Session signals">
        <MetricCard label="Answered" value={`${attempts.length}`} detail="Today" />
        {dsaEnabled ? (
          <MetricCard label="DSA rated" value={`${dsaAttempts.length}`} detail="Self-graded" />
        ) : null}
        <MetricCard label="Due reviews" value={`${todaySet.filter((q) => conceptState[questionConceptKey(q)]?.dueAt <= dateKey()).length}`} detail="SM-2 pull" />
        <MetricCard label="Weakest" value={dsaEnabled ? "DSA" : "CN"} detail={dsaEnabled ? "Sliding Window" : "Caching and TLS"} />
      </section>
    </div>
  );
}

function QuestionView({
  question,
  total,
  currentIndex,
  selectedIndex,
  cardSide,
  responseOutcome,
  chooseOption,
  blankOut,
  flip,
  nextQuestion,
  openLesson,
  goToday,
}) {
  const answered = selectedIndex !== null;
  const isCorrect = responseOutcome === "correct";
  const chosenOption = selectedIndex >= 0 ? question.options[selectedIndex] : null;
  const [confidence, setConfidence] = useState("medium");

  useEffect(() => {
    setConfidence("medium");
  }, [question.id]);

  return (
    <div className="question-screen view-enter">
      <div className="question-top">
        <button className="ghost-button compact" onClick={goToday}>
          <ChevronLeft size={16} aria-hidden="true" />
          Today
        </button>
        <div className="question-context">
          <span className="pill neutral">{question.subject}</span>
          <span>{question.concept}</span>
        </div>
        <span className="question-count">{currentIndex + 1} of {total}</span>
      </div>

      <div className="segment-row" aria-hidden="true">
        {Array.from({ length: total }).map((_, index) => (
          <span key={index} className={index <= currentIndex ? "filled" : ""} />
        ))}
      </div>

      <section className="card-stage">
        <div className={classNames("flip-card", cardSide === "back" && "flipped")}>
          <article className="question-card card-face front-face">
            <div className="pill-row">
              <span className="pill neutral">Scenario</span>
              <span className="pill accent">{question.difficulty}</span>
            </div>
            <p className="question-stem">{question.stem}</p>
            <div className="confidence-row" aria-label="Confidence rating">
              <span>Confidence</span>
              {["low", "medium", "high"].map((level) => (
                <button
                  key={level}
                  className={classNames(confidence === level && "selected")}
                  onClick={() => setConfidence(level)}
                  disabled={answered}
                >
                  {level}
                </button>
              ))}
            </div>
            <div className="options-list">
              {question.options.map((option, index) => {
                const optionState =
                  answered && index === question.correctIndex
                    ? "correct"
                    : answered && index === selectedIndex
                      ? "wrong"
                      : answered
                        ? "muted"
                        : "";
                return (
                  <button
                    key={option.text}
                    className={classNames("option-button", optionState)}
                    onClick={() => chooseOption(index)}
                    disabled={answered}
                  >
                    <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                    <span>
                      <strong>{option.text}</strong>
                      <small>{option.sub}</small>
                    </span>
                  </button>
                );
              })}
            </div>
            {answered ? (
              <div className="answer-bar">
                <Verdict outcome={responseOutcome} />
                <button className="dark-button" onClick={flip}>
                  See explanation
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div className="skip-row">
                <button className="text-button" onClick={blankOut}>
                  I don't know - show lesson
                </button>
              </div>
            )}
          </article>

          <article className="question-card card-face back-face">
            <div className="explanation-head">
              <div>
                <p className="eyebrow">
                  {selectedIndex === -1 ? "Full Lesson" : isCorrect ? "Pro Tip" : "Targeted Fix"}
                </p>
                <h2>{question.options[question.correctIndex].text}</h2>
              </div>
              {responseOutcome && <Verdict outcome={responseOutcome} />}
            </div>

            <div className="explanation-body">
              <div className="concept-chain">
                <span>{question.subject}</span>
                <ChevronRight size={14} aria-hidden="true" />
                <span>{question.concept}</span>
                <ChevronRight size={14} aria-hidden="true" />
                <span>{question.options[question.correctIndex].text}</span>
              </div>
              {isCorrect ? (
                <>
                  <p>{question.proTip}</p>
                  <div className="callout success">
                    <p className="eyebrow">Connects to</p>
                    <p>{connectionText(question.subject)}</p>
                  </div>
                </>
              ) : selectedIndex === -1 ? (
                <>
                  <p>{question.lesson}</p>
                  <div className="callout lesson">
                    <p className="eyebrow">Remember</p>
                    <p>{question.options[question.correctIndex].sub}</p>
                  </div>
                </>
              ) : (
                <>
                  <p>{chosenOption?.fix}</p>
                  <div className="callout warning">
                    <p className="eyebrow">Key distinction</p>
                    <p>
                      The correct answer is <strong>{question.options[question.correctIndex].text}</strong>:{" "}
                      {question.options[question.correctIndex].sub.toLowerCase()}.
                    </p>
                  </div>
                  <p className="fix-note">
                    Fix: anchor on what changed in the scenario before matching it to a named concept.
                  </p>
                </>
              )}
            </div>

            <div className="card-actions">
              <button className="text-button" onClick={() => openLesson(question.id)}>
                <BookOpen size={15} aria-hidden="true" />
                See full lesson
              </button>
              <button className="primary-button small" onClick={nextQuestion}>
                {currentIndex + 1 >= total ? "Finish set" : "Next question"}
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

function DsaView({ prompt, attempts, recordDsaAttempt, goToday, goProgress }) {
  const [draft, setDraft] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [rated, setRated] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef(null);
  const alreadyRated = attempts.find((attempt) => attempt.promptId === prompt?.id);
  const speechRecognition =
    typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
  const canTranscribe = Boolean(speechRecognition);
  const voiceStatus =
    voiceError ||
    interimTranscript ||
    (isListening ? "Listening..." : canTranscribe ? "Ready for dictation." : "Voice unavailable in this browser.");

  useEffect(() => {
    setDraft("");
    setRevealed(false);
    setRated(null);
    setVoiceError("");
    setInterimTranscript("");
    setIsListening(false);
    recognitionRef.current?.stop();
  }, [prompt?.id]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  if (!prompt) {
    return (
      <div className="screen summary-screen view-enter">
        <article className="summary-paper">
          <p className="eyebrow">DSA</p>
          <h1>No DSA course selected</h1>
          <p className="summary-lede">Turn on DSA Logic from Settings to add self-graded drills.</p>
          <div className="summary-actions">
            <button className="primary-button" onClick={goToday}>Back to today</button>
          </div>
        </article>
      </div>
    );
  }

  function rate(rating) {
    if (alreadyRated || rated) return;
    recordDsaAttempt(prompt, rating, draft);
    setRated(rating);
  }

  function appendTranscript(text) {
    const cleaned = text.trim();
    if (!cleaned) return;
    setDraft((current) => {
      const separator = current.trim().length ? " " : "";
      return `${current}${separator}${cleaned}`;
    });
  }

  function toggleVoiceDraft() {
    if (!canTranscribe) {
      setVoiceError("Voice dictation is not available in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setInterimTranscript("");
      return;
    }

    const recognition = new speechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceError("");
      setInterimTranscript("");
    };

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0]?.transcript || "";
        if (event.results[index].isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }
      appendTranscript(finalText);
      setInterimTranscript(interimText.trim());
    };

    recognition.onerror = (event) => {
      const message =
        event.error === "not-allowed"
          ? "Allow microphone access to use voice dictation."
          : "Voice dictation stopped. Try again when your mic is ready.";
      setVoiceError(message);
      setIsListening(false);
      setInterimTranscript("");
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    try {
      recognition.start();
    } catch {
      setVoiceError("Voice dictation is already starting. Try again in a moment.");
    }
  }

  return (
    <div className="screen dsa-screen view-enter">
      <div className="question-top inline">
        <button className="ghost-button compact" onClick={goToday}>
          <ChevronLeft size={16} aria-hidden="true" />
          Today
        </button>
        <div className="question-context">
          <span className="pill neutral">DSA</span>
          <span>{prompt.concept}</span>
        </div>
        <span className="question-count">{prompt.difficulty}</span>
      </div>

      <section className="dsa-card">
        <div className="dsa-prompt">
          <p className="eyebrow">Explain the logic</p>
          <h1>{prompt.concept}</h1>
          <p>{prompt.prompt}</p>
          <div className="hint-row">
            {prompt.hints.map((hint) => (
              <span key={hint}>
                <Lightbulb size={14} aria-hidden="true" />
                {hint}
              </span>
            ))}
          </div>
        </div>

        <label className="answer-draft">
          <span className="draft-label-row">
            <span>Your approach</span>
            <button
              type="button"
              className={classNames("voice-button", isListening && "listening")}
              onClick={toggleVoiceDraft}
              disabled={!canTranscribe}
              aria-pressed={isListening}
              aria-label={
                !canTranscribe ? "Voice dictation unavailable" : isListening ? "Stop voice dictation" : "Start voice dictation"
              }
            >
              {isListening ? <MicOff size={16} aria-hidden="true" /> : <Mic size={16} aria-hidden="true" />}
              <span>{!canTranscribe ? "Unavailable" : isListening ? "Stop" : "Speak"}</span>
            </button>
          </span>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Write the algorithm, key invariant, edge cases, and complexity..."
          />
          <span className={classNames("voice-status", isListening && "active", (voiceError || !canTranscribe) && "error")}>
            {voiceStatus}
          </span>
        </label>

        <div className="dsa-actions">
          <button className="ghost-button" onClick={() => setRevealed(true)}>
            Reveal model answer
          </button>
          {alreadyRated || rated ? (
            <button className="primary-button" onClick={goProgress}>
              View progress
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {revealed && (
          <div className="model-answer reveal-panel">
            <p className="eyebrow">Model answer</p>
            <p>{prompt.modelAnswer}</p>
            <div className="rubric-grid">
              {prompt.rubric.map((item) => (
                <span key={item}>
                  <Check size={14} aria-hidden="true" />
                  {item}
                </span>
              ))}
            </div>
            <div className="rating-row">
              <p className="eyebrow">Self-rate honestly</p>
              {["again", "hard", "good", "easy"].map((rating) => (
                <button
                  key={rating}
                  className={classNames("rating-button", (rated || alreadyRated?.outcome) === rating && "selected")}
                  onClick={() => rate(rating)}
                  disabled={Boolean(alreadyRated || rated)}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function LessonView({ question, onBack }) {
  return (
    <div className="screen lesson-screen">
      <button className="ghost-button compact" onClick={onBack}>
        <ChevronLeft size={16} aria-hidden="true" />
        Back
      </button>
      <article className="lesson-paper lesson-document">
        <aside className="lesson-toc">
          <p className="eyebrow">Lesson map</p>
          <span className="active">Core idea</span>
          <span>Signal words</span>
          <span>Interview link</span>
          <span>Practice</span>
        </aside>
        <div className="lesson-main">
          <p className="eyebrow">{question.subject} - {question.concept}</p>
          <h1>{question.options[question.correctIndex].text}</h1>
          <p>{question.lesson}</p>
          <div className="lesson-code-card">
            <p className="eyebrow">Mental model</p>
            <code>
              scenario - signal - concept - tradeoff - answer
            </code>
          </div>
          <div className="lesson-grid">
            <div>
              <p className="eyebrow">Question signal</p>
              <p>{question.stem}</p>
            </div>
            <div>
              <p className="eyebrow">Pro tip</p>
              <p>{question.proTip}</p>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

function SummaryView({ todaySet, attempts, streak, accuracy, goToday, openProgress }) {
  const correct = attempts.filter((attempt) => attempt.outcome === "correct").length;
  const concepts = [...new Set(todaySet.map((question) => question.concept))];
  const wrong = attempts.filter((attempt) => attempt.outcome === "wrong").length;

  return (
    <div className="screen summary-screen">
      <article className="summary-paper summary-celebration">
        <div className="summary-badge">
          <Flame size={24} aria-hidden="true" />
          <span>{streak.current} day streak</span>
        </div>
        <p className="eyebrow">Set complete</p>
        <h1>Nice work today.</h1>
        <p className="summary-lede">
          {correct} of {todaySet.length} correct. Today's concepts are back in the review scheduler.
        </p>
        <div className="summary-grid">
          <MetricCard label="Accuracy" value={`${accuracy}%`} detail="All attempts" />
          <MetricCard label="Concepts" value={`${concepts.length}`} detail={concepts.slice(0, 2).join(" - ")} />
          <MetricCard label="Longest" value={`${streak.longest}`} detail="day streak" />
        </div>
        <div className="mastery-delta">
          <div className="delta-row positive">
            <span>Strongest today</span>
            <strong>{concepts[0] || "Daily review"} +8%</strong>
          </div>
          <div className="delta-row warning">
            <span>Review again</span>
            <strong>{wrong ? `${wrong} target fixes` : "No misses"}</strong>
          </div>
        </div>
        <div className="summary-actions">
          <button className="ghost-button" onClick={goToday}>Back to today</button>
          <button className="primary-button" onClick={openProgress}>
            Open progress
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </article>
    </div>
  );
}

function ProgressView({ conceptState, attempts, dsaAttempts, streak, accuracy, selectedCourses }) {
  const activeSubjects = selectedCourses.filter((course) => SUBJECTS.includes(course));
  const subjectRows = activeSubjects.map((subject) => {
    const concepts = uniqueMcqConceptsForSubject(subject);
    const mastery = Math.round(
      concepts.reduce((sum, concept) => sum + (conceptState[concept.key]?.mastery || 0), 0) / concepts.length,
    );
    return { subject, concepts, mastery };
  });
  const visibleMcqConcepts = activeSubjects.flatMap((subject) =>
    uniqueMcqConceptsForSubject(subject).map(({ key, label }) => [key, conceptState[key], label]),
  );
  const visibleDsaConcepts = selectedCourses.includes("DSA")
    ? DSA_PROMPTS.map((prompt) => {
        const key = dsaConceptKey(prompt);
        return [key, conceptState[key], prompt.concept];
      })
    : [];
  const visibleConcepts = [...visibleMcqConcepts, ...visibleDsaConcepts]
    .filter(([, state]) => Boolean(state));
  const weakConcepts = visibleConcepts
    .sort((a, b) => a[1].mastery - b[1].mastery)
    .slice(0, 4);
  const strongConcepts = visibleConcepts
    .sort((a, b) => b[1].mastery - a[1].mastery)
    .slice(0, 3);

  return (
    <div className="screen progress-screen view-enter">
      <section className="page-heading">
        <p className="eyebrow">Progress</p>
        <h1>Mastery map</h1>
      </section>
      <section className="analytics-grid">
        <MetricCard label="Accuracy" value={`${accuracy}%`} detail={`${attempts.length} total attempts`} />
        <MetricCard label="DSA reps" value={`${dsaAttempts.length}`} detail="Self-graded" />
        <MetricCard label="Current streak" value={`${streak.current}`} detail={`Longest ${streak.longest}`} />
        <MetricCard label="Reviews due" value={`${visibleConcepts.filter(([, state]) => state.dueAt <= dateKey()).length}`} detail="Today" />
      </section>
      <section className="heatmap-panel">
        <div className="section-heading">
          <p className="eyebrow">Subjects</p>
          <span>SM-2 mastery</span>
        </div>
        <div className="activity-panel">
          <div>
            <p className="eyebrow">Activity heatmap</p>
            <strong>{streak.current} day streak</strong>
            <span>Consistency beats cramming.</span>
          </div>
          <div className="activity-grid" aria-label="Practice activity">
            {CALENDAR_LEVELS.map((level, index) => (
              <span key={`${level}-${index}`} className={`level-${level}`} />
            ))}
          </div>
        </div>
        <div className="heatmap">
          {subjectRows.map((row) => (
            <div className="subject-block" key={row.subject}>
              <div className="subject-head">
                <strong>{row.subject}</strong>
                <span>{row.mastery}%</span>
              </div>
              <div className="concept-grid">
                {row.concepts.map((concept) => {
                  const mastery = conceptState[concept.key]?.mastery || 0;
                  return (
                    <span
                      key={concept.key}
                      className="concept-cell"
                      style={{ "--mastery": `${mastery}%` }}
                      title={`${concept.label}: ${mastery}%`}
                    >
                      {concept.label}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
          {selectedCourses.includes("DSA") && (
            <div className="subject-block">
              <div className="subject-head">
                <strong>DSA</strong>
                <span>
                  {Math.round(
                    DSA_PROMPTS.reduce((sum, prompt) => sum + (conceptState[dsaConceptKey(prompt)]?.mastery || 0), 0) /
                      DSA_PROMPTS.length,
                  )}%
                </span>
              </div>
              <div className="concept-grid">
                {DSA_PROMPTS.map((prompt) => (
                  <span
                    key={dsaConceptKey(prompt)}
                    className="concept-cell"
                    style={{ "--mastery": `${conceptState[dsaConceptKey(prompt)]?.mastery || 0}%` }}
                  >
                    {prompt.concept}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
      <section className="insight-columns">
        <ConceptList title="Strengths" concepts={strongConcepts} />
        <ConceptList title="Weak areas" concepts={weakConcepts} />
        <div className="small-panel">
          <p className="eyebrow">Streak history</p>
          <div className="calendar-strip">
            {streak.history.slice(-14).map((day) => (
              <span key={day.date} className={classNames("calendar-day", day.completed && "done")}>
                {new Date(`${day.date}T00:00:00`).getDate()}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function SettingsView({ settings, updateGoal, toggleSubject, toggleCourse, updatePreference, regenerateSet, openCourseSetup }) {
  return (
    <div className="screen settings-screen view-enter">
      <section className="page-heading">
        <p className="eyebrow">Settings</p>
        <h1>Daily loop</h1>
      </section>
      <section className="settings-layout">
        <div className="settings-panel primary-settings">
          <div className="setting-section">
            <div className="section-heading">
              <p className="eyebrow">Daily goal</p>
              <span>~{Math.max(8, settings.dailyGoal * 2)} min</span>
            </div>
            <div className="goal-number compact">
              <span>{settings.dailyGoal}</span>
              <small>questions/day</small>
            </div>
            <div className="stepper">
              <button
                className="icon-button"
                onClick={() => updateGoal(Math.max(3, settings.dailyGoal - 1))}
                aria-label="Decrease daily goal"
              >
                -
              </button>
              <input
                type="range"
                min="3"
                max="10"
                value={settings.dailyGoal}
                onChange={(event) => updateGoal(event.target.value)}
                aria-label="Daily goal"
              />
              <button
                className="icon-button"
                onClick={() => updateGoal(Math.min(10, settings.dailyGoal + 1))}
                aria-label="Increase daily goal"
              >
                +
              </button>
            </div>
          </div>

          <div className="setting-section">
            <div className="section-heading">
              <p className="eyebrow">Active subjects</p>
              <button className="text-button" onClick={openCourseSetup}>Full setup</button>
            </div>
            <div className="subject-toggles">
              {COURSE_OPTIONS.map((course) => (
                <button
                  key={course.id}
                  className={classNames("toggle-chip", settings.selectedCourses.includes(course.id) && "enabled")}
                  style={{ "--chip-accent": SUBJECT_META[course.id].accent }}
                  onClick={() => course.type === "mcq" ? toggleSubject(course.id) : toggleCourse(course.id)}
                >
                  {settings.selectedCourses.includes(course.id) ? <Check size={15} /> : <X size={15} />}
                  {course.id}
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="settings-panel settings-cards">
          <button
            className={classNames("setting-feature-card dark", settings.interviewMode && "enabled")}
            onClick={() => updatePreference("interviewMode", !settings.interviewMode)}
          >
            <span>
              <p className="eyebrow">Interview mode</p>
              <strong>{settings.interviewMode ? "Timed practice" : "Open practice"}</strong>
              <small>Timer, no hints, placement pressure.</small>
            </span>
            <span className="toggle-switch" aria-hidden="true" />
          </button>

          <button
            className={classNames("setting-feature-card", settings.remindersEnabled && "enabled")}
            onClick={() => updatePreference("remindersEnabled", !settings.remindersEnabled)}
          >
            <span>
              <p className="eyebrow">Daily nudge</p>
              <strong>{settings.reminderTime}</strong>
              <small>Keep the habit warm.</small>
            </span>
            <Bell size={20} aria-hidden="true" />
          </button>

          <button className="setting-feature-card danger" onClick={regenerateSet}>
            <span>
              <p className="eyebrow">Today</p>
              <strong>Rebuild set</strong>
              <small>Use due reviews and weak areas.</small>
            </span>
            <RotateCcw size={20} aria-hidden="true" />
          </button>

          <button className="setting-feature-card" type="button">
            <span>
              <p className="eyebrow">Account</p>
              <strong>Export progress data</strong>
              <small>Local progress snapshot.</small>
            </span>
            <Download size={20} aria-hidden="true" />
          </button>
        </aside>
      </section>
    </div>
  );
}

function ProgressRing({ percent, label }) {
  return (
    <div className="progress-ring" style={{ "--percent": `${percent}%` }} aria-label={`Daily progress ${label}`}>
      <span>{label}</span>
    </div>
  );
}

function MetricCard({ label, value, detail }) {
  return (
    <article className="metric-card">
      <p className="eyebrow">{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  );
}

function Verdict({ outcome }) {
  if (!outcome) return null;
  const icon = outcome === "correct" ? <Check size={14} /> : outcome === "wrong" ? <X size={14} /> : <BookOpen size={14} />;
  const text = outcome === "correct" ? "Correct" : outcome === "wrong" ? "Wrong" : "Lesson";
  return <span className={classNames("verdict", outcome)}>{icon}{text}</span>;
}

function ConceptList({ title, concepts }) {
  return (
    <div className="small-panel">
      <p className="eyebrow">{title}</p>
      <div className="concept-list-panel">
        {concepts.map(([concept, state, label]) => (
          <div key={concept}>
            <span>{label || state.label || concept}</span>
            <strong>{state.mastery}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function connectionText(subject) {
  const map = {
    DBMS: "Isolation levels connect directly to transactions, MVCC, locks, and query consistency under concurrency.",
    OS: "Scheduling choices connect to latency, context switching cost, fairness, and starvation.",
    CN: "Network concepts stack together: DNS, TCP, TLS, HTTP, caching, and load balancing all affect one request.",
    OOP: "Design choices connect to coupling, cohesion, testability, and how easily a codebase accepts new behavior.",
  };
  return map[subject] || "The concept connects to neighboring ideas in the placement prep map.";
}
