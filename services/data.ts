import { DailyChallengeRecord, LeaderboardData, LeaderboardType, QuestionCase } from '../types';
import { fetchDailyChallengeCasesFromBackend, fetchLeaderboardDataFromBackend, fetchRandomCaseFromBackend } from './backend';
import { buildMockLeaderboardData, MOCK_CASE_DATABASE } from './mockData';
import { LocalPlayerIdentity } from './playerIdentity';

// Simulate API call to backend
export const fetchRandomCase = async (): Promise<QuestionCase> => {
  const backendCase = await fetchRandomCaseFromBackend();
  if (backendCase) {
    return backendCase;
  }

  await new Promise(resolve => setTimeout(resolve, 600));

  const randomIndex = Math.floor(Math.random() * MOCK_CASE_DATABASE.length);
  const data = MOCK_CASE_DATABASE[randomIndex];

  return {
    id: crypto.randomUUID(),
    ...data
  };
};

export const fetchLeaderboardData = async (payload: {
  type: LeaderboardType;
  identity: LocalPlayerIdentity;
  bestSoloStreak: number;
  dailyChallengeRecord: DailyChallengeRecord | null;
}): Promise<LeaderboardData> => {
    const backendLeaderboard = await fetchLeaderboardDataFromBackend(payload.type, payload.identity);
    if (backendLeaderboard) {
        return backendLeaderboard;
    }

    await new Promise(resolve => setTimeout(resolve, 400));
    return buildMockLeaderboardData(payload);
};

const sortMockCasesBySeed = (seed: string): Omit<QuestionCase, 'id'>[] => {
  const seedValue = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return [...MOCK_CASE_DATABASE].sort((left, right) => {
    const leftScore = Array.from(left.description).reduce((sum, char) => sum + char.charCodeAt(0), seedValue);
    const rightScore = Array.from(right.description).reduce((sum, char) => sum + char.charCodeAt(0), seedValue);
    return leftScore - rightScore;
  });
};

export const fetchDailyChallengeCases = async (dateSeed: string, count: number = 5): Promise<QuestionCase[]> => {
  const backendCases = await fetchDailyChallengeCasesFromBackend(dateSeed, count);
  if (backendCases && backendCases.length > 0) {
    return backendCases;
  }

  await new Promise(resolve => setTimeout(resolve, 300));

  return sortMockCasesBySeed(dateSeed)
    .slice(0, count)
    .map((item, index) => ({
      id: `${dateSeed}-${index}-${item.correctAnswer}`,
      ...item,
    }));
};
