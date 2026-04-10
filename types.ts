
export enum GameMode {
  SOLO_STREAK = 'SOLO_STREAK',
  PVP_BATTLE = 'PVP_BATTLE',
  DAILY_CHALLENGE = 'DAILY_CHALLENGE',
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
}

export interface QuestionCase {
  id: string;
  category: string;
  description: string;
  correctAnswer: string;
  options: string[];
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  imageUrl: string;
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
}

export interface DailyChallengeRecord {
  date: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  completedAt: string;
}

export interface WrongQuestionEntry {
  id: string;
  mode: 'solo_streak' | 'daily_challenge';
  questionId: string;
  category: string;
  description: string;
  options: string[];
  correctAnswer: string;
  selectedAnswer: string | null;
  explanation: string;
  difficulty: QuestionCase['difficulty'];
  imageUrl: string;
  createdAt: string;
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
}
