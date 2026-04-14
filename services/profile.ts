import { DailyChallengeRecord, LeaderboardData, ProfileSummary, RankSnapshot, TrainingHistoryEntry, WrongQuestionEntry } from '../types';
import { ensureBackendPlayerProfile, fetchLeaderboardDataFromBackend } from './backend';
import { getTodayChallengeDateKey } from './dailyChallenge';
import { buildMockLeaderboardData } from './mockData';
import { LocalPlayerIdentity } from './playerIdentity';
import { buildWeeklyActivity } from './playerHistory';
import { LocalPlayerStats } from './playerStats';
import { getSupabaseClient } from './supabase';

const buildRankSnapshot = (
  leaderboardData: LeaderboardData,
  currentScore: number
): RankSnapshot => {
  const totalPlayers = leaderboardData.totalPlayers;
  const topEntry = leaderboardData.entries[0] ?? leaderboardData.currentUserEntry;

  return {
    rank: currentScore > 0 ? leaderboardData.currentUserEntry?.rank ?? null : null,
    totalPlayers,
    topScore: leaderboardData.topScore ?? topEntry?.score ?? null,
    gapToTop: currentScore > 0 && topEntry ? Math.max(topEntry.score - currentScore, 0) : null,
  };
};

export const buildLocalProfileSummary = (payload: {
  identity: LocalPlayerIdentity;
  stats: LocalPlayerStats;
  dailyChallengeRecord: DailyChallengeRecord | null;
  wrongQuestions: WrongQuestionEntry[];
  trainingHistory: TrainingHistoryEntry[];
}): ProfileSummary => {
  const totalQuestionsAnswered = payload.trainingHistory.reduce((sum, entry) => sum + entry.totalQuestions, 0);
  const totalCorrectAnswers = payload.trainingHistory.reduce((sum, entry) => sum + entry.correctCount, 0);
  const totalSoloRuns = payload.trainingHistory.filter((entry) => entry.mode === 'solo_streak').length;
  const correctRate = totalQuestionsAnswered > 0
    ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100)
    : 0;
  const dailyLeaderboard = buildMockLeaderboardData({
    type: 'rating',
    identity: payload.identity,
    bestSoloStreak: payload.stats.bestSoloStreak,
    dailyChallengeRecord: payload.dailyChallengeRecord,
  });
  const streakLeaderboard = buildMockLeaderboardData({
    type: 'streak',
    identity: payload.identity,
    bestSoloStreak: payload.stats.bestSoloStreak,
    dailyChallengeRecord: payload.dailyChallengeRecord,
  });
  const latestDailyScore = payload.trainingHistory.find((entry) => entry.mode === 'daily_challenge')?.score
    ?? payload.dailyChallengeRecord?.score
    ?? null;

  return {
    displayName: payload.identity.displayName,
    avatar: payload.identity.avatar,
    bestSoloStreak: payload.stats.bestSoloStreak,
    totalSoloRuns,
    totalQuestionsAnswered,
    totalCorrectAnswers,
    correctRate,
    wrongQuestionCount: payload.wrongQuestions.length,
    dailyChallengesCompleted: payload.trainingHistory.filter((entry) => entry.mode === 'daily_challenge').length,
    bestDailyChallengeScore: payload.trainingHistory
      .filter((entry) => entry.mode === 'daily_challenge')
      .reduce((max, entry) => Math.max(max, entry.score), payload.dailyChallengeRecord?.score ?? 0),
    latestDailyChallengeScore: latestDailyScore,
    lastPlayedAt: payload.trainingHistory[0]?.completedAt ?? payload.stats.lastPlayedAt ?? payload.dailyChallengeRecord?.completedAt ?? null,
    dailyChallengeRank: buildRankSnapshot(dailyLeaderboard, latestDailyScore ?? 0),
    soloStreakRank: buildRankSnapshot(streakLeaderboard, payload.stats.bestSoloStreak),
    recentRecords: payload.trainingHistory.slice(0, 5),
    weeklyActivity: buildWeeklyActivity(payload.trainingHistory),
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

  const [soloBestRes, soloRunsRes, dailyAttemptsRes, wrongCountRes, dailyLeaderboard, streakLeaderboard] = await Promise.all([
    supabase
      .from('v_leaderboard_solo_best')
      .select('best_streak, total_answered, last_played_at')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('solo_runs')
      .select('id, streak_count, correct_count, total_answered, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('daily_challenge_attempts')
      .select('id, score, correct_count, total_questions, submitted_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('submitted_at', { ascending: false }),
    supabase
      .from('v_wrong_questions')
      .select('answer_id', { count: 'exact', head: true })
      .eq('user_id', userId),
    fetchLeaderboardDataFromBackend('rating', identity, getTodayChallengeDateKey()),
    fetchLeaderboardDataFromBackend('streak', identity),
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
  const dailyAttempts = dailyAttemptsRes.data ?? [];
  const totalCorrectAnswers = soloRuns.reduce((sum, entry) => sum + (entry.correct_count ?? 0), 0)
    + dailyAttempts.reduce((sum, entry) => sum + (entry.correct_count ?? 0), 0);
  const totalQuestionsAnswered = soloRuns.reduce((sum, entry) => sum + (entry.total_answered ?? 0), 0)
    + dailyAttempts.reduce((sum, entry) => sum + (entry.total_questions ?? 0), 0);
  const correctRate = totalQuestionsAnswered > 0
    ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100)
    : 0;

  const bestDailyChallengeScore = dailyAttempts.reduce((max, entry) => Math.max(max, entry.score ?? 0), 0);
  const combinedHistory: TrainingHistoryEntry[] = [
    ...soloRuns.map((entry) => ({
      id: entry.id,
      mode: 'solo_streak' as const,
      score: entry.streak_count ?? 0,
      correctCount: entry.correct_count ?? 0,
      totalQuestions: entry.total_answered ?? 0,
      completedAt: entry.created_at,
    })),
    ...dailyAttempts.map((entry) => ({
      id: entry.id,
      mode: 'daily_challenge' as const,
      score: entry.score ?? 0,
      correctCount: entry.correct_count ?? 0,
      totalQuestions: entry.total_questions ?? 0,
      completedAt: entry.submitted_at ?? new Date().toISOString(),
    })),
  ]
    .sort((left, right) => new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime());
  const recentRecords = combinedHistory.slice(0, 5);
  const latestDailyScore = dailyAttempts[0]?.score ?? null;

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
    latestDailyChallengeScore: latestDailyScore,
    lastPlayedAt: recentRecords[0]?.completedAt ?? soloBestRes.data?.last_played_at ?? dailyAttempts[0]?.submitted_at ?? null,
    dailyChallengeRank: dailyLeaderboard
      ? buildRankSnapshot(dailyLeaderboard, latestDailyScore ?? 0)
      : { rank: null, totalPlayers: 0, topScore: null, gapToTop: null },
    soloStreakRank: streakLeaderboard
      ? buildRankSnapshot(streakLeaderboard, soloBestRes.data?.best_streak ?? 0)
      : { rank: null, totalPlayers: 0, topScore: null, gapToTop: null },
    recentRecords,
    weeklyActivity: buildWeeklyActivity(combinedHistory, 7),
  };
};
