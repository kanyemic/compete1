
export enum GameMode {
  SOLO_STREAK = 'SOLO_STREAK',
  PVP_BATTLE = 'PVP_BATTLE',
}

export enum GameState {
  MENU = 'MENU',
  MATCHMAKING = 'MATCHMAKING',
  LOADING_ROUND = 'LOADING_ROUND',
  PLAYING = 'PLAYING',
  ROUND_RESULT = 'ROUND_RESULT',
  GAME_OVER = 'GAME_OVER',
  LEADERBOARD = 'LEADERBOARD',
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
