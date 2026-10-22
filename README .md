# AZ-900 Compass

AZ-900 Compass is an unofficial AI-powered readiness coach that helps Azure Fundamentals learners assess their knowledge, identify weak areas, understand mistakes, and generate a personalised study plan.

## MVP Features

- Diagnostic quiz with original AZ-900 practice questions
- Overall and topic-level readiness scores
- Beginner-friendly AI explanations and revision recommendations
- Personalised study plan based on weak areas, exam date, and available hours

## Core User Journey

1. Complete the diagnostic quiz.
2. Review the readiness score and topic breakdown.
3. Understand incorrect answers and priority revision areas.
4. Generate a personalised study plan.

## Project Structure

```text
.
├── backend/          # Scoring, data access, and server-side logic
├── data/             # Approved AZ-900 question bank
├── docs/             # PRD, contracts, project plan, and ERD
├── frontend/         # Learner-facing application
├── prompts/          # Version-controlled AI prompt templates
├── CONTRIBUTING.md   # Team workflow
└── README.md
```

## Team

- Alex: Product Lead & Repository Manager
- Grace: Frontend & UX Lead
- Vee: AI & Prompt Engineering Lead
- Kelly: AZ-900 Content & Quality Lead
- Gilton: Backend, Scoring & Data Lead

## Documentation

- [Project plan](docs/PROJECT_PLAN.md)
- [Product requirements](docs/PRD.md)
- [Integration contracts](docs/CONTRACTS.md)

## Local Setup

Setup instructions will be added when the application stack is committed.

## Contribution Workflow

Read [CONTRIBUTING.md](CONTRIBUTING.md) before making changes. Work in a dedicated branch, open a pull request, and avoid pushing feature work directly to `main`.

## Disclaimer

AZ-900 Compass is an unofficial learning tool. It is not affiliated with or endorsed by Microsoft. The project does not use real exam questions or Microsoft logos. Readiness results are study guidance and do not guarantee an official examination outcome.
