# AZ-900 Compass Demo Script

## Target Length

3 minutes, with up to 2 additional minutes for questions.

## Before Presenting

- Open the deployed application: [AZ-900 Compass](https://az-900-compass.vercel.app)
- Keep a completed results page available in a second browser tab as backup.
- Use a future exam date and 6 available study hours.
- Confirm the live application displays `AI Coach` and `AI-generated study plan`.
- Keep the GitHub repository open in another tab if technical questions arise.

## 0:00–0:25 — Problem

> During AZ-900 preparation, completing content and practice questions does not always answer the most important learner question: "Am I ready, where am I weak, and what should I study next?"
>
> Our team built AZ-900 Compass to turn assessment results into a clear revision direction.

## 0:25–0:45 — Solution

> AZ-900 Compass is an unofficial AI-powered readiness coach. It combines an original diagnostic quiz, deterministic topic scoring, answer explanations, AI coaching, and a personalised study plan.

Show the landing page and its unofficial-tool notice.

## 0:45–1:15 — Diagnostic

Scroll through several questions.

> The learner completes 20 original questions mapped to AZ-900 topic areas. We do not use real exam questions or Microsoft logos.
>
> The progress indicator makes completion clear, and submission requires all questions to be answered.

Do not answer all 20 questions live unless presentation rules require it. Switch to the prepared results tab.

## 1:15–1:50 — Readiness Report

Show:

- overall score;
- readiness label;
- topic-level scores;
- strengths;
- priority revision areas.

> The score is calculated using our tested deterministic scoring engine. AI never calculates, changes, or overrides this score.
>
> This makes the readiness result consistent and explainable.

## 1:50–2:20 — AI Coach

Show the `AI Coach` badge and recommendations.

> The AI Coach receives structured results, weak areas, incorrect answers, and approved explanations. The prompt prevents score recalculation, unsupported pass promises, and invented exam questions.
>
> The output gives the learner specific next actions instead of only showing a percentage.

## 2:20–2:45 — Personalised Study Plan

Enter a future date and available study hours, then generate the plan.

> The learner supplies an exam date and total study hours. The planner prioritises weak areas, stays within the available time, and does not schedule sessions after the exam date.

Show the `AI-generated study plan` badge and one or two sessions.

## 2:45–3:00 — Differentiator and Close

> Our key technical design is reliability: deterministic assessment first, AI enhancement second, and automatic deterministic fallback if AI is unavailable.
>
> This pattern can scale beyond AZ-900 to other certifications by changing the approved skills outline, question bank, and coaching prompts.
>
> AZ-900 Compass helps learners stop guessing and start revising with direction.

## Backup Explanation if AI Fails During the Demo

If the screen shows `Smart fallback guidance` or `Smart fallback study plan`, say:

> This is the resilience feature in action. The application detected that the AI service was unavailable or invalid and automatically preserved the learner experience using deterministic guidance. The readiness score remains unchanged because AI never controls scoring.

This is still a successful demonstration.

## Likely Judge Questions

### How is the readiness score calculated?

> The application compares submitted answers with the approved question bank, calculates the overall percentage and topic percentages, then applies documented readiness thresholds. The engine has 46 passing tests.

### What does AI do?

> AI explains and recommends. It receives structured results and approved explanations, but it never calculates or changes the score.

### What happens if the AI API fails?

> The application automatically displays deterministic coaching and creates a deterministic study plan, so the core learner journey does not fail.

### Are these real exam questions?

> No. The questions are original and based on the public AZ-900 skills outline.

### How could the product scale?

> The architecture separates content, scoring, prompts, and interface. Another certification can be supported by adding an approved skills outline, original question bank, scoring configuration, and tailored prompts.

### Why no authentication?

> Authentication was deliberately excluded from the hackathon MVP so the team could prioritise the complete learning journey. The repository includes a Supabase schema and ERD for future persistence.
