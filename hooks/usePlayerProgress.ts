import { useEffect, useState } from 'react';
import { ProfileSummary, QuestionCase, RoundResult, TrainingHistoryEntry, WrongQuestionEntry } from '../types';
import {
  fetchProfileSummaryFromBackend,
  buildLocalProfileSummary,
} from '../services/profile';
import {
  getTodayChallengeDateKey,
  getTodayChallengeRecord,
  saveTodayChallengeRecord,
} from '../services/dailyChallenge';
import {
  getLocalPlayerStats,
  saveSoloRunToLocalStats,
  type LocalPlayerStats,
} from '../services/playerStats';
import {
  getLocalPlayerIdentity,
  linkLocalIdentityToAccount,
  type LocalPlayerIdentity,
  unlinkLocalIdentityFromAccount,
  updateLocalPlayerIdentity,
} from '../services/playerIdentity';
import {
  ensureBackendPlayerProfile,
  fetchWrongQuestionsFromBackend,
  submitDailyChallengeAttemptToBackend,
  submitSoloRunToBackend,
} from '../services/backend';
import { getLocalWrongQuestions, saveWrongQuestion } from '../services/wrongQuestions';
import {
  getLatestTrainingRecord,
  getLocalTrainingHistory,
  saveTrainingHistoryEntry,
} from '../services/playerHistory';
import {
  getAuthAccountSession,
  isAuthAvailable,
  signInWithEmailPassword,
  signOutAuthAccount,
  signUpWithEmailPassword,
  subscribeToAuthStateChange,
  type AuthAccountSession,
} from '../services/auth';

const buildInitialProfileSummary = (): ProfileSummary => {
  const identity = getLocalPlayerIdentity();
  const stats = getLocalPlayerStats();
  const dailyChallengeRecord = getTodayChallengeRecord();
  const wrongQuestions = getLocalWrongQuestions();
  const trainingHistory = getLocalTrainingHistory();

  return buildLocalProfileSummary({
    identity,
    stats,
    dailyChallengeRecord,
    wrongQuestions,
    trainingHistory,
  });
};

interface DailyChallengeCompletionPayload {
  score: number;
  correctCount: number;
  totalQuestions: number;
  history: RoundResult[];
  cases: QuestionCase[];
}

interface SoloRunCompletionPayload {
  streakCount: number;
  totalAnswered: number;
  correctAnswers: number;
  history: RoundResult[];
}

interface AccountCredentials {
  email: string;
  password: string;
  displayName?: string;
}

interface AccountActionResult {
  success: boolean;
  message: string | null;
}

export const usePlayerProgress = () => {
  const [playerStats, setPlayerStats] = useState<LocalPlayerStats>(() => getLocalPlayerStats());
  const [playerIdentity, setPlayerIdentity] = useState<LocalPlayerIdentity>(() => getLocalPlayerIdentity());
  const [dailyChallengeRecord, setDailyChallengeRecord] = useState(() => getTodayChallengeRecord());
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestionEntry[]>(() => getLocalWrongQuestions());
  const [trainingHistory, setTrainingHistory] = useState<TrainingHistoryEntry[]>(() => getLocalTrainingHistory());
  const [wrongQuestionsLoading, setWrongQuestionsLoading] = useState(false);
  const [profileSummary, setProfileSummary] = useState<ProfileSummary>(() => buildInitialProfileSummary());
  const [profileLoading, setProfileLoading] = useState(false);
  const [accountSession, setAccountSession] = useState<AuthAccountSession | null>(null);
  const [authLoading, setAuthLoading] = useState(isAuthAvailable());

  useEffect(() => {
    setProfileSummary(buildLocalProfileSummary({
      identity: playerIdentity,
      stats: playerStats,
      dailyChallengeRecord,
      wrongQuestions,
      trainingHistory,
    }));
  }, [dailyChallengeRecord, playerIdentity, playerStats, trainingHistory, wrongQuestions]);

  useEffect(() => {
    if (!isAuthAvailable()) {
      setAuthLoading(false);
      return;
    }

    let active = true;

    const syncSession = async () => {
      setAuthLoading(true);
      const session = await getAuthAccountSession();
      if (!active) {
        return;
      }

      setAccountSession(session);
      if (session) {
        const nextIdentity = linkLocalIdentityToAccount({
          authUserId: session.userId,
          email: session.email,
        });
        setPlayerIdentity(nextIdentity);
        void ensureBackendPlayerProfile(nextIdentity);
      }

      setAuthLoading(false);
    };

    void syncSession();

    const subscription = subscribeToAuthStateChange((_event, session) => {
      if (!active) {
        return;
      }

      setAccountSession(session);
      if (session) {
        const nextIdentity = linkLocalIdentityToAccount({
          authUserId: session.userId,
          email: session.email,
        });
        setPlayerIdentity(nextIdentity);
        void ensureBackendPlayerProfile(nextIdentity);
      } else {
        const nextIdentity = unlinkLocalIdentityFromAccount();
        setPlayerIdentity(nextIdentity);
      }
    });

    return () => {
      active = false;
      subscription?.data.subscription.unsubscribe();
    };
  }, []);

  const loadWrongQuestions = async () => {
    setWrongQuestionsLoading(true);

    try {
      const backendEntries = await fetchWrongQuestionsFromBackend(playerIdentity);
      setWrongQuestions(backendEntries ?? getLocalWrongQuestions());
    } finally {
      setWrongQuestionsLoading(false);
    }
  };

  const loadProfileSummary = async () => {
    setProfileLoading(true);

    try {
      const backendSummary = await fetchProfileSummaryFromBackend(playerIdentity);
      if (backendSummary) {
        setProfileSummary((prev) => ({
          ...prev,
          ...backendSummary,
        }));
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const recordWrongAnswer = (payload: {
    mode: WrongQuestionEntry['mode'];
    question: QuestionCase;
    selectedAnswer: string | null;
  }) => {
    setWrongQuestions(saveWrongQuestion(payload));
  };

  const updateDisplayName = async (displayName: string): Promise<AccountActionResult> => {
    const normalized = displayName.trim();
    if (!normalized) {
      return {
        success: false,
        message: '昵称不能为空。',
      };
    }

    const nextIdentity = updateLocalPlayerIdentity({
      displayName: normalized,
    });
    setPlayerIdentity(nextIdentity);
    void ensureBackendPlayerProfile(nextIdentity);

    return {
      success: true,
      message: '昵称已更新。',
    };
  };

  const signInAccount = async (payload: AccountCredentials): Promise<AccountActionResult> => {
    const displayName = payload.displayName?.trim();
    if (displayName) {
      const nextIdentity = updateLocalPlayerIdentity({ displayName });
      setPlayerIdentity(nextIdentity);
    }

    setAuthLoading(true);
    const result = await signInWithEmailPassword({
      email: payload.email,
      password: payload.password,
    });
    setAuthLoading(false);

    if (result.error || !result.session) {
      return {
        success: false,
        message: result.error ?? '登录失败，请稍后重试。',
      };
    }

    const nextIdentity = linkLocalIdentityToAccount({
      authUserId: result.session.userId,
      email: result.session.email,
      displayName,
    });
    setPlayerIdentity(nextIdentity);
    setAccountSession(result.session);
    void ensureBackendPlayerProfile(nextIdentity);

    return {
      success: true,
      message: '登录成功，当前成绩已保留在这个账号下。',
    };
  };

  const signUpAccount = async (payload: AccountCredentials): Promise<AccountActionResult> => {
    const displayName = payload.displayName?.trim();
    if (displayName) {
      const nextIdentity = updateLocalPlayerIdentity({ displayName });
      setPlayerIdentity(nextIdentity);
    }

    setAuthLoading(true);
    const result = await signUpWithEmailPassword({
      email: payload.email,
      password: payload.password,
    });
    setAuthLoading(false);

    if (result.error) {
      return {
        success: false,
        message: result.error,
      };
    }

    if (!result.session && result.requiresEmailConfirmation) {
      return {
        success: true,
        message: '注册成功，请先完成邮箱确认，再回来登录。',
      };
    }

    if (!result.session) {
      return {
        success: true,
        message: '注册成功，请直接登录继续。',
      };
    }

    const nextIdentity = linkLocalIdentityToAccount({
      authUserId: result.session.userId,
      email: result.session.email,
      displayName,
    });
    setPlayerIdentity(nextIdentity);
    setAccountSession(result.session);
    void ensureBackendPlayerProfile(nextIdentity);

    return {
      success: true,
      message: '注册并登录成功，游客成绩已保留。',
    };
  };

  const signOutAccount = async (): Promise<AccountActionResult> => {
    setAuthLoading(true);
    const errorMessage = await signOutAuthAccount();
    setAuthLoading(false);

    if (errorMessage) {
      return {
        success: false,
        message: errorMessage,
      };
    }

    const nextIdentity = unlinkLocalIdentityFromAccount();
    setPlayerIdentity(nextIdentity);
    setAccountSession(null);

    return {
      success: true,
      message: '已退出登录，当前设备将回到游客模式。',
    };
  };

  const recordDailyChallengeCompletion = (payload: DailyChallengeCompletionPayload) => {
    const nextHistory = saveTrainingHistoryEntry({
      mode: 'daily_challenge',
      score: payload.score,
      correctCount: payload.correctCount,
      totalQuestions: payload.totalQuestions,
    });
    const savedRecord = saveTodayChallengeRecord({
      score: payload.score,
      correctCount: payload.correctCount,
      totalQuestions: payload.totalQuestions,
      completedAt: new Date().toISOString(),
    });

    setTrainingHistory(nextHistory);
    setDailyChallengeRecord(savedRecord);

    void submitDailyChallengeAttemptToBackend({
      identity: playerIdentity,
      dateKey: getTodayChallengeDateKey(),
      score: payload.score,
      correctCount: payload.correctCount,
      totalQuestions: payload.totalQuestions,
      history: payload.history,
      cases: payload.cases,
    });
  };

  const recordSoloRunCompletion = (payload: SoloRunCompletionPayload) => {
    const nextHistory = saveTrainingHistoryEntry({
      mode: 'solo_streak',
      score: payload.streakCount,
      correctCount: payload.correctAnswers,
      totalQuestions: payload.totalAnswered,
    });
    const nextStats = saveSoloRunToLocalStats({
      streakCount: payload.streakCount,
      totalAnswered: payload.totalAnswered,
      correctAnswers: payload.correctAnswers,
    });

    setTrainingHistory(nextHistory);
    setPlayerStats(nextStats);

    void submitSoloRunToBackend({
      identity: playerIdentity,
      history: payload.history,
      endedReason: 'wrong_answer',
    });
  };

  return {
    playerStats,
    playerIdentity,
    accountSession,
    authAvailable: isAuthAvailable(),
    authLoading,
    dailyChallengeRecord,
    wrongQuestions,
    wrongQuestionsLoading,
    profileSummary,
    profileLoading,
    latestTrainingRecord: getLatestTrainingRecord(trainingHistory),
    activeDaysThisWeek: profileSummary.weeklyActivity.filter((day) => day.active).length,
    loadWrongQuestions,
    loadProfileSummary,
    updateDisplayName,
    signInAccount,
    signUpAccount,
    signOutAccount,
    recordWrongAnswer,
    recordDailyChallengeCompletion,
    recordSoloRunCompletion,
  };
};
