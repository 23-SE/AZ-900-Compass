/**
 * AZ-900 Compass — Scoring Engine Test Suite
 * ============================================
 * Owner: Gilton (Backend, Scoring & Data Lead)
 *
 * 35 tests across 8 suites. Zero dependencies. Run with:
 *   node backend/scoring/scoringEngine.test.js
 */

"use strict";

const {
  scoreQuiz,
  validateSubmission,
  buildAICoachRequest,
  buildStudyPlanRequest,
  getReadinessLabel,
  ValidationError,
} = require("./scoringEngine.js");

// ─────────────────────────────────────────────────────────────────────────────
// MICRO TEST FRAMEWORK
// ─────────────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const log = [];

function test(name, fn) {
  try {
    fn();
    log.push({ ok: true, name });
    passed++;
  } catch (err) {
    log.push({ ok: false, name, error: err.message });
    failed++;
  }
}

function eq(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(msg || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function contains(arr, item, msg) {
  if (!Array.isArray(arr) || !arr.includes(item)) {
    throw new Error(msg || `Expected array to contain "${item}". Got: ${JSON.stringify(arr)}`);
  }
}

function notContains(arr, item, msg) {
  if (Array.isArray(arr) && arr.includes(item)) {
    throw new Error(msg || `Expected array NOT to contain "${item}"`);
  }
}

function hasKey(obj, key) {
  if (!(key in obj)) throw new Error(`Missing required key: "${key}"`);
}

function throwsCode(fn, expectedCode) {
  let threw = false;
  try {
    fn();
  } catch (e) {
    threw = true;
    if (!(e instanceof ValidationError)) {
      throw new Error(`Expected ValidationError but got ${e.constructor.name}: ${e.message}`);
    }
    if (e.code !== expectedCode) {
      throw new Error(`Expected code "${expectedCode}", got "${e.code}"`);
    }
  }
  if (!threw) throw new Error(`Expected ValidationError(${expectedCode}) but nothing was thrown`);
}

// ─────────────────────────────────────────────────────────────────────────────
// MINIMAL QUESTION BANK FIXTURE
// Topics: cloud-concepts (3q), identity-security (2q), cost-governance (1q)
// All equal weight (1 point each), max = 6
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_QUESTIONS = [
  {
    id: "q001", topic: "cloud-concepts", topicLabel: "Describe cloud concepts",
    question: "Q1", options: [{ id: "a", text: "A" }, { id: "b", text: "B" }],
    correctOptionId: "a", explanation: "Explanation 1"
  },
  {
    id: "q002", topic: "cloud-concepts", topicLabel: "Describe cloud concepts",
    question: "Q2", options: [{ id: "a", text: "A" }, { id: "b", text: "B" }],
    correctOptionId: "a", explanation: "Explanation 2"
  },
  {
    id: "q003", topic: "cloud-concepts", topicLabel: "Describe cloud concepts",
    question: "Q3", options: [{ id: "a", text: "A" }, { id: "b", text: "B" }],
    correctOptionId: "b", explanation: "Explanation 3"
  },
  {
    id: "q004", topic: "identity-security", topicLabel: "Describe identity, access, and security",
    question: "Q4", options: [{ id: "a", text: "A" }, { id: "b", text: "B" }],
    correctOptionId: "b", explanation: "Explanation 4"
  },
  {
    id: "q005", topic: "identity-security", topicLabel: "Describe identity, access, and security",
    question: "Q5", options: [{ id: "a", text: "A" }, { id: "b", text: "B" }],
    correctOptionId: "a", explanation: "Explanation 5"
  },
  {
    id: "q006", topic: "cost-governance", topicLabel: "Describe Azure management and governance",
    question: "Q6", options: [{ id: "a", text: "A" }, { id: "b", text: "B" }],
    correctOptionId: "a", explanation: "Explanation 6"
  },
];

function makeSubmission(answers) {
  return {
    attemptId: "attempt-test-001",
    answers: answers.map(([questionId, selectedOptionId]) => ({ questionId, selectedOptionId })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1 — Readiness Label Thresholds
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📋 Suite 1: Readiness Label Thresholds");

test("Score 100 → 'Ready'",           () => eq(getReadinessLabel(100), "Ready"));
test("Score 85  → 'Ready'",           () => eq(getReadinessLabel(85),  "Ready"));
test("Score 84  → 'Nearly Ready'",    () => eq(getReadinessLabel(84),  "Nearly Ready"));
test("Score 70  → 'Nearly Ready'",    () => eq(getReadinessLabel(70),  "Nearly Ready"));
test("Score 69  → 'Making Progress'", () => eq(getReadinessLabel(69),  "Making Progress"));
test("Score 50  → 'Making Progress'", () => eq(getReadinessLabel(50),  "Making Progress"));
test("Score 49  → 'Keep Studying'",   () => eq(getReadinessLabel(49),  "Keep Studying"));
test("Score 0   → 'Keep Studying'",   () => eq(getReadinessLabel(0),   "Keep Studying"));

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2 — Perfect Score (all correct)
// 6/6 = 100%
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📋 Suite 2: Perfect Score (all correct)");

const perfectSub = makeSubmission([
  ["q001", "a"], ["q002", "a"], ["q003", "b"],
  ["q004", "b"], ["q005", "a"], ["q006", "a"],
]);

test("Perfect: overallScore = 100", () => {
  const r = scoreQuiz(perfectSub, MOCK_QUESTIONS);
  eq(r.overallScore, 100);
});
test("Perfect: correctAnswers = 6, totalQuestions = 6", () => {
  const r = scoreQuiz(perfectSub, MOCK_QUESTIONS);
  eq(r.correctAnswers, 6); eq(r.totalQuestions, 6);
});
test("Perfect: readinessLabel = 'Ready'", () => {
  const r = scoreQuiz(perfectSub, MOCK_QUESTIONS);
  eq(r.readinessLabel, "Ready");
});
test("Perfect: weakAreas is empty", () => {
  const r = scoreQuiz(perfectSub, MOCK_QUESTIONS);
  eq(r.weakAreas.length, 0);
});
test("Perfect: all three topics appear in strengths", () => {
  const r = scoreQuiz(perfectSub, MOCK_QUESTIONS);
  contains(r.strengths, "Describe cloud concepts");
  contains(r.strengths, "Describe identity, access, and security");
  contains(r.strengths, "Describe Azure management and governance");
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3 — Zero Score (all wrong)
// 0/6 = 0%
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📋 Suite 3: Zero Score (all wrong)");

const zeroSub = makeSubmission([
  ["q001", "b"], ["q002", "b"], ["q003", "a"],
  ["q004", "a"], ["q005", "b"], ["q006", "b"],
]);

test("Zero: overallScore = 0", () => {
  const r = scoreQuiz(zeroSub, MOCK_QUESTIONS);
  eq(r.overallScore, 0);
});
test("Zero: readinessLabel = 'Keep Studying'", () => {
  const r = scoreQuiz(zeroSub, MOCK_QUESTIONS);
  eq(r.readinessLabel, "Keep Studying");
});
test("Zero: strengths is empty", () => {
  const r = scoreQuiz(zeroSub, MOCK_QUESTIONS);
  eq(r.strengths.length, 0);
});
test("Zero: all topics appear in weakAreas", () => {
  const r = scoreQuiz(zeroSub, MOCK_QUESTIONS);
  contains(r.weakAreas, "Describe cloud concepts");
  contains(r.weakAreas, "Describe identity, access, and security");
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4 — Skewed Result (strong in one topic, weak in another)
// Cloud: 3/3=100% (strength), Identity: 0/2=0% (weak), Governance: 0/1=0% (weak)
// Overall: 3/6 = 50%
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📋 Suite 4: Skewed Result (strong cloud, weak elsewhere)");

const skewedSub = makeSubmission([
  ["q001", "a"], ["q002", "a"], ["q003", "b"], // cloud correct ✓✓✓
  ["q004", "a"], ["q005", "b"], ["q006", "b"], // identity/gov wrong ✗✗✗
]);

test("Skewed: overallScore = 50", () => {
  const r = scoreQuiz(skewedSub, MOCK_QUESTIONS);
  eq(r.overallScore, 50);
});
test("Skewed: cloud-concepts is in strengths (100%)", () => {
  const r = scoreQuiz(skewedSub, MOCK_QUESTIONS);
  contains(r.strengths, "Describe cloud concepts");
});
test("Skewed: identity-security is in weakAreas (0%)", () => {
  const r = scoreQuiz(skewedSub, MOCK_QUESTIONS);
  contains(r.weakAreas, "Describe identity, access, and security");
});
test("Skewed: cloud-concepts NOT in weakAreas", () => {
  const r = scoreQuiz(skewedSub, MOCK_QUESTIONS);
  notContains(r.weakAreas, "Describe cloud concepts");
});
test("Skewed: topicScore for cloud-concepts = 100", () => {
  const r = scoreQuiz(skewedSub, MOCK_QUESTIONS);
  const cloud = r.topicScores.find((t) => t.topic === "cloud-concepts");
  eq(cloud.score, 100);
});
test("Skewed: topicScore for identity-security = 0", () => {
  const r = scoreQuiz(skewedSub, MOCK_QUESTIONS);
  const identity = r.topicScores.find((t) => t.topic === "identity-security");
  eq(identity.score, 0);
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 5 — Partial Submission (unanswered questions excluded from scoring)
// Learner answers only q001 (correct) and q004 (wrong) → 1/2 = 50%
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📋 Suite 5: Partial Submission (unanswered questions)");

const partialSub = makeSubmission([["q001", "a"], ["q004", "a"]]);

test("Partial: totalQuestions = 2 (only answered)", () => {
  const r = scoreQuiz(partialSub, MOCK_QUESTIONS);
  eq(r.totalQuestions, 2);
});
test("Partial: overallScore = 50 (1 correct of 2 answered)", () => {
  const r = scoreQuiz(partialSub, MOCK_QUESTIONS);
  eq(r.overallScore, 50);
});
test("Partial: answerResults has entry for ALL bank questions (6)", () => {
  const r = scoreQuiz(partialSub, MOCK_QUESTIONS);
  eq(r.answerResults.length, MOCK_QUESTIONS.length);
});
test("Partial: unanswered question has selectedOptionId = null", () => {
  const r = scoreQuiz(partialSub, MOCK_QUESTIONS);
  const unanswered = r.answerResults.find((a) => a.questionId === "q002");
  eq(unanswered.selectedOptionId, null);
  eq(unanswered.isCorrect, false);
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 6 — Validation Error Codes
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📋 Suite 6: Validation Error Codes");

test("Throws MISSING_ATTEMPT_ID when attemptId is absent", () => {
  throwsCode(
    () => validateSubmission({ answers: [] }, MOCK_QUESTIONS),
    "MISSING_ATTEMPT_ID"
  );
});
test("Throws INVALID_ANSWERS_FORMAT when answers is not an array", () => {
  throwsCode(
    () => validateSubmission({ attemptId: "x", answers: "wrong" }, MOCK_QUESTIONS),
    "INVALID_ANSWERS_FORMAT"
  );
});
test("Throws DUPLICATE_ANSWER for repeated questionId", () => {
  throwsCode(
    () => validateSubmission({
      attemptId: "x",
      answers: [{ questionId: "q001", selectedOptionId: "a" }, { questionId: "q001", selectedOptionId: "b" }],
    }, MOCK_QUESTIONS),
    "DUPLICATE_ANSWER"
  );
});
test("Throws UNKNOWN_QUESTION_ID for non-existent question", () => {
  throwsCode(
    () => validateSubmission({
      attemptId: "x",
      answers: [{ questionId: "q999", selectedOptionId: "a" }],
    }, MOCK_QUESTIONS),
    "UNKNOWN_QUESTION_ID"
  );
});
test("Throws INVALID_OPTION_ID for bad option", () => {
  throwsCode(
    () => validateSubmission({
      attemptId: "x",
      answers: [{ questionId: "q001", selectedOptionId: "z" }],
    }, MOCK_QUESTIONS),
    "INVALID_OPTION_ID"
  );
});
test("ValidationError.toContract() returns the Error Contract shape", () => {
  const err = new ValidationError("Test error", "TEST_CODE");
  const contract = err.toContract();
  eq(contract.success, false);
  eq(contract.error.code, "TEST_CODE");
  eq(contract.error.message, "Test error");
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 7 — Output Contract Integrity
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📋 Suite 7: Output Contract Integrity");

test("Result has all required top-level contract keys", () => {
  const r = scoreQuiz(perfectSub, MOCK_QUESTIONS);
  for (const key of [
    "attemptId", "overallScore", "readinessLabel",
    "correctAnswers", "totalQuestions",
    "topicScores", "strengths", "weakAreas", "answerResults",
  ]) {
    hasKey(r, key);
  }
});
test("attemptId matches submission.attemptId", () => {
  const r = scoreQuiz(perfectSub, MOCK_QUESTIONS);
  eq(r.attemptId, "attempt-test-001");
});
test("answerResult entries have all required contract fields", () => {
  const r = scoreQuiz(perfectSub, MOCK_QUESTIONS);
  for (const ar of r.answerResults) {
    hasKey(ar, "questionId");
    hasKey(ar, "selectedOptionId");
    hasKey(ar, "correctOptionId");
    hasKey(ar, "isCorrect");
    hasKey(ar, "explanation");
  }
});
test("topicScore entries have all required contract fields", () => {
  const r = scoreQuiz(perfectSub, MOCK_QUESTIONS);
  for (const ts of r.topicScores) {
    hasKey(ts, "topic");
    hasKey(ts, "topicLabel");
    hasKey(ts, "score");
    hasKey(ts, "correctAnswers");
    hasKey(ts, "totalQuestions");
  }
});
test("overallScore is an integer (whole number)", () => {
  const r = scoreQuiz(skewedSub, MOCK_QUESTIONS);
  eq(r.overallScore, Math.floor(r.overallScore));
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 8 — AI Coach & Study Plan Builders
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📋 Suite 8: AI Coach & Study Plan Request Builders");

test("buildAICoachRequest: output has all contract keys", () => {
  const r = scoreQuiz(skewedSub, MOCK_QUESTIONS);
  const ai = buildAICoachRequest(r, MOCK_QUESTIONS);
  hasKey(ai, "overallScore");
  hasKey(ai, "topicScores");
  hasKey(ai, "weakAreas");
  hasKey(ai, "incorrectAnswers");
});
test("buildAICoachRequest: incorrectAnswers contains question text not IDs", () => {
  const r = scoreQuiz(skewedSub, MOCK_QUESTIONS);
  const ai = buildAICoachRequest(r, MOCK_QUESTIONS);
  for (const ia of ai.incorrectAnswers) {
    hasKey(ia, "question");
    hasKey(ia, "selectedAnswer");
    hasKey(ia, "correctAnswer");
    hasKey(ia, "referenceExplanation");
  }
});
test("buildAICoachRequest: overallScore is numeric (not recalculated by AI)", () => {
  const r = scoreQuiz(skewedSub, MOCK_QUESTIONS);
  const ai = buildAICoachRequest(r, MOCK_QUESTIONS);
  eq(typeof ai.overallScore, "number");
});
test("buildStudyPlanRequest: valid inputs produce contract shape", () => {
  const r = scoreQuiz(skewedSub, MOCK_QUESTIONS);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 7);
  const plan = buildStudyPlanRequest({ examDate: tomorrow.toISOString().split("T")[0], availableHours: 10 }, r);
  hasKey(plan, "examDate");
  hasKey(plan, "availableHours");
  hasKey(plan, "weakAreas");
  hasKey(plan, "topicScores");
});
test("buildStudyPlanRequest: throws EXAM_DATE_IN_PAST for past date", () => {
  const r = scoreQuiz(skewedSub, MOCK_QUESTIONS);
  throwsCode(
    () => buildStudyPlanRequest({ examDate: "2020-01-01", availableHours: 5 }, r),
    "EXAM_DATE_IN_PAST"
  );
});
test("buildStudyPlanRequest: throws INVALID_INPUT for missing hours", () => {
  const r = scoreQuiz(skewedSub, MOCK_QUESTIONS);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 7);
  throwsCode(
    () => buildStudyPlanRequest({ examDate: tomorrow.toISOString().split("T")[0], availableHours: 0 }, r),
    "INVALID_INPUT"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// FINAL REPORT
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\n${"═".repeat(60)}`);
for (const entry of log) {
  const icon = entry.ok ? "✅" : "❌";
  console.log(`  ${icon} ${entry.ok ? "PASS" : "FAIL"}: ${entry.name}`);
  if (!entry.ok) console.log(`         ↳ ${entry.error}`);
}
console.log(`${"═".repeat(60)}`);
console.log(`  📊  ${passed} passed  |  ${failed} failed  |  ${passed + failed} total`);
console.log(`${"═".repeat(60)}\n`);

if (failed > 0) {
  console.error("❌ Test failures detected. Fix before committing.\n");
  process.exit(1);
} else {
  console.log("🎉 All tests passed. Scoring engine matches the Integration Contracts.\n");
}
