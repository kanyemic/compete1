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
import { getTodayChallengeDateKey } from './dailyChallenge';
import { MOCK_CASE_DATABASE } from './mockData';
import { getSupabaseClient } from './supabase';

interface BackendQuestionAdminRow {
  id: string;
  specialty: string;
  modality: string;
  difficulty: 'easy' | 'medium' | 'hard';
  review_status: ReviewStatus;
  source_name: string | null;
  reviewer_name: string | null;
  updated_at: string | null;
  is_active: boolean;
}

const difficultyMap: Record<BackendQuestionAdminRow['difficulty'], QuestionCase['difficulty']> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const mapQuestionSummary = (
  row: BackendQuestionAdminRow | (Omit<QuestionCase, 'id'> & { id: string; is_active?: boolean })
): AdminQuestionSummary => {
  const isBackendRow = 'review_status' in row;

  return {
    id: row.id,
    specialty: row.specialty ?? '未分类',
    modality: row.modality ?? '待补充',
    difficulty: isBackendRow ? difficultyMap[row.difficulty] : row.difficulty,
    reviewStatus: isBackendRow ? row.review_status : row.reviewStatus ?? 'draft',
    sourceName: isBackendRow ? row.source_name : row.sourceName ?? null,
    reviewerName: isBackendRow ? row.reviewer_name : row.reviewerName ?? null,
    updatedAt: isBackendRow ? row.updated_at : row.updatedAt ?? null,
    isActive: isBackendRow ? row.is_active : row.is_active ?? true,
  };
};

const sortBreakdown = (items: Array<{ label: string; count: number }>) =>
  items.sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, 'zh-CN'));

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

const buildAnalyticsSummary = (): AdminAnalyticsSummary => {
  const events = getAnalyticsEvents();
  const bucket = new Map<string, number>();

  events.forEach((event) => {
    bucket.set(event.name, (bucket.get(event.name) ?? 0) + 1);
  });

  const topEvents = Array.from(bucket.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, 'zh-CN'))
    .slice(0, 6);

  return {
    totalEvents: events.length,
    syncedEvents: events.filter((event) => event.syncedAt).length,
    latestEventAt: events[0]?.createdAt ?? null,
    topEvents,
    recentEvents: events.slice(0, 12).map((event) => ({
      id: event.id,
      name: event.name,
      createdAt: event.createdAt,
      syncedAt: event.syncedAt ?? null,
    })),
  };
};

const buildChallengePreview = (dateKey: string, cases: QuestionCase[]): AdminChallengePreview => ({
  dateKey,
  title: `${dateKey} 每日挑战`,
  questionCount: cases.length,
  cases: cases.map((entry) => ({
    id: entry.id,
    category: entry.category,
    specialty: entry.specialty,
    modality: entry.modality,
    difficulty: entry.difficulty,
  })),
});

const buildMockQuestionSummaries = (): AdminQuestionSummary[] =>
  MOCK_CASE_DATABASE.map((entry, index) => mapQuestionSummary({
    ...entry,
    id: `mock-question-${index + 1}`,
    is_active: true,
  }));

const sortMockCasesBySeed = (seed: string): QuestionCase[] => {
  const seedValue = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return [...MOCK_CASE_DATABASE]
    .sort((left, right) => {
      const leftScore = Array.from(left.description).reduce((sum, char) => sum + char.charCodeAt(0), seedValue);
      const rightScore = Array.from(right.description).reduce((sum, char) => sum + char.charCodeAt(0), seedValue);
      return leftScore - rightScore;
    })
    .map((entry, index) => ({
      id: `${seed}-${index + 1}`,
      ...entry,
    }));
};

const fetchQuestionSummaries = async (): Promise<AdminQuestionSummary[]> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return buildMockQuestionSummaries();
  }

  const { data, error } = await supabase
    .from('question_cases')
    .select('id, specialty, modality, difficulty, review_status, source_name, reviewer_name, updated_at, is_active')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch admin question summaries:', error);
    return buildMockQuestionSummaries();
  }

  return ((data as BackendQuestionAdminRow[]) ?? []).map(mapQuestionSummary);
};

const fetchChallengePreview = async (dateKey: string): Promise<AdminChallengePreview> => {
  const backendCases = await fetchDailyChallengeCasesFromBackend(dateKey, 5);
  if (backendCases && backendCases.length > 0) {
    return buildChallengePreview(dateKey, backendCases);
  }

  return buildChallengePreview(dateKey, sortMockCasesBySeed(dateKey).slice(0, 5));
};

export const fetchAdminSnapshot = async (): Promise<AdminSnapshot> => {
  const dateKey = getTodayChallengeDateKey();
  const [questions, todayChallenge] = await Promise.all([
    fetchQuestionSummaries(),
    fetchChallengePreview(dateKey),
  ]);

  return {
    questionCount: questions.length,
    activeQuestionCount: questions.filter((question) => question.isActive).length,
    reviewBreakdown: buildReviewBreakdown(questions),
    specialtyBreakdown: buildSpecialtyBreakdown(questions),
    recentQuestions: questions.slice(0, 12),
    todayChallenge,
    analytics: buildAnalyticsSummary(),
  };
};
