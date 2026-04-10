import { DailyChallengeRecord } from '../types';

const DAILY_CHALLENGE_STORAGE_KEY = 'medscan.dailyChallengeRecord';

const getTodayDateKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayChallengeDateKey = (): string => getTodayDateKey();

export const getTodayChallengeRecord = (): DailyChallengeRecord | null => {
  try {
    const raw = localStorage.getItem(DAILY_CHALLENGE_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as DailyChallengeRecord;
    if (parsed.date !== getTodayDateKey()) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('Failed to parse daily challenge record:', error);
    return null;
  }
};

export const saveTodayChallengeRecord = (record: Omit<DailyChallengeRecord, 'date'>): DailyChallengeRecord => {
  const current = getTodayChallengeRecord();
  if (
    current &&
    (current.score > record.score ||
      (current.score === record.score && current.correctCount >= record.correctCount))
  ) {
    return current;
  }

  const fullRecord: DailyChallengeRecord = {
    date: getTodayDateKey(),
    ...record,
  };

  localStorage.setItem(DAILY_CHALLENGE_STORAGE_KEY, JSON.stringify(fullRecord));
  return fullRecord;
};
