# AZ-900 Compass Submission Checklist

## Product

- [x] Production URL loads: [AZ-900 Compass](https://az-900-compass.vercel.app)
- [x] All 20 questions render.
- [x] Progress counter works.
- [x] Incomplete submission is blocked.
- [x] Overall and topic scores render correctly.
- [x] Answer explanations render.
- [x] `AI Coach` appears when Groq succeeds.
- [x] `AI-generated study plan` appears when Groq succeeds.
- [x] Deterministic coach fallback still works if AI fails.
- [x] Deterministic study-plan fallback still works if AI fails.
- [x] Retake flow resets the application.
- [x] Mobile-width layout remains usable.

## Verification

- [x] `node backend/scoring/scoringEngine.test.js` reports 46 passed and 0 failed.
- [x] `npm --prefix frontend run build` succeeds.
- [x] No `.env`, `.env.local`, API key, or credential is tracked by Git.
- [x] Production Groq key exists in Vercel as a secret.
- [x] Preview Groq key exists in Vercel as a secret.
- [x] Question bank contains only original questions.
- [x] Microsoft logos are not used.
- [x] Unofficial-tool disclaimer is visible.

## Repository

- [x] Final application changes are merged into `main`.
- [x] README contains the live demo and setup instructions.
- [x] Team contributions are accurate.
- [x] PRD, contracts, ERD, prompts, tests, and integration guide are present.
- [x] Repository is accessible to judges.
- [x] No unnecessary open pull requests remain.

## Presentation

- [x] Official Canva template is used.
- [x] Problem is linked to the team's own AZ-900 learning journey.
- [x] Target users are clear.
- [x] Product screenshots are current.
- [x] Prompt-engineering safeguards are explained.
- [x] Deterministic scoring is distinguished from AI coaching.
- [x] Automatic fallback is demonstrated or explained.
- [x] Impact and scalability are covered.
- [x] Team contributions are shown.
- [x] Live demo and GitHub links are included.
- [x] Unofficial-tool disclaimer is included.

## Demo

- [x] Presenter has rehearsed the 3-minute script.
- [x] A completed results tab is open as backup.
- [x] A future exam date and available-hours value are ready.
- [x] Internet connection is checked.
- [x] Demo browser notifications and unrelated tabs are closed.
- [x] Fallback explanation is ready if the AI provider is unavailable.

## Submission

- [x] Submission form/link from the Concept Note is open.
- [x] Team and project names use consistent spelling.
- [x] GitHub repository link is correct.
- [x] Production demo link is correct.
- [x] Official Canva presentation link/file is correct.
- [x] All required form fields are completed.
- [x] Submission is made before Friday, 23 October 2026 at 11:59 PM EAT.
- [x] Confirmation page or receipt is saved as evidence.
