# AZ-900 Compass — Entity Relationship Diagram

> Owner: Gilton (Backend, Scoring & Data Lead)
> Status: Approved for MVP
> Last updated: 2026-10-23

---

## Overview

The database supports one user journey: a learner takes a quiz, receives a score, and optionally requests AI coaching and a study plan. All tables are in a single Supabase project (PostgreSQL).

Since the MVP has **no authentication or user accounts**, learners are identified by an anonymous `attempt_id` generated client-side using `crypto.randomUUID()`.

---

## Entity Relationship Diagram

```mermaid
erDiagram

  QUIZ_ATTEMPTS {
    uuid        id              PK
    text        attempt_id      UK "client-generated UUID"
    timestamptz started_at
    timestamptz completed_at
    timestamptz created_at
  }

  ATTEMPT_ANSWERS {
    uuid        id              PK
    uuid        quiz_attempt_id FK
    text        question_id     "matches questions.json id"
    text        selected_option_id
    timestamptz created_at
  }

  SCORE_RESULTS {
    uuid        id              PK
    uuid        quiz_attempt_id FK  UK "one result per attempt"
    integer     overall_score
    text        readiness_label
    integer     correct_answers
    integer     total_questions
    jsonb       topic_scores    "Array of TopicScore objects"
    jsonb       strengths       "Array of topic label strings"
    jsonb       weak_areas      "Array of topic label strings"
    jsonb       answer_results  "Array of AnswerResult objects"
    timestamptz scored_at
  }

  AI_COACH_RESPONSES {
    uuid        id              PK
    uuid        quiz_attempt_id FK  UK "one coach response per attempt"
    text        summary
    jsonb       priority_topics "Array of topic label strings"
    jsonb       recommendations "Array of recommendation strings"
    jsonb       answer_explanations "Array of {questionId, explanation}"
    timestamptz generated_at
  }

  STUDY_PLAN_REQUESTS {
    uuid        id              PK
    uuid        quiz_attempt_id FK
    date        exam_date
    integer     available_hours
    timestamptz created_at
  }

  STUDY_PLAN_RESPONSES {
    uuid        id              PK
    uuid        study_plan_request_id FK  UK
    text        summary
    jsonb       sessions        "Array of StudySession objects"
    jsonb       final_review    "Array of review action strings"
    timestamptz generated_at
  }

  QUIZ_ATTEMPTS         ||--o{ ATTEMPT_ANSWERS       : "has"
  QUIZ_ATTEMPTS         ||--o|  SCORE_RESULTS         : "produces"
  QUIZ_ATTEMPTS         ||--o|  AI_COACH_RESPONSES    : "generates"
  QUIZ_ATTEMPTS         ||--o{  STUDY_PLAN_REQUESTS   : "requests"
  STUDY_PLAN_REQUESTS   ||--o|  STUDY_PLAN_RESPONSES  : "produces"
```

---

## Table Descriptions

### `quiz_attempts`
Records a single attempt by a learner. The `attempt_id` is a client-generated UUID passed in the QuizSubmission contract. `completed_at` is null until the learner submits.

### `attempt_answers`
Stores individual question answers for an attempt. One row per question answered. Unanswered questions are not stored (they are inferred during scoring).

### `score_results`
Stores the full computed ScoringResult from `scoringEngine.js`. `topic_scores`, `strengths`, `weak_areas`, and `answer_results` are stored as JSONB so the frontend can read them directly without joins.

### `ai_coach_responses`
Stores the AI Coach response returned by Vee's prompt. Stored so it can be retrieved without calling the AI again if the learner revisits the page.

### `study_plan_requests`
Records the learner's exam date and available hours. Created when the learner submits the study plan form.

### `study_plan_responses`
Stores the AI-generated study plan. `sessions` is a JSONB array of StudySession objects from the Study Plan Response Contract.

---

## JSONB Column Schemas

### `score_results.topic_scores` (array)
```json
[
  {
    "topic": "cloud-concepts",
    "topicLabel": "Describe cloud concepts",
    "score": 80,
    "correctAnswers": 4,
    "totalQuestions": 5
  }
]
```

### `score_results.answer_results` (array)
```json
[
  {
    "questionId": "q001",
    "selectedOptionId": "a",
    "correctOptionId": "a",
    "isCorrect": true,
    "explanation": "Explanation text..."
  }
]
```

### `ai_coach_responses.answer_explanations` (array)
```json
[
  {
    "questionId": "q007",
    "explanation": "The selected answer does not apply because..."
  }
]
```

### `study_plan_responses.sessions` (array)
```json
[
  {
    "date": "2026-10-24",
    "durationMinutes": 60,
    "topic": "Describe Azure management and governance",
    "activities": [
      "Review Azure Policy and resource locks",
      "Complete five original governance questions"
    ]
  }
]
```

---

## Supabase Row-Level Security (RLS) — Demo-Only Public Persistence

As specified in `docs/PRD.md §10`, user authentication and user accounts are strictly out of scope for the MVP.

Consequently, the Supabase database implements **Demo-Only Public Persistence**:
- **INSERT & SELECT:** Open to anonymous clients (`TO anon WITH CHECK (true)` and `USING (true)`). This allows the frontend application, evaluators, and judges to run the full assessment journey, store attempts, and query the `result_summary` view by `attempt_id` without requiring an account or login session.
- **UPDATE & DELETE:** Prohibited (no policies granted to `anon`). Attempt records, scores, and AI recommendations cannot be altered or removed after submission.
- **Production Architecture:** In a production deployment with Supabase Auth, these policies would be restricted to authenticated user sessions matching `auth.uid() = user_id`.

---

## Notes for the Team

- **Gilton owns** the Supabase schema and migrations in `supabase/`.
- **Grace (Frontend)** reads from `score_results` and `ai_coach_responses` by `quiz_attempt_id`.
- **Vee (AI)** writes to `ai_coach_responses` and `study_plan_responses`.
- The `questions.json` file is **not stored in Supabase** for the MVP. It is loaded from `data/questions.json` at runtime.
- No table stores raw AI prompts; those live in `prompts/` and are version-controlled.
