import { useState } from "react";
import questions from "./data/questions.json";
import {
  scoreQuiz,
  buildAICoachRequest,
  buildStudyPlanRequest,
} from "./lib/scoringEngine.js";
import { requestAICoach, requestAIStudyPlan } from "./lib/aiClient.js";
import "./App.css";

function App() {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [examDate, setExamDate] = useState("");
  const [availableHours, setAvailableHours] = useState(6);
  const [studyPlan, setStudyPlan] = useState(null);
  const [coachFeedback, setCoachFeedback] = useState(null);
  const [coachSource, setCoachSource] = useState("fallback");
  const [coachLoading, setCoachLoading] = useState(false);
  const [planSource, setPlanSource] = useState("fallback");
  const [planLoading, setPlanLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [navigationMessage, setNavigationMessage] = useState("");

  const answered = Object.keys(answers).length;
  const currentQuestion = questions[currentQuestionIndex];
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const currentAnswered = Boolean(answers[currentQuestion.id]);
  const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100;

  function selectAnswer(questionId, optionId) {
    setAnswers((current) => ({ ...current, [questionId]: optionId }));
    setNavigationMessage("");
  }

  function goPrevious() {
    if (isFirstQuestion) return;
    setCurrentQuestionIndex((index) => index - 1);
    setNavigationMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goNext() {
    if (!currentAnswered) {
      setNavigationMessage("Choose an answer before continuing.");
      return;
    }

    if (!isLastQuestion) {
      setCurrentQuestionIndex((index) => index + 1);
      setNavigationMessage("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function buildFallbackCoach(scoringResult) {
    return {
      summary: scoringResult.weakAreas.length
        ? `Focus first on ${scoringResult.weakAreas.join(", ")}. Review the explanations below, then retry questions from those topics.`
        : "The diagnostic shows consistent performance. Use the answer review to reinforce concepts before the exam.",
      priorityTopics: scoringResult.weakAreas,
      recommendations: scoringResult.weakAreas.length
        ? [
            "Review approved learning material for each weak area.",
            "Retry related diagnostic questions after revision.",
          ]
        : [
            "Review the answer explanations and maintain a short mixed-topic revision session.",
          ],
      answerExplanations: [],
    };
  }

  function submitQuiz() {
    if (!currentAnswered) {
      setNavigationMessage("Choose an answer before submitting the diagnostic.");
      return;
    }

    if (answered !== questions.length) {
      const firstUnansweredIndex = questions.findIndex((question) => !answers[question.id]);
      if (firstUnansweredIndex >= 0) {
        setCurrentQuestionIndex(firstUnansweredIndex);
        setNavigationMessage("Please answer this question before submitting.");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    const submission = {
      attemptId: crypto.randomUUID(),
      answers: Object.entries(answers).map(([questionId, selectedOptionId]) => ({
        questionId,
        selectedOptionId,
      })),
    };

    const scoringResult = scoreQuiz(submission, questions);

    setResult(scoringResult);
    setStudyPlan(null);
    setPlanSource("fallback");
    setCoachFeedback(buildFallbackCoach(scoringResult));
    setCoachSource("fallback");
    setCoachLoading(true);

    const aiPayload = buildAICoachRequest(scoringResult, questions);

    requestAICoach(aiPayload)
      .then((feedback) => {
        setCoachFeedback(feedback);
        setCoachSource("ai");
      })
      .catch(() => {
        setCoachSource("fallback");
      })
      .finally(() => setCoachLoading(false));

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function restartQuiz() {
    setAnswers({});
    setResult(null);
    setStudyPlan(null);
    setExamDate("");
    setAvailableHours(6);
    setCoachFeedback(null);
    setCoachSource("fallback");
    setCoachLoading(false);
    setPlanSource("fallback");
    setPlanLoading(false);
    setCurrentQuestionIndex(0);
    setNavigationMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function buildFallbackStudyPlan() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(`${examDate}T00:00:00`);
    const priorities = result.weakAreas.length
      ? result.weakAreas
      : result.topicScores.map((topic) => topic.topicLabel);

    const hours = Number(availableHours);
    const sessionCount = Math.max(
      1,
      Math.min(priorities.length, Math.floor(hours))
    );
    const minutesPerSession = Math.max(
      30,
      Math.floor((hours * 60) / sessionCount)
    );

    const sessions = priorities.slice(0, sessionCount).map((topic, index) => {
      const sessionDate = new Date(today);
      sessionDate.setDate(today.getDate() + index + 1);
      if (sessionDate > target) sessionDate.setTime(target.getTime());

      return {
        date: sessionDate.toISOString().split("T")[0],
        topic,
        durationMinutes: minutesPerSession,
        activities: [
          "Review the relevant Microsoft Learn AZ-900 material.",
          "Retry related diagnostic questions and review the explanations.",
        ],
      };
    });

    return {
      summary: result.weakAreas.length
        ? `Prioritise ${result.weakAreas.join(", ")} before the exam.`
        : "Maintain your strengths with a short mixed-topic review before the exam.",
      sessions,
      finalReview: [
        "Retry previously incorrect questions.",
        "Review the remaining weak areas before the exam.",
      ],
    };
  }

  async function generateStudyPlan() {
    if (!examDate || Number(availableHours) <= 0) {
      alert("Enter a valid exam date and available study hours.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(`${examDate}T00:00:00`);

    if (Number.isNaN(target.getTime()) || target <= today) {
      alert("Exam date must be in the future.");
      return;
    }

    const fallbackPlan = buildFallbackStudyPlan();
    setStudyPlan(fallbackPlan);
    setPlanSource("fallback");
    setPlanLoading(true);

    try {
      const payload = buildStudyPlanRequest(
        { examDate, availableHours: Number(availableHours) },
        result
      );
      const aiPlan = await requestAIStudyPlan(payload);
      setStudyPlan(aiPlan);
      setPlanSource("ai");
    } catch {
      setStudyPlan(fallbackPlan);
      setPlanSource("fallback");
    } finally {
      setPlanLoading(false);
    }
  }

  if (result) {
    return (
      <main>
        <header>
          <p className="eyebrow">AZ-900 COMPASS</p>
          <h1>Your readiness report</h1>
          <p>
            Use this diagnostic as study guidance, not as a guarantee of an
            official exam result.
          </p>
        </header>

        <section className="hero-card">
          <div>
            <span className="score">{result.overallScore}%</span>
            <h2>{result.readinessLabel}</h2>
            <p>{result.correctAnswers} of {result.totalQuestions} questions correct</p>
          </div>
        </section>

        <section>
          <h2>Topic readiness</h2>
          <div className="grid">
            {result.topicScores.map((topic) => (
              <article key={topic.topic} className="card">
                <h3>{topic.topicLabel}</h3>
                <strong>{topic.score}%</strong>
                <p>{topic.correctAnswers}/{topic.totalQuestions} correct</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid two-column">
          <article className="card">
            <h2>Strengths</h2>
            {result.strengths.length ? (
              <ul>{result.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
            ) : (
              <p>Keep building. No topic has reached the strength threshold yet.</p>
            )}
          </article>

          <article className="card">
            <h2>Priority revision</h2>
            {result.weakAreas.length ? (
              <ul>{result.weakAreas.map((item) => <li key={item}>{item}</li>)}</ul>
            ) : (
              <p>No weak areas were identified in this diagnostic.</p>
            )}
          </article>
        </section>

        <section>
          <h2>Coach feedback</h2>
          <article className="card">
            <p className="source-badge">
              {coachLoading
                ? "Checking AI coach..."
                : coachSource === "ai"
                  ? "AI Coach"
                  : "Smart fallback guidance"}
            </p>
            <p>{coachFeedback?.summary}</p>
            {coachFeedback?.recommendations?.length > 0 && (
              <ul>{coachFeedback.recommendations.map((item) => <li key={item}>{item}</li>)}</ul>
            )}
          </article>
        </section>

        <section>
          <h2>Personal study plan</h2>
          <div className="card form-grid">
            <label>
              Planned exam date
              <input type="date" value={examDate} onChange={(event) => setExamDate(event.target.value)} />
            </label>
            <label>
              Total hours available
              <input
                type="number"
                min="1"
                value={availableHours}
                onChange={(event) => setAvailableHours(event.target.value)}
              />
            </label>
            <button type="button" onClick={generateStudyPlan} disabled={planLoading}>
              {planLoading ? "Generating..." : "Generate study plan"}
            </button>
          </div>

          {studyPlan && (
            <div className="card">
              <p className="source-badge">
                {planLoading
                  ? "Checking AI planner..."
                  : planSource === "ai"
                    ? "AI-generated study plan"
                    : "Smart fallback study plan"}
              </p>
              <p>{studyPlan.summary}</p>
              {studyPlan.sessions.map((session, index) => (
                <article key={`${session.date}-${session.topic}-${index}`} className="session">
                  <h3>{session.topic}</h3>
                  <p>{session.date} · {session.durationMinutes} minutes</p>
                  <ul>{session.activities.map((activity) => <li key={activity}>{activity}</li>)}</ul>
                </article>
              ))}

              {studyPlan.finalReview?.length > 0 && (
                <>
                  <h3>Final review</h3>
                  <ul>{studyPlan.finalReview.map((item) => <li key={item}>{item}</li>)}</ul>
                </>
              )}
            </div>
          )}
        </section>

        <section>
          <h2>Answer review</h2>
          <div className="answer-list">
            {result.answerResults.map((answer) => {
              const question = questions.find((item) => item.id === answer.questionId);
              const selected = question.options.find((option) => option.id === answer.selectedOptionId);
              const correct = question.options.find((option) => option.id === answer.correctOptionId);

              return (
                <article key={answer.questionId} className={`card answer ${answer.isCorrect ? "correct" : "incorrect"}`}>
                  <h3>{question.question}</h3>
                  <strong>{answer.isCorrect ? "Correct" : "Needs review"}</strong>
                  <p>Your answer: {selected?.text ?? "No answer"}</p>
                  {!answer.isCorrect && <p>Correct answer: {correct?.text}</p>}
                  <p>{answer.explanation}</p>
                </article>
              );
            })}
          </div>
        </section>

        <button type="button" className="secondary" onClick={restartQuiz}>Retake diagnostic</button>
        <footer>
          Unofficial AZ-900 preparation tool · Not affiliated with or endorsed by Microsoft.
        </footer>
      </main>
    );
  }

  return (
    <main className="diagnostic-main">
      <header className="diagnostic-intro">
        <p className="eyebrow">AZ-900 COMPASS</p>
        <h1>Know what to study next.</h1>
        <p>Complete the diagnostic to reveal your topic strengths, weak areas and readiness.</p>
        <small>Unofficial AZ-900 preparation tool</small>
      </header>

      <section className="diagnostic-shell">
        <div className="diagnostic-progress" aria-label="Diagnostic progress">
          <div className="progress-row">
            <div>
              <strong>Diagnostic</strong>
              <span className="progress-topic">{currentQuestion.topicLabel}</span>
            </div>
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          </div>
          <div className="progress-track" aria-hidden="true">
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="progress-caption">
            <span>{answered} answered</span>
            <span>{questions.length - answered} remaining</span>
          </div>
        </div>

        <article className="card question-card single-question-card">
          <span className="question-meta">
            Question {currentQuestionIndex + 1} · {currentQuestion.topicLabel}
          </span>
          <h2>{currentQuestion.question}</h2>

          <div className="options">
            {currentQuestion.options.map((option) => (
              <label
                key={option.id}
                className={answers[currentQuestion.id] === option.id ? "option selected" : "option"}
              >
                <input
                  type="radio"
                  name={currentQuestion.id}
                  checked={answers[currentQuestion.id] === option.id}
                  onChange={() => selectAnswer(currentQuestion.id, option.id)}
                />
                <span className="option-letter">{option.id.toUpperCase()}</span>
                <span>{option.text}</span>
              </label>
            ))}
          </div>

          {navigationMessage && (
            <p className="navigation-message" role="status">{navigationMessage}</p>
          )}

          <div className="question-navigation">
            <button
              type="button"
              className="secondary navigation-button"
              onClick={goPrevious}
              disabled={isFirstQuestion}
            >
              Previous
            </button>

            <span className="question-position">
              {currentQuestionIndex + 1} / {questions.length}
            </span>

            {isLastQuestion ? (
              <button type="button" className="navigation-button" onClick={submitQuiz}>
                Submit diagnostic
              </button>
            ) : (
              <button type="button" className="navigation-button" onClick={goNext}>
                Next question
              </button>
            )}
          </div>
        </article>

        <p className="diagnostic-note">
          Answers stay editable. Use Previous to revisit earlier questions before submitting.
        </p>
      </section>

      <footer>20 original practice questions · No real exam questions used.</footer>
    </main>
  );
}

export default App;
