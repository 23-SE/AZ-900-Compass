/**
 * Test & Demo Script for Supabase Integration
 * ===========================================
 * Run with:
 *   node backend/db/testSupabaseClient.js
 */

const fs = require('fs');
const path = require('path');
const { SupabaseClient } = require('./supabaseClient');
const { scoreQuiz } = require('../scoring/scoringEngine');
const questions = require('../../data/questions.json');

// Load environment variables from .env if present
function loadEnv() {
  const envPath = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

async function runDemo() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  console.log('='.repeat(60));
  console.log('AZ-900 Compass — Supabase Integration Test');
  console.log('='.repeat(60));

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-ref')) {
    console.log('\n⚠️  Supabase environment variables not found or still placeholders.');
    console.log('To run this live test against your database:');
    console.log('  1. Create az900-compass/.env (copy from .env.example)');
    console.log('  2. Set SUPABASE_URL and SUPABASE_ANON_KEY from your Supabase dashboard');
    console.log('  3. Re-run: node backend/db/testSupabaseClient.js\n');
    return;
  }

  const client = new SupabaseClient({ supabaseUrl, supabaseKey });

  const attemptId = 'test-attempt-' + Date.now();
  console.log(`\n1. Creating test quiz attempt: ${attemptId}`);

  // Simulate answers: answer first 10 questions correctly
  const sampleAnswers = questions.slice(0, 10).map(q => ({
    questionId: q.id,
    selectedOptionId: q.correctOptionId
  }));

  // Score the quiz using our deterministic scoring engine
  const scoreResult = scoreQuiz({
    attemptId,
    answers: sampleAnswers
  }, questions);

  console.log(`   Overall Score: ${scoreResult.overallScore}/100 (${scoreResult.readinessLabel})`);

  // Save to Supabase
  console.log('\n2. Saving quiz attempt and score to Supabase...');
  const saveRes = await client.saveQuizSession({
    attemptId,
    startedAt: new Date(Date.now() - 300000).toISOString(),
    completedAt: new Date().toISOString(),
    answers: sampleAnswers,
    scoringResult: scoreResult
  });
  console.log('   ✅ Saved successfully! Row UUID:', saveRes.attempt.id);

  // Query back using the result_summary view
  console.log('\n3. Querying result_summary view for frontend...');
  const summary = await client.getResultSummary(attemptId);
  console.log('   ✅ View query returned:', {
    attemptId: summary.attempt_id,
    overallScore: summary.overall_score,
    readinessLabel: summary.readiness_label,
    totalQuestions: summary.total_questions
  });

  console.log('\n🎉 ALL SUPABASE INTEGRATION TESTS PASSED!\n');
}

runDemo().catch(err => {
  console.error('\n❌ Integration error:', err.message);
  process.exit(1);
});
