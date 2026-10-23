# AZ-900 Compass — Backend Integration Guide
> **Owner:** Gilton (Backend, Scoring & Data Lead)  
> **Audience:** Grace (Frontend Lead), Vee (AI Lead), Alex (Product Lead)  
> **Status:** ✅ Ready for Integration

---

## 1. Quick Overview

All backend & data deliverables are complete and tested:
- **Scoring Engine:** Deterministic, zero AI dependency, 44/44 unit tests passing.
- **Data Models & Schema:** Supabase database live with tables, RLS policies, and performance indexes.
- **Client Library:** [`backend/db/supabaseClient.js`](../backend/db/supabaseClient.js) works with standard browser/Node `fetch` (zero npm dependencies).

---

## 2. Instructions for Grace (Frontend)

### A. How to Score a Quiz
```javascript
const { scoreQuiz } = require('./backend/scoring/scoringEngine'); // or ES import
const questions = require('./data/questions.json');

// 1. Collect user submission:
const submission = {
  attemptId: crypto.randomUUID(), // Unique session ID
  answers: [
    { questionId: 'q001', selectedOptionId: 'b' },
    { questionId: 'q002', selectedOptionId: 'c' }
  ]
};

// 2. Score the quiz:
const result = scoreQuiz(submission, questions);
console.log(result.overallScore);    // e.g. 85 (0 - 100 integer)
console.log(result.readinessLabel);  // "Ready" | "Nearly Ready" | "Making Progress" | "Keep Studying"
console.log(result.topicScores);     // [{ topicLabel, score, correctAnswers, totalQuestions }]
console.log(result.strengths);       // ['Describe cloud concepts', ...]
console.log(result.weakAreas);       // ['Describe Azure management and governance', ...]
```

### B. How to Save & Fetch from Supabase
```javascript
const { SupabaseClient } = require('./backend/db/supabaseClient');

const db = new SupabaseClient({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_ANON_KEY
});

// 1. Save attempt & score when user finishes quiz:
await db.saveQuizSession({
  attemptId: submission.attemptId,
  startedAt: startTimeISO,
  completedAt: endTimeISO,
  answers: submission.answers,
  scoringResult: result
});

// 2. Fetch full results for the Results dashboard:
const summary = await db.getResultSummary(submission.attemptId);
// Returns quiz scores + AI recommendations in a single call!
```

---

## 3. Instructions for Vee (AI & Prompt Engineering)

### A. Preparing Context for AI Coach
Use the contract helper so AI never handles raw calculations:
```javascript
const { buildAICoachRequest } = require('./backend/scoring/scoringEngine');

const aiPayload = buildAICoachRequest(result, questions);
// aiPayload contains:
// - overallScore
// - topicScores
// - weakAreas
// - incorrectAnswers: [{ question, selectedAnswer, correctAnswer, referenceExplanation }]
```

### B. Saving AI Coach Output
```javascript
await db.saveAICoachResponse(attemptId, {
  summary: "Great job on cloud fundamentals! Revise Azure governance locks.",
  priorityTopics: ["Describe Azure management and governance"],
  recommendations: ["Review Azure Policy and Role-Based Access Control"]
});
```

---

## 4. Verification & Testing

To test the backend locally at any time:
```powershell
# Run the 44 unit & contract tests
node backend/scoring/scoringEngine.test.js

# Run live Supabase database verification
node backend/db/testSupabaseClient.js
```
