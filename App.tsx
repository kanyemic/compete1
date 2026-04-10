
import React, { useState, useEffect, useRef } from 'react';
import { GameState, GameMode, QuestionCase, BattleState, RoundResult, DailyChallengeRecord, WrongQuestionEntry, ProfileSummary } from './types';
import { fetchDailyChallengeCases, fetchRandomCase } from './services/data';
import { generateOpponent, getBotBehavior, calculateScore } from './services/bot';
import { Matchmaking } from './components/Matchmaking';
import { LoadingScreen } from './components/LoadingScreen';
import { Leaderboard } from './components/Leaderboard';
import { WrongQuestions } from './components/WrongQuestions';
import { Profile } from './components/Profile';
import { MenuScreen } from './components/MenuScreen';
import { GameScreen } from './components/GameScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { getTodayChallengeDateKey, getTodayChallengeRecord, saveTodayChallengeRecord } from './services/dailyChallenge';
import { getLocalPlayerStats, saveSoloRunToLocalStats, type LocalPlayerStats } from './services/playerStats';
import { getLocalPlayerIdentity, type LocalPlayerIdentity } from './services/playerIdentity';
import { fetchWrongQuestionsFromBackend, submitDailyChallengeAttemptToBackend, submitSoloRunToBackend } from './services/backend';
import { getLocalWrongQuestions, saveWrongQuestion } from './services/wrongQuestions';
import { buildLocalProfileSummary, fetchProfileSummaryFromBackend } from './services/profile';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.SOLO_STREAK);
  
  // Game Data
  const [currentCase, setCurrentCase] = useState<QuestionCase | null>(null);
  const [dailyChallengeCases, setDailyChallengeCases] = useState<QuestionCase[]>([]);
  const [dailyChallengeRecord, setDailyChallengeRecord] = useState<DailyChallengeRecord | null>(null);
  const [playerStats, setPlayerStats] = useState<LocalPlayerStats>(() => getLocalPlayerStats());
  const [playerIdentity, setPlayerIdentity] = useState<LocalPlayerIdentity>(() => getLocalPlayerIdentity());
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestionEntry[]>(() => getLocalWrongQuestions());
  const [wrongQuestionsLoading, setWrongQuestionsLoading] = useState(false);
  const [profileSummary, setProfileSummary] = useState<ProfileSummary>(() => buildLocalProfileSummary({
    identity: getLocalPlayerIdentity(),
    stats: getLocalPlayerStats(),
    dailyChallengeRecord: getTodayChallengeRecord(),
    wrongQuestions: getLocalWrongQuestions(),
  }));
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Battle State
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [roundStartTime, setRoundStartTime] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  
  // Player Interaction
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  
  // Bot State
  const [opponentAnswered, setOpponentAnswered] = useState(false);
  const [opponentResult, setOpponentResult] = useState<RoundResult | null>(null);

  // Timers
  const timerRef = useRef<number | null>(null);
  const botTimerRef = useRef<number | null>(null);

  // --- Game Loop Control ---

  useEffect(() => {
    setDailyChallengeRecord(getTodayChallengeRecord());
    setPlayerStats(getLocalPlayerStats());
    setPlayerIdentity(getLocalPlayerIdentity());
    setWrongQuestions(getLocalWrongQuestions());
  }, []);

  useEffect(() => {
    setProfileSummary(buildLocalProfileSummary({
      identity: playerIdentity,
      stats: playerStats,
      dailyChallengeRecord,
      wrongQuestions,
    }));
  }, [playerIdentity, playerStats, dailyChallengeRecord, wrongQuestions]);

  const openWrongQuestions = async () => {
    setGameState(GameState.WRONG_QUESTIONS);
    setWrongQuestionsLoading(true);

    const backendEntries = await fetchWrongQuestionsFromBackend(playerIdentity);
    if (backendEntries) {
      setWrongQuestions(backendEntries);
    } else {
      setWrongQuestions(getLocalWrongQuestions());
    }

    setWrongQuestionsLoading(false);
  };

  const openProfile = async () => {
    setGameState(GameState.PROFILE);
    setProfileLoading(true);

    const backendSummary = await fetchProfileSummaryFromBackend(playerIdentity);
    if (backendSummary) {
      setProfileSummary(prev => ({
        ...prev,
        ...backendSummary,
      }));
    }

    setProfileLoading(false);
  };

  const startSolo = () => {
    setGameMode(GameMode.SOLO_STREAK);
    setDailyChallengeCases([]);
    setBattleState({
      round: 1,
      totalRounds: 999, // Infinite
      playerScore: 0,
      opponentScore: 0,
      opponent: { name: "训练机器人", avatar: "🤖", rating: 0 },
      history: []
    });
    loadRound({ mode: GameMode.SOLO_STREAK, round: 1 });
  };

  const startPvP = () => {
    setGameMode(GameMode.PVP_BATTLE);
    setDailyChallengeCases([]);
    const opponent = generateOpponent();
    setBattleState({
      round: 1,
      totalRounds: 5,
      playerScore: 0,
      opponentScore: 0,
      opponent,
      history: []
    });
    setGameState(GameState.MATCHMAKING);
  };

  const startDailyChallenge = async () => {
    setGameMode(GameMode.DAILY_CHALLENGE);
    const cases = await fetchDailyChallengeCases(getTodayChallengeDateKey(), 5);
    setDailyChallengeCases(cases);
    setBattleState({
      round: 1,
      totalRounds: cases.length,
      playerScore: 0,
      opponentScore: 0,
      opponent: { name: '今日挑战', avatar: '📅', rating: 0 },
      history: []
    });
    loadRound({ mode: GameMode.DAILY_CHALLENGE, round: 1, cases });
  };

  const onMatchFound = () => {
    loadRound({ mode: GameMode.PVP_BATTLE, round: 1 });
  };

  const loadRound = async ({
    mode = gameMode,
    round = battleState?.round ?? 1,
    cases = dailyChallengeCases
  }: {
    mode?: GameMode;
    round?: number;
    cases?: QuestionCase[];
  } = {}) => {
    setGameState(GameState.LOADING_ROUND);
    setSelectedOption(null);
    setHasAnswered(false);
    setOpponentAnswered(false);
    setOpponentResult(null);
    setTimeLeft(15);
    
    // Cleanup timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (botTimerRef.current) clearTimeout(botTimerRef.current);

    try {
      const caseData = mode === GameMode.DAILY_CHALLENGE
        ? cases[round - 1]
        : await fetchRandomCase();

      if (!caseData) {
        throw new Error('No case data available for this round.');
      }

      setCurrentCase(caseData);
      setShuffledOptions([...caseData.options].sort(() => Math.random() - 0.5));
      
      // Start Round
      setGameState(GameState.PLAYING);
      setRoundStartTime(Date.now());
      startTimers(caseData.difficulty, mode);
    } catch (error) {
      console.error(error);
      // Retry
      setTimeout(() => loadRound({ mode, round, cases }), 1000);
    }
  };

  const startTimers = (difficulty: 'Easy' | 'Medium' | 'Hard', mode: GameMode) => {
    // 1. Countdown Timer
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 2. Bot Logic (Only in PvP)
    if (mode === GameMode.PVP_BATTLE && battleState) {
      const behavior = getBotBehavior(difficulty);
      const reactionTime = Math.random() * (behavior.reactionTimeMax - behavior.reactionTimeMin) + behavior.reactionTimeMin;
      
      botTimerRef.current = window.setTimeout(() => {
        const isCorrect = Math.random() < behavior.accuracy;
        const timeTaken = reactionTime / 1000;
        const score = calculateScore(isCorrect, timeTaken);
        
        setOpponentResult({
          questionId: "bot",
          correct: isCorrect,
          timeTaken,
          score
        });
        setOpponentAnswered(true);
      }, reactionTime);
    }
  };

  const handleTimeUp = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!hasAnswered) {
      submitAnswer(null); // Timeout counts as wrong
    }
  };

  const submitAnswer = (option: string | null) => {
    if (hasAnswered || !currentCase || !battleState) return;
    
    setHasAnswered(true);
    setSelectedOption(option);
    
    const timeTaken = (Date.now() - roundStartTime) / 1000;
    const isCorrect = option === currentCase.correctAnswer;
    const score = calculateScore(isCorrect, timeTaken);

    if (!isCorrect) {
      const updatedWrongQuestions = saveWrongQuestion({
        mode: gameMode === GameMode.DAILY_CHALLENGE ? 'daily_challenge' : 'solo_streak',
        question: currentCase,
        selectedAnswer: option,
      });
      setWrongQuestions(updatedWrongQuestions);
    }

    // Save Player Result (Wait for bot if necessary)
    checkRoundEnd({
      questionId: currentCase.id,
      correct: isCorrect,
      timeTaken,
      score,
      selectedAnswer: option,
    });
  };

  const checkRoundEnd = (playerRes: RoundResult) => {
    if (!battleState) return;

    const finalize = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      
      // If bot hasn't answered yet in PvP, simulate it
      let finalOpponentRes = opponentResult;
      if (gameMode === GameMode.PVP_BATTLE && !finalOpponentRes) {
         const behavior = getBotBehavior(currentCase!.difficulty);
        const isCorrect = Math.random() < behavior.accuracy;
        finalOpponentRes = {
           questionId: 'bot',
            correct: isCorrect,
            timeTaken: (Date.now() - roundStartTime) / 1000,
            score: calculateScore(isCorrect, (Date.now() - roundStartTime) / 1000)
         };
         setOpponentAnswered(true);
      } else if (gameMode === GameMode.SOLO_STREAK || gameMode === GameMode.DAILY_CHALLENGE) {
          finalOpponentRes = { questionId: 'dummy', correct: false, timeTaken: 0, score: 0 };
      }

      setBattleState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          playerScore: prev.playerScore + playerRes.score,
          opponentScore: prev.opponentScore + (finalOpponentRes?.score || 0),
          history: [...prev.history, { player: playerRes, opponent: finalOpponentRes! }]
        };
      });

      setGameState(GameState.ROUND_RESULT);
    };

    if (gameMode === GameMode.PVP_BATTLE && !opponentAnswered) {
      setTimeout(finalize, 1000); 
    } else {
      finalize();
    }
  };

  const nextRound = () => {
    if (!battleState) return;

    if (gameMode === GameMode.PVP_BATTLE && battleState.round >= battleState.totalRounds) {
      setGameState(GameState.GAME_OVER);
    } else if (gameMode === GameMode.DAILY_CHALLENGE && battleState.round >= battleState.totalRounds) {
      const correctCount = battleState.history.filter(entry => entry.player.correct).length;
      const savedRecord = saveTodayChallengeRecord({
        score: battleState.playerScore,
        correctCount,
        totalQuestions: battleState.totalRounds,
        completedAt: new Date().toISOString(),
      });
      setDailyChallengeRecord(savedRecord);
      void submitDailyChallengeAttemptToBackend({
        identity: playerIdentity,
        dateKey: getTodayChallengeDateKey(),
        score: battleState.playerScore,
        correctCount,
        totalQuestions: battleState.totalRounds,
        history: battleState.history.map(entry => entry.player),
        cases: dailyChallengeCases,
      });
      setGameState(GameState.GAME_OVER);
    } else if (gameMode === GameMode.SOLO_STREAK && battleState.history[battleState.history.length - 1].player.correct === false) {
      const totalAnswered = battleState.history.length;
      const correctAnswers = battleState.history.filter(entry => entry.player.correct).length;
      const nextStats = saveSoloRunToLocalStats({
        streakCount: correctAnswers,
        totalAnswered,
        correctAnswers,
      });
      setPlayerStats(nextStats);
      void submitSoloRunToBackend({
        identity: playerIdentity,
        history: battleState.history.map(entry => entry.player),
        endedReason: 'wrong_answer',
      });
      setGameState(GameState.GAME_OVER); // Streak ends
    } else {
      const nextRoundNumber = battleState.round + 1;
      setBattleState(prev => prev ? ({ ...prev, round: nextRoundNumber }) : null);
      loadRound({ mode: gameMode, round: nextRoundNumber });
    }
  };

  return (
    <>
      {gameState === GameState.MATCHMAKING && battleState && (
        <Matchmaking opponent={battleState.opponent} onMatchFound={onMatchFound} />
      )}
      {gameState === GameState.LEADERBOARD && (
        <Leaderboard onClose={() => setGameState(GameState.MENU)} />
      )}
      {gameState === GameState.WRONG_QUESTIONS && (
        <WrongQuestions
          entries={wrongQuestions}
          loading={wrongQuestionsLoading}
          onClose={() => setGameState(GameState.MENU)}
        />
      )}
      {gameState === GameState.PROFILE && (
        <Profile
          summary={profileSummary}
          loading={profileLoading}
          onClose={() => setGameState(GameState.MENU)}
        />
      )}
      {gameState === GameState.MENU && (
        <MenuScreen
          bestSoloStreak={playerStats.bestSoloStreak}
          dailyChallengeRecord={dailyChallengeRecord}
          onStartSolo={startSolo}
          onStartDailyChallenge={startDailyChallenge}
          onStartPvP={startPvP}
          onOpenProfile={openProfile}
          onOpenLeaderboard={() => setGameState(GameState.LEADERBOARD)}
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
          onReplay={gameMode === GameMode.PVP_BATTLE ? startPvP : gameMode === GameMode.DAILY_CHALLENGE ? startDailyChallenge : startSolo}
          onBackToMenu={() => setGameState(GameState.MENU)}
        />
      )}
    </>
  );
};

export default App;
