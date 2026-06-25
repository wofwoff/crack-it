const PROXY_URL = import.meta.env.VITE_VERTEX_PROXY_URL;
const PROXY_SECRET = import.meta.env.VITE_VERTEX_PROXY_SECRET;

export const isAiConfigured = Boolean(PROXY_URL && PROXY_SECRET);

async function askLlm(prompt) {
  if (!PROXY_URL || !PROXY_SECRET) {
    throw new Error("AI proxy is not configured");
  }
  const response = await fetch(`${PROXY_URL}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-app-secret": PROXY_SECRET,
    },
    body: JSON.stringify({ prompt }),
  });
  if (!response.ok) {
    throw new Error(`AI request failed (${response.status})`);
  }
  const data = await response.json();
  return data.text?.trim() || "";
}

function extractJson(text) {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("AI response was not valid JSON");
    }
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

function normalizeGeneratedQuestion(question, index) {
  const options = Array.isArray(question.options) ? question.options.slice(0, 4) : [];
  if (!question.subject || !question.concept || !question.stem || options.length !== 4) {
    throw new Error("AI response is missing question fields");
  }
  const correctIndex = Number(question.correctIndex);
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
    throw new Error("AI response has an invalid correct answer");
  }

  return {
    id: `generated-interview-${Date.now()}-${index}`,
    subject: String(question.subject).trim(),
    concept: String(question.concept).trim(),
    difficulty: question.difficulty || "application",
    stem: String(question.stem).trim(),
    options: options.map((option, optionIndex) => ({
      text: compactText(option.text, 110),
      sub: compactText(option.sub, 72),
      fix: optionIndex === correctIndex ? "" : String(option.fix || "This option does not fit the scenario constraints.").trim(),
    })),
    correctIndex,
    proTip: String(question.proTip || question.explanation || "").trim(),
    lesson: String(question.lesson || question.explanation || "").trim(),
    remember: String(question.remember || "").trim(),
    interviewAnswer: String(question.interviewAnswer || question.explanation || "").trim(),
  };
}

function compactText(value, maxLength) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  const sentenceEnd = text.search(/[.;:]/);
  const clipped = sentenceEnd > 24 && sentenceEnd < maxLength ? text.slice(0, sentenceEnd) : text.slice(0, maxLength - 1);
  return `${clipped.trim()}...`;
}

async function askQuestionGenerator(prompt) {
  if (!PROXY_URL || !PROXY_SECRET) {
    throw new Error("AI proxy is not configured");
  }
  const response = await fetch(`${PROXY_URL}/generate-question-set`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-app-secret": PROXY_SECRET,
    },
    body: JSON.stringify({ prompt }),
  });
  if (!response.ok) {
    throw new Error(`AI question generation failed (${response.status})`);
  }
  const data = await response.json();
  const parsed = extractJson(data.text || "");
  const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
  if (!questions.length) {
    throw new Error("AI response did not include questions");
  }
  return questions.map(normalizeGeneratedQuestion);
}

export function generateApplicationInterviewQuestions({ scope, count = 3 }) {
  const syllabus = scope
    .map(
      ({ subject, concepts }) =>
        `${subject}: ${concepts.map((concept) => concept.label).join(", ")}`
    )
    .join("\n");

  return askQuestionGenerator(
    `You are generating interview practice questions for a computer science placement prep app.\n\n` +
      `Create exactly ${count} multiple-choice questions.\n\n` +
      `CRITICAL QUESTION STYLE:\n` +
      `- Ask only situational, application-level, interview-style questions.\n` +
      `- Do not ask definition recall, trivia, formula recall, acronym expansion, or textbook-only questions.\n` +
      `- Each stem must describe a real engineering situation: a production bug, system behavior, design tradeoff, debugging clue, performance symptom, concurrency issue, API behavior, code review decision, or architecture choice.\n` +
      `- The learner should have to apply the concept to the scenario, not merely recognize a term.\n` +
      `- For DBMS, OS, CN, OOP, C++, and Python, prefer practical CSE fundamentals scenarios that can realistically appear in interviews.\n` +
      `- Keep the questions high-quality and high-signal, but avoid obscure edge cases unless the concept requires it.\n\n` +
      `SYLLABUS CONSTRAINT:\n` +
      `Use only these selected subjects and concepts. Do not introduce unrelated subjects or concepts.\n${syllabus}\n\n` +
      `Return only valid JSON with this exact shape:\n` +
      `{"questions":[{"subject":"DBMS","concept":"Indexing","difficulty":"application","stem":"...","options":[{"text":"...","sub":"...","fix":"..."},{"text":"...","sub":"...","fix":"..."},{"text":"...","sub":"...","fix":"..."},{"text":"...","sub":"...","fix":"..."}],"correctIndex":0,"proTip":"...","lesson":"...","remember":"...","interviewAnswer":"..."}]}\n\n` +
      `Rules for options:\n` +
      `- Exactly 4 options per question.\n` +
      `- One clearly correct option.\n` +
      `- Distractors must be plausible misunderstandings from interviews.\n` +
      `- option.text must be a concise choice, ideally under 12 words.\n` +
      `- option.sub must be a short hint label, ideally under 9 words.\n` +
      `- Do not put full explanations inside option.text or option.sub; put explanation in fix, proTip, lesson, and interviewAnswer.\n` +
      `- The correct option's fix may be empty; every wrong option needs a concise fix explaining why it fails in the scenario.\n` +
      `- Explanations should explain the practical reasoning behind the answer.`
  );
}

export function explainWrongMcqAnswer({ question, chosenOption }) {
  return askLlm(
    `A student practicing ${question.subject} (concept: ${question.concept}) answered this multiple-choice question incorrectly.\n\n` +
      `Question: ${question.stem}\n\n` +
      `They chose: "${chosenOption.text}" (${chosenOption.sub})\n` +
      `The correct answer was: "${question.options[question.correctIndex].text}" (${question.options[question.correctIndex].sub})\n\n` +
      `The canned explanation already shown to them is: "${chosenOption.fix}"\n\n` +
      `Explain, in a different way than the canned explanation, the specific misconception behind their wrong choice and why the correct answer holds. ` +
      `Keep it under 100 words, direct, no preamble.`
  );
}

export function gradeDsaAnswer({ prompt, draft }) {
  return askLlm(
    `A student is practicing a DSA logic drill (concept: ${prompt.concept}).\n\n` +
      `Prompt: ${prompt.prompt}\n\n` +
      `Reference model answer: ${prompt.modelAnswer}\n\n` +
      `The student wrote this explanation of their approach:\n"${draft}"\n\n` +
      `Grade their approach against the model answer. Point out what's correct, what's missing or wrong (e.g. complexity, edge cases, invariants), and be specific. ` +
      `Keep it under 120 words, direct, no preamble.`
  );
}

export function explainDsaMistake({ prompt, draft }) {
  return askLlm(
    `A student attempted this DSA logic drill (concept: ${prompt.concept}) and rated their own attempt as weak.\n\n` +
      `Prompt: ${prompt.prompt}\n\n` +
      `Reference model answer: ${prompt.modelAnswer}\n\n` +
      `Their attempt:\n"${draft || "(left blank)"}"\n\n` +
      `Explain the core mistake or gap in their thinking compared to the model answer, and the one key insight that would have unlocked it. ` +
      `Keep it under 100 words, direct, no preamble.`
  );
}

export function followUpQuestion({ concept, subject, context, question }) {
  return askLlm(
    `A student practicing ${subject} (concept: ${concept}) is reviewing this material:\n\n` +
      `${context}\n\n` +
      `They have a follow-up question: "${question}"\n\n` +
      `Answer it directly and concisely, staying scoped to the concept above. Under 120 words, no preamble.`
  );
}
