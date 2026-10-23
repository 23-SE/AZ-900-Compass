# AZ-900 Compass — Backend Integration & Team Handoff Guide
> **Owner:** Gilton (Backend, Scoring & Data Lead)  
> **Audience:** Alex (Product Lead), Grace (Frontend Lead), Vee (AI Lead), Kelly (Content Lead)  
> **Status:** ✅ Complete, Fully Tested & Verified Live  

---

## 1. Quick Overview & Verification

All backend & data deliverables are complete, verified against the official contracts, and ready for integration:
- **Scoring Engine:** Deterministic, zero AI dependency, 44/44 unit tests passing.
- **Data Models & Schema:** Supabase database live with tables, RLS policies, and performance indexes.
- **Client Library:** [`backend/db/supabaseClient.js`](../backend/db/supabaseClient.js) works with standard browser/Node `fetch` (zero npm dependencies).

### Run Tests Anytime (Zero Setup Required)
```powershell
# 1. Run the 44 unit & contract tests:
node backend/scoring/scoringEngine.test.js

# 2. Run the live Supabase database verification:
node backend/db/testSupabaseClient.js
```

---

## 2. Instructions for Grace (Frontend & UX Lead)

Grace, you do not need to write any math or scoring algorithms. Everything is ready to import.

### A. Question Bank (`data/questions.json`)
The file contains 20 multiple-choice questions. Each question has:
- `id`: Unique identifier (e.g., `"q001"`)
- `topic`: Domain slug (`"cloud-concepts"`, `"azure-architecture"`, `"azure-governance"`)
- `topicLabel`: Display name for headings (e.g., `"Describe cloud concepts"`)
- `question`: The text of the question
- `options`: Array of 4 options with `id` (`"a"`, `"b"`, `"c"`, `"d"`) and `text`
- `explanation`: Official reference explanation for learning

### B. How to Score a Quiz
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
console.log(result.answerResults);   // Per-question correctness, user's choice, & explanation
```

### C. How to Save & Fetch from Supabase
```javascript
const { SupabaseClient } = require('./backend/db/supabaseClient');

const db = new SupabaseClient({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_ANON_KEY
});

// 1. Save attempt & score when user finishes quiz (saves attempt, answers & scores in 1 shot):
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

## 3. Instructions for Vee (AI & Prompt Engineering Lead)

Vee, your AI prompt inputs are isolated and prepared by the backend so AI never needs to calculate scores, parse raw option IDs, or perform math.

### A. Preparing Context for AI Coach
Use the contract helper so AI never handles raw calculations:
```javascript
const { buildAICoachRequest } = require('./backend/scoring/scoringEngine');

const aiPayload = buildAICoachRequest(result, questions);
// aiPayload matches your exact prompt contract:
// {
//   overallScore: 65,
//   topicScores: [{ topicLabel: '...', score: 70 }],
//   weakAreas: ['Describe Azure management and governance'],
//   incorrectAnswers: [
//     {
//       questionId: 'q007',
//       question: 'Full question text',
//       selectedAnswer: 'The incorrect text option learner chose',
//       correctAnswer: 'The correct text option',
//       referenceExplanation: 'Reference explanation from official guide'
//     }
//   ]
// }
```

### B. Saving AI Coach Output to Supabase
```javascript
await db.saveAICoachResponse(attemptId, {
  summary: "Great job on cloud fundamentals! Revise Azure governance locks.",
  priorityTopics: ["Describe Azure management and governance"],
  recommendations: ["Review Azure Policy and Role-Based Access Control"]
});
```

---

## 4. Instructions for Kelly (AZ-900 Content & Quality Lead)

Kelly, the question bank is stored in [`data/questions.json`](../data/questions.json).

- It contains **20 original questions** structured across Microsoft’s 3 AZ-900 domains:
  1. `cloud-concepts`: **6 questions** (~25–30% exam weighting)
  2. `azure-architecture`: **7 questions** (~35–40% exam weighting)
  3. `azure-governance`: **7 questions** (~30–35% exam weighting)
- **Adding or modifying questions:**
  - Make sure `correctOptionId` matches one of the option IDs (`"a"`, `"b"`, `"c"`, or `"d"`).
  - All questions use `topicLabel` for UI category headings.

---

## 5. Instructions for Alex (Product Lead & Repo Manager)

Alex, all backend criteria from the PRD, CONTRACTS.md, and CONTRIBUTING.md are satisfied:

1. **GitHub Branch:** `feature/scoring-logic` pushed and ready for PR merge.
2. **Commit Standard:** Every commit follows the rules (`content:`, `feat:`, `docs:`).
3. **Security:** No API keys, credentials, or `.env` files were tracked or committed.
4. **Reliability:** Scoring logic is 100% deterministic and decoupled from AI.
5. **ERD Documented:** Full database architecture and JSONB structures documented in [`docs/ERD.md`](./ERD.md).

---

## 6. Frequently Asked Questions (Self-Service)

**Q: What if the learner does not answer all questions?**  
A: The scoring engine handles partial submissions gracefully without inflating readiness. Unanswered questions receive 0 credit (`selectedOptionId: null`), and the score is calculated against the complete quiz length (`(correctAnswers / totalQuestionsInBank) * 100`) so 1 correct answer out of 1 attempted does not produce an artificial 100% score.

**Q: What are the readiness labels and score cutoffs?**  
- **Score ≥ 85:** `"Ready"`
- **Score ≥ 70:** `"Nearly Ready"`
- **Score ≥ 50:** `"Making Progress"`
- **Score < 50:** `"Keep Studying"`

**Q: What defines a strength vs. a weak area?**  
- A topic score **≥ 75%** is categorized as a **strength**.
- A topic score **< 75%** is categorized as a **weak area**.

**Q: Do we need to run `npm install` for the scoring engine?**  
A: No! The scoring engine, test suite, and Supabase client use standard built-in Node.js / JavaScript (zero external dependencies).
