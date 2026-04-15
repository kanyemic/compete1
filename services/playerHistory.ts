import { ActivityDay, TrainingHistoryEntry } from '../types';

const TRAINING_HISTORY_STORAGE_KEY = 'medscan.trainingHistory';
const MAX_HISTORY_ENTRIES = 50;

const pad = (value: number): string => String(value).padStart(2, '0');

export const toDateKey = (value: string | Date): string => {
  const parsed = value instanceof Date ? value : new Date(value);
  const year = parsed.getFullYear();
  const month = pad(parsed.getMonth() + 1);
  const day = pad(parsed.getDate());

  return `${year}-${month}-${day}`;
};

export const getLocalTrainingHistory = (): TrainingHistoryEntry[] => {
  try {
    const raw = localStorage.getItem(TRAINING_HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as TrainingHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse local training history:', error);
    return [];
  }
};

export const saveTrainingHistoryEntry = (
  entry: Omit<TrainingHistoryEntry, 'id' | 'completedAt'>
): TrainingHistoryEntry[] => {
  const nextEntry: TrainingHistoryEntry = {
    id: crypto.randomUUID(),
    completedAt: new Date().toISOString(),
    ...entry,
  };

  const current = getLocalTrainingHistory();
  const next = [nextEntry, ...current].slice(0, MAX_HISTORY_ENTRIES);
  localStorage.setItem(TRAINING_HISTORY_STORAGE_KEY, JSON.stringify(next));
  return next;
};

export const buildWeeklyActivity = (
  history: TrainingHistoryEntry[],
  days: number = 7
): ActivityDay[] => {
  const dailyCounts = history.reduce<Map<string, number>>((accumulator, entry) => {
    const dateKey = toDateKey(entry.completedAt);
    accumulator.set(dateKey, (accumulator.get(dateKey) ?? 0) + 1);
    return accumulator;
  }, new Map());
  const today = new Date();
  const result: ActivityDay[] = [];

  const resolveLevel = (count: number): ActivityDay['level'] => {
    if (count <= 0) {
      return 0;
    }
    if (count === 1) {
      return 1;
    }
    if (count === 2) {
      return 2;
    }
    if (count <= 4) {
      return 3;
    }
    return 4;
  };

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    const dateKey = toDateKey(date);
    const count = dailyCounts.get(dateKey) ?? 0;

    result.push({
      dateKey,
      label: date.toLocaleDateString('zh-CN', { weekday: 'short' }),
      active: count > 0,
      count,
      level: resolveLevel(count),
    });
  }

  return result;
};

export const buildContributionActivity = (
  history: TrainingHistoryEntry[],
  days: number | 'all' = 365
): ActivityDay[] => {
  if (days === 'all') {
    if (history.length === 0) {
      return buildWeeklyActivity(history, 30);
    }

    const today = new Date();
    const earliestEntry = history.reduce((earliest, entry) => {
      const current = new Date(entry.completedAt);
      return current.getTime() < earliest.getTime() ? current : earliest;
    }, new Date(history[0].completedAt));

    const diffMs = today.getTime() - earliestEntry.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

    return buildWeeklyActivity(history, Math.max(diffDays, 30));
  }

  return buildWeeklyActivity(history, days);
};

export const getLatestTrainingRecord = (
  history: TrainingHistoryEntry[]
): TrainingHistoryEntry | null => history[0] ?? null;
