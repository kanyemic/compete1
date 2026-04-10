export interface LocalPlayerStats {
  bestSoloStreak: number;
  totalSoloRuns: number;
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  lastPlayedAt: string | null;
}

const PLAYER_STATS_STORAGE_KEY = 'medscan.localPlayerStats';

const defaultStats = (): LocalPlayerStats => ({
  bestSoloStreak: 0,
  totalSoloRuns: 0,
  totalQuestionsAnswered: 0,
  totalCorrectAnswers: 0,
  lastPlayedAt: null,
});

export const getLocalPlayerStats = (): LocalPlayerStats => {
  try {
    const raw = localStorage.getItem(PLAYER_STATS_STORAGE_KEY);
    if (!raw) {
      return defaultStats();
    }

    return {
      ...defaultStats(),
      ...(JSON.parse(raw) as Partial<LocalPlayerStats>),
    };
  } catch (error) {
    console.error('Failed to parse local player stats:', error);
    return defaultStats();
  }
};

export const saveSoloRunToLocalStats = (payload: {
  streakCount: number;
  totalAnswered: number;
  correctAnswers: number;
}): LocalPlayerStats => {
  const current = getLocalPlayerStats();
  const next: LocalPlayerStats = {
    bestSoloStreak: Math.max(current.bestSoloStreak, payload.streakCount),
    totalSoloRuns: current.totalSoloRuns + 1,
    totalQuestionsAnswered: current.totalQuestionsAnswered + payload.totalAnswered,
    totalCorrectAnswers: current.totalCorrectAnswers + payload.correctAnswers,
    lastPlayedAt: new Date().toISOString(),
  };

  localStorage.setItem(PLAYER_STATS_STORAGE_KEY, JSON.stringify(next));
  return next;
};
