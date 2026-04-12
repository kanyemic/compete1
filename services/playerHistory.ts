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
  const activeDays = new Set(history.map((entry) => toDateKey(entry.completedAt)));
  const today = new Date();
  const result: ActivityDay[] = [];

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);

    result.push({
      dateKey: toDateKey(date),
      label: date.toLocaleDateString('zh-CN', { weekday: 'short' }),
      active: activeDays.has(toDateKey(date)),
    });
  }

  return result;
};

export const getLatestTrainingRecord = (
  history: TrainingHistoryEntry[]
): TrainingHistoryEntry | null => history[0] ?? null;
