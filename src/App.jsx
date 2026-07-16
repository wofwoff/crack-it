import { useCallback, useEffect, useMemo, useRef, useState, Fragment } from "react";
import {
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  Check,
  ChevronLeft,
  ChevronRight,
  Code2,
  Copy,
  Download,
  Flame,
  Home,
  LogIn,
  Lightbulb,
  Loader2,
  Mic,
  MicOff,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Move,
  RotateCcw,
  Send,
  Settings,
  Sparkles,
  Target,
  Timer,
  X,
  Columns,
  LayoutGrid,
} from "lucide-react";
import { QUESTIONS, DSA_PROMPTS, INTERACTIVE_QUESTIONS } from "./content";
import { CHEATSHEETS } from "./cheatsheets";
import {
  generateApplicationInterviewQuestions,
  gradeDsaAnswer,
  explainDsaMistake,
  followUpQuestion,
  isAiConfigured,
} from "./llm";
import {
  getLocalProgressUpdatedAt,
  getProgressSyncId,
  isProgressSyncConfigured,
  loadRemoteProgress,
  markLocalProgressUpdated,
  normalizeProgressSyncId,
  progressSyncDescription,
  saveRemoteProgress,
  setProgressSyncId,
  saveStorageItem,
} from "./sync";

const isIosApp = typeof window !== "undefined" && (
  (window.Capacitor && window.Capacitor.platform === "ios") ||
  /iPad|iPhone|iPod/.test(navigator.userAgent)
);

const STORAGE_KEY = "placement-prep-v2";
const STATE_SCHEMA_VERSION = 5;
const AI_TOOLS_ENABLED = isAiConfigured && import.meta.env.VITE_ENABLE_AI_TOOLS === "true";
const SUBJECTS = ["DBMS", "OS", "CN", "OOP", "CPP", "PYTHON", "OA"];
const SUBJECT_META = {
  DBMS: { name: "DBMS", detail: "Transactions, indexes, normalization", accent: "#c87a28" },
  OS: { name: "OS", detail: "CPU, memory, locks, deadlocks", accent: "#d65a4a" },
  CN: { name: "CN", detail: "TCP/IP, TLS, HTTP, DNS", accent: "#2e8f82" },
  OOP: { name: "OOP", detail: "SOLID, patterns, design tradeoffs", accent: "#6e78d8" },
  CPP: { name: "C++", detail: "Memory, references, STL, RAII", accent: "#4a5a8f" },
  PYTHON: { name: "Python", detail: "GIL, mutability, generators, scoping", accent: "#3d7a4f" },
  OA: { name: "Logical Aptitude", detail: "Series, arrangements, syllogisms, coding, directions", accent: "#8a5a9e" },
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
    id: "CPP",
    title: "C++",
    subtitle: "Memory, references, STL, RAII, ownership",
    type: "mcq",
  },
  {
    id: "PYTHON",
    title: "Python",
    subtitle: "GIL, mutability, generators, scoping, decorators",
    type: "mcq",
  },
  {
    id: "OA",
    title: "Logical Aptitude",
    subtitle: "Aptitude reasoning, puzzles, and placement logic",
    type: "mcq",
  },
  {
    id: "DSA",
    title: "DSA Logic",
    subtitle: "Explain the approach, compare, self-rate",
    type: "dsa",
  },
];
const DEFAULT_SELECTED_COURSES = COURSE_OPTIONS.map((course) => course.id);
const CORRECT_POINTS = { correct: 1, wrong: 0, blank: 0 };
const CONTENT_BANK_SIGNATURE = [
  QUESTIONS.length,
  DSA_PROMPTS.length,
  INTERACTIVE_QUESTIONS.length,
  QUESTIONS.map((question) => question.id).join(","),
  DSA_PROMPTS.map((prompt) => prompt.id).join(","),
  INTERACTIVE_QUESTIONS.map((q) => q.id).join(","),
].join("|");

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

function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
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

function addCourseBeforeDsa(courses, courseId) {
  if (courses.includes(courseId)) return courses;
  const dsaIndex = courses.indexOf("DSA");
  if (dsaIndex === -1) return [...courses, courseId];
  return [...courses.slice(0, dsaIndex), courseId, ...courses.slice(dsaIndex)];
}

function questionConceptKey(question) {
  return `${question.subject}:${question.concept}`;
}

function dsaConceptKey(prompt) {
  return `DSA:${prompt.concept}`;
}

function subjectLabel(subject) {
  return SUBJECT_META[subject]?.name || subject;
}

export function parseAndFormatCode(text) {
  if (typeof text !== "string") return text;
  if (!text) return "";

  // Split by block code blocks first: ```[optional lang]\n...```
  const blockRegex = /(```[\s\S]*?```)/g;
  const parts = text.split(blockRegex);

  return parts.map((part, index) => {
    // Check if the part is a code block
    if (part.startsWith("```") && part.endsWith("```")) {
      const rawCode = part.slice(3, -3);
      let codeContent = rawCode;

      // Extract optional language specifier from the first line
      const lines = codeContent.split("\n");
      if (lines.length > 0) {
        const firstLine = lines[0].trim();
        const knownLanguages = new Set([
          "python", "py",
          "cpp", "c++", "c",
          "sql",
          "javascript", "js",
          "html", "css",
          "bash", "sh",
          "java", "json",
          "rust",
          "typescript", "ts"
        ]);
        if (knownLanguages.has(firstLine.toLowerCase())) {
          codeContent = lines.slice(1).join("\n");
        }
      }

      // Trim leading/trailing blank lines/newlines (while keeping indentation)
      codeContent = codeContent.replace(/^\n+/, "").replace(/\n+$/, "");

      return (
        <pre key={`block-${index}`} className="code-block">
          <code>{codeContent}</code>
        </pre>
      );
    }

    // It's normal text or inline code. Split by inline code: `code`
    const inlineRegex = /(`[^`]+`)/g;
    const subParts = part.split(inlineRegex);

    return (
      <Fragment key={`text-block-${index}`}>
        {subParts.map((subPart, subIdx) => {
          if (subPart.startsWith("`") && subPart.endsWith("`")) {
            const inlineCode = subPart.slice(1, -1);
            return <code key={`inline-${index}-${subIdx}`}>{inlineCode}</code>;
          }

          // Plain text - convert newlines to <br /> elements
          const textLines = subPart.split("\n");
          return textLines.reduce((acc, line, lineIdx) => {
            if (lineIdx > 0) {
              acc.push(<br key={`br-${index}-${subIdx}-${lineIdx}`} />);
            }
            if (line) {
              acc.push(line);
            }
            return acc;
          }, []);
        })}
      </Fragment>
    );
  });
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

// Returns concepts for a subject that are both in the CHEATSHEETS and have at least one question.
// The progress breakdown should only track topics the app actually teaches.
function cheatsheetConceptsForSubject(subject) {
  const cheatsheetTopics = new Set((CHEATSHEETS[subject] || []).map((t) => t.topic));
  const seen = new Set();
  return QUESTIONS.filter((q) => q.subject === subject && cheatsheetTopics.has(q.concept)).reduce((concepts, q) => {
    const key = questionConceptKey(q);
    if (!seen.has(key)) {
      seen.add(key);
      concepts.push({ key, label: q.concept, subject });
    }
    return concepts;
  }, []);
}

function buildInterviewQuestionScope(selectedCourses) {
  const selectedSubjects = selectedCourses.filter((course) => SUBJECTS.includes(course));
  const fallbackSubjects = SUBJECTS.filter((subject) => subject !== "OA");
  return (selectedSubjects.length ? selectedSubjects : fallbackSubjects)
    .map((subject) => ({
      subject,
      concepts: uniqueMcqConceptsForSubject(subject).map(({ label }) => ({ label })),
    }))
    .filter((item) => item.concepts.length);
}

function defaultConceptState() {
  const mcqState = QUESTIONS.reduce((acc, question) => {
    const key = questionConceptKey(question);
    if (acc[key]) return acc;
    acc[key] = {
      label: question.concept,
      subject: question.subject,
      type: "mcq",
      ease: 2.5,
      interval: 0,
      dueAt: dateKey(),
      reps: 0,
      lapses: 0,
      mastery: 0,
      lastSeen: null,
    };
    return acc;
  }, {});
  return DSA_PROMPTS.reduce((acc, prompt) => {
    const key = dsaConceptKey(prompt);
    acc[key] = {
      label: prompt.concept,
      subject: "DSA",
      type: "dsa",
      ease: 2.5,
      interval: 0,
      dueAt: dateKey(),
      reps: 0,
      lapses: 0,
      mastery: 0,
      lastSeen: null,
    };
    return acc;
  }, mcqState);
}

function subjectQuestionCoverage(subject, attempts) {
  const subjectQuestionIds = new Set(QUESTIONS.filter((question) => question.subject === subject).map((q) => q.id));
  const attemptedIds = new Set(
    attempts.filter((attempt) => subjectQuestionIds.has(attempt.questionId)).map((attempt) => attempt.questionId),
  );
  return { completed: attemptedIds.size, total: subjectQuestionIds.size };
}

function dsaCoverage(dsaAttempts) {
  const attemptedIds = new Set(dsaAttempts.map((attempt) => attempt.promptId));
  return { completed: attemptedIds.size, total: DSA_PROMPTS.length };
}

function buildActivityLevels(attempts, dsaAttempts, days = 60) {
  const countsByDate = {};
  [...attempts, ...dsaAttempts].forEach((attempt) => {
    countsByDate[attempt.date] = (countsByDate[attempt.date] || 0) + 1;
  });
  const levels = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = dateKey(new Date(Date.now() - offset * 86400000));
    const count = countsByDate[date] || 0;
    const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : 3;
    levels.push(level);
  }
  return levels;
}

function createInitialState() {
  return {
    settings: {
      dailyGoal: 7,
      activeSubjects: SUBJECTS,
      selectedCourses: DEFAULT_SELECTED_COURSES,
      remindersEnabled: true,
      reminderTime: "9:00 AM",
      interviewMode: true,
    },
    hasCompletedCourseSetup: false,
    conceptState: defaultConceptState(),
    streak: {
      current: 0,
      longest: 0,
      lastActiveDate: null,
      history: [],
    },
    attempts: [],
    dsaAttempts: [],
    interactiveAttempts: [],
    dailySet: null,
    oaCourseAddedToSelection: true,
    contentBankSignature: CONTENT_BANK_SIGNATURE,
    stateSchemaVersion: STATE_SCHEMA_VERSION,
  };
}

function normalizeSavedState(saved) {
  if (!saved || saved.stateSchemaVersion !== STATE_SCHEMA_VERSION) {
    return createInitialState();
  }

  const hasCurrentContent = saved.contentBankSignature === CONTENT_BANK_SIGNATURE;
  const savedSelectedCourses =
    saved.settings?.selectedCourses ||
    [...new Set([...(saved.settings?.activeSubjects || SUBJECTS), "DSA"])];
  const selectedCourses =
    saved.oaCourseAddedToSelection === true
      ? savedSelectedCourses
      : addCourseBeforeDsa(savedSelectedCourses, "OA");

  return {
    ...createInitialState(),
    ...saved,
    contentBankSignature: CONTENT_BANK_SIGNATURE,
    stateSchemaVersion: STATE_SCHEMA_VERSION,
    oaCourseAddedToSelection: true,
    settings: {
      ...createInitialState().settings,
      ...saved.settings,
      selectedCourses,
      activeSubjects: selectedCourses.filter((course) => SUBJECTS.includes(course)),
    },
    conceptState: { ...defaultConceptState(), ...saved.conceptState },
    dsaAttempts: saved.dsaAttempts || [],
    interactiveAttempts: saved.interactiveAttempts || [],
    dailySet: hasCurrentContent ? saved.dailySet : null,
  };
}

function loadStateSnapshot() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { state: createInitialState(), status: "missing" };
    }

    const saved = JSON.parse(raw);
    if (saved.stateSchemaVersion !== STATE_SCHEMA_VERSION) {
      return { state: createInitialState(), status: "invalid" };
    }

    return { state: normalizeSavedState(saved), status: "valid" };
  } catch {
    return { state: createInitialState(), status: "invalid" };
  }
}

function loadState() {
  return loadStateSnapshot().state;
}

function composeDailySet(settings, conceptState) {
  const today = dateKey();
  const activeSubjects = (settings.selectedCourses?.filter((course) => SUBJECTS.includes(course)) || settings.activeSubjects).filter(
    (subject) => subject !== "OA",
  );
  const rankQuestions = (questions) => [...questions].sort((a, b) => {
    const aState = conceptState[questionConceptKey(a)] || {};
    const bState = conceptState[questionConceptKey(b)] || {};
    const aDue = (aState.dueAt || today) <= today ? 0 : 1;
    const bDue = (bState.dueAt || today) <= today ? 0 : 1;
    if (aDue !== bDue) return aDue - bDue;
    return (aState.mastery || 0) - (bState.mastery || 0);
  });
  const queues = activeSubjects
    .map((subject) => rankQuestions(QUESTIONS.filter((question) => question.subject === subject)))
    .filter((queue) => queue.length);
  const selected = [];
  const usedIds = new Set();

  while (selected.length < settings.dailyGoal && queues.some((queue) => queue.length)) {
    for (const queue of queues) {
      if (selected.length >= settings.dailyGoal) break;
      const nextQuestion = queue.find((question) => !usedIds.has(question.id));
      if (!nextQuestion) continue;
      selected.push(nextQuestion);
      usedIds.add(nextQuestion.id);
    }
    queues.forEach((queue) => {
      while (queue.length && usedIds.has(queue[0].id)) {
        queue.shift();
      }
    });
  }

  return {
    date: today,
    questionIds: selected.map((question) => question.id),
    completedAt: null,
    contentBankSignature: CONTENT_BANK_SIGNATURE,
  };
}

function composeSubjectPracticeSet(subject, conceptState) {
  const today = dateKey();
  const subjectQuestions = QUESTIONS.filter((question) => question.subject === subject);
  return [...subjectQuestions].sort((a, b) => {
    const aState = conceptState[questionConceptKey(a)] || {};
    const bState = conceptState[questionConceptKey(b)] || {};
    const aDue = (aState.dueAt || today) <= today ? 0 : 1;
    const bDue = (bState.dueAt || today) <= today ? 0 : 1;
    if (aDue !== bDue) return aDue - bDue;
    return (aState.mastery || 0) - (bState.mastery || 0);
  });
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

function nextOaQuestion(settings, conceptState, attempts) {
  const hasOa = settings.selectedCourses?.includes("OA");
  if (!hasOa) return null;
  const oaQuestions = QUESTIONS.filter((question) => question.subject === "OA");
  if (!oaQuestions.length) return null;
  const today = dateKey();
  const attemptedToday = new Set(
    attempts.filter((attempt) => attempt.date === today).map((attempt) => attempt.questionId),
  );
  return (
    [...oaQuestions]
      .filter((question) => !attemptedToday.has(question.id))
      .sort((a, b) => {
        const aState = conceptState[questionConceptKey(a)] || {};
        const bState = conceptState[questionConceptKey(b)] || {};
        const aDue = (aState.dueAt || today) <= today ? 0 : 1;
        const bDue = (bState.dueAt || today) <= today ? 0 : 1;
        if (aDue !== bDue) return aDue - bDue;
        return (aState.mastery || 0) - (bState.mastery || 0);
      })[0] || oaQuestions[0]
  );
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

function FlameMark({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 21 21" aria-hidden="true">
      <path
        d="M9 0C9 0 11.5 6 8 9.5C8 9.5 5.5 7 3.5 8.5C3.5 8.5 0 14.5 7.5 18.5C7.5 18.5 5.5 16 8 14.5C8 14.5 9.5 21 14 21C14 21 19 18.5 19 12C19 6 14.5 9.5 14.5 9.5C14.5 9.5 17 4.5 13 2.5C13 2.5 13 7 11 7C11 7 13.5 1 9 0Z"
        fill="currentColor"
        transform="translate(-0.342 0)"
      />
    </svg>
  );
}

function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

export function App() {
  const initialLocalStateStatusRef = useRef("unknown");
  const [appState, setAppState] = useState(() => {
    const snapshot = loadStateSnapshot();
    initialLocalStateStatusRef.current = snapshot.status;
    return snapshot.state;
  });
  const [currentSyncId, setCurrentSyncId] = useState(getProgressSyncId);
  const [syncIdInput, setSyncIdInput] = useState("");
  const [syncIdActionMessage, setSyncIdActionMessage] = useState("");
  const [syncStatus, setSyncStatus] = useState(() => (isProgressSyncConfigured() ? "checking" : "local"));
  const [syncMessage, setSyncMessage] = useState(progressSyncDescription);
  const [view, setView] = useState("today");
  const [selectedInteractiveId, setSelectedInteractiveId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [cardSide, setCardSide] = useState("front");
  const [lessonQuestionId, setLessonQuestionId] = useState(null);
  const [lessonOrigin, setLessonOrigin] = useState("question");
  const [practiceSubject, setPracticeSubject] = useState(null);
  const [cheatsheetSubject, setCheatsheetSubject] = useState(null);
  const [activeDsaPromptOverride, setActiveDsaPromptOverride] = useState(null);
  const [practiceSet, setPracticeSet] = useState([]);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceSelectedIndex, setPracticeSelectedIndex] = useState(null);
  const [practiceCardSide, setPracticeCardSide] = useState("front");
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [interviewIndex, setInterviewIndex] = useState(0);
  const [interviewSelectedIndex, setInterviewSelectedIndex] = useState(null);
  const [interviewCardSide, setInterviewCardSide] = useState("front");
  const [interviewAnswers, setInterviewAnswers] = useState({});
  const [interviewStatus, setInterviewStatus] = useState("idle");
  const [interviewError, setInterviewError] = useState("");
  const syncReadyRef = useRef(!isProgressSyncConfigured());
  const hasStoredInitialLocalStateRef = useRef(false);
  const lastSyncedStateRef = useRef(null);
  const syncInProgressRef = useRef(false);
  const appStateRef = useRef(appState);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    if (isIosApp) {
      document.body.classList.add("ios-native");
    }
  }, []);

  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  const pullRemoteProgress = useCallback(async (isInitial = false) => {
    if (!isProgressSyncConfigured()) return;
    if (syncInProgressRef.current) return;

    syncInProgressRef.current = true;
    if (isInitial) {
      setSyncStatus("checking");
      setSyncMessage("Checking cloud progress...");
    }

    try {
      const remote = await loadRemoteProgress();
      const localUpdatedAt = getLocalProgressUpdatedAt();
      const shouldPreferRemote =
        !localUpdatedAt ||
        remote?.updatedAt > localUpdatedAt ||
        (isInitial && initialLocalStateStatusRef.current !== "valid");

      if (remote?.state) {
        if (shouldPreferRemote) {
          const normalized = normalizeSavedState(remote.state);
          const serialized = JSON.stringify(normalized);
          lastSyncedStateRef.current = serialized;

          setAppState(normalized);
          markLocalProgressUpdated(remote.updatedAt);
          setSyncStatus("synced");
          setSyncMessage("Pulled latest progress from cloud.");
        } else if (isInitial) {
          const serialized = JSON.stringify(appStateRef.current);
          lastSyncedStateRef.current = serialized;
          await saveRemoteProgress(appStateRef.current);
          setSyncStatus("synced");
          setSyncMessage("Cloud progress updated from this device.");
        }
      } else if (isInitial) {
        const serialized = JSON.stringify(appStateRef.current);
        lastSyncedStateRef.current = serialized;
        await saveRemoteProgress(appStateRef.current);
        setSyncStatus("synced");
        setSyncMessage("Cloud progress created for this app.");
      }
    } catch (err) {
      if (isInitial) {
        setSyncStatus("offline");
        setSyncMessage(err.message || "Progress sync is unavailable.");
      }
    } finally {
      syncInProgressRef.current = false;
      syncReadyRef.current = true;
    }
  }, []);

  const copyCurrentSyncId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentSyncId);
      setSyncIdActionMessage("Sync ID copied.");
    } catch {
      setSyncIdActionMessage(`Sync ID: ${currentSyncId}`);
    }
  }, [currentSyncId]);

  const loadProgressBySyncId = useCallback(async () => {
    if (!isProgressSyncConfigured()) {
      setSyncIdActionMessage("Cloud sync is not configured for this build.");
      return;
    }

    const nextSyncId = normalizeProgressSyncId(syncIdInput);
    if (!nextSyncId) {
      setSyncIdActionMessage("Enter a sync ID first.");
      return;
    }

    if (syncInProgressRef.current) return;
    syncInProgressRef.current = true;
    syncReadyRef.current = false;

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    setSyncStatus("checking");
    setSyncMessage(`Loading ${nextSyncId}...`);
    setSyncIdActionMessage("");

    try {
      const remote = await loadRemoteProgress(nextSyncId);
      if (!remote?.state) {
        throw new Error("No progress found for that sync ID.");
      }

      const normalized = normalizeSavedState(remote.state);
      const serialized = JSON.stringify(normalized);
      const savedSyncId = setProgressSyncId(nextSyncId);

      lastSyncedStateRef.current = serialized;
      markLocalProgressUpdated(remote.updatedAt);
      setAppState(normalized);
      setCurrentSyncId(savedSyncId);
      setSyncIdInput("");
      setSyncStatus("synced");
      setSyncMessage(`Loaded progress for ${savedSyncId}.`);
      setSyncIdActionMessage("This device will open with that progress from now on.");
    } catch (err) {
      setSyncStatus("offline");
      setSyncMessage(err.message || "Could not load that sync ID.");
      setSyncIdActionMessage(err.message || "Could not load that sync ID.");
    } finally {
      syncInProgressRef.current = false;
      syncReadyRef.current = true;
    }
  }, [syncIdInput]);

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
    saveStorageItem(STORAGE_KEY, JSON.stringify(appState));
    if (hasStoredInitialLocalStateRef.current && syncReadyRef.current) {
      markLocalProgressUpdated();
    } else {
      hasStoredInitialLocalStateRef.current = true;
    }
  }, [appState]);

  useEffect(() => {
    pullRemoteProgress(true);
  }, [pullRemoteProgress]);

  useEffect(() => {
    if (!isProgressSyncConfigured()) return undefined;

    const handleFocus = () => {
      pullRemoteProgress();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        pullRemoteProgress();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        pullRemoteProgress();
      }
    }, 15000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(interval);
    };
  }, [pullRemoteProgress]);

  useEffect(() => {
    if (!isProgressSyncConfigured() || !syncReadyRef.current) return undefined;

    const serialized = JSON.stringify(appState);
    if (lastSyncedStateRef.current === serialized) {
      return undefined;
    }

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(async () => {
      saveTimeoutRef.current = null;
      setSyncStatus("syncing");
      setSyncMessage("Saving progress...");
      try {
        await saveRemoteProgress(appState);
        lastSyncedStateRef.current = JSON.stringify(appState);
        setSyncStatus("synced");
        setSyncMessage("Progress synced.");
      } catch (err) {
        setSyncStatus("offline");
        setSyncMessage(err.message || "Progress sync is unavailable.");
      }
    }, 700);

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [appState]);

  // Flush pending save immediately when page/app goes to background
  useEffect(() => {
    if (!isProgressSyncConfigured()) return undefined;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (saveTimeoutRef.current) {
          window.clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }

        const serialized = JSON.stringify(appStateRef.current);
        if (lastSyncedStateRef.current !== serialized) {
          saveRemoteProgress(appStateRef.current)
            .then(() => {
              lastSyncedStateRef.current = serialized;
            })
            .catch((err) => {
              console.error("Background auto-sync failed:", err);
            });
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const todaySet = useMemo(() => {
    const ids = appState.dailySet?.questionIds || [];
    return ids.map((id) => QUESTIONS.find((question) => question.id === id)).filter(Boolean);
  }, [appState.dailySet]);

  const todayAttempts = appState.attempts.filter(
    (attempt) => attempt.date === dateKey() && (attempt.source || "daily") === "daily",
  );
  const todaySetIds = new Set(todaySet.map((question) => question.id));
  const todaySetAttempts = todayAttempts.filter((attempt) => todaySetIds.has(attempt.questionId));
  const todayDsaAttempts = appState.dsaAttempts.filter((attempt) => attempt.date === dateKey());
  const completedCount = new Set(todaySetAttempts.map((attempt) => attempt.questionId)).size;
  const currentQuestion = todaySet[currentIndex] || todaySet[0] || QUESTIONS[0];
  const currentDsaPrompt = activeDsaPromptOverride || nextDsaPrompt(appState.settings, appState.conceptState, appState.dsaAttempts);
  const currentOaQuestion = nextOaQuestion(appState.settings, appState.conceptState, appState.attempts);
  const currentAttempt = todaySetAttempts.find((attempt) => attempt.questionId === currentQuestion.id);
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

  const practiceAttemptsToday = appState.attempts.filter(
    (attempt) => attempt.date === dateKey() && attempt.source === "practice",
  );
  const currentPracticeQuestion = practiceSet[practiceIndex] || practiceSet[0];
  const currentPracticeAttempt =
    currentPracticeQuestion &&
    practiceAttemptsToday.find((attempt) => attempt.questionId === currentPracticeQuestion.id);
  const practiceResponseOutcome =
    !currentPracticeQuestion || practiceSelectedIndex === null
      ? null
      : practiceSelectedIndex === -1
        ? "blank"
        : practiceSelectedIndex === currentPracticeQuestion.correctIndex
          ? "correct"
          : "wrong";
  const currentInterviewQuestion = interviewQuestions[interviewIndex] || interviewQuestions[0];
  const interviewResponseOutcome =
    !currentInterviewQuestion || interviewSelectedIndex === null
      ? null
      : interviewSelectedIndex === -1
        ? "blank"
        : interviewSelectedIndex === currentInterviewQuestion.correctIndex
          ? "correct"
          : "wrong";
  const scrollResetKey = [
    view,
    cardSide,
    practiceCardSide,
    interviewCardSide,
    view === "question" ? currentQuestion?.id : "",
    view === "practice" ? currentPracticeQuestion?.id : "",
    view === "interview-question" ? currentInterviewQuestion?.id : "",
    view === "lesson" ? lessonQuestionId : "",
    view === "dsa" ? currentDsaPrompt?.id : "",
    view === "cheatsheet" ? cheatsheetSubject : "",
  ].join("|");

  useEffect(() => {
    const resetScroll = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      const shell = document.querySelector(".app-shell");
      if (shell) {
        shell.scrollTop = 0;
      }
      const frame = document.querySelector(".app-frame");
      if (frame) {
        frame.scrollTop = 0;
      }
      const explanationBodies = document.querySelectorAll(".explanation-body");
      explanationBodies.forEach((el) => {
        el.scrollTop = 0;
      });
    };

    // Phase 1: Reset scroll immediately
    resetScroll();

    // Phase 2: Reset scroll on the next animation frame
    const frameId = window.requestAnimationFrame(resetScroll);

    // Phase 3: Reset scroll after a short delay to account for asynchronous React state/DOM updates
    const timeoutId = window.setTimeout(resetScroll, 50);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [scrollResetKey]);

  function resetQuestionUi(nextIndex = currentIndex) {
    const question = todaySet[nextIndex];
    const attempt = question && todaySetAttempts.find((item) => item.questionId === question.id);
    setCurrentIndex(nextIndex);
    setSelectedIndex(attempt ? (attempt.optionIndex === null ? -1 : attempt.optionIndex) : null);
    setCardSide("front");
  }

  function startSession() {
    if (todaySet.length === 0) {
      setView("dsa");
      return;
    }
    const firstUnanswered = todaySet.findIndex(
      (question) => !todaySetAttempts.some((attempt) => attempt.questionId === question.id),
    );
    if (firstUnanswered === -1) {
      setView("summary");
      return;
    }
    resetQuestionUi(firstUnanswered >= 0 ? firstUnanswered : 0);
    setView("question");
  }

  function recordAttempt(question, outcome, optionIndex, source = "daily") {
    setAppState((state) => {
      const existing = state.attempts.some(
        (attempt) =>
          attempt.date === dateKey() &&
          attempt.questionId === question.id &&
          (attempt.source || "daily") === source,
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
            source,
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

  function previousQuestion() {
    if (currentIndex <= 0) return;
    resetQuestionUi(currentIndex - 1);
  }

  function openLesson(questionId = currentQuestion.id, origin = "question") {
    setLessonQuestionId(questionId);
    setLessonOrigin(origin);
    setView("lesson");
  }

  function startPractice(subject, conceptFilter = null) {
    let subjectSet = composeSubjectPracticeSet(subject, appState.conceptState);
    if (conceptFilter) {
      subjectSet = subjectSet.filter((question) => question.concept === conceptFilter);
    }
    const attemptsToday = appState.attempts.filter(
      (attempt) => attempt.date === dateKey() && attempt.source === "practice",
    );
    const firstUnanswered = subjectSet.findIndex(
      (question) => !attemptsToday.some((attempt) => attempt.questionId === question.id),
    );
    setPracticeSubject(subject);
    setPracticeSet(subjectSet);
    if (firstUnanswered === -1) {
      setView("practice-summary");
      return;
    }
    setPracticeIndex(firstUnanswered);
    setPracticeSelectedIndex(null);
    setPracticeCardSide("front");
    setView("practice");
  }

  function resetInterviewUi(nextIndex, set = interviewQuestions) {
    const question = set[nextIndex];
    const savedAnswer = question ? interviewAnswers[question.id] : undefined;
    setInterviewIndex(nextIndex);
    setInterviewSelectedIndex(savedAnswer === undefined ? null : savedAnswer);
    setInterviewCardSide("front");
  }

  async function startInterviewGenerator() {
    if (!AI_TOOLS_ENABLED || interviewStatus === "loading") return;

    const scope = buildInterviewQuestionScope(appState.settings.selectedCourses);
    if (!scope.length) {
      setInterviewError("Select at least one MCQ course before generating interview questions.");
      setInterviewStatus("error");
      setView("interview-lab");
      return;
    }

    setView("interview-lab");
    setInterviewStatus("loading");
    setInterviewError("");
    setInterviewAnswers({});
    setInterviewSelectedIndex(null);
    setInterviewCardSide("front");

    try {
      const questions = await generateApplicationInterviewQuestions({ scope, count: 3 });
      setInterviewQuestions(questions);
      setInterviewIndex(0);
      setInterviewStatus("ready");
      setView("interview-question");
    } catch (err) {
      setInterviewQuestions([]);
      setInterviewStatus("error");
      setInterviewError(err.message || "Could not generate interview questions.");
      setView("interview-lab");
    }
  }

  function chooseInterviewOption(index) {
    if (!currentInterviewQuestion || interviewSelectedIndex !== null) return;
    setInterviewSelectedIndex(index);
    setInterviewAnswers((answers) => ({
      ...answers,
      [currentInterviewQuestion.id]: index,
    }));
  }

  function blankOutInterview() {
    if (!currentInterviewQuestion || interviewSelectedIndex !== null) return;
    setInterviewSelectedIndex(-1);
    setInterviewCardSide("back");
    setInterviewAnswers((answers) => ({
      ...answers,
      [currentInterviewQuestion.id]: -1,
    }));
  }

  function nextInterviewQuestion() {
    const nextIndex = interviewIndex + 1;
    if (nextIndex >= interviewQuestions.length) {
      setView("today");
      return;
    }
    resetInterviewUi(nextIndex);
  }

  function previousInterviewQuestion() {
    if (interviewIndex <= 0) return;
    resetInterviewUi(interviewIndex - 1);
  }

  function resetPracticeUi(nextIndex, set = practiceSet) {
    const question = set[nextIndex];
    const attempt = question && practiceAttemptsToday.find((item) => item.questionId === question.id);
    setPracticeIndex(nextIndex);
    setPracticeSelectedIndex(attempt ? (attempt.optionIndex === null ? -1 : attempt.optionIndex) : null);
    setPracticeCardSide("front");
  }

  function choosePracticeOption(index) {
    if (!currentPracticeQuestion || practiceSelectedIndex !== null || currentPracticeAttempt) return;
    setPracticeSelectedIndex(index);
    recordAttempt(
      currentPracticeQuestion,
      index === currentPracticeQuestion.correctIndex ? "correct" : "wrong",
      index,
      "practice",
    );
  }

  function blankOutPractice() {
    if (!currentPracticeQuestion || practiceSelectedIndex !== null || currentPracticeAttempt) return;
    setPracticeSelectedIndex(-1);
    setPracticeCardSide("back");
    recordAttempt(currentPracticeQuestion, "blank", null, "practice");
  }

  function nextPracticeQuestion() {
    const nextIndex = practiceIndex + 1;
    if (nextIndex >= practiceSet.length) {
      setView("practice-summary");
      return;
    }
    resetPracticeUi(nextIndex);
  }

  function previousPracticeQuestion() {
    if (practiceIndex <= 0) return;
    resetPracticeUi(practiceIndex - 1);
  }

  function exitPractice() {
    setPracticeSubject(null);
    setPracticeSet([]);
    setPracticeIndex(0);
    setPracticeSelectedIndex(null);
    setPracticeCardSide("front");
    if (cheatsheetSubject) {
      setView("cheatsheet");
    } else {
      setView("practice-setup");
    }
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

  function goBackFromLesson() {
    setView(
      lessonOrigin === "practice"
        ? "practice"
        : cardSide === "back"
          ? "question"
          : "today",
    );
  }

  function continueFromLesson() {
    if (lessonOrigin === "practice") {
      setView("practice");
      nextPracticeQuestion();
    } else {
      setView("question");
      nextQuestion();
    }
  }

  function rateLesson(question, rating) {
    const conceptKey = questionConceptKey(question);
    setAppState((state) => ({
      ...state,
      conceptState: {
        ...state.conceptState,
        [conceptKey]: updateMemoryState(
          state.conceptState[conceptKey] || defaultConceptState()[conceptKey],
          rating,
        ),
      },
    }));
    continueFromLesson();
  }

  function goTopBack() {
    if (view === "today") return;
    if (view === "question") {
      const confirmExit = window.confirm("Exit active session? Your progress is saved, and you can resume anytime from the dashboard.");
      if (!confirmExit) return;
    }
    if (view === "practice") {
      const confirmExit = window.confirm("Exit practice session? This will discard your current custom practice run.");
      if (!confirmExit) return;
      exitPractice();
      return;
    }
    if (view === "practice-summary") {
      if (cheatsheetSubject) {
        setView("cheatsheet");
      } else {
        setView("practice-setup");
      }
      return;
    }
    if (view === "cheatsheet") {
      setCheatsheetSubject(null);
      setView("practice-setup");
      return;
    }
    if (view === "dsa") {
      if (activeDsaPromptOverride) {
        setActiveDsaPromptOverride(null);
        setView("cheatsheet");
        return;
      }
      setView("today");
      return;
    }
    if (view === "interview-question" || view === "interview-lab") {
      setView("today");
      return;
    }
    if (view === "lesson") {
      goBackFromLesson();
      return;
    }
    if (view === "setup") {
      setView("settings");
      return;
    }
    if (view === "interactive-play") {
      setView("interactive-list");
      return;
    }
    setView("today");
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
    if (completedCount > 0) {
      const confirmReset = window.confirm(
        "Are you sure you want to rebuild today's set? This will reset your progress for today's session, though your overall history is saved."
      );
      if (!confirmReset) return;
    }
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

  const activeQuestionSubject =
    view === "question" ? currentQuestion?.subject :
    view === "practice" ? currentPracticeQuestion?.subject :
    view === "interview-question" ? currentInterviewQuestion?.subject :
    view === "lesson" ? (QUESTIONS.find((item) => item.id === lessonQuestionId) || currentQuestion)?.subject :
    null;

  const activeQuestionConcept =
    view === "question" ? currentQuestion?.concept :
    view === "practice" ? currentPracticeQuestion?.concept :
    view === "interview-question" ? currentInterviewQuestion?.concept :
    view === "lesson" ? (QUESTIONS.find((item) => item.id === lessonQuestionId) || currentQuestion)?.concept :
    null;

  return (
    <main className="app-shell">
      <section
        className={classNames("app-frame", appState.hasCompletedCourseSetup && "has-frame-top")}
        aria-label="CrackIt application"
      >
        {appState.hasCompletedCourseSetup && (
          <FrameTop
            view={view}
            setView={setView}
            onBack={goTopBack}
            backDisabled={view === "today"}
            completedCount={completedCount}
            totalCount={todaySet.length}
            streak={appState.streak}
            dsaEnabled={appState.settings.selectedCourses.includes("DSA")}
            lessonOrigin={lessonOrigin}
            activeQuestionSubject={activeQuestionSubject}
            activeQuestionConcept={activeQuestionConcept}
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
            attempts={todaySetAttempts}
            dsaAttempts={todayDsaAttempts}
            dsaPrompt={currentDsaPrompt}
            oaQuestion={currentOaQuestion}
            completedCount={completedCount}
            dsaEnabled={appState.settings.selectedCourses.includes("DSA")}
            oaEnabled={appState.settings.selectedCourses.includes("OA")}
            settings={appState.settings}
            conceptState={appState.conceptState}
            streak={appState.streak}
            startSession={startSession}
            startDsa={() => setView("dsa")}
            startOa={() => startPractice("OA")}
            startInterviewGenerator={startInterviewGenerator}
            interviewStatus={interviewStatus}
            openProgress={() => setView("progress")}
            openPractice={() => setView("practice-setup")}
            openInteractive={() => setView("interactive-list")}
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
            previousQuestion={previousQuestion}
            openLesson={openLesson}
          />
        )}

        {appState.hasCompletedCourseSetup && view === "dsa" && (
          <DsaView
            prompt={currentDsaPrompt}
            attempts={todayDsaAttempts}
            recordDsaAttempt={recordDsaAttempt}
            goToday={() => setView("today")}
            goProgress={activeDsaPromptOverride ? () => { setActiveDsaPromptOverride(null); setView("cheatsheet"); } : () => setView("progress")}
            isPracticeMode={Boolean(activeDsaPromptOverride)}
          />
        )}

        {appState.hasCompletedCourseSetup && view === "interview-lab" && (
          <InterviewLabView
            status={interviewStatus}
            error={interviewError}
            selectedCourses={appState.settings.selectedCourses}
            startInterviewGenerator={startInterviewGenerator}
          />
        )}

        {appState.hasCompletedCourseSetup && view === "interview-question" && (
          <QuestionView
            question={currentInterviewQuestion}
            total={interviewQuestions.length}
            currentIndex={interviewIndex}
            selectedIndex={interviewSelectedIndex}
            cardSide={interviewCardSide}
            responseOutcome={interviewResponseOutcome}
            chooseOption={chooseInterviewOption}
            blankOut={blankOutInterview}
            flip={() => setInterviewCardSide("back")}
            nextQuestion={nextInterviewQuestion}
            previousQuestion={previousInterviewQuestion}
          />
        )}

        {appState.hasCompletedCourseSetup && view === "practice-setup" && (
          <PracticeSetupView
            conceptState={appState.conceptState}
            attempts={appState.attempts}
            dsaAttempts={appState.dsaAttempts}
            openCheatsheet={(subject) => {
              setCheatsheetSubject(subject);
              setView("cheatsheet");
            }}
            startPractice={(subject) => {
              if (subject === "DSA") {
                const todayDsaAttempts = appState.dsaAttempts.filter((attempt) => attempt.date === dateKey());
                const unanswered = DSA_PROMPTS.find((p) => !todayDsaAttempts.some((a) => a.promptId === p.id)) || DSA_PROMPTS[0];
                if (unanswered) {
                  setActiveDsaPromptOverride(unanswered);
                  setView("dsa");
                }
              } else {
                startPractice(subject);
              }
            }}
          />
        )}

        {appState.hasCompletedCourseSetup && view === "cheatsheet" && (
          <CheatsheetView
            subject={cheatsheetSubject}
            attempts={appState.attempts}
            dsaAttempts={appState.dsaAttempts}
            startPractice={(subject, conceptFilter) => {
              if (subject === "DSA") {
                const todayDsaAttempts = appState.dsaAttempts.filter((attempt) => attempt.date === dateKey());
                const matching = conceptFilter
                  ? DSA_PROMPTS.filter((p) => p.concept === conceptFilter)
                  : DSA_PROMPTS;
                const unanswered = matching.find((p) => !todayDsaAttempts.some((a) => a.promptId === p.id)) || matching[0];
                if (unanswered) {
                  setActiveDsaPromptOverride(unanswered);
                  setView("dsa");
                }
              } else {
                startPractice(subject, conceptFilter);
              }
            }}
            openDsaPrompt={(prompt) => {
              setActiveDsaPromptOverride(prompt);
              setView("dsa");
            }}
          />
        )}

        {appState.hasCompletedCourseSetup && view === "practice" && (
          <QuestionView
            question={currentPracticeQuestion}
            total={practiceSet.length}
            currentIndex={practiceIndex}
            selectedIndex={practiceSelectedIndex}
            cardSide={practiceCardSide}
            responseOutcome={practiceResponseOutcome}
            chooseOption={choosePracticeOption}
            blankOut={blankOutPractice}
            flip={() => setPracticeCardSide("back")}
            nextQuestion={nextPracticeQuestion}
            previousQuestion={previousPracticeQuestion}
            openLesson={(questionId) => openLesson(questionId, "practice")}
          />
        )}

        {appState.hasCompletedCourseSetup && view === "practice-summary" && (
          <PracticeSummaryView
            subject={practiceSubject}
            practiceSet={practiceSet}
            attempts={practiceAttemptsToday}
            goPracticeSetup={() => {
              if (cheatsheetSubject) {
                setView("cheatsheet");
              } else {
                setView("practice-setup");
              }
            }}
            goToday={() => {
              setCheatsheetSubject(null);
              setView("today");
            }}
            reviewPractice={() => {
              resetPracticeUi(0);
              setView("practice");
            }}
          />
        )}

        {appState.hasCompletedCourseSetup && view === "lesson" && (
          <LessonView
            question={QUESTIONS.find((item) => item.id === lessonQuestionId) || currentQuestion}
            onRate={rateLesson}
          />
        )}

        {appState.hasCompletedCourseSetup && view === "summary" && (
          <SummaryView
            todaySet={todaySet}
            attempts={todaySetAttempts}
            streak={appState.streak}
            accuracy={accuracy}
            goToday={() => setView("today")}
            openProgress={() => setView("progress")}
            openPractice={() => setView("practice-setup")}
            reviewSession={() => {
              resetQuestionUi(0);
              setView("question");
            }}
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
            currentSyncId={currentSyncId}
            syncIdInput={syncIdInput}
            syncIdActionMessage={syncIdActionMessage}
            syncStatus={syncStatus}
            syncMessage={syncMessage}
            setSyncIdInput={setSyncIdInput}
            copyCurrentSyncId={copyCurrentSyncId}
            loadProgressBySyncId={loadProgressBySyncId}
            regenerateSet={regenerateSet}
          />
        )}

        {appState.hasCompletedCourseSetup && view === "interactive-list" && (
          <InteractiveListView
            attempts={appState.interactiveAttempts}
            onSelectChallenge={(id) => {
              setSelectedInteractiveId(id);
              setView("interactive-play");
            }}
          />
        )}

        {appState.hasCompletedCourseSetup && view === "interactive-play" && (
          <InteractivePlayView
            challenge={INTERACTIVE_QUESTIONS.find((q) => q.id === selectedInteractiveId)}
            onBack={() => setView("interactive-list")}
            recordAttempt={(challengeId, outcome) => {
              setAppState((state) => {
                const newAttempt = {
                  date: dateKey(),
                  challengeId,
                  outcome,
                };
                return {
                  ...state,
                  interactiveAttempts: [...state.interactiveAttempts, newAttempt],
                };
              });
            }}
          />
        )}
      </section>
    </main>
  );
}

function FrameTop({
  view,
  setView,
  onBack,
  backDisabled,
  completedCount,
  totalCount,
  streak,
  dsaEnabled,
  lessonOrigin,
  activeQuestionSubject,
  activeQuestionConcept,
}) {
  const baseNavItems = [
    { id: "today", label: "Today", icon: Home },
    ...(dsaEnabled ? [{ id: "dsa", label: "DSA", icon: Code2 }] : []),
    { id: "practice-setup", label: "Practice", icon: BookOpen },
    { id: "progress", label: "Progress", icon: BarChart3 },
  ];
  const mobileNavItems = baseNavItems;

  function renderNavButtons(items) {
    return items.map((item) => {
      const Icon = item.icon;
      const isActive =
        (view === item.id) ||
        (item.id === "today" && (view === "question" || view === "summary" || view === "interview-lab" || view === "interview-question" || view === "interactive-list" || view === "interactive-play" || (view === "lesson" && lessonOrigin === "question"))) ||
        (item.id === "practice-setup" && (view === "practice" || view === "practice-summary" || view === "cheatsheet" || (view === "lesson" && lessonOrigin === "practice")));
      return (
        <button
          key={item.id}
          className={classNames("nav-button", isActive && "active")}
          onClick={() => setView(item.id)}
        >
          <Icon size={16} aria-hidden="true" />
          <span>{item.label}</span>
        </button>
      );
    });
  }

  const showCenterTitle = isIosApp && activeQuestionConcept;

  return (
    <>
      <header className="frame-top">
        <div className="top-leading">
          <button
            className="top-back-button"
            onClick={onBack}
            disabled={backDisabled}
            aria-label={backDisabled ? "Already on Today" : "Back"}
          >
            <ChevronLeft size={18} aria-hidden="true" />
            <span>Back</span>
          </button>
          {!showCenterTitle && (
            <>
              <span className="top-divider" aria-hidden="true" />
              <button className="brand-button" onClick={() => setView("today")}>
                <span className="brand-mark">
                  <FlameMark size={18} />
                </span>
                <span className="eyebrow">CrackIt</span>
              </button>
            </>
          )}
        </div>

        {showCenterTitle && (
          <div className="top-center-title">
            <span className="pill neutral">{subjectLabel(activeQuestionSubject)}</span>
            <span className="concept-text">{parseAndFormatCode(activeQuestionConcept)}</span>
          </div>
        )}

        <nav className="top-nav top-nav-desktop" aria-label="Main navigation">
          {renderNavButtons(baseNavItems)}
        </nav>
        <div className="top-stats">
          <span>{completedCount} / {totalCount || 0}</span>
          <span className="stat-divider" />
          <Flame size={16} aria-hidden="true" />
          <span>{streak.current}</span>
        </div>
      </header>
      <nav
        className="top-nav mobile-tabbar"
        aria-label="Mobile navigation"
        style={{ "--mobile-nav-count": mobileNavItems.length }}
      >
        {renderNavButtons(mobileNavItems)}
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
        <p className="eyebrow">CrackIt setup</p>
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
            <span>Based on {selectedMcqCount} MCQ courses and DSA practice.</span>
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
  oaQuestion,
  completedCount,
  dsaEnabled,
  oaEnabled,
  settings,
  conceptState,
  streak,
  startSession,
  startDsa,
  startOa,
  startInterviewGenerator,
  interviewStatus,
  openProgress,
  openPractice,
  openInteractive,
}) {
  const total = todaySet.length;
  const percent = total ? Math.round((completedCount / total) * 100) : 0;
  const dailySetComplete = total > 0 && completedCount >= total;
  const selectedSubjects = settings.selectedCourses.filter((course) => SUBJECTS.includes(course) && course !== "OA");
  const mix = SUBJECTS.filter((subject) => subject !== "OA").map((subject) => {
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

  const weakestEntry = Object.entries(conceptState)
    .filter(([, state]) => state.reps > 0)
    .sort((a, b) => a[1].mastery - b[1].mastery)[0];
  const weakestSubjectKey = weakestEntry ? weakestEntry[0].split(":")[0] : "—";
  const weakestSubject = weakestEntry ? (SUBJECT_META[weakestSubjectKey]?.name || weakestSubjectKey) : "—";
  const weakestConcept = weakestEntry ? weakestEntry[0].split(":")[1] : "Not enough data yet";

  return (
    <div className="screen today-screen view-enter">
      <section className="hero-row">
        <div>
          <p className="eyebrow">CrackIt</p>
          <h1>{greeting()}.</h1>
        </div>
        <p className="date-label">{readableDate()}</p>
      </section>

      <section className="session-card dashboard-hero-card">
        <ProgressRing percent={percent} label={`${completedCount} / ${total}`} />
        <div className="session-copy">
          <p className="eyebrow">Today's Session</p>
          <h2>{total} daily questions ready</h2>
          <div className="subject-chip-row" aria-label="Selected courses">
            {selectedSubjects.map((course) => (
              <span key={course} style={{ "--chip-accent": SUBJECT_META[course]?.accent }}>
                {course}
              </span>
            ))}
          </div>
        </div>
        <button className="primary-button" onClick={startSession}>
          {dailySetComplete ? "View daily summary" : completedCount > 0 ? "Continue daily set" : "Start daily set"}
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

      {oaEnabled && oaQuestion && (
        <section className="dsa-teaser">
          <div className="dsa-teaser-copy">
            <span className="course-icon">
              <Lightbulb size={18} aria-hidden="true" />
            </span>
            <div>
              <p className="eyebrow">Aptitude reasoning</p>
              <h2>{oaQuestion.concept}</h2>
              <div className="teaser-stem-text">{parseAndFormatCode(oaQuestion.stem)}</div>
            </div>
          </div>
          <button className="dark-button" onClick={startOa}>
            Practice aptitude
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </section>
      )}

      <section className="dsa-teaser interactive-teaser">
        <div className="dsa-teaser-copy">
          <span className="course-icon">
            <Sparkles size={18} aria-hidden="true" style={{ color: "var(--accent)" }} />
          </span>
          <div>
            <p className="eyebrow">Interactive Drills</p>
            <h2>Puzzles & Sequencing</h2>
            <p>
              Test your skills with drag-to-reorder sequences, sorting items into category buckets, and syntax clozes.
            </p>
          </div>
        </div>
        <button className="dark-button" onClick={openInteractive}>
          Play Drills
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </section>

      {AI_TOOLS_ENABLED && (
        <section className="dsa-teaser interview-teaser">
          <div className="dsa-teaser-copy">
            <span className="course-icon">
              <Sparkles size={18} aria-hidden="true" />
            </span>
            <div>
              <p className="eyebrow">Application interview lab</p>
              <h2>Generate situational questions</h2>
              <p>
                Gemini 2.5 Pro will create application-level interview MCQs from your selected subjects and concepts.
              </p>
            </div>
          </div>
          <button className="dark-button" onClick={startInterviewGenerator} disabled={interviewStatus === "loading"}>
            {interviewStatus === "loading" ? (
              <>
                <Loader2 size={16} aria-hidden="true" className="spin-icon" />
                Generating
              </>
            ) : (
              <>
                Generate
                <ChevronRight size={16} aria-hidden="true" />
              </>
            )}
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
        <article
          className="planner-card dark"
          onClick={weakestEntry ? () => startPractice(weakestSubjectKey) : undefined}
          style={{ cursor: weakestEntry ? "pointer" : "default" }}
        >
          <div>
            <p className="eyebrow">Practice Weakest Area</p>
            <strong>{weakestSubject}</strong>
            <span style={{ textTransform: "capitalize" }}>{weakestConcept}</span>
          </div>
          <BookOpen size={22} aria-hidden="true" />
        </article>
        <article className="planner-card amber">
          <div>
            <p className="eyebrow">Daily Target</p>
            <strong>{completedCount} / {total} completed</strong>
            <span>{completedCount >= total ? "Daily set complete." : `${total - completedCount} more to finish today's set`}</span>
          </div>
          <Target size={22} aria-hidden="true" />
        </article>
      </section>

      <section className="mix-section">
        <div className="section-heading">
          <p className="eyebrow">Today's mix</p>
          <div className="section-heading-actions">
            <button className="text-button" onClick={openPractice}>Practice by topic</button>
            <button className="text-button" onClick={openProgress}>View mastery</button>
          </div>
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
        <MetricCard label="Weakest" value={weakestSubject} detail={weakestConcept} />
      </section>
    </div>
  );
}

function InterviewLabView({ status, error, selectedCourses, startInterviewGenerator }) {
  const selectedMcqCourses = selectedCourses.filter((course) => SUBJECTS.includes(course));
  const courseLabel = selectedMcqCourses.length ? selectedMcqCourses.map(subjectLabel).join(" - ") : "Selected courses";

  return (
    <div className="screen interview-lab-screen view-enter">
      <section className="dsa-card interview-lab-card">
        <div className="dsa-prompt">
          <p className="eyebrow">Application interview lab</p>
          <h1>{status === "loading" ? "Thinking through scenarios..." : "Generate situational MCQs"}</h1>
          <p>
            Questions are constrained to {courseLabel} and must test practical reasoning over definitions.
          </p>
          <div className="hint-row">
            <span>
              <Sparkles size={14} aria-hidden="true" />
              Gemini 2.5 Pro
            </span>
            <span>
              <Target size={14} aria-hidden="true" />
              Application-only
            </span>
            <span>
              <BookOpen size={14} aria-hidden="true" />
              Same syllabus
            </span>
          </div>
        </div>

        {status === "loading" ? (
          <div className="model-answer reveal-panel interview-loading-panel">
            <Loader2 size={22} aria-hidden="true" className="spin-icon" />
            <p>Building scenario-based interview questions from your selected concepts.</p>
          </div>
        ) : null}

        {error ? (
          <div className="callout warning">
            <p className="eyebrow">Generation failed</p>
            <p>{error}</p>
          </div>
        ) : null}

        <div className="dsa-actions">
          <button className="primary-button" onClick={startInterviewGenerator} disabled={status === "loading"}>
            {status === "loading" ? "Generating..." : "Generate questions"}
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
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
  previousQuestion,
  openLesson,
}) {
  if (!question) {
    return (
      <div className="screen summary-screen view-enter">
        <article className="summary-paper">
          <p className="eyebrow">Questions</p>
          <h1>No questions ready.</h1>
          <p className="summary-lede">Go back to Today and generate a fresh set.</p>
        </article>
      </div>
    );
  }

  const answered = selectedIndex !== null;
  const isCorrect = responseOutcome === "correct";
  const chosenOption = selectedIndex >= 0 ? question.options[selectedIndex] : null;

  const [prevIndex, setPrevIndex] = useState(currentIndex);
  const [slideDirection, setSlideDirection] = useState("");
  if (currentIndex !== prevIndex) {
    setSlideDirection(currentIndex > prevIndex ? "slide-next" : "slide-prev");
    setPrevIndex(currentIndex);
  }

  const answerBarRef = useRef(null);
  useEffect(() => {
    if (answered && answerBarRef.current) {
      setTimeout(() => {
        if (answerBarRef.current) {
          answerBarRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  }, [answered]);

  return (
    <div className="question-screen view-enter">
      <div className="question-top">
        <div className="question-context">
          {currentIndex > 0 && (
            <button
              className="icon-button question-back"
              onClick={previousQuestion}
              aria-label="Previous question"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
          )}
          {!isIosApp && (
            <>
              <span className="pill neutral">{subjectLabel(question.subject)}</span>
              <span>{parseAndFormatCode(question.concept)}</span>
            </>
          )}
        </div>
        <span className="question-count">{currentIndex + 1} of {total}</span>
      </div>

      <div className="segment-row" aria-hidden="true">
        {Array.from({ length: total }).map((_, index) => (
          <span key={index} className={index <= currentIndex ? "filled" : ""} />
        ))}
      </div>

      <section className={classNames("card-stage", slideDirection)} key={`${currentIndex}-${slideDirection}`}>
        <div className={classNames("flip-card", cardSide === "back" && "flipped")}>
          <article className="question-card card-face front-face">
            <div className="pill-row">
              <span className="pill neutral">Scenario</span>
              <span className="pill accent">{question.difficulty}</span>
            </div>
            <div className="question-stem">{parseAndFormatCode(question.stem)}</div>
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
                      <strong>{parseAndFormatCode(option.text)}</strong>
                      <small>{parseAndFormatCode(option.sub)}</small>
                    </span>
                  </button>
                );
              })}
            </div>
            {answered ? (
              <>
                <div className="answer-bar" ref={answerBarRef}>
                  <Verdict outcome={responseOutcome} />
                  <button className="dark-button" onClick={flip}>
                    See explanation
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </div>
                <div className="card-actions">
                  <button
                    className="ghost-button small-action"
                    onClick={previousQuestion}
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft size={15} aria-hidden="true" />
                    Previous
                  </button>
                  <button className="primary-button small" onClick={nextQuestion}>
                    {currentIndex + 1 >= total ? "Finish set" : "Next question"}
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </>
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
                <h2>{parseAndFormatCode(question.options[question.correctIndex].text)}</h2>
              </div>
              {responseOutcome && <Verdict outcome={responseOutcome} />}
            </div>

            <div className="explanation-body">
              {isCorrect ? (
                <div className="explanation-text">{parseAndFormatCode(question.proTip)}</div>
              ) : selectedIndex === -1 ? (
                <div className="explanation-text">{parseAndFormatCode(question.lesson)}</div>
              ) : (
                <>
                  <div className="explanation-text">{parseAndFormatCode(chosenOption?.fix)}</div>
                  {question.proTip && (
                    <div className="callout success">
                      <p className="eyebrow">Why the correct answer is right</p>
                      <div className="explanation-text">{parseAndFormatCode(question.proTip)}</div>
                    </div>
                  )}
                </>
              )}
              {question.remember && (
                <div className="callout lesson">
                  <p className="eyebrow">Remember</p>
                  <div className="explanation-text">{parseAndFormatCode(question.remember)}</div>
                </div>
              )}
              {AI_TOOLS_ENABLED && (
                <AiPanel
                  key={`followup-${question.id}-${selectedIndex}`}
                  actionLabel="Ask a follow-up question"
                  resultLabel="Answer"
                  startWithInput
                  allowFollowUp
                  run={(followUp) =>
                    followUpQuestion({
                      concept: question.concept,
                      subject: question.subject,
                      context: `${question.stem}\n\nCorrect answer: ${question.options[question.correctIndex].text} - ${question.options[question.correctIndex].sub}`,
                      question: followUp,
                    })
                  }
                />
              )}
            </div>

            <div className="card-actions">
              <button
                className="ghost-button small-action"
                onClick={previousQuestion}
                disabled={currentIndex === 0}
              >
                <ChevronLeft size={15} aria-hidden="true" />
                Previous
              </button>
              {openLesson ? (
                <button className="ghost-button small-action" onClick={() => openLesson(question.id)}>
                  <BookOpen size={15} aria-hidden="true" />
                  See full lesson
                </button>
              ) : null}
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

function DsaView({ prompt, attempts, recordDsaAttempt, goToday, goProgress, isPracticeMode = false }) {
  const [draft, setDraft] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [rated, setRated] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef(null);
  const alreadyRated = attempts.find((attempt) => attempt.promptId === prompt?.id);
  const speechRecognition =
    typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
  const canTranscribe = Boolean(speechRecognition);
  const canRequestMic =
    typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
  const canUseVoice = canTranscribe || canRequestMic;
  const voiceReadyStatus = canTranscribe
    ? "Tap Speak to allow microphone access."
    : canRequestMic
      ? "Tap Speak to request microphone access."
      : "Voice unavailable in this browser.";
  const voiceStatus =
    voiceError ||
    interimTranscript ||
    (isRequestingMic ? "Requesting microphone access..." : null) ||
    (isListening ? "Listening..." : voiceReadyStatus);

  function stopVoiceDraft({ abort = false } = {}) {
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        if (abort && typeof recognition.abort === "function") {
          recognition.abort();
        } else {
          recognition.stop();
        }
      } catch {
        // The browser/WebView may have already stopped the recognition session.
      }
    }
    recognitionRef.current = null;
    setIsListening(false);
    setIsRequestingMic(false);
    setInterimTranscript("");
  }

  useEffect(() => {
    setDraft("");
    setRevealed(false);
    setRated(null);
    setVoiceError("");
    stopVoiceDraft({ abort: true });
  }, [prompt?.id]);

  useEffect(() => {
    function stopOnPageExit() {
      stopVoiceDraft({ abort: true });
    }

    function stopOnHidden() {
      if (document.visibilityState === "hidden") {
        stopVoiceDraft({ abort: true });
      }
    }

    document.addEventListener("visibilitychange", stopOnHidden);
    window.addEventListener("pagehide", stopOnPageExit);
    window.addEventListener("beforeunload", stopOnPageExit);
    window.addEventListener("freeze", stopOnPageExit);
    return () => {
      document.removeEventListener("visibilitychange", stopOnHidden);
      window.removeEventListener("pagehide", stopOnPageExit);
      window.removeEventListener("beforeunload", stopOnPageExit);
      window.removeEventListener("freeze", stopOnPageExit);
      stopVoiceDraft({ abort: true });
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

  async function requestMicrophoneAccess() {
    if (!canRequestMic) return true;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  }

  async function toggleVoiceDraft() {
    if (!canUseVoice) {
      setVoiceError("Voice dictation is not available in this browser.");
      return;
    }

    if (isListening) {
      stopVoiceDraft();
      return;
    }

    setIsRequestingMic(true);
    setVoiceError("");
    setInterimTranscript("");
    try {
      await requestMicrophoneAccess();
    } catch (error) {
      const permissionDenied = error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError";
      const noInput = error?.name === "NotFoundError" || error?.name === "DevicesNotFoundError";
      setVoiceError(
        permissionDenied
          ? "Microphone access was denied. Allow it in device or browser settings, then try again."
          : noInput
            ? "No microphone was found on this device."
            : "Microphone access could not be requested on this device.",
      );
      setIsRequestingMic(false);
      return;
    }
    setIsRequestingMic(false);

    if (!canTranscribe) {
      setVoiceError("Microphone access is allowed, but speech dictation is not available in this browser.");
      return;
    }

    const recognition = new speechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onstart = () => {
      setIsListening(true);
      setIsRequestingMic(false);
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
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
    };

    try {
      recognition.start();
    } catch {
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
      setIsRequestingMic(false);
      setVoiceError("Voice dictation is already starting. Try again in a moment.");
    }
  }

  return (
    <div className="screen dsa-screen view-enter">
      <div className="question-top inline">
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
              className={classNames("voice-button", isListening && "listening", isRequestingMic && "requesting")}
              onClick={toggleVoiceDraft}
              disabled={!canUseVoice || isRequestingMic}
              aria-pressed={isListening}
              aria-label={
                !canUseVoice
                  ? "Voice dictation unavailable"
                  : isRequestingMic
                    ? "Requesting microphone access"
                    : isListening
                      ? "Stop voice dictation"
                      : "Start voice dictation"
              }
            >
              {isListening ? <MicOff size={16} aria-hidden="true" /> : <Mic size={16} aria-hidden="true" />}
              <span>{!canUseVoice ? "Unavailable" : isRequestingMic ? "Allow..." : isListening ? "Stop" : "Speak"}</span>
            </button>
          </span>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Write the algorithm, key invariant, edge cases, and complexity..."
          />
          <span className={classNames("voice-status", (isListening || isRequestingMic) && "active", (voiceError || !canUseVoice) && "error")}>
            {voiceStatus}
          </span>
        </label>

        {AI_TOOLS_ENABLED && draft.trim() && (
          <AiPanel
            key={`grade-${prompt.id}`}
            actionLabel="Get AI feedback on my answer"
            resultLabel="AI feedback"
            run={() => gradeDsaAnswer({ prompt, draft })}
          />
        )}

        <div className="dsa-actions">
          <button className="ghost-button" onClick={() => setRevealed(true)}>
            Reveal model answer
          </button>
          {alreadyRated || rated ? (
            <button className="primary-button" onClick={goProgress}>
              {isPracticeMode ? "Back to cheatsheet" : "View progress"}
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
            {AI_TOOLS_ENABLED && ["again", "hard"].includes(rated || alreadyRated?.outcome) && (
              <AiPanel
                key={`mistake-${prompt.id}`}
                actionLabel="Explain what I got wrong"
                resultLabel="Where it went wrong"
                run={() => explainDsaMistake({ prompt, draft: draft || alreadyRated?.draft })}
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function getRealExampleText(stem) {
  if (!stem) return "";
  const trimmed = stem.trim();
  if (trimmed.endsWith("?")) {
    const matches = [...trimmed.matchAll(/[\.\?!]['"’]?(?:\s+|$)/g)];
    if (matches.length >= 2) {
      const boundaryMatch = matches[matches.length - 2];
      const endIdx = boundaryMatch.index + boundaryMatch[0].trim().length;
      return trimmed.substring(0, endIdx).trim();
    }
  }
  return stem;
}

function LessonView({ question, onRate }) {
  return (
    <div className="screen lesson-screen">
      <article className="lesson-paper lesson-document">
        <div className="lesson-main">
          <p className="eyebrow">{question.subject}</p>
          <h1>{parseAndFormatCode(question.concept)}</h1>
          <div className="lesson-paragraph">{parseAndFormatCode(question.lesson)}</div>
          <div className="callout lesson">
            <p className="eyebrow">Real example</p>
            <div className="lesson-paragraph">{parseAndFormatCode(getRealExampleText(question.stem))}</div>
          </div>
          {question.interviewAnswer && (
            <div className="callout neutral">
              <p className="eyebrow">Interview answer</p>
              <div className="lesson-paragraph">{parseAndFormatCode(question.interviewAnswer)}</div>
            </div>
          )}
          <div className="card-actions lesson-actions">
            <button className="ghost-button small-action" onClick={() => onRate(question, "again")}>
              Review this again
            </button>
            <button className="primary-button small" onClick={() => onRate(question, "good")}>
              I got it
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}

function SummaryView({ todaySet, attempts, streak, accuracy, goToday, openProgress, openPractice, reviewSession }) {
  const [copied, setCopied] = useState(false);
  const correct = attempts.filter((attempt) => attempt.outcome === "correct").length;
  const concepts = [...new Set(todaySet.map((question) => question.concept))];
  const wrong = attempts.filter((attempt) => attempt.outcome === "wrong").length;

  const conceptDeltas = {};
  attempts.forEach((attempt) => {
    const shift = {
      correct: 8,
      easy: 10,
      good: 7,
      hard: 2,
      wrong: -9,
      again: -10,
      blank: -14,
    }[attempt.outcome] ?? 0;
    conceptDeltas[attempt.concept] = (conceptDeltas[attempt.concept] || 0) + shift;
  });

  const sortedDeltas = Object.entries(conceptDeltas).sort((a, b) => b[1] - a[1]);
  const strongestConcept = sortedDeltas[0];
  const strongestName = strongestConcept ? strongestConcept[0] : (concepts[0] || "Daily review");
  const strongestDeltaVal = strongestConcept ? strongestConcept[1] : 8;
  const strongestDeltaStr = strongestDeltaVal >= 0 ? `+${strongestDeltaVal}%` : `${strongestDeltaVal}%`;

  const copyResults = async () => {
    const grid = todaySet.map((q) => {
      const attempt = attempts.find((a) => a.questionId === q.id);
      if (!attempt) return "⬜";
      if (attempt.outcome === "correct") return "🟩";
      if (attempt.outcome === "wrong") return "🟥";
      return "📘";
    }).join("");

    const text = `CrackIt Daily Set Results 🚀\n` +
      `Streak: ${streak.current} days\n` +
      `Score: ${correct}/${todaySet.length} (${Math.round((correct / todaySet.length) * 100)}%)\n` +
      `Grid: ${grid}\n\n` +
      `Keep cracking CS fundamentals!`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy results: ", err);
    }
  };

  return (
    <div className="screen summary-screen">
      <article className="summary-paper summary-celebration">
        <div className="summary-badge">
          <Flame size={24} aria-hidden="true" />
          <span>{streak.current} day streak</span>
        </div>
        <p className="eyebrow">Daily set complete</p>
        <h1>{todaySet.length} questions done.</h1>
        <p className="summary-lede">
          {correct} of {todaySet.length} correct. You can stop here or keep practicing outside the daily count.
        </p>
        <div className="summary-grid">
          <MetricCard label="Accuracy" value={`${accuracy}%`} detail="All attempts" />
          <MetricCard label="Concepts" value={`${concepts.length}`} detail={concepts.slice(0, 2).join(" - ")} />
          <MetricCard label="Longest" value={`${streak.longest}`} detail="day streak" />
        </div>
        <div className="mastery-delta">
          <div className="delta-row positive">
            <span>Strongest today</span>
            <strong>{strongestName} {strongestDeltaStr}</strong>
          </div>
          <div className="delta-row warning">
            <span>Review again</span>
            <strong>{wrong ? `${wrong} target fixes` : "No misses"}</strong>
          </div>
        </div>
        <div className="summary-actions">
          <button className="ghost-button" onClick={goToday}>Back to today</button>
          <button className="ghost-button" onClick={copyResults} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Copy size={16} aria-hidden="true" />
            {copied ? "Copied!" : "Copy results"}
          </button>
          <button className="primary-button" onClick={reviewSession}>
            Review questions
            <ChevronRight size={16} aria-hidden="true" />
          </button>
          <button className="ghost-button" onClick={openPractice}>
            Practice more questions
            <ChevronRight size={16} aria-hidden="true" />
          </button>
          <button className="ghost-button" onClick={openProgress}>
            Open progress
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </article>
    </div>
  );
}

function PracticeSetupView({ conceptState, attempts, dsaAttempts = [], openCheatsheet, startPractice }) {
  const PRACTICE_SUBJECTS = ["DBMS", "OS", "CN", "OOP", "CPP", "PYTHON", "OA", "DSA"];

  const subjectCards = PRACTICE_SUBJECTS.map((subject) => {
    const meta = SUBJECT_META[subject];
    let coverage = { completed: 0, total: 0 };
    if (subject === "DSA") {
      coverage = dsaCoverage(dsaAttempts);
    } else {
      coverage = subjectQuestionCoverage(subject, attempts);
    }
    const coveragePercent = coverage.total
      ? Math.round((coverage.completed / coverage.total) * 100)
      : 0;
    return { subject, meta, coveragePercent, coverage };
  });

  return (
    <div className="screen practice-setup-screen">
      <header className="screen-header">
        <p className="eyebrow">Practice by topic</p>
        <h1>Pick a course to drill.</h1>
        <p className="screen-subtitle">Select a subject to read its cheatsheet or start practice questions directly.</p>
      </header>
      <div className="practice-subject-grid">
        {subjectCards.map(({ subject, meta, coveragePercent, coverage }) => (
          <div key={subject} className="practice-subject-card" onClick={() => openCheatsheet(subject)}>
            <div className="practice-subject-card-top">
              <span className="pill neutral" style={{ borderColor: meta.accent, color: meta.accent }}>
                {meta.name}
              </span>
              <span className="practice-subject-mastery">{coveragePercent}%</span>
            </div>
            <p className="practice-subject-detail">{meta.detail}</p>
            <div className="coverage-row" style={{ marginBottom: "4px" }}>
              <div className="coverage-bar">
                <span
                  className="coverage-bar-fill"
                  style={{ width: `${coveragePercent}%`, backgroundColor: meta.accent }}
                />
              </div>
              <span className="coverage-label">
                {coverage.completed}/{coverage.total} {subject === "DSA" ? "prompts" : "questions"} covered
              </span>
            </div>
            <div className="practice-card-actions">
              <button
                className="ghost-button small-action"
                onClick={(e) => {
                  e.stopPropagation();
                  openCheatsheet(subject);
                }}
              >
                Cheatsheet
              </button>
              <button
                className="primary-button small-action"
                style={{ backgroundColor: meta.accent, borderColor: meta.accent }}
                onClick={(e) => {
                  e.stopPropagation();
                  startPractice(subject);
                }}
              >
                Practice
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CheatsheetView({ subject, attempts, dsaAttempts = [], startPractice, openDsaPrompt }) {
  const meta = SUBJECT_META[subject] || { name: subject, accent: "#7b7168" };
  const cheatsheetData = CHEATSHEETS[subject] || [];

  let coverage = { completed: 0, total: 0 };
  if (subject === "DSA") {
    coverage = dsaCoverage(dsaAttempts);
  } else {
    coverage = subjectQuestionCoverage(subject, attempts);
  }
  const coveragePercent = coverage.total ? Math.round((coverage.completed / coverage.total) * 100) : 0;

  const [expandedTopic, setExpandedTopic] = useState(null);
  const [displayMode, setDisplayMode] = useState("reader"); // "reader" or "board"
  const [activeTopicIndex, setActiveTopicIndex] = useState(0);

  const toggleTopic = (topicName) => {
    setExpandedTopic(expandedTopic === topicName ? null : topicName);
  };

  const activeTopic = cheatsheetData[activeTopicIndex] || cheatsheetData[0];

  return (
    <div className="screen cheatsheet-screen view-enter">
      <div className="cheatsheet-header-row">
        <div className="cheatsheet-header">
          <span className="pill neutral" style={{ borderColor: meta.accent, color: meta.accent }}>
            {meta.name}
          </span>
          <h1>{meta.name} Cheatsheet</h1>
          <p className="cheatsheet-subtitle">{meta.detail}</p>
        </div>

        {cheatsheetData.length > 0 && (
          <div className="cheatsheet-mode-toggle">
            <button
              className={classNames("toggle-btn", displayMode === "reader" && "active")}
              onClick={() => setDisplayMode("reader")}
              title="Reader View (Split Pane)"
            >
              <Columns size={14} aria-hidden="true" />
              <span>Reader View</span>
            </button>
            <button
              className={classNames("toggle-btn", displayMode === "board" && "active")}
              onClick={() => setDisplayMode("board")}
              title="Board View (Grid)"
            >
              <LayoutGrid size={14} aria-hidden="true" />
              <span>Board View</span>
            </button>
          </div>
        )}
      </div>

      <div className="cheatsheet-practice-card" style={{ borderColor: meta.accent + "33" }}>
        <div className="practice-card-info">
          <h2>Subject Practice</h2>
          <p>Test your knowledge with practice questions for the entire subject.</p>
          <div className="coverage-row">
            <div className="coverage-bar">
              <span className="coverage-bar-fill" style={{ width: `${coveragePercent}%`, backgroundColor: meta.accent }} />
            </div>
            <span className="coverage-label">
              {coverage.completed}/{coverage.total} {subject === "DSA" ? "prompts" : "questions"} covered
            </span>
          </div>
        </div>
        <button className="primary-button" style={{ backgroundColor: meta.accent }} onClick={() => startPractice(subject)}>
          Start Practice
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="cheatsheet-content-container">
        {cheatsheetData.length === 0 ? (
          <p className="no-topics">No cheatsheet data available for this subject.</p>
        ) : (
          <>
            {/* Mobile Accordion View (Hidden on desktop) */}
            <div className="cheatsheet-mobile-accordion">
              <div className="topics-accordion">
                {cheatsheetData.map((t) => {
                  const isExpanded = expandedTopic === t.topic;

                  return (
                    <div key={t.topic} className={classNames("cheatsheet-topic-item", isExpanded && "expanded")}>
                      <button className="topic-trigger" onClick={() => toggleTopic(t.topic)}>
                        <span className="topic-title">{t.topic}</span>
                        <div className="topic-trigger-right">
                          <span className="arrow-icon">{isExpanded ? "▲" : "▼"}</span>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="topic-content view-enter">
                          <p className="topic-brief">{t.brief}</p>
                          {t.subtopics && t.subtopics.length > 0 && (
                            <div className="subtopics-list">
                              {t.subtopics.map((sub, sIdx) => (
                                <div key={sIdx} className="subtopic-card">
                                  <span className="subtopic-name">{sub.name}</span>
                                  <p className="subtopic-explanation">{sub.explanation}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop Views (Hidden on mobile) */}
            <div className="cheatsheet-desktop-content">
              {displayMode === "reader" ? (
                /* Reader View: Split Pane */
                <div className="cheatsheet-split-layout">
                  <aside className="cheatsheet-sidebar">
                    <p className="sidebar-title">Topics</p>
                    <nav className="sidebar-nav">
                      {cheatsheetData.map((t, idx) => (
                        <button
                          key={t.topic}
                          className={classNames("sidebar-item", activeTopicIndex === idx && "active")}
                          style={activeTopicIndex === idx ? { borderLeftColor: meta.accent, color: meta.accent, fontWeight: "700" } : {}}
                          onClick={() => setActiveTopicIndex(idx)}
                        >
                          {t.topic}
                        </button>
                      ))}
                    </nav>
                  </aside>

                  <main className="cheatsheet-reader-panel view-enter" key={activeTopic?.topic}>
                    <h2 className="reader-topic-title">{activeTopic?.topic}</h2>
                    <p className="reader-topic-brief">{activeTopic?.brief}</p>
                    {activeTopic?.subtopics && activeTopic.subtopics.length > 0 && (
                      <div className="reader-subtopics-section">
                        <h3>Subtopics</h3>
                        <div className="reader-subtopics-grid">
                          {activeTopic.subtopics.map((sub, sIdx) => (
                            <div key={sIdx} className="reader-subtopic-card">
                              <span className="subtopic-name">{sub.name}</span>
                              <p className="subtopic-explanation">{sub.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </main>
                </div>
              ) : (
                /* Board View: Grid Board */
                <div className="cheatsheet-grid-board">
                  {cheatsheetData.map((t) => (
                    <div key={t.topic} className="board-topic-card">
                      <h3 className="board-topic-title" style={{ borderLeftColor: meta.accent }}>
                        {t.topic}
                      </h3>
                      <p className="board-topic-brief">{t.brief}</p>
                      {t.subtopics && t.subtopics.length > 0 && (
                        <div className="board-subtopics-list">
                          {t.subtopics.map((sub, sIdx) => (
                            <div key={sIdx} className="board-subtopic-item">
                              <span className="subtopic-name">{sub.name}</span>
                              <p className="subtopic-explanation">{sub.explanation}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PracticeSummaryView({ subject, practiceSet, attempts, goPracticeSetup, goToday, reviewPractice }) {
  const meta = SUBJECT_META[subject] || { name: subject };
  const correct = attempts.filter((attempt) => attempt.outcome === "correct").length;

  return (
    <div className="screen summary-screen">
      <article className="summary-paper">
        <p className="eyebrow">Practice complete</p>
        <h1>{meta.name} session done.</h1>
        <p className="summary-lede">
          {correct} of {practiceSet.length} correct. These attempts updated your mastery but didn't touch your streak.
        </p>
        <div className="summary-actions">
          <button className="ghost-button" onClick={goToday}>Back to today</button>
          <button className="primary-button" onClick={reviewPractice}>
            Review questions
            <ChevronRight size={16} aria-hidden="true" />
          </button>
          <button className="ghost-button" onClick={goPracticeSetup}>
            Practice another topic
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </article>
    </div>
  );
}

function ProgressView({
  conceptState,
  attempts,
  dsaAttempts,
  streak,
  accuracy,
  selectedCourses,
  currentSyncId,
  syncIdInput,
  syncIdActionMessage,
  syncStatus,
  syncMessage,
  setSyncIdInput,
  copyCurrentSyncId,
  loadProgressBySyncId,
  regenerateSet,
}) {
  const activeSubjects = selectedCourses.filter((subject) => SUBJECTS.includes(subject));
  const subjectRows = activeSubjects.map((subject) => {
    // Use cheatsheet topics only — don't show concepts the app doesn't teach yet.
    const concepts = cheatsheetConceptsForSubject(subject);
    const mastery = concepts.length
      ? Math.round(
          concepts.reduce((sum, concept) => sum + (conceptState[concept.key]?.mastery || 0), 0) / concepts.length,
        )
      : 0;
    const coverage = subjectQuestionCoverage(subject, attempts);
    return { subject, concepts, mastery, coverage };
  });
  const activityLevels = buildActivityLevels(attempts, dsaAttempts);
  const visibleMcqConcepts = activeSubjects.flatMap((subject) =>
    cheatsheetConceptsForSubject(subject).map(({ key, label }) => [key, conceptState[key], label]),
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

  const dsaMastery = Math.round(
    DSA_PROMPTS.reduce((sum, prompt) => sum + (conceptState[dsaConceptKey(prompt)]?.mastery || 0), 0) /
      DSA_PROMPTS.length
  );

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
            {activityLevels.map((level, index) => (
              <span key={index} className={`level-${level}`} />
            ))}
          </div>
        </div>
        <div className="heatmap">
          {subjectRows.map((row) => (
            <div className="subject-block" key={row.subject}>
              <div className="subject-head">
                <strong>{subjectLabel(row.subject)}</strong>
                <span>{row.mastery}%</span>
              </div>
              <div className="coverage-row">
                <div className="coverage-bar">
                  <span
                    className="coverage-bar-fill"
                    style={{ width: `${row.mastery}%` }}
                  />
                </div>
                <span className="coverage-label">
                  {row.coverage.completed}/{row.coverage.total} questions covered
                </span>
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
                      {parseAndFormatCode(concept.label)}
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
                <span>{dsaMastery}%</span>
              </div>
              <div className="coverage-row">
                <div className="coverage-bar">
                  <span
                    className="coverage-bar-fill"
                    style={{ width: `${dsaMastery}%` }}
                  />
                </div>
                <span className="coverage-label">
                  {dsaCoverage(dsaAttempts).completed}/{dsaCoverage(dsaAttempts).total} prompts covered
                </span>
              </div>
              <div className="concept-grid">
                {DSA_PROMPTS.map((prompt) => (
                  <span
                    key={dsaConceptKey(prompt)}
                    className="concept-cell"
                    style={{ "--mastery": `${conceptState[dsaConceptKey(prompt)]?.mastery || 0}%` }}
                  >
                    {parseAndFormatCode(prompt.concept)}
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

      <section className="progress-settings-section">
        {/* Progress Sync Card */}
        <div className={classNames("setting-feature-card sync-card", syncStatus)}>
          <div className="sync-card-layout">
            <div className="sync-card-header">
              <div>
                <p className="eyebrow">Progress sync</p>
                <strong style={{ display: "block", marginTop: "4px" }}>
                  {syncStatus === "synced"
                    ? "Synced"
                    : syncStatus === "syncing"
                      ? "Syncing"
                      : syncStatus === "checking"
                        ? "Checking"
                        : syncStatus === "offline"
                          ? "Offline"
                          : "Local only"}
                </strong>
                <small className="sync-status-message">{syncMessage}</small>
              </div>
              <div className="sync-id-display">
                <span className="sync-id-label">Device Sync ID</span>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
                  <code className="sync-id-code">{currentSyncId}</code>
                  <button
                    type="button"
                    className="copy-sync-button"
                    onClick={copyCurrentSyncId}
                  >
                    <Copy size={13} aria-hidden="true" />
                    <span>Copy ID</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="sync-card-divider" />

            <div className="sync-card-actions">
              <form
                className="sync-load-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  loadProgressBySyncId();
                }}
              >
                <div className="sync-input-wrapper">
                  <label htmlFor="sync-id-field" className="sync-input-label">
                    Load progress from another device
                  </label>
                  <div className="sync-input-row">
                    <input
                      id="sync-id-field"
                      type="text"
                      inputMode="text"
                      value={syncIdInput}
                      onChange={(event) => setSyncIdInput(event.target.value)}
                      placeholder="Enter another Sync ID"
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck="false"
                    />
                    <button type="submit" className="primary-button small-action sync-submit-btn">
                      <LogIn size={14} aria-hidden="true" />
                      <span>Link Device</span>
                    </button>
                  </div>
                </div>
              </form>
              {syncIdActionMessage && (
                <p className="sync-action-feedback">{syncIdActionMessage}</p>
              )}
            </div>
          </div>
        </div>

        <button className="setting-feature-card danger rebuild-card" onClick={regenerateSet}>
          <span>
            <p className="eyebrow">Today</p>
            <strong>Rebuild set</strong>
            <small>Recreate your daily practice queue.</small>
          </span>
          <RotateCcw size={20} aria-hidden="true" />
        </button>
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

function AiPanel({ actionLabel, run, resultLabel = "AI", allowFollowUp = false, startWithInput = false }) {
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const [lastPrompt, setLastPrompt] = useState(undefined);

  async function trigger(prompt) {
    const activePrompt = prompt !== undefined ? prompt : lastPrompt;
    if (prompt !== undefined) {
      setLastPrompt(prompt);
    }
    setStatus("loading");
    setError("");
    try {
      const text = await run(activePrompt);
      setResult(text);
      setStatus("done");
    } catch (err) {
      setError(err.message || "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "idle") {
    return (
      <button className="ai-trigger" onClick={() => (startWithInput ? setStatus("input") : trigger())}>
        <Sparkles size={14} aria-hidden="true" />
        {actionLabel}
      </button>
    );
  }

  if (status === "input") {
    return (
      <form
        className="ai-followup"
        onSubmit={(event) => {
          event.preventDefault();
          if (!question.trim()) return;
          trigger(question);
        }}
      >
        <input
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask a follow-up..."
        />
        <button type="submit" aria-label="Send">
          <Send size={14} aria-hidden="true" />
        </button>
      </form>
    );
  }

  return (
    <div className="ai-panel">
      <p className="eyebrow">
        <Sparkles size={12} aria-hidden="true" />
        {resultLabel}
      </p>
      {status === "loading" && (
        <p className="ai-loading">
          <Loader2 size={14} className="spin" aria-hidden="true" />
          Thinking...
        </p>
      )}
      {status === "error" && (
        <p className="ai-error">
          {error}
          <button className="text-button" onClick={() => trigger()}>
            Try again
          </button>
        </p>
      )}
      {status === "done" && <p className="ai-result">{result}</p>}
      {status === "done" && allowFollowUp && (
        <form
          className="ai-followup"
          onSubmit={(event) => {
            event.preventDefault();
            if (!question.trim()) return;
            trigger(question);
            setQuestion("");
          }}
        >
          <input
            type="text"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask a follow-up..."
          />
          <button type="submit" aria-label="Send">
            <Send size={14} aria-hidden="true" />
          </button>
        </form>
      )}
    </div>
  );
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

// ----------------------------------------------------------------------------
// INTERACTIVE CHALLENGES (FUN QUESTIONS)
// ----------------------------------------------------------------------------

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function InteractiveListView({ attempts, onSelectChallenge }) {
  const getChallengeStatus = (id) => {
    const challengeAttempts = attempts.filter((a) => a.challengeId === id);
    if (!challengeAttempts.length) return "Unattempted";
    const hasPassed = challengeAttempts.some((a) => a.outcome === "correct");
    return hasPassed ? "Completed" : "Failed";
  };

  const completedCount = INTERACTIVE_QUESTIONS.filter((q) => {
    return attempts.some((a) => a.challengeId === q.id && a.outcome === "correct");
  }).length;

  const totalCount = INTERACTIVE_QUESTIONS.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="screen interactive-list-screen view-enter">
      <header className="page-hero color-wash">
        <p className="eyebrow">Interactive Drills</p>
        <h1>Concept Puzzles</h1>
        <p>Test your procedural and conceptual CS knowledge with interactive ordering, sorting, and fill-in-the-blank puzzles.</p>

        <div className="interactive-progress-bar-container">
          <div className="interactive-progress-bar-header">
            <span>Progress: {completedCount} / {totalCount} drills completed</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="interactive-progress-track">
            <div className="interactive-progress-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
      </header>

      <section className="interactive-challenges-section" aria-label="Interactive challenges list">
        <div className="interactive-list-grid">
          {INTERACTIVE_QUESTIONS.map((q) => {
            const status = getChallengeStatus(q.id);
            const statusClass = status.toLowerCase();
            const subjectMeta = SUBJECT_META[q.subject] || { name: q.subject, accent: "#7b7168" };

            let typeLabel = "";
            if (q.type === "ordering") typeLabel = "Sequencing";
            else if (q.type === "categorize") typeLabel = "Categorization";
            else if (q.type === "cloze") typeLabel = "Fill-in-the-blank";

            return (
              <button
                key={q.id}
                className="challenge-card"
                onClick={() => onSelectChallenge(q.id)}
              >
                <div className="challenge-card-header">
                  <span className="subject-badge" style={{ backgroundColor: subjectMeta.accent }}>
                    {subjectMeta.name}
                  </span>
                  <span className={`status-badge status-${statusClass}`}>
                    {status}
                  </span>
                </div>
                <h3>{q.title}</h3>
                <p className="challenge-desc">{q.instructions}</p>
                <div className="challenge-card-footer">
                  <span className="type-badge">{typeLabel}</span>
                  <span className={`difficulty-badge ${q.difficulty}`}>
                    {q.difficulty}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function InteractivePlayView({ challenge, recordAttempt, onBack }) {
  if (!challenge) return null;

  // State variables for various question types
  const [userOrder, setUserOrder] = useState([]);
  const [userAssignments, setUserAssignments] = useState({}); // { itemText: bucketName }
  const [userCloze, setUserCloze] = useState({}); // { blankId: string }

  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // Animation & Selection states
  const [swappingIndices, setSwappingIndices] = useState(null); // { first: number, second: number, direction: 'up' | 'down' }
  const [selectedItemText, setSelectedItemText] = useState(null);

  // Drag and Drop helpers (for ordering)
  const [activeDragIndex, setActiveDragIndex] = useState(null);

  // Initialize and shuffle questions
  useEffect(() => {
    setIsChecked(false);
    setIsCorrect(false);
    setRevealed(false);
    setSwappingIndices(null);
    setSelectedItemText(null);

    if (challenge.type === "ordering") {
      setUserOrder(shuffleArray(challenge.steps));
    } else {
      setUserOrder([]);
    }

    setUserAssignments({});
    setUserCloze({});
  }, [challenge]);

  // ----------------------------------------------------------------------------
  // ORDERING LOGIC
  // ----------------------------------------------------------------------------
  const handleOrderDragStart = (e, index) => {
    setActiveDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleOrderDragOver = (e) => {
    e.preventDefault();
  };

  const handleOrderDrop = (e, targetIndex) => {
    e.preventDefault();
    if (activeDragIndex === null || activeDragIndex === targetIndex) return;
    const list = [...userOrder];
    const draggedItem = list[activeDragIndex];
    list.splice(activeDragIndex, 1);
    list.splice(targetIndex, 0, draggedItem);
    setUserOrder(list);
    setActiveDragIndex(null);
  };

  const moveItemUp = (index) => {
    if (index === 0 || swappingIndices) return;
    setSwappingIndices({ first: index - 1, second: index, direction: "up" });
    setTimeout(() => {
      const list = [...userOrder];
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
      setUserOrder(list);
      setSwappingIndices(null);
    }, 180);
  };

  const moveItemDown = (index) => {
    if (index === userOrder.length - 1 || swappingIndices) return;
    setSwappingIndices({ first: index, second: index + 1, direction: "down" });
    setTimeout(() => {
      const list = [...userOrder];
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
      setUserOrder(list);
      setSwappingIndices(null);
    }, 180);
  };

  // ----------------------------------------------------------------------------
  // CATEGORIZATION LOGIC
  // ----------------------------------------------------------------------------

  const assignItem = (itemText, bucketName) => {
    setUserAssignments((prev) => ({
      ...prev,
      [itemText]: bucketName,
    }));
  };

  const unassignItem = (itemText) => {
    setUserAssignments((prev) => {
      const next = { ...prev };
      delete next[itemText];
      return next;
    });
  };

  // Get items not yet placed in any bucket
  const unassignedItems = challenge.type === "categorize" 
    ? challenge.items.filter((item) => !userAssignments[item.text])
    : [];

  const allItemsAssigned = challenge.type === "categorize" && unassignedItems.length === 0;

  // ----------------------------------------------------------------------------
  // CHECK & REVEAL ANSWERS
  // ----------------------------------------------------------------------------
  const checkAnswer = () => {
    let correct = false;

    if (challenge.type === "ordering") {
      correct = userOrder.every((step, idx) => step === challenge.steps[idx]);
    } else if (challenge.type === "categorize") {
      correct = challenge.items.every((item) => userAssignments[item.text] === item.bucket);
    } else if (challenge.type === "cloze") {
      correct = challenge.blanks.every(
        (blank) => (userCloze[blank.id] || "").trim().toLowerCase() === blank.correct.toLowerCase()
      );
    }

    setIsCorrect(correct);
    setIsChecked(true);
    recordAttempt(challenge.id, correct ? "correct" : "wrong");
  };

  const revealAnswers = () => {
    if (challenge.type === "ordering") {
      setUserOrder(challenge.steps);
    } else if (challenge.type === "categorize") {
      const solution = {};
      challenge.items.forEach((item) => {
        solution[item.text] = item.bucket;
      });
      setUserAssignments(solution);
    } else if (challenge.type === "cloze") {
      const solution = {};
      challenge.blanks.forEach((blank) => {
        solution[blank.id] = blank.correct;
      });
      setUserCloze(solution);
    }
    setIsCorrect(true);
    setIsChecked(true);
    setRevealed(true);
  };

  const resetChallenge = () => {
    setIsChecked(false);
    setIsCorrect(false);
    setRevealed(false);
    if (challenge.type === "ordering") {
      setUserOrder(shuffleArray(challenge.steps));
    } else {
      setUserOrder([]);
    }
    setUserAssignments({});
    setUserCloze({});
  };

  // Render variables
  const subjectMeta = SUBJECT_META[challenge.subject] || { name: challenge.subject, accent: "#7b7168" };

  return (
    <div className="screen interactive-play-screen view-enter">
      <div className="challenge-play-container">
        {/* Eyebrow info bar */}
        <div className="challenge-play-eyebrow">
          <span className="subject-badge" style={{ backgroundColor: subjectMeta.accent }}>
            {subjectMeta.name}
          </span>
          <span className="concept-label">{challenge.concept}</span>
          <span className={`difficulty-badge ${challenge.difficulty}`}>
            {challenge.difficulty}
          </span>
        </div>

        <h1>{challenge.title}</h1>
        <p className="challenge-instructions-text">{challenge.instructions}</p>

        {/* ------------------------------------------------------------------ */}
        {/* ORDERING LAYOUT */}
        {/* ------------------------------------------------------------------ */}
        {challenge.type === "ordering" && (
          <div className="ordering-list">
            {userOrder.map((step, idx) => {
              const isStepCorrect = isChecked && step === challenge.steps[idx];
              const isStepIncorrect = isChecked && step !== challenge.steps[idx];

              const isSwappingFirst = swappingIndices && swappingIndices.first === idx;
              const isSwappingSecond = swappingIndices && swappingIndices.second === idx;

              return (
                <div
                  key={idx}
                  draggable={!isChecked}
                  onDragStart={(e) => handleOrderDragStart(e, idx)}
                  onDragOver={handleOrderDragOver}
                  onDrop={(e) => handleOrderDrop(e, idx)}
                  className={classNames(
                    "ordering-item",
                    isStepCorrect && "step-correct",
                    isStepIncorrect && "step-incorrect",
                    activeDragIndex === idx && "dragging",
                    isSwappingFirst && "swapping-down",
                    isSwappingSecond && "swapping-up"
                  )}
                >
                  <div className="ordering-left">
                    <span className="ordering-index">{idx + 1}</span>
                    {!isChecked && (
                      <span className="drag-handle" title="Drag to reorder">
                        <Move size={14} />
                      </span>
                    )}
                    <span className="ordering-text">{parseAndFormatCode(step)}</span>
                  </div>

                  {!isChecked && (
                    <div className="ordering-arrows">
                      <button
                        className="arrow-btn"
                        onClick={() => moveItemUp(idx)}
                        disabled={idx === 0}
                        aria-label="Move item up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        className="arrow-btn"
                        onClick={() => moveItemDown(idx)}
                        disabled={idx === userOrder.length - 1}
                        aria-label="Move item down"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* CATEGORIZATION LAYOUT */}
        {/* ------------------------------------------------------------------ */}
        {challenge.type === "categorize" && (
          <div className="categorize-stage">
            {/* Unassigned Pool */}
            {!isChecked && unassignedItems.length > 0 && (
              <div className="unassigned-pool-panel">
                <p className="eyebrow">Select an item to categorize ({unassignedItems.length} remaining)</p>
                <div className="unassigned-pool">
                  {unassignedItems.map((item) => {
                    const isSelected = selectedItemText === item.text;
                    return (
                      <button
                        key={item.text}
                        className={classNames(
                          "categorize-item",
                          isSelected && "selected"
                        )}
                        onClick={() => {
                          if (selectedItemText === item.text) {
                            setSelectedItemText(null);
                          } else {
                            setSelectedItemText(item.text);
                          }
                        }}
                      >
                        <div className="item-text">{parseAndFormatCode(item.text)}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!isChecked && allItemsAssigned && (
              <div className="all-placed-banner">
                <Check size={18} />
                <span>All items placed! Click &quot;Check Answer&quot; to verify.</span>
              </div>
            )}

            {/* Buckets Grid */}
            <div className="buckets-grid">
              {challenge.buckets.map((bucketName) => {
                const assignedItems = challenge.items.filter(
                  (item) => userAssignments[item.text] === bucketName
                );
                const isTargetActive = !!selectedItemText && !isChecked;

                return (
                  <div
                    key={bucketName}
                    className={classNames(
                      "bucket-zone",
                      isTargetActive && "active-target"
                    )}
                    onClick={() => {
                      if (isTargetActive) {
                        assignItem(selectedItemText, bucketName);
                        setSelectedItemText(null);
                      }
                    }}
                  >
                    <div className="bucket-header">
                      <h3>{bucketName}</h3>
                      <span className="bucket-count">{assignedItems.length} items</span>
                    </div>

                    <div className="bucket-content">
                      {assignedItems.length === 0 ? (
                        <p className="bucket-empty-placeholder">
                          {isTargetActive ? "Tap here to place item" : "Select an item above, then tap here"}
                        </p>
                      ) : (
                        assignedItems.map((item) => {
                          const isPlacedCorrectly = isChecked && item.bucket === bucketName;
                          const isPlacedIncorrectly = isChecked && item.bucket !== bucketName;

                          return (
                            <div
                              key={item.text}
                              className={classNames(
                                "bucket-item-card",
                                isPlacedCorrectly && "placed-correct",
                                isPlacedIncorrectly && "placed-incorrect"
                              )}
                            >
                              <div className="item-text">{parseAndFormatCode(item.text)}</div>
                              {!isChecked && (
                                <button
                                  className="remove-item-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    unassignItem(item.text);
                                  }}
                                  aria-label="Remove item"
                                >
                                  <X size={14} />
                                </button>
                              )}
                              {isPlacedIncorrectly && (
                                <span className="correct-bucket-hint">
                                  Should be in: {item.bucket}
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* CLOZE LAYOUT */}
        {/* ------------------------------------------------------------------ */}
        {challenge.type === "cloze" && (
          <div className="cloze-stage">
            <pre className="cloze-code-block">
              <code>
                {challenge.code.split(/(\[BLANK\d+\])/g).map((part, index) => {
                  const match = part.match(/\[(BLANK\d+)\]/);
                  if (match) {
                    const blankId = match[1];
                    const blankInfo = challenge.blanks.find((b) => b.id === blankId);
                    const userVal = userCloze[blankId] || "";
                    const isBlankCorrect =
                      isChecked && userVal.trim().toLowerCase() === blankInfo.correct.toLowerCase();
                    const isBlankIncorrect =
                      isChecked && userVal.trim().toLowerCase() !== blankInfo.correct.toLowerCase();

                    return (
                      <input
                        key={blankId}
                        type="text"
                        disabled={isChecked}
                        value={userVal}
                        className={classNames(
                          "cloze-input",
                          isBlankCorrect && "input-correct",
                          isBlankIncorrect && "input-incorrect"
                        )}
                        placeholder={blankInfo ? blankInfo.placeholder : "..."}
                        style={{
                          fontSize: "16px",
                          width: `${Math.max(8, blankInfo ? blankInfo.correct.length + 2 : 10)}ch`,
                        }}
                        onChange={(e) => {
                          setUserCloze({
                            ...userCloze,
                            [blankId]: e.target.value,
                          });
                        }}
                      />
                    );
                  }
                  return <span key={index}>{part}</span>;
                })}
              </code>
            </pre>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* ACTION BUTTONS & FEEDBACK PANEL */}
        {/* ------------------------------------------------------------------ */}
        <div className="challenge-play-actions">
          {!isChecked ? (
            <div className="action-row">
              <button
                className="primary-button"
                onClick={checkAnswer}
                disabled={challenge.type === "categorize" && !allItemsAssigned}
              >
                Check Answer
              </button>
            </div>
          ) : (
            <div className="feedback-flow">
              {isCorrect ? (
                <div className="success-banner view-enter">
                  <div className="success-banner-header">
                    <Check size={20} />
                    <strong>Correct!</strong>
                  </div>
                  {revealed && <p className="revealed-note">Correct answer is revealed below.</p>}
                </div>
              ) : (
                <div className="error-banner view-enter">
                  <div className="error-banner-header">
                    <X size={20} />
                    <strong>Some parts are incorrect.</strong>
                  </div>
                  <p>Check the red-highlighted items and try again!</p>
                  <div className="error-actions">
                    <button className="secondary-button" onClick={resetChallenge}>
                      <RotateCcw size={14} />
                      Try Again
                    </button>
                    <button className="text-button" onClick={revealAnswers}>
                      Reveal Answer
                    </button>
                  </div>
                </div>
              )}

              {/* Explanatory components (only show if correct or revealed) */}
              {(isCorrect || revealed) && (
                <div className="explanation-reveal view-enter">
                  {challenge.proTip && (
                    <div className="pro-tip-card">
                      <p className="eyebrow">Pro Tip</p>
                      <div className="explanation-text">{parseAndFormatCode(challenge.proTip)}</div>
                    </div>
                  )}

                  {challenge.lesson && (
                    <div className="lesson-paper">
                      <h3>Concept Explanation</h3>
                      <div className="lesson-body-text">{parseAndFormatCode(challenge.lesson)}</div>
                    </div>
                  )}

                  {challenge.remember && (
                    <div className="remember-box">
                      <strong>Remember:</strong> {parseAndFormatCode(challenge.remember)}
                    </div>
                  )}

                  <div className="continue-row">
                    <button className="primary-button continue-btn" onClick={onBack}>
                      <span>Return to Challenges</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
