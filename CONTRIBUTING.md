# Contributing to AZ-900 Compass

This guide keeps parallel work easy to integrate during the hackathon.

## 1. Before Starting

1. Pull the latest `main` branch.
2. Read `docs/PRD.md` and `docs/CONTRACTS.md`.
3. Confirm that the work matches an assigned GitHub issue.
4. Do not change shared data structures without notifying the team.

## 2. Branch Naming

Create one branch per task:

```text
feature/frontend-quiz
feature/ai-coach-prompts
feature/question-bank
feature/scoring-logic
docs/erd
fix/short-description
```

Example:

```bash
git switch main
git pull --ff-only origin main
git switch -c feature/question-bank
```

## 3. Commit Style

Use short, descriptive messages:

```text
feat: add diagnostic quiz interface
feat: implement readiness scoring
content: add AZ-900 question bank
prompt: add study plan prompt
fix: handle unanswered questions
docs: add backend ERD
chore: update repository configuration
```

## 4. Pull Requests

Before opening a pull request:

- Confirm the relevant feature works locally.
- Check that files follow `docs/CONTRACTS.md`.
- Do not commit API keys, credentials, `.env` files, or generated metadata.
- Keep the pull request focused on one responsibility.
- Link the relevant GitHub issue.

Pull request description:

```md
## What changed
Brief description.

## How to test
1. Step one
2. Step two

## Related issue
Closes #ISSUE_NUMBER

## Notes
Known limitations or integration details.
```

## 5. Integration Rules

- `main` should remain demo-ready.
- Feature work should enter `main` through reviewed pull requests.
- Scoring must remain deterministic and must not depend on AI.
- Questions must be original and mapped to AZ-900 skill areas.
- AI outputs must follow the response contracts.
- Shared contract changes require team agreement.
- Resolve merge conflicts on the feature branch before merging.

## 6. Repository Ownership

- Alex coordinates scope, repository integration, and release readiness.
- Each contributor owns and tests the files related to the assigned role.
- Gilton owns the ERD and backend data model.
- Alex approves scope changes; relevant technical owners review implementation changes.

## 7. Fast Hackathon Review Checklist

- Does the change support the agreed MVP?
- Does the full user journey still work?
- Are loading, empty, and error states handled where relevant?
- Are secrets excluded?
- Is documentation updated if a shared contract changed?
