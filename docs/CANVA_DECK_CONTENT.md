# AZ-900 Compass Canva Deck Content

Use the official hackathon Canva template. Preserve the template's required slide order if it differs from this outline.

## Slide 1 — Title

**AZ-900 Compass**

**Know what to study next.**

An unofficial AI-powered readiness coach for Microsoft Azure Fundamentals learners.

Team: Alex, Grace, Vee, Kelly and Gilton

Live demo: `az-900-compass.vercel.app`

## Slide 2 — Learner Problem

### Studying is not the same as knowing you are ready

AZ-900 learners may complete lessons and practice questions but still struggle to identify:

- whether they are ready for the exam;
- which topics are weakest;
- why answers were incorrect;
- how to use their remaining study time.

**Our own learning journey:** after studying and completing practice assessments, readiness and revision priority were still difficult to judge clearly.

## Slide 3 — Target Users

### Who AZ-900 Compass serves

**Primary users**

- #1MillionDevs participants preparing for AZ-900;
- first-time Azure learners;
- learners with limited revision time;
- learners who need actionable feedback rather than another score.

**Core user question**

> What do I know, where am I weak, and what should I study next?

## Slide 4 — Our Solution

### One guided readiness journey

1. Complete an original 20-question diagnostic.
2. Receive an overall readiness score.
3. View performance by topic.
4. Review correct answers and explanations.
5. Get AI-powered revision recommendations.
6. Generate a study plan using an exam date and available hours.

Add screenshots of the landing page and readiness report.

## Slide 5 — Product Demo

### From diagnostic to direction

Show three screenshots:

1. Diagnostic quiz and progress indicator.
2. Topic-level readiness report.
3. AI Coach and personalised study plan.

**Live product:** `az-900-compass.vercel.app`

## Slide 6 — Prompt Engineering

### AI enhances learning without controlling assessment

The AI receives structured:

- overall and topic scores;
- weak areas;
- incorrect answers;
- approved reference explanations;
- exam date and available hours.

Prompt safeguards require the model to:

- never recalculate or change scores;
- use supplied learner data only;
- avoid pass guarantees;
- avoid real or leaked exam questions;
- return validated JSON;
- produce concise, beginner-friendly guidance.

## Slide 7 — Technical Design

### Reliable by design

```text
React diagnostic interface
          ↓
Deterministic scoring engine
          ↓
Structured readiness result
          ↓
Vercel serverless function
          ↓
Groq AI coaching
          ↓
Automatic deterministic fallback
```

**Key decision:** assessment remains consistent even when the AI service is unavailable.

## Slide 8 — Technical Creativity and Execution

- React and Vite responsive application.
- 20 original, topic-mapped AZ-900 questions.
- Dependency-free deterministic scoring engine.
- 46 passing scoring and contract tests.
- Server-side Groq integration through Vercel Functions.
- Automatic AI failure fallback.
- Structured prompts and response validation.
- Supabase schema and ERD prepared for future persistence.
- GitHub issues, branches, pull requests and code review workflow.

## Slide 9 — Learning Value

### More than a quiz score

AZ-900 Compass gives the learner:

- a clear readiness indicator;
- topic-level strengths and weak areas;
- explanations for every answer;
- practical next steps;
- a time-bounded revision plan;
- continued guidance even when AI is unavailable.

## Slide 10 — Impact and Scalability

### From AZ-900 to a reusable certification-prep engine

The architecture separates:

- approved content;
- scoring;
- prompts;
- interface;
- persistence.

This allows future support for:

- other Microsoft fundamentals certifications;
- saved learner history and progress trends;
- spaced revision and adaptive question selection;
- multilingual or locally contextualised explanations;
- cohort dashboards for learning programmes.

## Slide 11 — Team Contributions

- **Alex:** Product leadership, requirements, repository workflow, reviews, frontend recovery, integration, deployment and submission coordination.
- **Grace:** Frontend and UX role contributor.
- **Vee:** AI prompt specifications, structured outputs and prompt test examples.
- **Kelly:** Original AZ-900 question bank, explanations and content quality.
- **Gilton:** Scoring engine, 46 tests, backend integration, Supabase schema and ERD.

## Slide 12 — Closing

### Stop guessing. Start revising with direction.

**AZ-900 Compass**

- Working live demo
- Tested deterministic assessment
- AI-powered coaching
- Automatic resilient fallback

Include:

- Live demo link
- GitHub repository link
- Unofficial-tool disclaimer

## Presentation Design Notes

- Use product screenshots rather than paragraphs where possible.
- Keep each slide to one main message.
- Use the app's dark navy and Azure-blue visual palette.
- Do not use Microsoft logos.
- Display the unofficial-tool disclaimer on the final slide.
- Do not claim that readiness scores predict official exam outcomes.
