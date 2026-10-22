# AZ-900 Compass Product Requirements Document

## 1. Product Summary

AZ-900 Compass is an unofficial AI-powered exam readiness coach for AZ-900 learners. It combines a diagnostic quiz, topic-level readiness scoring, AI-assisted explanations, and a personalised study plan.

## 2. Problem

AZ-900 learners may complete lessons and practice assessments without clearly knowing:

- Whether they are ready to sit the exam.
- Which topic areas need more revision.
- Why particular answers are correct or incorrect.
- How to use their remaining study time effectively.

## 3. Proposed Solution

The product will guide a learner through a short diagnostic assessment, calculate an overall and topic-level readiness score, explain mistakes in beginner-friendly language, and generate a focused study plan based on weak areas, available hours, and the intended exam date.

## 4. Target Users

### Primary users
- Learners currently preparing for AZ-900.
- #1MillionDevs participants studying Azure Fundamentals.
- Beginners who need structured guidance before attempting the exam.

### User need
A learner needs a quick, understandable answer to: **What do I know, where am I weak, and what should I study next?**

## 5. Goals

- Help learners assess their AZ-900 readiness.
- Provide useful feedback instead of only showing a score.
- Prioritise weak topic areas.
- Turn assessment results into clear next steps.
- Demonstrate purposeful use of AI and rapid prototyping.

## 6. MVP Scope

### 6.1 Diagnostic Quiz
- Provide 10-20 original multiple-choice questions.
- Organise questions by AZ-900 skill area.
- Allow one answer per question.
- Require answers before final submission, or clearly identify unanswered questions.
- Do not copy real exam questions.

### 6.2 Readiness Report
- Calculate an overall readiness percentage.
- Calculate a score for each covered topic.
- Display strengths and weak areas.
- Use deterministic scoring so identical answers always produce identical results.
- Clearly state that the score is guidance and not a guarantee of passing the official exam.

### 6.3 AI Coach
- Explain why selected answers are correct or incorrect.
- Use simple, beginner-friendly language.
- Recommend the topics the learner should revise next.
- Use the learner's actual diagnostic results as context.
- Return a safe fallback message if AI generation fails.

### 6.4 Personalised Study Plan
- Collect the learner's intended exam date.
- Collect available study hours.
- Prioritise weak topic areas from the diagnostic result.
- Generate realistic study sessions and revision actions.
- Avoid allocating time to dates that have already passed.

## 7. Core User Journey

1. The learner opens AZ-900 Compass and sees the product purpose and unofficial disclaimer.
2. The learner starts and completes the diagnostic quiz.
3. The system validates the submission and calculates scores.
4. The learner receives an overall readiness score and topic breakdown.
5. The learner reviews strengths, weak areas, and explanations.
6. The learner enters an exam date and available study hours.
7. The AI Coach generates recommended next steps and a personalised study plan.

## 8. Functional Requirements

- The application must load the approved question bank.
- The application must record the learner's selected answers during the session.
- The application must calculate overall and topic-level scores.
- The results page must show readable strengths and weak areas.
- The application must pass structured results to the AI Coach.
- The AI Coach output must follow the agreed response contract.
- The learner must be able to retry the diagnostic quiz.
- The application must show useful loading and error states.

## 9. Non-Functional Requirements

- The main user journey must work on desktop and mobile-sized screens.
- The interface must be clear enough for a first-time Azure learner.
- The scoring logic must not depend on AI.
- Secrets and API keys must not be committed to GitHub.
- Question, result, and AI response structures must follow `docs/CONTRACTS.md`.
- The product must be labelled **Unofficial AZ-900 preparation tool**.
- Microsoft logos must not be used.

## 10. Out of Scope for the MVP

- Authentication and user accounts.
- Leaderboards or social features.
- Payment processing.
- Multiple certification tracks.
- A native mobile application.
- Advanced long-term analytics.
- Claims that the readiness score predicts an official exam result.

## 11. Success Criteria

The MVP is successful when:

- A learner can complete the diagnostic quiz without a blocking error.
- The app produces accurate, repeatable overall and topic scores.
- The report clearly identifies at least one strength or weak area when supported by the learner's result.
- The AI Coach produces a relevant explanation and next-step recommendation.
- The study plan uses the learner's weak areas, exam date, and available hours.
- The complete flow can be demonstrated without manual data editing.
- The repository contains setup instructions, project documentation, prompt files, and limitations.

## 12. Acceptance Test

Before submission, the team will test this complete scenario:

1. Open the deployed application.
2. Complete all diagnostic questions.
3. Submit and verify the calculated results.
4. Review one correct-answer explanation and one incorrect-answer explanation.
5. Enter an exam date and available study hours.
6. Generate and review the study plan.
7. Retry the quiz and confirm the app remains usable.

## 13. Ownership

- Product requirements and scope: Alex, Product Lead & Repository Manager.
- Frontend and user experience: Grace.
- AI prompts and structured outputs: Vee.
- AZ-900 question content and accuracy: Kelly.
- Backend, scoring, data modelling, and ERD: Gilton.

## 14. Open Decisions

- Final AI provider and integration method.
- Whether Supabase persistence is necessary for the MVP.
- Final readiness labels or thresholds.
- Final product name and visual identity.
