
export enum GameMode {
  SOLO_STREAK = 'SOLO_STREAK',
  PVP_BATTLE = 'PVP_BATTLE',
  DAILY_CHALLENGE = 'DAILY_CHALLENGE',
  REVIEW_PRACTICE = 'REVIEW_PRACTICE',
}

export enum GameState {
  MENU = 'MENU',
  MATCHMAKING = 'MATCHMAKING',
  LOADING_ROUND = 'LOADING_ROUND',
  PLAYING = 'PLAYING',
  ROUND_RESULT = 'ROUND_RESULT',
  GAME_OVER = 'GAME_OVER',
  LEADERBOARD = 'LEADERBOARD',
  WRONG_QUESTIONS = 'WRONG_QUESTIONS',
  PROFILE = 'PROFILE',
  ADMIN = 'ADMIN',
}

export type ReviewStatus = 'draft' | 'reviewing' | 'approved' | 'archived';

export interface QuestionCase {
  id: string;
  category: string;
  specialty?: string;
  modality?: string;
  description: string;
  correctAnswer: string;
  options: string[];
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  imageUrl: string;
  sourceName?: string | null;
  sourceUrl?: string | null;
  reviewStatus?: ReviewStatus;
  reviewerName?: string | null;
  updatedAt?: string | null;
}

export interface PlayerProfile {
  name: string;
  avatar: string; // Emoji or URL
  rating: number; // ELO-like rating
}

export interface RoundResult {
  questionId: string;
  correct: boolean;
  timeTaken: number;
  score: number;
  selectedAnswer?: string | null;
}

export interface BattleState {
  round: number;
  totalRounds: number;
  playerScore: number;
  opponentScore: number;
  opponent: PlayerProfile;
  history: { player: RoundResult; opponent: RoundResult }[];
}

export interface BotBehavior {
  reactionTimeMin: number;
  reactionTimeMax: number;
  accuracy: number; // 0-1
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  score: number;
  trend: 'up' | 'down' | 'same';
  totalTimeMs?: number | null;
}

export type LeaderboardType = 'rating' | 'streak';

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  currentUserEntry: LeaderboardEntry | null;
  totalPlayers: number;
  topScore: number | null;
  chaseMessage: string | null;
  stabilityMessage: string | null;
}

export interface DailyChallengeRecord {
  date: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  completedAt: string;
  totalTimeMs?: number;
}

export interface WrongQuestionEntry {
  id: string;
  mode: 'solo_streak' | 'daily_challenge' | 'review_practice';
  questionId: string;
  category: string;
  specialty?: string;
  modality?: string;
  description: string;
  options: string[];
  correctAnswer: string;
  selectedAnswer: string | null;
  explanation: string;
  difficulty: QuestionCase['difficulty'];
  imageUrl: string;
  sourceName?: string | null;
  sourceUrl?: string | null;
  reviewStatus?: ReviewStatus;
  reviewerName?: string | null;
  updatedAt?: string | null;
  createdAt: string;
}

export interface TrainingHistoryEntry {
  id: string;
  mode: 'solo_streak' | 'daily_challenge';
  score: number;
  correctCount: number;
  totalQuestions: number;
  completedAt: string;
}

export interface ActivityDay {
  dateKey: string;
  label: string;
  active: boolean;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface RankSnapshot {
  rank: number | null;
  totalPlayers: number;
  topScore: number | null;
  gapToTop: number | null;
}

export interface ProfileSummary {
  displayName: string;
  avatar: string;
  bestSoloStreak: number;
  totalSoloRuns: number;
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  correctRate: number;
  wrongQuestionCount: number;
  dailyChallengesCompleted: number;
  bestDailyChallengeScore: number;
  latestDailyChallengeScore: number | null;
  lastPlayedAt: string | null;
  dailyChallengeRank: RankSnapshot;
  soloStreakRank: RankSnapshot;
  recentRecords: TrainingHistoryEntry[];
  weeklyActivity: ActivityDay[];
  yearlyActivity: ActivityDay[];
  lifetimeActivity: ActivityDay[];
}

export interface AdminQuestionSummary {
  id: string;
  specialty: string;
  modality: string;
  category: string;
  description: string;
  difficulty: QuestionCase['difficulty'];
  reviewStatus: ReviewStatus;
  sourceName: string | null;
  sourceUrl: string | null;
  reviewerName: string | null;
  updatedAt: string | null;
  isActive: boolean;
}

export interface AdminChallengePreview {
  dateKey: string;
  title: string;
  questionCount: number;
  attemptCount: number;
  completedCount: number;
  averageScore: number | null;
  bestScore: number | null;
  cases: Array<Pick<QuestionCase, 'id' | 'category' | 'specialty' | 'modality' | 'difficulty'>>;
}

export interface AdminAnalyticsSummary {
  source: 'local' | 'supabase';
  windowLabel: string;
  totalEvents: number;
  syncedEvents: number;
  pendingLocalEvents: number;
  uniqueUsers: number;
  latestEventAt: string | null;
  funnel: Array<{
    label: string;
    count: number;
  }>;
  modeBreakdown: Array<{
    label: string;
    started: number;
    completed: number;
  }>;
  topEvents: Array<{
    name: string;
    count: number;
  }>;
  recentEvents: Array<{
    id: string;
    name: string;
    createdAt: string;
    syncedAt?: string | null;
  }>;
}

export interface AdminSnapshot {
  questionCount: number;
  activeQuestionCount: number;
  reviewBreakdown: Array<{
    status: ReviewStatus;
    count: number;
  }>;
  specialtyBreakdown: Array<{
    label: string;
    count: number;
  }>;
  recentQuestions: AdminQuestionSummary[];
  todayChallenge: AdminChallengePreview;
  analytics: AdminAnalyticsSummary;
}
