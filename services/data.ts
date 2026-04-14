import { DailyChallengeRecord, LeaderboardData, LeaderboardType, QuestionCase } from '../types';
import { getAdminDailyChallengeCases, getAdminQuestionCatalog } from './admin';
import { fetchDailyChallengeCasesFromBackend, fetchLeaderboardDataFromBackend, fetchRandomCaseFromBackend } from './backend';
import { getTodayChallengeDateKey } from './dailyChallenge';
import { buildMockLeaderboardData, getMockQuestionCases } from './mockData';
import { LocalPlayerIdentity } from './playerIdentity';
import { buildQuestionBankSeed, filterQuestionCasesByBank, type QuestionBankId } from './questionBanks';

const getLocalAvailableCases = async (questionBankId: QuestionBankId): Promise<QuestionCase[]> => {
  const localCatalog = await getAdminQuestionCatalog();
  const approvedCases = localCatalog
    .filter((entry) => entry.isActive && entry.reviewStatus === 'approved')
    .map(({ isActive, ...question }) => question);
  const fallbackCases = approvedCases.length > 0 ? approvedCases : getMockQuestionCases();
  const filteredCases = filterQuestionCasesByBank(fallbackCases, questionBankId);

  return filteredCases.length > 0 ? filteredCases : fallbackCases;
};

// Simulate API call to backend
export const fetchRandomCase = async (questionBankId: QuestionBankId = 'all'): Promise<QuestionCase> => {
  const backendCase = await fetchRandomCaseFromBackend();
  if (backendCase && filterQuestionCasesByBank([backendCase], questionBankId).length > 0) {
    return backendCase;
  }

  await new Promise(resolve => setTimeout(resolve, 600));

  const fallbackCases = await getLocalAvailableCases(questionBankId);
  const randomIndex = Math.floor(Math.random() * fallbackCases.length);
  return fallbackCases[randomIndex];
};

export const fetchLeaderboardData = async (payload: {
  type: LeaderboardType;
  identity: LocalPlayerIdentity;
  bestSoloStreak: number;
  dailyChallengeRecord: DailyChallengeRecord | null;
}): Promise<LeaderboardData> => {
    const backendLeaderboard = await fetchLeaderboardDataFromBackend(
      payload.type,
      payload.identity,
      payload.dailyChallengeRecord?.date ?? getTodayChallengeDateKey()
    );
    if (backendLeaderboard) {
        return backendLeaderboard;
    }

    await new Promise(resolve => setTimeout(resolve, 400));
    return buildMockLeaderboardData(payload);
};

const sortCasesBySeed = (cases: QuestionCase[], seed: string): QuestionCase[] => {
  const seedValue = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return [...cases].sort((left, right) => {
    const leftScore = Array.from(left.description).reduce((sum, char) => sum + char.charCodeAt(0), seedValue);
    const rightScore = Array.from(right.description).reduce((sum, char) => sum + char.charCodeAt(0), seedValue);
    return leftScore - rightScore;
  });
};

export const fetchDailyChallengeCases = async (
  dateSeed: string,
  count: number = 5,
  questionBankId: QuestionBankId = 'all'
): Promise<QuestionCase[]> => {
  const adminCases = await getAdminDailyChallengeCases(dateSeed);
  const filteredAdminCases = adminCases ? filterQuestionCasesByBank(adminCases, questionBankId) : [];
  if (filteredAdminCases.length >= count) {
    return filteredAdminCases.slice(0, count);
  }
  if (questionBankId === 'all' && adminCases && adminCases.length > 0) {
    return adminCases.slice(0, count);
  }

  const backendCases = await fetchDailyChallengeCasesFromBackend(dateSeed, count);
  const filteredBackendCases = backendCases ? filterQuestionCasesByBank(backendCases, questionBankId) : [];
  if (filteredBackendCases.length >= count) {
    return filteredBackendCases.slice(0, count);
  }
  if (questionBankId === 'all' && backendCases && backendCases.length > 0) {
    return backendCases;
  }

  await new Promise(resolve => setTimeout(resolve, 300));

  const localCases = await getLocalAvailableCases(questionBankId);
  return sortCasesBySeed(localCases, buildQuestionBankSeed(dateSeed, questionBankId)).slice(0, count);
};
