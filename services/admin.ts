import {
  AdminAnalyticsSummary,
  AdminChallengePreview,
  AdminQuestionSummary,
  AdminSnapshot,
  QuestionCase,
  ReviewStatus,
} from '../types';
import { fetchDailyChallengeCasesFromBackend } from './backend';
import { getAnalyticsEvents } from './analytics';
import { getTodayChallengeDateKey, getTodayChallengeRecord } from './dailyChallenge';
import { getMockQuestionCases } from './mockData';
import { getSupabaseClient } from './supabase';

const ADMIN_QUESTION_OVERRIDES_KEY = 'medscan.adminQuestionOverrides';
const ADMIN_DAILY_CHALLENGE_KEY = 'medscan.adminDailyChallengeConfig';

type QuestionOverride = Partial<Pick<
  QuestionCase,
  'specialty' | 'modality' | 'description' | 'difficulty' | 'sourceName' | 'sourceUrl' | 'reviewStatus' | 'reviewerName' | 'updatedAt'
>> & {
  isActive?: boolean;
};

type DailyChallengeOverride = {
  dateKey: string;
  questionIds: string[];
};

interface BackendQuestionAdminRow {
  id: string;
  specialty: string;
  modality: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  source_name: string | null;
  source_url: string | null;
  review_status: ReviewStatus;
  reviewer_name: string | null;
  updated_at: string | null;
  is_active: boolean;
}

const difficultyMap: Record<BackendQuestionAdminRow['difficulty'], QuestionCase['difficulty']> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Failed to parse local storage key ${key}:`, error);
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const readQuestionOverrides = (): Record<string, QuestionOverride> =>
  readJson<Record<string, QuestionOverride>>(ADMIN_QUESTION_OVERRIDES_KEY, {});

const writeQuestionOverrides = (value: Record<string, QuestionOverride>) => {
  writeJson(ADMIN_QUESTION_OVERRIDES_KEY, value);
};

const readDailyChallengeOverride = (): DailyChallengeOverride | null =>
  readJson<DailyChallengeOverride | null>(ADMIN_DAILY_CHALLENGE_KEY, null);

const writeDailyChallengeOverride = (value: DailyChallengeOverride) => {
  writeJson(ADMIN_DAILY_CHALLENGE_KEY, value);
};

const clearDailyChallengeOverride = () => {
  localStorage.removeItem(ADMIN_DAILY_CHALLENGE_KEY);
};

const applyQuestionOverride = (question: QuestionCase): QuestionCase & { isActive: boolean } => {
  const override = readQuestionOverrides()[question.id];

  return {
    ...question,
    ...override,
    updatedAt: override?.updatedAt ?? question.updatedAt ?? null,
    isActive: override?.isActive ?? true,
  };
};

const mapQuestionSummary = (question: QuestionCase & { isActive: boolean }): AdminQuestionSummary => ({
  id: question.id,
  specialty: question.specialty ?? '未分类',
  modality: question.modality ?? '待补充',
  category: question.category,
  description: question.description,
  difficulty: question.difficulty,
  reviewStatus: question.reviewStatus ?? 'draft',
  sourceName: question.sourceName ?? null,
  sourceUrl: question.sourceUrl ?? null,
  reviewerName: question.reviewerName ?? null,
  updatedAt: question.updatedAt ?? null,
  isActive: question.isActive,
});

const sortBreakdown = (items: Array<{ label: string; count: number }>) =>
  items.sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, 'zh-CN'));

const buildWindowLabel = (windowDays: number, source: 'local' | 'supabase') => {
  const baseLabel = windowDays <= 1
    ? '最近 24 小时'
    : `最近 ${windowDays} 天`;

  return source === 'supabase'
    ? `${baseLabel}（云端样本）`
    : `${baseLabel}（当前设备）`;
};

const buildWindowStartIso = (windowDays: number) => {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - Math.max(windowDays - 1, 0));
  return startDate.toISOString();
};

const buildReviewBreakdown = (questions: AdminQuestionSummary[]) => {
  const statusOrder: ReviewStatus[] = ['approved', 'reviewing', 'draft', 'archived'];
  return statusOrder.map((status) => ({
    status,
    count: questions.filter((question) => question.reviewStatus === status).length,
  }));
};

const buildSpecialtyBreakdown = (questions: AdminQuestionSummary[]) => {
  const bucket = new Map<string, number>();
  questions.forEach((question) => {
    bucket.set(question.specialty, (bucket.get(question.specialty) ?? 0) + 1);
  });

  return sortBreakdown(
    Array.from(bucket.entries()).map(([label, count]) => ({ label, count }))
  ).slice(0, 6);
};

interface BackendAnalyticsEventRow {
  id: string;
  user_id: string | null;
  event_name: string;
  payload: Record<string, unknown> | null;
  client_created_at: string;
  created_at: string;
}

interface BackendDailyChallengeAttemptRow {
  status: 'in_progress' | 'completed' | 'abandoned';
  score: number;
}

interface AnalyticsDatasetEvent {
  id: string;
  name: string;
  payload: Record<string, unknown>;
  createdAt: string;
  syncedAt: string | null;
  identityId: string | null;
}

const modeLabelMap: Record<string, string> = {
  DAILY_CHALLENGE: '每日挑战',
  SOLO_STREAK: '单人连胜',
  PVP_BATTLE: '排位对战',
  REVIEW_PRACTICE: '错题复练',
};

const buildAnalyticsSummary = (payload: {
  source: 'local' | 'supabase';
  events: AnalyticsDatasetEvent[];
  totalEvents: number;
  syncedEvents: number;
  pendingLocalEvents: number;
  windowLabel: string;
}): AdminAnalyticsSummary => {
  const bucket = new Map<string, number>();
  const uniqueUsers = new Set<string>();
  const countByName = new Map<string, number>();

  payload.events.forEach((event) => {
    bucket.set(event.name, (bucket.get(event.name) ?? 0) + 1);
    countByName.set(event.name, (countByName.get(event.name) ?? 0) + 1);
    if (event.identityId) {
      uniqueUsers.add(event.identityId);
    }
  });

  const topEvents = Array.from(bucket.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, 'zh-CN'))
    .slice(0, 6);

  const modeBreakdown = Object.entries(modeLabelMap)
    .map(([mode, label]) => ({
      label,
      started: payload.events.filter((event) => event.name === 'session_started' && event.payload.mode === mode).length,
      completed: payload.events.filter((event) => event.name === 'session_completed' && event.payload.mode === mode).length,
    }))
    .filter((entry) => entry.started > 0 || entry.completed > 0);

  return {
    source: payload.source,
    windowLabel: payload.windowLabel,
    totalEvents: payload.totalEvents,
    syncedEvents: payload.syncedEvents,
    pendingLocalEvents: payload.pendingLocalEvents,
    uniqueUsers: uniqueUsers.size,
    latestEventAt: payload.events[0]?.createdAt ?? null,
    funnel: [
      { label: '首页曝光', count: countByName.get('home_exposed') ?? 0 },
      { label: '玩法点击', count: countByName.get('home_mode_clicked') ?? 0 },
      { label: '开始对局', count: countByName.get('session_started') ?? 0 },
      { label: '完成对局', count: countByName.get('session_completed') ?? 0 },
      { label: '查看榜单', count: countByName.get('leaderboard_opened') ?? 0 },
    ],
    modeBreakdown,
    topEvents,
    recentEvents: payload.events.slice(0, 12).map((event) => ({
      id: event.id,
      name: event.name,
      createdAt: event.createdAt,
      syncedAt: event.syncedAt,
    })),
  };
};

const fetchAdminAnalyticsSummary = async (windowDays: number): Promise<AdminAnalyticsSummary> => {
  const supabase = getSupabaseClient();
  const windowStartIso = buildWindowStartIso(windowDays);
  const localEvents = getAnalyticsEvents().filter((event) => event.createdAt >= windowStartIso);
  const localSummary = buildAnalyticsSummary({
    source: 'local',
    events: localEvents.map((event) => ({
      id: event.id,
      name: event.name,
      payload: event.payload,
      createdAt: event.createdAt,
      syncedAt: event.syncedAt ?? null,
      identityId: event.identityId ?? null,
    })),
    totalEvents: localEvents.length,
    syncedEvents: localEvents.filter((event) => event.syncedAt).length,
    pendingLocalEvents: localEvents.filter((event) => !event.syncedAt).length,
    windowLabel: buildWindowLabel(windowDays, 'local'),
  });

  if (!supabase) {
    return localSummary;
  }

  const [countRes, recentRes] = await Promise.all([
    supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .gte('client_created_at', windowStartIso),
    supabase
      .from('analytics_events')
      .select('id, user_id, event_name, payload, client_created_at, created_at')
      .gte('client_created_at', windowStartIso)
      .order('client_created_at', { ascending: false })
      .limit(500),
  ]);

  if (countRes.error) {
    console.error('Failed to fetch analytics event count:', countRes.error);
    return localSummary;
  }

  if (recentRes.error) {
    console.error('Failed to fetch recent analytics events:', recentRes.error);
    return localSummary;
  }

  const recentEvents = ((recentRes.data as BackendAnalyticsEventRow[] | null) ?? []).map((event) => ({
    id: event.id,
    name: event.event_name,
    payload: event.payload ?? {},
    createdAt: event.client_created_at ?? event.created_at,
    syncedAt: event.created_at,
    identityId: event.user_id,
  }));

  return buildAnalyticsSummary({
    source: 'supabase',
    events: recentEvents,
    totalEvents: (countRes.count ?? recentEvents.length) + localSummary.pendingLocalEvents,
    syncedEvents: countRes.count ?? recentEvents.length,
    pendingLocalEvents: localSummary.pendingLocalEvents,
    windowLabel: buildWindowLabel(windowDays, 'supabase'),
  });
};

const buildChallengePreview = (
  dateKey: string,
  cases: QuestionCase[],
  metrics?: Pick<AdminChallengePreview, 'attemptCount' | 'completedCount' | 'averageScore' | 'bestScore'>
): AdminChallengePreview => ({
  dateKey,
  title: `${dateKey} 每日挑战`,
  questionCount: cases.length,
  attemptCount: metrics?.attemptCount ?? 0,
  completedCount: metrics?.completedCount ?? 0,
  averageScore: metrics?.averageScore ?? null,
  bestScore: metrics?.bestScore ?? null,
  cases: cases.map((entry) => ({
    id: entry.id,
    category: entry.category,
    specialty: entry.specialty,
    modality: entry.modality,
    difficulty: entry.difficulty,
  })),
});

const fetchAdminChallengeMetrics = async (
  dateKey: string
): Promise<Pick<AdminChallengePreview, 'attemptCount' | 'completedCount' | 'averageScore' | 'bestScore'>> => {
  const supabase = getSupabaseClient();

  if (!supabase) {
    const localRecord = getTodayChallengeRecord();
    if (!localRecord || localRecord.date !== dateKey) {
      return {
        attemptCount: 0,
        completedCount: 0,
        averageScore: null,
        bestScore: null,
      };
    }

    return {
      attemptCount: 1,
      completedCount: 1,
      averageScore: localRecord.score,
      bestScore: localRecord.score,
    };
  }

  const { data: challenge, error: challengeError } = await supabase
    .from('daily_challenges')
    .select('id')
    .eq('challenge_date', dateKey)
    .eq('status', 'published')
    .limit(1)
    .maybeSingle();

  if (challengeError) {
    console.error('Failed to fetch admin challenge metrics:', challengeError);
    return {
      attemptCount: 0,
      completedCount: 0,
      averageScore: null,
      bestScore: null,
    };
  }

  if (!challenge?.id) {
    return {
      attemptCount: 0,
      completedCount: 0,
      averageScore: null,
      bestScore: null,
    };
  }

  const { data: attempts, error: attemptsError } = await supabase
    .from('daily_challenge_attempts')
    .select('status, score')
    .eq('challenge_id', challenge.id);

  if (attemptsError) {
    console.error('Failed to fetch challenge attempts for admin:', attemptsError);
    return {
      attemptCount: 0,
      completedCount: 0,
      averageScore: null,
      bestScore: null,
    };
  }

  const rows = (attempts as BackendDailyChallengeAttemptRow[] | null) ?? [];
  const completedRows = rows.filter((entry) => entry.status === 'completed');
  const totalScore = completedRows.reduce((sum, entry) => sum + (entry.score ?? 0), 0);

  return {
    attemptCount: rows.length,
    completedCount: completedRows.length,
    averageScore: completedRows.length > 0 ? Math.round(totalScore / completedRows.length) : null,
    bestScore: completedRows.reduce((max, entry) => Math.max(max, entry.score ?? 0), 0) || null,
  };
};

export const getAdminQuestionCatalog = async (): Promise<Array<QuestionCase & { isActive: boolean }>> => {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return getMockQuestionCases().map(applyQuestionOverride);
  }

  const { data, error } = await supabase
    .from('question_cases')
    .select('id, specialty, modality, difficulty, description, correct_answer, options, explanation, image_url, source_name, source_url, review_status, reviewer_name, updated_at, is_active')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch admin question catalog:', error);
    return getMockQuestionCases().map(applyQuestionOverride);
  }

  return ((data as BackendQuestionAdminRow[]) ?? []).map((row) => ({
    id: row.id,
    category: `${row.specialty} · ${row.modality}`,
    specialty: row.specialty,
    modality: row.modality,
    description: row.description,
    correctAnswer: '',
    options: [],
    explanation: '',
    difficulty: difficultyMap[row.difficulty],
    imageUrl: '',
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    reviewStatus: row.review_status,
    reviewerName: row.reviewer_name,
    updatedAt: row.updated_at,
    isActive: row.is_active,
  }));
};

export const getAdminQuestionSummaries = async (): Promise<AdminQuestionSummary[]> => {
  const catalog = await getAdminQuestionCatalog();
  return catalog.map(mapQuestionSummary);
};

const buildDailyChallengeFromOverride = async (dateKey: string): Promise<QuestionCase[] | null> => {
  const override = readDailyChallengeOverride();
  if (!override || override.dateKey !== dateKey) {
    return null;
  }

  const catalog = await getAdminQuestionCatalog();
  const caseMap = new Map(catalog.map((entry) => [entry.id, entry]));
  const cases = override.questionIds
    .map((questionId) => caseMap.get(questionId))
    .filter((entry): entry is QuestionCase & { isActive: boolean } => Boolean(entry))
    .map(({ isActive, ...question }) => question);

  return cases.length > 0 ? cases : null;
};

export const getAdminDailyChallengeCases = async (dateKey: string): Promise<QuestionCase[] | null> => {
  const supabase = getSupabaseClient();

  if (!supabase) {
    const overrideCases = await buildDailyChallengeFromOverride(dateKey);
    if (overrideCases) {
      return overrideCases;
    }
  }

  const backendCases = await fetchDailyChallengeCasesFromBackend(dateKey, 5);
  if (backendCases && backendCases.length > 0) {
    return backendCases;
  }

  const catalog = (await getAdminQuestionCatalog())
    .filter((entry) => entry.isActive && entry.reviewStatus === 'approved')
    .map(({ isActive, ...question }) => question);

  return catalog.slice(0, 5);
};

export const fetchAdminSnapshot = async (payload?: {
  challengeDateKey?: string;
  analyticsWindowDays?: number;
}): Promise<AdminSnapshot> => {
  const dateKey = payload?.challengeDateKey ?? getTodayChallengeDateKey();
  const analyticsWindowDays = payload?.analyticsWindowDays ?? 7;
  const [questions, todayChallengeCases, analytics, challengeMetrics] = await Promise.all([
    getAdminQuestionSummaries(),
    getAdminDailyChallengeCases(dateKey),
    fetchAdminAnalyticsSummary(analyticsWindowDays),
    fetchAdminChallengeMetrics(dateKey),
  ]);

  return {
    questionCount: questions.length,
    activeQuestionCount: questions.filter((question) => question.isActive).length,
    reviewBreakdown: buildReviewBreakdown(questions),
    specialtyBreakdown: buildSpecialtyBreakdown(questions),
    recentQuestions: questions.slice(0, 12),
    todayChallenge: buildChallengePreview(dateKey, todayChallengeCases ?? [], challengeMetrics),
    analytics,
  };
};

export const saveAdminQuestion = async (
  questionId: string,
  patch: {
    reviewStatus: ReviewStatus;
    reviewerName: string;
    sourceName: string;
    sourceUrl: string;
    isActive: boolean;
  }
): Promise<{ success: boolean; message: string }> => {
  const supabase = getSupabaseClient();
  const updatedAt = new Date().toISOString();

  if (!supabase) {
    const current = readQuestionOverrides();
    current[questionId] = {
      ...current[questionId],
      reviewStatus: patch.reviewStatus,
      reviewerName: patch.reviewerName || null,
      sourceName: patch.sourceName || null,
      sourceUrl: patch.sourceUrl || null,
      isActive: patch.isActive,
      updatedAt,
    };
    writeQuestionOverrides(current);

    return {
      success: true,
      message: '已保存到本地后台配置。',
    };
  }

  const { error } = await supabase
    .from('question_cases')
    .update({
      review_status: patch.reviewStatus,
      reviewer_name: patch.reviewerName || null,
      source_name: patch.sourceName || null,
      source_url: patch.sourceUrl || null,
      is_active: patch.isActive,
      updated_at: updatedAt,
    })
    .eq('id', questionId);

  if (error) {
    console.error('Failed to save admin question:', error);
    return {
      success: false,
      message: '保存题目失败，请稍后重试。',
    };
  }

  return {
    success: true,
    message: '题目配置已更新。',
  };
};

export const saveAdminQuestionBatch = async (
  questionIds: string[],
  patch: {
    reviewStatus?: ReviewStatus;
    isActive?: boolean;
    reviewerName?: string | null;
  }
): Promise<{ success: boolean; message: string }> => {
  if (questionIds.length === 0) {
    return {
      success: false,
      message: '请先选择至少 1 道题。',
    };
  }

  if (patch.reviewStatus === undefined && patch.isActive === undefined && patch.reviewerName === undefined) {
    return {
      success: false,
      message: '请先选择要批量执行的操作。',
    };
  }

  const supabase = getSupabaseClient();
  const updatedAt = new Date().toISOString();

  if (!supabase) {
    const current = readQuestionOverrides();
    questionIds.forEach((questionId) => {
      current[questionId] = {
        ...current[questionId],
        ...(patch.reviewStatus !== undefined ? { reviewStatus: patch.reviewStatus } : {}),
        ...(patch.isActive !== undefined ? { isActive: patch.isActive } : {}),
        ...(patch.reviewerName !== undefined ? { reviewerName: patch.reviewerName } : {}),
        updatedAt,
      };
    });
    writeQuestionOverrides(current);

    return {
      success: true,
      message: `已批量更新 ${questionIds.length} 道题。`,
    };
  }

  const { error } = await supabase
    .from('question_cases')
    .update({
      ...(patch.reviewStatus !== undefined ? { review_status: patch.reviewStatus } : {}),
      ...(patch.isActive !== undefined ? { is_active: patch.isActive } : {}),
      ...(patch.reviewerName !== undefined ? { reviewer_name: patch.reviewerName } : {}),
      updated_at: updatedAt,
    })
    .in('id', questionIds);

  if (error) {
    console.error('Failed to batch save admin questions:', error);
    return {
      success: false,
      message: '批量更新失败，请稍后重试。',
    };
  }

  return {
    success: true,
    message: `已批量更新 ${questionIds.length} 道题。`,
  };
};

export const saveAdminDailyChallengeConfig = async (
  dateKey: string,
  questionIds: string[]
): Promise<{ success: boolean; message: string }> => {
  if (questionIds.length === 0) {
    return {
      success: false,
      message: '请至少选择 1 道题。',
    };
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    writeDailyChallengeOverride({ dateKey, questionIds });
    return {
      success: true,
      message: '已保存到本地每日挑战配置。',
    };
  }

  const { data: challenge, error: challengeError } = await supabase
    .from('daily_challenges')
    .upsert(
      [{
        challenge_date: dateKey,
        title: `${dateKey} 每日挑战`,
        status: 'published',
      }],
      { onConflict: 'challenge_date' }
    )
    .select('id')
    .single();

  if (challengeError || !challenge) {
    console.error('Failed to upsert admin daily challenge:', challengeError);
    return {
      success: false,
      message: '保存每日挑战失败，请稍后重试。',
    };
  }

  const { error: deleteError } = await supabase
    .from('daily_challenge_questions')
    .delete()
    .eq('challenge_id', challenge.id);

  if (deleteError) {
    console.error('Failed to clear challenge questions:', deleteError);
  }

  const { error: insertError } = await supabase
    .from('daily_challenge_questions')
    .insert(questionIds.map((questionId, index) => ({
      challenge_id: challenge.id,
      question_id: questionId,
      order_index: index + 1,
      points: 1000,
    })));

  if (insertError) {
    console.error('Failed to insert challenge questions:', insertError);
    return {
      success: false,
      message: '题组保存失败，请检查题目是否可用。',
    };
  }

  clearDailyChallengeOverride();

  return {
    success: true,
    message: '今日挑战题组已发布。',
  };
};
