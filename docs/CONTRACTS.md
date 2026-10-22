# AZ-900 Compass Integration Contracts

All contributors should use these structures unless the team agrees to a change. Shared contract changes must be communicated before implementation.

## 1. Question Contract

Store the question bank as an array of question objects.

```json
{
  "id": "q001",
  "topic": "cloud-concepts",
  "topicLabel": "Describe cloud concepts",
  "question": "Which cloud model provides shared computing resources over the internet?",
  "options": [
    {
      "id": "a",
      "text": "Public cloud"
    },
    {
      "id": "b",
      "text": "Private cloud"
    },
    {
      "id": "c",
      "text": "On-premises datacentre"
    },
    {
      "id": "d",
      "text": "Local workstation"
    }
  ],
  "correctOptionId": "a",
  "explanation": "A public cloud provides computing resources over the internet through a cloud provider."
}
```

### Required rules
- `id` must be unique.
- `topic` must use a consistent machine-readable value.
- Each question must contain at least two options.
- `correctOptionId` must match one option ID.
- `explanation` must be original, accurate, and concise.

## 2. Quiz Submission Contract

```json
{
  "attemptId": "attempt-001",
  "answers": [
    {
      "questionId": "q001",
      "selectedOptionId": "a"
    },
    {
      "questionId": "q002",
      "selectedOptionId": "c"
    }
  ]
}
```

## 3. Scoring Result Contract

Percentages use values from `0` to `100`.

```json
{
  "attemptId": "attempt-001",
  "overallScore": 75,
  "readinessLabel": "Nearly Ready",
  "correctAnswers": 15,
  "totalQuestions": 20,
  "topicScores": [
    {
      "topic": "cloud-concepts",
      "topicLabel": "Describe cloud concepts",
      "score": 80,
      "correctAnswers": 4,
      "totalQuestions": 5
    }
  ],
  "strengths": [
    "Describe cloud concepts"
  ],
  "weakAreas": [
    "Describe Azure management and governance"
  ],
  "answerResults": [
    {
      "questionId": "q001",
      "selectedOptionId": "a",
      "correctOptionId": "a",
      "isCorrect": true,
      "explanation": "A public cloud provides computing resources over the internet through a cloud provider."
    }
  ]
}
```

### Scoring rules
- Scoring must be performed in application or backend code, not by AI.
- `overallScore` equals correct answers divided by total answered/scored questions, multiplied by 100.
- Topic scores use the same formula for questions belonging to that topic.
- Round scores consistently to whole numbers for display.
- Readiness labels and thresholds must be documented before implementation.

## 4. AI Coach Request Contract

Send only the information required for feedback.

```json
{
  "overallScore": 75,
  "topicScores": [
    {
      "topicLabel": "Describe cloud concepts",
      "score": 80
    },
    {
      "topicLabel": "Describe Azure management and governance",
      "score": 50
    }
  ],
  "weakAreas": [
    "Describe Azure management and governance"
  ],
  "incorrectAnswers": [
    {
      "question": "Original question text",
      "selectedAnswer": "Selected answer text",
      "correctAnswer": "Correct answer text",
      "referenceExplanation": "Approved explanation from the question bank"
    }
  ]
}
```

## 5. AI Coach Response Contract

```json
{
  "summary": "You have a solid foundation but should revise Azure management and governance.",
  "priorityTopics": [
    "Describe Azure management and governance"
  ],
  "recommendations": [
    "Review the purpose of Azure Policy and resource locks.",
    "Retry governance questions after revision."
  ],
  "answerExplanations": [
    {
      "questionId": "q007",
      "explanation": "The selected answer does not apply because..."
    }
  ]
}
```

### AI response rules
- Return valid JSON without Markdown fences when called by the application.
- Do not change or recalculate scores.
- Do not claim that the learner will pass the official exam.
- Prefer approved question-bank explanations as grounding.
- Return short, beginner-friendly recommendations.

## 6. Study Plan Request Contract

```json
{
  "examDate": "2026-10-30",
  "availableHours": 6,
  "weakAreas": [
    "Describe Azure management and governance"
  ],
  "topicScores": [
    {
      "topicLabel": "Describe Azure management and governance",
      "score": 50
    }
  ]
}
```

## 7. Study Plan Response Contract

```json
{
  "summary": "Focus most of the available time on governance, then complete a short mixed review.",
  "sessions": [
    {
      "date": "2026-10-24",
      "durationMinutes": 60,
      "topic": "Describe Azure management and governance",
      "activities": [
        "Review Azure Policy and resource locks",
        "Complete five original governance questions"
      ]
    }
  ],
  "finalReview": [
    "Retry previously incorrect questions",
    "Review explanations for remaining weak areas"
  ]
}
```

### Study plan rules
- Dates must not be later than the supplied exam date.
- Total planned time must not exceed the supplied available hours.
- Weak areas receive the highest priority.
- If inputs are missing or invalid, return a validation error instead of inventing values.

## 8. Error Contract

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Please provide a valid exam date and available study hours."
  }
}
```

## 9. Suggested File Locations

```text
data/questions.json
prompts/coach-prompt.md
prompts/study-plan-prompt.md
backend/scoring/
docs/ERD.md
```

Gilton owns the ERD and may refine storage fields, but the frontend-facing structures above should remain stable unless the team agrees to update them.
