
import React, { useEffect, useRef, useState } from 'react';
import { GameMode, GameState, WrongQuestionEntry } from './types';
import { Matchmaking } from './components/Matchmaking';
import { LoadingScreen } from './components/LoadingScreen';
import { Leaderboard } from './components/Leaderboard';
import { WrongQuestions } from './components/WrongQuestions';
import { Profile } from './components/Profile';
import { MenuScreen } from './components/MenuScreen';
import { GameScreen } from './components/GameScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { LoginRequiredModal } from './components/LoginRequiredModal';
import { AdminDashboard } from './components/AdminDashboard';
import { useGameSession } from './hooks/useGameSession';
import { usePlayerProgress } from './hooks/usePlayerProgress';
import { flushAnalyticsEvents, trackEvent } from './services/analytics';
import { getQuestionBankById, readSelectedQuestionBank, saveSelectedQuestionBank } from './services/questionBanks';

const hasAdminRoute = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get('admin') === '1' || window.location.hash === '#admin';
};

const clearAdminRoute = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.delete('admin');

  const search = url.searchParams.toString();
  const hash = url.hash === '#admin' ? '' : url.hash;
  const nextUrl = `${url.pathname}${search ? `?${search}` : ''}${hash}`;

  window.history.replaceState({}, '', nextUrl);
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const previousGameStateRef = useRef<GameState | null>(null);
  const adminRouteOpenedRef = useRef(false);
  const [loginPrompt, setLoginPrompt] = useState<{ title: string; description: string } | null>(null);
  const [profileAuthTab, setProfileAuthTab] = useState<'signin' | 'signup'>('signin');
  const [selectedQuestionBankId, setSelectedQuestionBankId] = useState(() => readSelectedQuestionBank());
  const {
    playerStats,
    playerIdentity,
    accountSession,
    authAvailable,
    authLoading,
    dailyChallengeRecord,
    wrongQuestions,
    wrongQuestionsLoading,
    profileSummary,
    profileLoading,
    latestTrainingRecord,
    activeDaysThisWeek,
    loadWrongQuestions,
    loadProfileSummary,
    updateDisplayName,
    signInAccount,
    signUpAccount,
    signOutAccount,
    recordWrongAnswer,
    recordDailyChallengeCompletion,
    recordSoloRunCompletion,
  } = usePlayerProgress();
  const {
    gameMode,
    currentCase,
    battleState,
    timeLeft,
    selectedOption,
    hasAnswered,
    shuffledOptions,
    opponentAnswered,
    startSolo,
    startPvP,
    startDailyChallenge,
    startWrongQuestionReview,
    restartWrongQuestionReview,
    onMatchFound,
    submitAnswer,
    nextRound,
  } = useGameSession({
    selectedQuestionBankId,
    onGameStateChange: setGameState,
    onWrongAnswer: recordWrongAnswer,
    onSessionStarted: (mode) => {
      trackEvent('session_started', { mode });
    },
    onAnswerSubmitted: (payload) => {
      trackEvent('answer_submitted', payload);
    },
    onSessionCompleted: (payload) => {
      trackEvent('session_completed', payload);
    },
    onDailyChallengeComplete: recordDailyChallengeCompletion,
    onSoloRunComplete: recordSoloRunCompletion,
  });

  useEffect(() => {
    if (gameState === GameState.MENU && previousGameStateRef.current !== GameState.MENU) {
      trackEvent('home_exposed', {
        source: previousGameStateRef.current ?? 'initial_load',
      });
    }

    previousGameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    void flushAnalyticsEvents();
  }, [playerIdentity.id, playerIdentity.authUserId]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const syncAdminRoute = () => {
      const shouldOpenAdmin = hasAdminRoute();

      if (shouldOpenAdmin) {
        setGameState((current) => current === GameState.ADMIN ? current : GameState.ADMIN);

        if (!adminRouteOpenedRef.current) {
          adminRouteOpenedRef.current = true;
          trackEvent('admin_opened', { source: 'internal_route' });
        }

        return;
      }

      adminRouteOpenedRef.current = false;
      setGameState((current) => current === GameState.ADMIN ? GameState.MENU : current);
    };

    syncAdminRoute();
    window.addEventListener('hashchange', syncAdminRoute);
    window.addEventListener('popstate', syncAdminRoute);

    return () => {
      window.removeEventListener('hashchange', syncAdminRoute);
      window.removeEventListener('popstate', syncAdminRoute);
    };
  }, []);

  const accountStatusLabel = accountSession
    ? '正式账号'
    : playerIdentity.isGuest
      ? '游客模式'
      : '已绑定账号';
  const profileEntryLabel = playerIdentity.isGuest ? '登录 / 注册' : '进入个人中心';
  const selectedQuestionBank = getQuestionBankById(selectedQuestionBankId);

  const openProfile = async (initialAuthTab: 'signin' | 'signup' = 'signin') => {
    setProfileAuthTab(initialAuthTab);
    setGameState(GameState.PROFILE);
    await loadProfileSummary();
  };

  const showLoginPrompt = (payload: { title: string; description: string }) => {
    trackEvent('login_prompt_opened', {
      title: payload.title,
    });
    setLoginPrompt(payload);
  };

  const requireLogin = (payload: { title: string; description: string }) => {
    if (!playerIdentity.isGuest) {
      return false;
    }

    showLoginPrompt(payload);
    return true;
  };

  const openWrongQuestions = async () => {
    if (requireLogin({
      title: '错题本需要登录后使用',
      description: '游客账号目前先体验每日挑战。登录后再查看错题详情、复练记录和长期积累。',
    })) {
      return;
    }
    trackEvent('wrong_questions_opened', {
      totalEntries: wrongQuestions.length,
    });
    setGameState(GameState.WRONG_QUESTIONS);
    await loadWrongQuestions();
  };

  const retryWrongQuestion = (entry: WrongQuestionEntry) => {
    trackEvent('wrong_question_retry_started', {
      questionId: entry.questionId,
      sourceMode: entry.mode,
    });
    startWrongQuestionReview(entry);
  };

  const openLeaderboard = () => {
    if (requireLogin({
      title: '排行榜需要登录后查看',
      description: '登录后才能查看个人名次、全球排名和持续成长表现。',
    })) {
      return;
    }
    trackEvent('leaderboard_opened', {
      bestSoloStreak: playerStats.bestSoloStreak,
      dailyScore: dailyChallengeRecord?.score ?? null,
    });
    setGameState(GameState.LEADERBOARD);
  };

  const startSoloWithTracking = () => {
    if (requireLogin({
      title: '单人连胜需要登录后解锁',
      description: '游客账号目前只能玩每日挑战。登录后即可解锁单人连胜、错题本和完整统计。',
    })) {
      return;
    }
    trackEvent('home_mode_clicked', {
      mode: GameMode.SOLO_STREAK,
      questionBankId: selectedQuestionBankId,
    });
    startSolo();
  };

  const startDailyChallengeWithTracking = () => {
    trackEvent('home_mode_clicked', {
      mode: GameMode.DAILY_CHALLENGE,
      questionBankId: selectedQuestionBankId,
    });
    void startDailyChallenge();
  };

  const startPvPWithTracking = () => {
    if (requireLogin({
      title: '排位赛需要登录后解锁',
      description: '登录后才能进入排位赛，并持续保存你的战绩与成长轨迹。',
    })) {
      return;
    }
    trackEvent('home_mode_clicked', {
      mode: GameMode.PVP_BATTLE,
      questionBankId: selectedQuestionBankId,
    });
    startPvP();
  };

  const closeAdmin = () => {
    adminRouteOpenedRef.current = false;
    clearAdminRoute();
    setGameState(GameState.MENU);
  };

  return (
    <>
      {gameState === GameState.MATCHMAKING && battleState && (
        <Matchmaking opponent={battleState.opponent} onMatchFound={onMatchFound} />
      )}
      {gameState === GameState.LEADERBOARD && (
        <Leaderboard
          playerIdentity={playerIdentity}
          bestSoloStreak={playerStats.bestSoloStreak}
          dailyChallengeRecord={dailyChallengeRecord}
          onClose={() => setGameState(GameState.MENU)}
        />
      )}
      {gameState === GameState.WRONG_QUESTIONS && (
        <WrongQuestions
          entries={wrongQuestions}
          loading={wrongQuestionsLoading}
          onRetryEntry={retryWrongQuestion}
          onClose={() => setGameState(GameState.MENU)}
        />
      )}
      {gameState === GameState.PROFILE && (
        <Profile
          summary={profileSummary}
          identity={playerIdentity}
          accountSession={accountSession}
          authAvailable={authAvailable}
          authLoading={authLoading}
          accountStatusLabel={accountStatusLabel}
          selectedQuestionBankId={selectedQuestionBankId}
          initialAuthTab={profileAuthTab}
          loading={profileLoading}
          onClose={() => setGameState(GameState.MENU)}
          onSelectQuestionBank={(nextBankId) => {
            setSelectedQuestionBankId(nextBankId);
            saveSelectedQuestionBank(nextBankId);
            trackEvent('question_bank_selected', {
              questionBankId: nextBankId,
              source: 'profile',
            });
          }}
          onUpdateDisplayName={async (displayName) => {
            const result = await updateDisplayName(displayName);
            trackEvent('account_profile_updated', {
              success: result.success,
            });
            return result;
          }}
          onSignIn={async (payload) => {
            const result = await signInAccount(payload);
            trackEvent('account_signin_submitted', {
              success: result.success,
            });
            return result;
          }}
          onSignUp={async (payload) => {
            const result = await signUpAccount(payload);
            trackEvent('account_signup_submitted', {
              success: result.success,
            });
            return result;
          }}
          onSignOut={async () => {
            const result = await signOutAccount();
            trackEvent('account_signout_submitted', {
              success: result.success,
            });
            return result;
          }}
        />
      )}
      {gameState === GameState.ADMIN && (
        <AdminDashboard onClose={closeAdmin} />
      )}
      {gameState === GameState.MENU && (
        <MenuScreen
          bestSoloStreak={playerStats.bestSoloStreak}
          dailyChallengeRecord={dailyChallengeRecord}
          latestTrainingRecord={latestTrainingRecord}
          activeDaysThisWeek={activeDaysThisWeek}
          profileEntryLabel={profileEntryLabel}
          onStartSolo={startSoloWithTracking}
          onStartDailyChallenge={startDailyChallengeWithTracking}
          onStartPvP={startPvPWithTracking}
          onOpenProfile={() => {
            void openProfile(playerIdentity.isGuest ? 'signup' : 'signin');
          }}
          onOpenLeaderboard={openLeaderboard}
          onOpenWrongQuestions={openWrongQuestions}
        />
      )}
      {gameState === GameState.LOADING_ROUND && (
        <LoadingScreen />
      )}
      {(gameState === GameState.PLAYING || gameState === GameState.ROUND_RESULT) && currentCase && battleState && (
        <GameScreen
          currentCase={currentCase}
          battleState={battleState}
          gameMode={gameMode}
          selectedQuestionBankLabel={selectedQuestionBank.title}
          playerIdentity={{ name: playerIdentity.displayName, avatar: playerIdentity.avatar, rating: 0 }}
          timeLeft={timeLeft}
          opponentAnswered={opponentAnswered}
          hasAnswered={hasAnswered}
          selectedOption={selectedOption}
          shuffledOptions={shuffledOptions}
          onSubmitAnswer={submitAnswer}
          onNextRound={nextRound}
          onExit={() => setGameState(GameState.MENU)}
        />
      )}
      {gameState === GameState.GAME_OVER && battleState && (
        <GameOverScreen
          battleState={battleState}
          gameMode={gameMode}
          bestSoloStreak={playerStats.bestSoloStreak}
          dailyChallengeRecord={dailyChallengeRecord}
          isGuest={playerIdentity.isGuest}
          onOpenProfile={() => {
            void openProfile(playerIdentity.isGuest ? 'signup' : 'signin');
          }}
          onViewLeaderboard={openLeaderboard}
          onReplay={
            gameMode === GameMode.PVP_BATTLE
              ? startPvP
              : gameMode === GameMode.DAILY_CHALLENGE
                ? startDailyChallenge
                : gameMode === GameMode.REVIEW_PRACTICE
                  ? restartWrongQuestionReview
                  : startSolo
          }
          onBackToMenu={() => setGameState(GameState.MENU)}
        />
      )}
      {loginPrompt && (
        <LoginRequiredModal
          title={loginPrompt.title}
          description={loginPrompt.description}
          confirmLabel="去个人中心解锁"
          onClose={() => setLoginPrompt(null)}
          onGoToProfile={() => {
            setLoginPrompt(null);
            void openProfile('signup');
          }}
        />
      )}
    </>
  );
};

export default App;
