# AZ-900 Hackathon Project Plan

## Deadline
Friday, 23 October 2026, 6:00 PM EAT

## Working Concept
An unofficial AI-powered AZ-900 Readiness Coach that assesses learners, identifies weak areas, explains mistakes, and creates a personalised study plan.

This project primarily addresses the hackathon's **Readiness Tracker** challenge and also incorporates elements of the **Smart Quiz Builder**, **Personal Study Planner**, and **AI Study Buddy** challenges.

## Why This Concept
The hackathon brief identifies a clear learner problem: learners often do not know whether they are ready to sit the AZ-900 exam. The solution directly addresses that problem while supporting key judging areas: learning value, purposeful prompt engineering, user experience, technical creativity, rapid execution, and presentation.

## Agreed MVP

### 1. Diagnostic Quiz
- 10-20 original questions based on the public AZ-900 skills outline.
- Questions organised by topic/domain.
- No copied exam questions.

### 2. Readiness Report
- Overall readiness percentage.
- Topic-level scores.
- Clear strengths and weak areas.
- Deterministic scoring so the same answers produce the same score.

### 3. AI Coach
- Explains why an answer is correct or incorrect.
- Uses simple, beginner-friendly language.
- Recommends what the learner should revise next.

### 4. Personalised Study Plan
- Accepts exam date, available study time, and weak areas.
- Produces a prioritised revision plan.
- Keeps recommendations realistic and tied to the diagnostic results.

## Required User Journey
1. Learner opens the app.
2. Learner completes the diagnostic quiz.
3. App calculates topic scores and overall readiness.
4. Learner reviews strengths, weaknesses, and explanations.
5. AI Coach recommends the next study actions.
6. App generates a personalised study plan.

## Team Roles

### Alex: Product Lead & Repository Manager
**Owns**
- Product scope, priorities, and final decisions.
- Creating and managing the repository under the 23-SE organisation.
- Issues, branches, pull requests, integration, and final release.
- Ensuring all work matches the MVP and judging criteria.
- README, final demo flow, submission checklist, and coordination.

**First deliverables**
- Create repository, project board, issues, and branch rules.
- Add this plan, README skeleton, contribution guidance, and shared data contracts.
- Confirm product name and keep the team on schedule.

### Grace: Frontend & UX Lead
**Owns**
- Building the complete learner-facing flow.
- Quiz, results dashboard, AI explanation, and study-plan screens.
- Responsive layout, clear navigation, loading/error states, and visual polish.
- Connecting the interface to agreed scoring/data functions.

**Technical preference**
- Use the fastest shared web stack selected by the team, such as Lovable or React/Vite.
- Reuse components and keep the interface demo-ready rather than feature-heavy.

**First deliverable**
- A clickable end-to-end interface using temporary sample data.

### Vee: AI & Prompt Engineering Lead
**Owns**
- Prompts for answer explanations, revision recommendations, and study-plan generation.
- Structured outputs that the frontend can display reliably.
- Prompt constraints that keep responses focused on AZ-900 and beginner-friendly.
- Testing prompts against correct, incorrect, weak, and incomplete inputs.

**Technical preference**
- Store prompts in version-controlled files, not only inside a third-party dashboard.
- Request structured JSON where possible and include fallback responses.

**First deliverable**
- Tested prompt templates plus sample inputs and expected outputs.

### Kelly: AZ-900 Content & Quality Lead
**Owns**
- Writing 10-20 original diagnostic questions and answer options.
- Mapping each question to a public AZ-900 skill area.
- Providing the correct answer and a concise explanation.
- Reviewing learner-facing content for accuracy, clarity, and originality.
- Confirming the app is labelled unofficial and contains no Microsoft logos.

**Technical preference**
- Deliver content in the shared JSON schema so it can be imported directly.
- Use the public Microsoft Learn AZ-900 skills outline as the content reference.

**First deliverable**
- A validated question bank ready for integration.

### Gilton: Backend, Scoring & Data Lead
**Owns**
- Question and result data structures.
- Deterministic overall and topic-level scoring.
- APIs/server functions or Supabase integration only where needed.
- Validation, error handling, and sample test data.
- Making frontend integration simple and stable.

**Technical preference**
- Use Supabase only if persistence adds value to the demo.
- Keep scoring independent from AI so readiness results remain reliable.

**First deliverable**
- Working scoring logic with a documented input/output contract and test cases.

## Shared Integration Contract
Before parallel development, agree on:
- Question JSON structure.
- Quiz submission structure.
- Score/result structure.
- AI request and response structure.
- Branch naming and pull-request process.

No team member should change a shared structure without notifying the group.

## Scope Guardrails
Do not add these unless the MVP is working:
- Authentication.
- Leaderboards.
- Social features.
- Advanced analytics.
- Mobile application.
- Multiple certification tracks.

## Definition of Done
- Full user journey works without manual intervention.
- Questions are original and mapped to AZ-900 topics.
- Scores are accurate and repeatable.
- AI outputs are useful, constrained, and readable.
- Failure/loading states do not break the demo.
- README explains the problem, solution, setup, team, prompts, and limitations.
- App is labelled **Unofficial AZ-900 preparation tool**.
- Working demo and presentation are ready before submission.

## Product Name Candidates
1. AZ-900 Compass
2. Azure Navigator
3. CloudReady
4. ExamPilot

The final name must not imply Microsoft ownership or endorsement.

## Immediate Next Step
Create the organisation repository, add this file, create one issue per role, agree on shared data contracts, and start parallel work.
