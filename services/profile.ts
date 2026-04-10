import { DailyChallengeRecord, ProfileSummary, WrongQuestionEntry } from '../types';
import { ensureBackendPlayerProfile } from './backend';
import { LocalPlayerIdentity } from './playerIdentity';
import { LocalPlayerStats } from './playerStats';
import { getSupabaseClient } from './supabase';

export const buildLocalProfileSummary = (payload: {
  identity: LocalPlayerIdentity;
  stats: LocalPlayerStats;
  dailyChallengeRecord: DailyChallengeRecord | null;
  wrongQuestions: WrongQuestionEntry[];
}): ProfileSummary => {
  const correctRate = payload.stats.totalQuestionsAnswered > 0
    ? Math.round((payload.stats.totalCorrectAnswers / payload.stats.totalQuestionsAnswered) * 100)
    : 0;

  return {
    displayName: payload.identity.displayName,
    avatar: payload.identity.avatar,
    bestSoloStreak: payload.stats.bestSoloStreak,
    totalSoloRuns: payload.stats.totalSoloRuns,
    totalQuestionsAnswered: payload.stats.totalQuestionsAnswered,
    totalCorrectAnswers: payload.stats.totalCorrectAnswers,
    correctRate,
    wrongQuestionCount: payload.wrongQuestions.length,
    dailyChallengesCompleted: payload.dailyChallengeRecord ? 1 : 0,
    bestDailyChallengeScore: payload.dailyChallengeRecord?.score ?? 0,
    latestDailyChallengeScore: payload.dailyChallengeRecord?.score ?? null,
    lastPlayedAt: payload.stats.lastPlayedAt ?? payload.dailyChallengeRecord?.completedAt ?? null,
  };
};

export const fetchProfileSummaryFromBackend = async (
  identity: LocalPlayerIdentity
): Promise<Partial<ProfileSummary> | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const userId = await ensureBackendPlayerProfile(identity);
  if (!userId) {
    return null;
  }

  const [soloBestRes, soloRunsRes, dailyAttemptsRes, wrongCountRes] = await Promise.all([
    supabase
      .from('v_leaderboard_solo_best')
      .select('best_streak, total_answered, last_played_at')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('solo_runs')
      .select('correct_count, total_answered, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('daily_challenge_attempts')
      .select('score, submitted_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('submitted_at', { ascending: false }),
    supabase
      .from('v_wrong_questions')
      .select('answer_id', { count: 'exact', head: true })
      .eq('user_id', userId),
  ]);

  if (soloBestRes.error) {
    console.error('Failed to fetch profile solo best summary:', soloBestRes.error);
  }
  if (soloRunsRes.error) {
    console.error('Failed to fetch profile solo run summary:', soloRunsRes.error);
  }
  if (dailyAttemptsRes.error) {
    console.error('Failed to fetch profile daily summary:', dailyAttemptsRes.error);
  }
  if (wrongCountRes.error) {
    console.error('Failed to fetch profile wrong count summary:', wrongCountRes.error);
  }

  const soloRuns = soloRunsRes.data ?? [];
  const totalCorrectAnswers = soloRuns.reduce((sum, entry) => sum + (entry.correct_count ?? 0), 0);
  const totalQuestionsAnswered = soloRuns.reduce((sum, entry) => sum + (entry.total_answered ?? 0), 0);
  const correctRate = totalQuestionsAnswered > 0
    ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100)
    : 0;

  const dailyAttempts = dailyAttemptsRes.data ?? [];
  const bestDailyChallengeScore = dailyAttempts.reduce((max, entry) => Math.max(max, entry.score ?? 0), 0);

  return {
    displayName: identity.displayName,
    avatar: identity.avatar,
    bestSoloStreak: soloBestRes.data?.best_streak ?? 0,
    totalSoloRuns: soloRuns.length,
    totalQuestionsAnswered,
    totalCorrectAnswers,
    correctRate,
    wrongQuestionCount: wrongCountRes.count ?? 0,
    dailyChallengesCompleted: dailyAttempts.length,
    bestDailyChallengeScore,
    latestDailyChallengeScore: dailyAttempts[0]?.score ?? null,
    lastPlayedAt: soloBestRes.data?.last_played_at ?? dailyAttempts[0]?.submitted_at ?? null,
  };
};
