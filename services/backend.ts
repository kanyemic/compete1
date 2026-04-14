import { LeaderboardData, LeaderboardEntry, LeaderboardType, QuestionCase, ReviewStatus, RoundResult, WrongQuestionEntry } from '../types';
import { buildLeaderboardInsights } from './leaderboard';
import { getSupabaseClient } from './supabase';
import { LocalPlayerIdentity } from './playerIdentity';

type BackendQuestionCaseRow = {
  id: string;
  specialty: string;
  modality: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  image_url: string;
  source_name: string | null;
  source_url: string | null;
  review_status: ReviewStatus;
  reviewer_name: string | null;
  updated_at: string;
};

type SoloLeaderboardRow = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  best_streak: number;
};

type DailyLeaderboardRow = {
  id: string;
  user_id: string;
  score: number;
  total_time_ms: number | null;
  user: {
    display_name: string;
    avatar_url: string | null;
  } | Array<{
    display_name: string;
    avatar_url: string | null;
  }> | null;
};

type DailyChallengeQuestionRow = {
  order_index: number;
  question: BackendQuestionCaseRow | BackendQuestionCaseRow[] | null;
};

const difficultyLabelMap: Record<BackendQuestionCaseRow['difficulty'], QuestionCase['difficulty']> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const avatarFromName = (name: string): string => {
  const symbolBank = ['🩺', '🔬', '🧠', '🧬', '🏥', '💊', '📚', '⚕️'];
  const code = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return symbolBank[code % symbolBank.length];
};

const mapQuestionCase = (row: BackendQuestionCaseRow): QuestionCase => ({
  id: row.id,
  category: `${row.specialty} · ${row.modality}`,
  specialty: row.specialty,
  modality: row.modality,
  description: row.description,
  correctAnswer: row.correct_answer,
  options: row.options,
  explanation: row.explanation,
  difficulty: difficultyLabelMap[row.difficulty],
  imageUrl: row.image_url,
  sourceName: row.source_name,
  sourceUrl: row.source_url,
  reviewStatus: row.review_status,
  reviewerName: row.reviewer_name,
  updatedAt: row.updated_at,
});

const pickRelationRow = <T,>(value: T | T[] | null | undefined): T | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
};

const sortByDailySeed = (items: BackendQuestionCaseRow[], seed: string): BackendQuestionCaseRow[] => {
  const seedValue = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return [...items].sort((left, right) => {
    const leftScore = Array.from(left.id).reduce((sum, char) => sum + char.charCodeAt(0), seedValue);
    const rightScore = Array.from(right.id).reduce((sum, char) => sum + char.charCodeAt(0), seedValue);
    return leftScore - rightScore;
  });
};

export const fetchRandomCaseFromBackend = async (): Promise<QuestionCase | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('question_cases')
    .select('id, specialty, modality, difficulty, description, options, correct_answer, explanation, image_url, source_name, source_url, review_status, reviewer_name, updated_at')
    .eq('is_active', true)
    .eq('review_status', 'approved');

  if (error) {
    console.error('Failed to fetch question cases from Supabase:', error);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * data.length);
  return mapQuestionCase(data[randomIndex] as BackendQuestionCaseRow);
};

export const fetchDailyChallengeCasesFromBackend = async (
  seed: string,
  count: number
): Promise<QuestionCase[] | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data: challengeData, error: challengeError } = await supabase
    .from('daily_challenges')
    .select('id')
    .eq('challenge_date', seed)
    .eq('status', 'published')
    .limit(1)
    .maybeSingle();

  if (challengeError) {
    console.error('Failed to fetch daily challenge by date:', challengeError);
  }

  if (challengeData?.id) {
    const { data: challengeQuestions, error: challengeQuestionsError } = await supabase
      .from('daily_challenge_questions')
      .select(`
        order_index,
        question:question_cases (
          id,
          specialty,
          modality,
          difficulty,
          description,
          options,
          correct_answer,
          explanation,
          image_url,
          source_name,
          source_url,
          review_status,
          reviewer_name,
          updated_at
        )
      `)
      .eq('challenge_id', challengeData.id)
      .order('order_index', { ascending: true })
      .limit(count);

    if (challengeQuestionsError) {
      console.error('Failed to fetch daily challenge question set:', challengeQuestionsError);
    } else if (challengeQuestions && challengeQuestions.length > 0) {
      return (challengeQuestions as unknown as DailyChallengeQuestionRow[])
        .map((entry) => pickRelationRow(entry.question))
        .filter((entry): entry is BackendQuestionCaseRow => Boolean(entry))
        .map(mapQuestionCase);
    }
  }

  const { data, error } = await supabase
    .from('question_cases')
    .select('id, specialty, modality, difficulty, description, options, correct_answer, explanation, image_url, source_name, source_url, review_status, reviewer_name, updated_at')
    .eq('is_active', true)
    .eq('review_status', 'approved');

  if (error) {
    console.error('Failed to fetch daily challenge cases from Supabase:', error);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return sortByDailySeed(data as BackendQuestionCaseRow[], seed)
    .slice(0, count)
    .map(mapQuestionCase);
};

const fetchLatestDailyChallengeId = async (): Promise<string | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('daily_challenges')
    .select('id')
    .eq('status', 'published')
    .order('challenge_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch latest daily challenge:', error);
    return null;
  }

  return data?.id ?? null;
};

const fetchDailyChallengeIdByDate = async (dateKey: string): Promise<string | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('daily_challenges')
    .select('id')
    .eq('challenge_date', dateKey)
    .eq('status', 'published')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch daily challenge id by date:', error);
    return null;
  }

  return data?.id ?? null;
};

const mapDailyLeaderboardEntries = (data: DailyLeaderboardRow[]): LeaderboardEntry[] => (
  data.map((entry, index) => {
    const user = pickRelationRow(entry.user);
    const fallbackName = `用户 ${index + 1}`;

    return {
      id: entry.user_id || entry.id,
      rank: index + 1,
      name: user?.display_name ?? fallbackName,
      avatar: user?.avatar_url || avatarFromName(user?.display_name ?? fallbackName),
      score: entry.score,
      trend: 'same',
      totalTimeMs: entry.total_time_ms ?? null,
    };
  })
);

const mapSoloLeaderboardEntries = (data: SoloLeaderboardRow[]): LeaderboardEntry[] => (
  data.map((entry, index) => ({
    id: entry.user_id,
    rank: index + 1,
    name: entry.display_name,
    avatar: entry.avatar_url || avatarFromName(entry.display_name),
    score: entry.best_streak,
    trend: 'same',
  }))
);

const fetchDailyLeaderboard = async (): Promise<LeaderboardData | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const challengeId = await fetchLatestDailyChallengeId();
  if (!challengeId) {
    return null;
  }

  const { data, error } = await supabase
    .from('daily_challenge_attempts')
    .select(`
      id,
      user_id,
      score,
      total_time_ms,
      user:app_users!daily_challenge_attempts_user_id_fkey (
        display_name,
        avatar_url
      )
    `)
    .eq('challenge_id', challengeId)
    .eq('status', 'completed')
    .order('score', { ascending: false })
    .order('total_time_ms', { ascending: true })
    .limit(10);

  if (error) {
    console.error('Failed to fetch daily leaderboard:', error);
    return null;
  }

  const entries = mapDailyLeaderboardEntries((data as unknown as DailyLeaderboardRow[]) ?? []);
  return {
    entries: entries.slice(0, 10),
    currentUserEntry: null,
    totalPlayers: entries.length,
    topScore: entries[0]?.score ?? null,
    chaseMessage: null,
    stabilityMessage: null,
  };
};

const fetchSoloBestLeaderboard = async (): Promise<LeaderboardData | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('v_leaderboard_solo_best')
    .select('user_id, display_name, avatar_url, best_streak')
    .order('best_streak', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Failed to fetch solo leaderboard:', error);
    return null;
  }

  const entries = mapSoloLeaderboardEntries((data as SoloLeaderboardRow[]) ?? []);
  return {
    entries: entries.slice(0, 10),
    currentUserEntry: null,
    totalPlayers: entries.length,
    topScore: entries[0]?.score ?? null,
    chaseMessage: null,
    stabilityMessage: null,
  };
};

export const fetchLeaderboardDataFromBackend = async (
  type: LeaderboardType,
  identity: LocalPlayerIdentity,
  dateKey?: string
): Promise<LeaderboardData | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  if (type === 'rating') {
    const challengeId = dateKey
      ? (await fetchDailyChallengeIdByDate(dateKey)) ?? await fetchLatestDailyChallengeId()
      : await fetchLatestDailyChallengeId();

    if (!challengeId) {
      return {
        entries: [],
        currentUserEntry: null,
        totalPlayers: 0,
        topScore: null,
        chaseMessage: null,
        stabilityMessage: null,
      };
    }

    const { data, error } = await supabase
      .from('daily_challenge_attempts')
      .select(`
        id,
        user_id,
        score,
        total_time_ms,
        user:app_users!daily_challenge_attempts_user_id_fkey (
          display_name,
          avatar_url
        )
      `)
      .eq('challenge_id', challengeId)
      .eq('status', 'completed')
      .order('score', { ascending: false })
      .order('total_time_ms', { ascending: true });

    if (error) {
      console.error('Failed to fetch daily leaderboard data:', error);
      return null;
    }

    const mappedEntries = mapDailyLeaderboardEntries((data as unknown as DailyLeaderboardRow[]) ?? []);
    const insights = buildLeaderboardInsights({
      entries: mappedEntries,
      currentUserId: identity.id,
      type,
    });
    return {
      entries: mappedEntries.slice(0, 10),
      currentUserEntry: insights.currentUserEntry,
      totalPlayers: insights.totalPlayers,
      topScore: insights.topScore,
      chaseMessage: insights.chaseMessage,
      stabilityMessage: insights.stabilityMessage,
    };
  }

  const { data, error } = await supabase
    .from('v_leaderboard_solo_best')
    .select('user_id, display_name, avatar_url, best_streak')
    .order('best_streak', { ascending: false });

  if (error) {
    console.error('Failed to fetch solo leaderboard data:', error);
    return null;
  }

  const mappedEntries = mapSoloLeaderboardEntries((data as SoloLeaderboardRow[]) ?? []);
  const insights = buildLeaderboardInsights({
    entries: mappedEntries,
    currentUserId: identity.id,
    type,
  });
  return {
    entries: mappedEntries.slice(0, 10),
    currentUserEntry: insights.currentUserEntry,
    totalPlayers: insights.totalPlayers,
    topScore: insights.topScore,
    chaseMessage: insights.chaseMessage,
    stabilityMessage: insights.stabilityMessage,
  };
};

export const ensureBackendPlayerProfile = async (
  identity: LocalPlayerIdentity
): Promise<string | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('app_users')
    .upsert(
      [
        {
          id: identity.id,
          auth_user_id: identity.authUserId ?? null,
          display_name: identity.displayName,
          avatar_url: identity.avatar,
          is_guest: identity.isGuest,
          last_seen_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'id' }
    )
    .select('id')
    .single();

  if (error) {
    console.error('Failed to ensure backend player profile:', error);
    return null;
  }

  return data.id;
};

export const submitDailyChallengeAttemptToBackend = async (payload: {
  identity: LocalPlayerIdentity;
  dateKey: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  history: RoundResult[];
  cases: QuestionCase[];
}): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return;
  }

  const userId = await ensureBackendPlayerProfile(payload.identity);
  if (!userId) {
    return;
  }

  const challengeId = await fetchDailyChallengeIdByDate(payload.dateKey);
  if (!challengeId) {
    return;
  }

  const totalTimeMs = payload.history.reduce((sum, entry) => sum + Math.round(entry.timeTaken * 1000), 0);

  const { data: attempt, error: attemptError } = await supabase
    .from('daily_challenge_attempts')
    .upsert(
      [
        {
          challenge_id: challengeId,
          user_id: userId,
          status: 'completed',
          score: payload.score,
          correct_count: payload.correctCount,
          total_questions: payload.totalQuestions,
          total_time_ms: totalTimeMs,
          submitted_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'challenge_id,user_id' }
    )
    .select('id')
    .single();

  if (attemptError || !attempt) {
    console.error('Failed to upsert daily challenge attempt:', attemptError);
    return;
  }

  const { error: deleteError } = await supabase
    .from('daily_challenge_answers')
    .delete()
    .eq('attempt_id', attempt.id);

  if (deleteError) {
    console.error('Failed to clear existing daily challenge answers:', deleteError);
  }

  const answers = payload.history.map((entry, index) => ({
    attempt_id: attempt.id,
    question_id: payload.cases[index]?.id,
    order_index: index + 1,
    selected_answer: entry.selectedAnswer ?? null,
    is_correct: entry.correct,
    time_taken_ms: Math.round(entry.timeTaken * 1000),
  })).filter((entry) => entry.question_id);

  if (answers.length === 0) {
    return;
  }

  const { error: answersError } = await supabase
    .from('daily_challenge_answers')
    .insert(answers);

  if (answersError) {
    console.error('Failed to insert daily challenge answers:', answersError);
  }
};

export const submitSoloRunToBackend = async (payload: {
  identity: LocalPlayerIdentity;
  history: RoundResult[];
  endedReason: 'wrong_answer' | 'timeout' | 'manual_exit' | 'completed';
}): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return;
  }

  const userId = await ensureBackendPlayerProfile(payload.identity);
  if (!userId) {
    return;
  }

  const totalAnswered = payload.history.length;
  const correctCount = payload.history.filter((entry) => entry.correct).length;
  const totalTimeMs = payload.history.reduce((sum, entry) => sum + Math.round(entry.timeTaken * 1000), 0);

  const { data: run, error } = await supabase
    .from('solo_runs')
    .insert([
      {
        user_id: userId,
        status: 'completed',
        streak_count: correctCount,
        correct_count: correctCount,
        total_answered: totalAnswered,
        total_time_ms: totalTimeMs,
        ended_reason: payload.endedReason,
        ended_at: new Date().toISOString(),
      },
    ])
    .select('id')
    .single();

  if (error || !run) {
    console.error('Failed to insert solo run:', error);
    return;
  }

  const answers = payload.history.map((entry, index) => ({
    run_id: run.id,
    question_id: entry.questionId,
    sequence_no: index + 1,
    selected_answer: entry.selectedAnswer ?? null,
    is_correct: entry.correct,
    time_taken_ms: Math.round(entry.timeTaken * 1000),
  }));

  const { error: answersError } = await supabase
    .from('solo_run_answers')
    .insert(answers);

  if (answersError) {
    console.error('Failed to insert solo run answers:', answersError);
  }
};

export const fetchWrongQuestionsFromBackend = async (
  identity: LocalPlayerIdentity
): Promise<WrongQuestionEntry[] | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const userId = await ensureBackendPlayerProfile(identity);
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from('v_wrong_questions')
    .select(`
      answer_id,
      mode,
      question_id,
      category: specialty,
      description,
      options,
      correct_answer,
      selected_answer,
      explanation,
      difficulty,
      image_url,
      source_name,
      source_url,
      review_status,
      reviewer_name,
      updated_at,
      created_at
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Failed to fetch wrong questions:', error);
    return null;
  }

  return (data ?? []).map((entry: any) => ({
    id: entry.answer_id,
    mode: entry.mode,
    questionId: entry.question_id,
    category: `${entry.specialty} · ${entry.modality}`,
    specialty: entry.specialty,
    modality: entry.modality,
    description: entry.description,
    options: entry.options,
    correctAnswer: entry.correct_answer,
    selectedAnswer: entry.selected_answer,
    explanation: entry.explanation,
    difficulty: entry.difficulty === 'hard' ? 'Hard' : entry.difficulty === 'medium' ? 'Medium' : 'Easy',
    imageUrl: entry.image_url,
    sourceName: entry.source_name,
    sourceUrl: entry.source_url,
    reviewStatus: entry.review_status,
    reviewerName: entry.reviewer_name,
    updatedAt: entry.updated_at,
    createdAt: entry.created_at,
  }));
};
