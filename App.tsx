
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

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const previousGameStateRef = useRef<GameState | null>(null);
  const [loginPrompt, setLoginPrompt] = useState<{ title: string; description: string } | null>(null);
  const [profileAuthTab, setProfileAuthTab] = useState<'signin' | 'signup'>('signin');
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

  const accountStatusLabel = accountSession
    ? '正式账号'
    : playerIdentity.isGuest
      ? '游客模式'
      : '已绑定账号';
  const profileEntryLabel = playerIdentity.isGuest ? '登录 / 个人主页' : '查看个人主页';

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
    });
    startSolo();
  };

  const startDailyChallengeWithTracking = () => {
    trackEvent('home_mode_clicked', {
      mode: GameMode.DAILY_CHALLENGE,
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
    });
    startPvP();
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
          initialAuthTab={profileAuthTab}
          loading={profileLoading}
          onClose={() => setGameState(GameState.MENU)}
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
        <AdminDashboard onClose={() => setGameState(GameState.MENU)} />
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
          playerIdentity={{ name: playerIdentity.displayName, avatar: playerIdentity.avatar, rating: 0 }}
          timeLeft={timeLeft}
          opponentAnswered={opponentAnswered}
          hasAnswered={hasAnswered}
          selectedOption={selectedOption}
          shuffledOptions={shuffledOptions}
          onSubmitAnswer={submitAnswer}
          onNextRound={nextRound}
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
          confirmLabel="去注册 / 登录"
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
