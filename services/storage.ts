import { GameMode } from '../types';

const BEST_STREAK_KEY = 'medscan_best_streak';
const BEST_RATING_KEY = 'medscan_best_rating';

const getNumberFromStorage = (key: string): number => {
  if (typeof localStorage === 'undefined') return 0;
  const value = localStorage.getItem(key);
  if (!value) return 0;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const saveNumberToStorage = (key: string, value: number) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, String(Math.max(0, Math.floor(value))));
};

export const getBestStreak = (): number => getNumberFromStorage(BEST_STREAK_KEY);
export const saveBestStreak = (streak: number) => saveNumberToStorage(BEST_STREAK_KEY, streak);

export const getBestRating = (): number => getNumberFromStorage(BEST_RATING_KEY);
export const saveBestRating = (rating: number) => saveNumberToStorage(BEST_RATING_KEY, rating);

export const updateRecordForMode = (mode: GameMode, score: number): number => {
  if (mode === GameMode.SOLO_STREAK) {
    const previous = getBestStreak();
    const next = Math.max(previous, score);
    if (next !== previous) saveBestStreak(next);
    return next;
  }

  const previous = getBestRating();
  const next = Math.max(previous, score);
  if (next !== previous) saveBestRating(next);
  return next;
};
