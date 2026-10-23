/**
 * AZ-900 Compass — Scoring Engine
 * =================================
 * Owner: Gilton (Backend, Scoring & Data Lead)
 *
 * Deterministic scoring. No AI. No external dependencies.
 * Implements the Integration Contracts defined in docs/CONTRACTS.md exactly.
 *
 * Input:  QuizSubmission + QuestionBank  →  ScoringResult
 * Usage:  const result = scoreQuiz(submission, questions);
 *
 * DISCLAIMER: Unofficial AZ-900 preparation tool. Not affiliated with Microsoft.
 */

"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// READINESS LABELS  (Section 3 of CONTRACTS.md — thresholds agreed with team)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Readiness tier thresholds (percentage, inclusive lower bound).
 *
 *  ≥ 85  →  "Ready"
 *  ≥ 70  →  "Nearly Ready"
 *  ≥ 50  →  "Making Progress"
 *   < 50  →  "Keep Studying"
 */
const READINESS_TIERS = [
  { minScore: 85, label: "Ready" },
  { minScore: 70, label: "Nearly Ready" },
  { minScore: 50, label: "Making Progress" },
  { minScore: 0,  label: "Keep Studying" },
];

/**
 * Strength / weak-area thresholds per topic.
 *
 *  ≥ 75  →  strength
 *   < 75  →  weak area
 */
const STRENGTH_THRESHOLD = 75;

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION ERROR
// ─────────────────────────────────────────────────────────────────────────────

class ValidationError extends Error {
  /**
   * @param {string} message  Human-readable description
   * @param {string} code     Machine-readable error code (matches Error Contract)
   * @param {object} [details]
   */
  constructor(message, code, details = {}) {
    super(message);
    this.name = "ValidationError";
    this.code = code;
    this.details = details;
  }

  /** Returns the Error Contract shape defined in CONTRACTS.md §8 */
  toContract() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
      },
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Round to nearest whole number (per contract: "round scores to whole numbers").
 * @param {number} value
 * @returns {number}
 */
function roundScore(value) {
  return Math.round(value);
}

/**
 * Return the readiness label for an overall score.
 * @param {number} score  0–100
 * @returns {string}
 */
function getReadinessLabel(score) {
  for (const tier of READINESS_TIERS) {
    if (score >= tier.minScore) return tier.label;
  }
  return "Keep Studying";
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate a quiz submission before scoring.
 * Throws ValidationError on the first problem found.
 *
 * @param {object} submission  QuizSubmission contract object
 * @param {object[]} questions  Question bank array
 */
function validateSubmission(submission, questions) {
  if (!submission || typeof submission !== "object") {
    throw new ValidationError("Submission must be a valid object.", "INVALID_INPUT");
  }

  if (!submission.attemptId || typeof submission.attemptId !== "string") {
    throw new ValidationError("attemptId is required and must be a string.", "MISSING_ATTEMPT_ID");
  }

  if (!Array.isArray(submission.answers)) {
    throw new ValidationError("answers must be an array.", "INVALID_ANSWERS_FORMAT");
  }

  const questionMap = new Map(questions.map((q) => [q.id, q]));
  const seenIds = new Set();

  for (const answer of submission.answers) {
    if (!answer.questionId || typeof answer.questionId !== "string") {
      throw new ValidationError(
        "Each answer must have a valid questionId string.",
        "INVALID_ANSWER_SHAPE",
        { answer }
      );
    }

    if (seenIds.has(answer.questionId)) {
      throw new ValidationError(
        `Duplicate answer submitted for question '${answer.questionId}'.`,
        "DUPLICATE_ANSWER",
        { questionId: answer.questionId }
      );
    }
    seenIds.add(answer.questionId);

    const question = questionMap.get(answer.questionId);
    if (!question) {
      throw new ValidationError(
        `Question '${answer.questionId}' was not found in the question bank.`,
        "UNKNOWN_QUESTION_ID",
        { questionId: answer.questionId }
      );
    }

    const validOptionIds = question.options.map((o) => o.id);
    if (!validOptionIds.includes(answer.selectedOptionId)) {
      throw new ValidationError(
        `Option '${answer.selectedOptionId}' is not valid for question '${answer.questionId}'. Valid options: ${validOptionIds.join(", ")}.`,
        "INVALID_OPTION_ID",
        { questionId: answer.questionId, selectedOptionId: answer.selectedOptionId, validOptions: validOptionIds }
      );
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCORING FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Score a quiz submission against the question bank.
 *
 * Implements the Scoring Result Contract from CONTRACTS.md §3 exactly.
 * All fields in the returned object match the contract property names.
 *
 * Unanswered questions are excluded from the score calculation
 * (they do not count as correct or incorrect attempts) but are
 * noted in answerResults with isCorrect: false.
 *
 * @param {object}   submission  Validated QuizSubmission object
 * @param {object[]} questions   Array of question objects from data/questions.json
 * @returns {object}             ScoringResult matching CONTRACTS.md §3
 * @throws  {ValidationError}    If submission data is malformed
 */
function scoreQuiz(submission, questions) {
  // ── Step 1: Validate ──────────────────────────────────────────────────────
  validateSubmission(submission, questions);

  // ── Step 2: Build lookup maps ─────────────────────────────────────────────
  const questionMap = new Map(questions.map((q) => [q.id, q]));
  const answerMap = new Map(
    submission.answers.map((a) => [a.questionId, a.selectedOptionId])
  );

  // ── Step 3: Score individual answers ─────────────────────────────────────
  // Scored against the complete quiz to prevent inflated readiness scores
  const totalQuestions = questions.length;
  let totalCorrect = 0;

  const answerResults = [];

  for (const question of questions) {
    const selectedOptionId = answerMap.get(question.id) ?? null;
    const wasAnswered = selectedOptionId !== null;
    const isCorrect = wasAnswered && selectedOptionId === question.correctOptionId;

    if (wasAnswered && isCorrect) totalCorrect++;

    answerResults.push({
      questionId: question.id,
      selectedOptionId: selectedOptionId,
      correctOptionId: question.correctOptionId,
      isCorrect: wasAnswered ? isCorrect : false,
      explanation: question.explanation,
    });
  }

  // ── Step 4: Overall score ─────────────────────────────────────────────────
  // Scored against complete quiz length so unanswered questions receive 0 credit
  const overallScore =
    totalQuestions > 0
      ? roundScore((totalCorrect / totalQuestions) * 100)
      : 0;

  const readinessLabel = getReadinessLabel(overallScore);

  // ── Step 5: Topic-level scores ────────────────────────────────────────────
  // Each topic is scored against all questions in that topic across the complete quiz
  const topicMeta = new Map(); // topic → { topicLabel, totalQuestions, correctAnswers }

  for (const question of questions) {
    if (!topicMeta.has(question.topic)) {
      topicMeta.set(question.topic, {
        topicLabel: question.topicLabel,
        totalQuestions: 0,
        correctAnswers: 0,
      });
    }
    const entry = topicMeta.get(question.topic);
    entry.totalQuestions++;

    const selectedOptionId = answerMap.get(question.id);
    if (selectedOptionId !== undefined && selectedOptionId === question.correctOptionId) {
      entry.correctAnswers++;
    }
  }

  const topicScores = [];
  for (const [topic, meta] of topicMeta) {
    const score =
      meta.totalQuestions > 0
        ? roundScore((meta.correctAnswers / meta.totalQuestions) * 100)
        : 0;
    topicScores.push({
      topic,
      topicLabel: meta.topicLabel,
      score,
      correctAnswers: meta.correctAnswers,
      totalQuestions: meta.totalQuestions,
    });
  }

  // ── Step 6: Strengths and weak areas ─────────────────────────────────────
  const strengths = topicScores
    .filter((t) => t.score >= STRENGTH_THRESHOLD)
    .map((t) => t.topicLabel);

  const weakAreas = topicScores
    .filter((t) => t.score < STRENGTH_THRESHOLD)
    .map((t) => t.topicLabel);

  // ── Step 7: Assemble and return result ────────────────────────────────────
  return {
    attemptId: submission.attemptId,
    overallScore,
    readinessLabel,
    correctAnswers: totalCorrect,
    totalQuestions,
    topicScores,
    strengths,
    weakAreas,
    answerResults,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AI COACH CONTEXT BUILDER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the AI Coach Request payload (CONTRACTS.md §4).
 * Called by the API route after scoreQuiz(). Passed to Vee's AI layer.
 *
 * This function isolates what the AI sees so it can never access or
 * modify raw scores.
 *
 * @param {object}   scoringResult  Result from scoreQuiz()
 * @param {object[]} questions      Question bank (needed for question text lookup)
 * @returns {object}                AI Coach Request Contract object
 */
function buildAICoachRequest(scoringResult, questions) {
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  const incorrectAnswers = scoringResult.answerResults
    .filter((r) => !r.isCorrect && r.selectedOptionId !== null)
    .map((r) => {
      const question = questionMap.get(r.questionId);
      const selectedOption = question.options.find((o) => o.id === r.selectedOptionId);
      const correctOption = question.options.find((o) => o.id === r.correctOptionId);
      return {
        question: question.question,
        selectedAnswer: selectedOption ? selectedOption.text : "No answer selected",
        correctAnswer: correctOption.text,
        referenceExplanation: question.explanation,
      };
    });

  return {
    overallScore: scoringResult.overallScore,
    topicScores: scoringResult.topicScores.map((t) => ({
      topicLabel: t.topicLabel,
      score: t.score,
    })),
    weakAreas: scoringResult.weakAreas,
    incorrectAnswers,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDY PLAN REQUEST BUILDER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate and build the Study Plan Request payload (CONTRACTS.md §6).
 *
 * @param {object} input
 * @param {string} input.examDate        ISO 8601 date string e.g. "2026-10-30"
 * @param {number} input.availableHours  Total study hours available
 * @param {object} scoringResult         Result from scoreQuiz()
 * @returns {object}                     Study Plan Request Contract object
 * @throws  {ValidationError}            If inputs are missing or invalid
 */
function buildStudyPlanRequest(input, scoringResult) {
  if (!input.examDate || typeof input.examDate !== "string") {
    throw new ValidationError(
      "Please provide a valid exam date.",
      "INVALID_INPUT"
    );
  }

  const examDate = new Date(input.examDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(examDate.getTime())) {
    throw new ValidationError(
      "examDate is not a valid date. Use ISO format: YYYY-MM-DD.",
      "INVALID_EXAM_DATE"
    );
  }

  if (examDate <= today) {
    throw new ValidationError(
      "examDate must be a future date.",
      "EXAM_DATE_IN_PAST"
    );
  }

  if (
    typeof input.availableHours !== "number" ||
    input.availableHours <= 0 ||
    isNaN(input.availableHours)
  ) {
    throw new ValidationError(
      "Please provide a valid exam date and available study hours.",
      "INVALID_INPUT"
    );
  }

  return {
    examDate: input.examDate,
    availableHours: input.availableHours,
    weakAreas: scoringResult.weakAreas,
    topicScores: scoringResult.topicScores.map((t) => ({
      topicLabel: t.topicLabel,
      score: t.score,
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  scoreQuiz,
  validateSubmission,
  buildAICoachRequest,
  buildStudyPlanRequest,
  getReadinessLabel,
  ValidationError,
  READINESS_TIERS,
  STRENGTH_THRESHOLD,
};
