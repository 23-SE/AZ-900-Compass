-- ============================================================
-- AZ-900 Compass — Supabase Database Schema
-- Owner: Gilton (Backend, Scoring & Data Lead)
-- Run this in the Supabase SQL Editor to set up all tables.
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ────────────────────────────────────────────────────────────
-- TABLE: quiz_attempts
-- Records each learner quiz session.
-- attempt_id is a client-generated UUID from crypto.randomUUID()
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id      TEXT          NOT NULL UNIQUE,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- TABLE: attempt_answers
-- Individual answers submitted during a quiz attempt.
-- One row per answered question (unanswered = no row).
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attempt_answers (
  id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_attempt_id     UUID    NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id         TEXT    NOT NULL,        -- matches id in data/questions.json
  selected_option_id  TEXT    NOT NULL,        -- matches option id in questions.json
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (quiz_attempt_id, question_id)        -- one answer per question per attempt
);

-- ────────────────────────────────────────────────────────────
-- TABLE: score_results
-- The computed ScoringResult from scoringEngine.js.
-- Stored as JSONB so the frontend can read it without joins.
-- One result per attempt.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS score_results (
  id                  UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_attempt_id     UUID      NOT NULL UNIQUE REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  overall_score       INTEGER   NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  readiness_label     TEXT      NOT NULL,
  correct_answers     INTEGER   NOT NULL CHECK (correct_answers >= 0),
  total_questions     INTEGER   NOT NULL CHECK (total_questions >= 0),
  topic_scores        JSONB     NOT NULL DEFAULT '[]'::jsonb,
  strengths           JSONB     NOT NULL DEFAULT '[]'::jsonb,
  weak_areas          JSONB     NOT NULL DEFAULT '[]'::jsonb,
  answer_results      JSONB     NOT NULL DEFAULT '[]'::jsonb,
  scored_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- TABLE: ai_coach_responses
-- AI Coach output (Vee's AI layer writes here).
-- Cached so the learner can revisit without re-calling the AI.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_coach_responses (
  id                    UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_attempt_id       UUID    NOT NULL UNIQUE REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  summary               TEXT    NOT NULL,
  priority_topics       JSONB   NOT NULL DEFAULT '[]'::jsonb,
  recommendations       JSONB   NOT NULL DEFAULT '[]'::jsonb,
  answer_explanations   JSONB   NOT NULL DEFAULT '[]'::jsonb,
  generated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- TABLE: study_plan_requests
-- The learner's exam date and available hours input.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_plan_requests (
  id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_attempt_id     UUID    NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  exam_date           DATE    NOT NULL,
  available_hours     INTEGER NOT NULL CHECK (available_hours > 0),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- TABLE: study_plan_responses
-- AI-generated study plan (Vee's AI layer writes here).
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_plan_responses (
  id                      UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  study_plan_request_id   UUID    NOT NULL UNIQUE REFERENCES study_plan_requests(id) ON DELETE CASCADE,
  summary                 TEXT    NOT NULL,
  sessions                JSONB   NOT NULL DEFAULT '[]'::jsonb,
  final_review            JSONB   NOT NULL DEFAULT '[]'::jsonb,
  generated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES — for fast lookups by attempt_id
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_attempt_id    ON quiz_attempts(attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt     ON attempt_answers(quiz_attempt_id);
CREATE INDEX IF NOT EXISTS idx_score_results_attempt       ON score_results(quiz_attempt_id);
CREATE INDEX IF NOT EXISTS idx_ai_coach_attempt            ON ai_coach_responses(quiz_attempt_id);
CREATE INDEX IF NOT EXISTS idx_study_plan_req_attempt      ON study_plan_requests(quiz_attempt_id);

-- ============================================================
-- ROW-LEVEL SECURITY (RLS) — DEMO-ONLY PUBLIC PERSISTENCE
-- As specified in docs/PRD.md §10, user authentication is out of
-- scope for the MVP.
--
-- Therefore, policies use `USING (true)` to allow anonymous reads
-- and inserts for demo assessment sessions without login friction.
-- No UPDATE or DELETE policies are granted to protect submitted data.
--
-- In production with authentication, policies would restrict access
-- to authenticated sessions matching `auth.uid() = user_id`.
-- ============================================================

ALTER TABLE quiz_attempts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_answers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_results      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plan_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plan_responses ENABLE ROW LEVEL SECURITY;

-- quiz_attempts: anyone may insert or select
DROP POLICY IF EXISTS "public_insert_quiz_attempts" ON quiz_attempts;
CREATE POLICY "public_insert_quiz_attempts"
  ON quiz_attempts FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "public_select_quiz_attempts" ON quiz_attempts;
CREATE POLICY "public_select_quiz_attempts"
  ON quiz_attempts FOR SELECT TO anon USING (true);

-- attempt_answers: anyone may insert or select
DROP POLICY IF EXISTS "public_insert_attempt_answers" ON attempt_answers;
CREATE POLICY "public_insert_attempt_answers"
  ON attempt_answers FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "public_select_attempt_answers" ON attempt_answers;
CREATE POLICY "public_select_attempt_answers"
  ON attempt_answers FOR SELECT TO anon USING (true);

-- score_results: anyone may insert or select
DROP POLICY IF EXISTS "public_insert_score_results" ON score_results;
CREATE POLICY "public_insert_score_results"
  ON score_results FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "public_select_score_results" ON score_results;
CREATE POLICY "public_select_score_results"
  ON score_results FOR SELECT TO anon USING (true);

-- ai_coach_responses: anyone may insert or select
DROP POLICY IF EXISTS "public_insert_ai_coach_responses" ON ai_coach_responses;
CREATE POLICY "public_insert_ai_coach_responses"
  ON ai_coach_responses FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "public_select_ai_coach_responses" ON ai_coach_responses;
CREATE POLICY "public_select_ai_coach_responses"
  ON ai_coach_responses FOR SELECT TO anon USING (true);

-- study_plan_requests: anyone may insert or select
DROP POLICY IF EXISTS "public_insert_study_plan_requests" ON study_plan_requests;
CREATE POLICY "public_insert_study_plan_requests"
  ON study_plan_requests FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "public_select_study_plan_requests" ON study_plan_requests;
CREATE POLICY "public_select_study_plan_requests"
  ON study_plan_requests FOR SELECT TO anon USING (true);

-- study_plan_responses: anyone may insert or select
DROP POLICY IF EXISTS "public_insert_study_plan_responses" ON study_plan_responses;
CREATE POLICY "public_insert_study_plan_responses"
  ON study_plan_responses FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "public_select_study_plan_responses" ON study_plan_responses;
CREATE POLICY "public_select_study_plan_responses"
  ON study_plan_responses FOR SELECT TO anon USING (true);

-- ============================================================
-- HELPER VIEW — result_summary
-- Grace (Frontend) can query this view to get everything
-- needed for the results page in a single call.
-- ============================================================
CREATE OR REPLACE VIEW result_summary AS
SELECT
  qa.attempt_id,
  qa.started_at,
  qa.completed_at,
  sr.overall_score,
  sr.readiness_label,
  sr.correct_answers,
  sr.total_questions,
  sr.topic_scores,
  sr.strengths,
  sr.weak_areas,
  sr.answer_results,
  sr.scored_at,
  acr.summary          AS ai_summary,
  acr.priority_topics  AS ai_priority_topics,
  acr.recommendations  AS ai_recommendations
FROM
  quiz_attempts qa
  LEFT JOIN score_results sr       ON sr.quiz_attempt_id = qa.id
  LEFT JOIN ai_coach_responses acr ON acr.quiz_attempt_id = qa.id;

-- ============================================================
-- DONE
-- After running this script:
-- 1. Copy the Supabase URL and anon key into your .env file
-- 2. Never commit .env to GitHub
-- 3. See docs/ERD.md for the full entity relationship diagram
-- ============================================================
