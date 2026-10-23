/**
 * AZ-900 Compass — Supabase Data Client
 * =====================================
 * Owner: Gilton (Backend, Scoring & Data Lead)
 *
 * Zero dependencies! Uses standard native fetch (compatible with Node 18+ and browsers).
 * Connects directly to Supabase PostgREST API using your SUPABASE_URL and SUPABASE_ANON_KEY.
 *
 * Implements the database contracts defined in docs/ERD.md and supabase/schema.sql.
 */

class SupabaseClient {
  /**
   * @param {Object} config
   * @param {string} config.supabaseUrl - Your Supabase project URL
   * @param {string} config.supabaseKey - Your Supabase anon/public API key
   */
  constructor({ supabaseUrl, supabaseKey } = {}) {
    this.supabaseUrl = (supabaseUrl || (typeof process !== 'undefined' && process.env?.SUPABASE_URL) || '').replace(/\/$/, '');
    this.supabaseKey = supabaseKey || (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) || '';

    if (!this.supabaseUrl || !this.supabaseKey) {
      console.warn('[SupabaseClient] Warning: SUPABASE_URL or SUPABASE_ANON_KEY is missing. Calls will fail until configured.');
    }
  }

  /**
   * Internal helper for PostgREST requests
   */
  async _request(endpoint, options = {}) {
    const url = `${this.supabaseUrl}/rest/v1/${endpoint}`;
    const headers = {
      'apikey': this.supabaseKey,
      'Authorization': `Bearer ${this.supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || 'return=representation',
      ...(options.headers || {})
    };

    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (!res.ok) {
      let errBody;
      try { errBody = await res.json(); } catch (_) { errBody = await res.text(); }
      const err = new Error(`Supabase request failed: [${res.status}] ${JSON.stringify(errBody)}`);
      err.status = res.status;
      err.details = errBody;
      throw err;
    }

    if (res.status === 204) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  /**
   * Save a complete quiz session (attempt, submitted answers, and calculated score)
   *
   * @param {Object} params
   * @param {string} params.attemptId - Unique UUID string for this session
   * @param {string} [params.startedAt] - ISO timestamp string
   * @param {string} [params.completedAt] - ISO timestamp string
   * @param {Array<{questionId: string, selectedOptionId: string}>} params.answers - Learner answers
   * @param {Object} params.scoringResult - Output from scoringEngine.calculateScore()
   * @returns {Promise<{attempt: Object, scoreResult: Object, answersCount: number}>}
   */
  async saveQuizSession({ attemptId, startedAt, completedAt, answers = [], scoringResult }) {
    if (!attemptId) throw new Error('attemptId is required');
    if (!scoringResult) throw new Error('scoringResult is required');

    // 1. Insert quiz_attempt
    const [attempt] = await this._request('quiz_attempts', {
      method: 'POST',
      body: {
        attempt_id: attemptId,
        started_at: startedAt || new Date().toISOString(),
        completed_at: completedAt || new Date().toISOString()
      }
    });

    const quizAttemptUuid = attempt.id;

    // 2. Insert attempt_answers (if any)
    if (answers && answers.length > 0) {
      const answersPayload = answers.map(a => ({
        quiz_attempt_id: quizAttemptUuid,
        question_id: a.questionId,
        selected_option_id: a.selectedOptionId
      }));

      await this._request('attempt_answers', {
        method: 'POST',
        prefer: 'return=minimal',
        body: answersPayload
      });
    }

    // 3. Insert score_results
    const [scoreRow] = await this._request('score_results', {
      method: 'POST',
      body: {
        quiz_attempt_id: quizAttemptUuid,
        overall_score: scoringResult.overallScore,
        readiness_label: scoringResult.readinessLabel,
        correct_answers: scoringResult.correctAnswers,
        total_questions: scoringResult.totalQuestions,
        topic_scores: scoringResult.topicScores,
        strengths: scoringResult.strengths,
        weak_areas: scoringResult.weakAreas,
        answer_results: scoringResult.answerResults
      }
    });

    return {
      attempt,
      scoreResult: scoreRow,
      answersCount: answers.length
    };
  }

  /**
   * Fetch full result summary for the frontend (quiz results + AI feedback in 1 call)
   *
   * @param {string} attemptId - The client attempt_id
   * @returns {Promise<Object|null>} Summary row or null if not found
   */
  async getResultSummary(attemptId) {
    if (!attemptId) throw new Error('attemptId is required');
    const rows = await this._request(`result_summary?attempt_id=eq.${encodeURIComponent(attemptId)}&limit=1`);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  /**
   * Save AI Coach recommendations (Vee's layer)
   *
   * @param {string} attemptId - The client attempt_id
   * @param {Object} aiData - Output from AI Coach
   * @param {string} aiData.summary - Friendly summary explanation
   * @param {Array<string>} [aiData.priorityTopics] - Topics needing revision
   * @param {Array<Object>} [aiData.recommendations] - Actionable study tips
   * @param {Array<Object>} [aiData.answerExplanations] - Detailed per-question explanations
   */
  async saveAICoachResponse(attemptId, aiData) {
    if (!attemptId) throw new Error('attemptId is required');

    // Look up attempt UUID
    const [attempt] = await this._request(`quiz_attempts?attempt_id=eq.${encodeURIComponent(attemptId)}&select=id`);
    if (!attempt) throw new Error(`Quiz attempt ${attemptId} not found in database`);

    const [coachRow] = await this._request('ai_coach_responses', {
      method: 'POST',
      body: {
        quiz_attempt_id: attempt.id,
        summary: aiData.summary,
        priority_topics: aiData.priorityTopics || [],
        recommendations: aiData.recommendations || [],
        answer_explanations: aiData.answerExplanations || []
      }
    });

    return coachRow;
  }

  /**
   * Save Study Plan Request & AI-generated Plan
   *
   * @param {Object} params
   * @param {string} params.attemptId - The client attempt_id
   * @param {string} params.examDate - YYYY-MM-DD
   * @param {number} params.availableHours - Weekly or total available hours
   * @param {Object} params.studyPlan - Plan generated by AI
   */
  async saveStudyPlan({ attemptId, examDate, availableHours, studyPlan }) {
    if (!attemptId) throw new Error('attemptId is required');

    // Look up attempt UUID
    const [attempt] = await this._request(`quiz_attempts?attempt_id=eq.${encodeURIComponent(attemptId)}&select=id`);
    if (!attempt) throw new Error(`Quiz attempt ${attemptId} not found in database`);

    // 1. Insert study_plan_request
    const [requestRow] = await this._request('study_plan_requests', {
      method: 'POST',
      body: {
        quiz_attempt_id: attempt.id,
        exam_date: examDate,
        available_hours: availableHours
      }
    });

    // 2. Insert study_plan_response
    const [responseRow] = await this._request('study_plan_responses', {
      method: 'POST',
      body: {
        study_plan_request_id: requestRow.id,
        summary: studyPlan.summary,
        sessions: studyPlan.sessions || [],
        final_review: studyPlan.finalReview || []
      }
    });

    return { request: requestRow, plan: responseRow };
  }
}

// Export for CommonJS (Node.js) & ES Module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SupabaseClient };
}
