import { useEffect, useRef, useState } from 'react';
import {
  BattleState,
  GameMode,
  GameState,
  QuestionCase,
  RoundResult,
  WrongQuestionEntry,
} from '../types';
import { fetchDailyChallengeCases, fetchRandomCase } from '../services/data';
import { calculateScore, generateOpponent, getBotBehavior } from '../services/bot';
import { getTodayChallengeDateKey } from '../services/dailyChallenge';
import { QuestionBankId } from '../services/questionBanks';

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

interface UseGameSessionOptions {
  selectedQuestionBankId: QuestionBankId;
  onGameStateChange: (state: GameState) => void;
  onWrongAnswer: (payload: {
    mode: WrongQuestionEntry['mode'];
    question: QuestionCase;
    selectedAnswer: string | null;
  }) => void;
  onSessionStarted: (mode: GameMode) => void;
  onAnswerSubmitted: (payload: {
    mode: GameMode;
    questionId: string;
    correct: boolean;
    timeTaken: number;
    selectedAnswer: string | null;
  }) => void;
  onSessionCompleted: (payload: {
    mode: GameMode;
    score: number;
    correctCount: number;
    totalQuestions: number;
  }) => void;
  onDailyChallengeComplete: (payload: DailyChallengeCompletionPayload) => void;
  onSoloRunComplete: (payload: SoloRunCompletionPayload) => void;
}

const mapWrongQuestionEntryToCase = (entry: WrongQuestionEntry): QuestionCase => ({
  id: entry.questionId,
  category: entry.category,
  description: entry.description,
  correctAnswer: entry.correctAnswer,
  options: entry.options,
  explanation: entry.explanation,
  difficulty: entry.difficulty,
  imageUrl: entry.imageUrl,
  sourceName: entry.sourceName,
  sourceUrl: entry.sourceUrl,
  reviewStatus: entry.reviewStatus,
  reviewerName: entry.reviewerName,
  updatedAt: entry.updatedAt,
});

export const useGameSession = ({
  selectedQuestionBankId,
  onGameStateChange,
  onWrongAnswer,
  onSessionStarted,
  onAnswerSubmitted,
  onSessionCompleted,
  onDailyChallengeComplete,
  onSoloRunComplete,
}: UseGameSessionOptions) => {
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.SOLO_STREAK);
  const [currentCase, setCurrentCase] = useState<QuestionCase | null>(null);
  const [dailyChallengeCases, setDailyChallengeCases] = useState<QuestionCase[]>([]);
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [roundStartTime, setRoundStartTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [opponentAnswered, setOpponentAnswered] = useState(false);
  const [opponentResult, setOpponentResult] = useState<RoundResult | null>(null);

  const timerRef = useRef<number | null>(null);
  const botTimerRef = useRef<number | null>(null);
  const roundEndTimerRef = useRef<number | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const sessionTokenRef = useRef(0);
  const sessionActiveRef = useRef(false);

  const gameModeRef = useRef(gameMode);
  const selectedQuestionBankIdRef = useRef(selectedQuestionBankId);
  const currentCaseRef = useRef(currentCase);
  const dailyChallengeCasesRef = useRef(dailyChallengeCases);
  const battleStateRef = useRef(battleState);
  const roundStartTimeRef = useRef(roundStartTime);
  const hasAnsweredRef = useRef(hasAnswered);
  const opponentAnsweredRef = useRef(opponentAnswered);
  const opponentResultRef = useRef(opponentResult);

  useEffect(() => {
    gameModeRef.current = gameMode;
  }, [gameMode]);

  useEffect(() => {
    selectedQuestionBankIdRef.current = selectedQuestionBankId;
  }, [selectedQuestionBankId]);

  useEffect(() => {
    currentCaseRef.current = currentCase;
  }, [currentCase]);

  useEffect(() => {
    dailyChallengeCasesRef.current = dailyChallengeCases;
  }, [dailyChallengeCases]);

  useEffect(() => {
    battleStateRef.current = battleState;
  }, [battleState]);

  useEffect(() => {
    roundStartTimeRef.current = roundStartTime;
  }, [roundStartTime]);

  useEffect(() => {
    hasAnsweredRef.current = hasAnswered;
  }, [hasAnswered]);

  useEffect(() => {
    opponentAnsweredRef.current = opponentAnswered;
  }, [opponentAnswered]);

  useEffect(() => {
    opponentResultRef.current = opponentResult;
  }, [opponentResult]);

  useEffect(() => (
    () => {
      clearTimers();
    }
  ), []);

  function clearTimers() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (botTimerRef.current !== null) {
      window.clearTimeout(botTimerRef.current);
      botTimerRef.current = null;
    }

    if (roundEndTimerRef.current !== null) {
      window.clearTimeout(roundEndTimerRef.current);
      roundEndTimerRef.current = null;
    }

    if (retryTimerRef.current !== null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }

  function isCurrentSession(sessionToken: number) {
    return sessionActiveRef.current && sessionTokenRef.current === sessionToken;
  }

  function startTimers(difficulty: QuestionCase['difficulty'], mode: GameMode, sessionToken = sessionTokenRef.current) {
    timerRef.current = window.setInterval(() => {
      if (!isCurrentSession(sessionToken)) {
        if (timerRef.current !== null) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }

        return;
      }

      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    if (mode === GameMode.PVP_BATTLE && battleStateRef.current) {
      const behavior = getBotBehavior(difficulty);
      const reactionTime = Math.random() * (behavior.reactionTimeMax - behavior.reactionTimeMin) + behavior.reactionTimeMin;

      botTimerRef.current = window.setTimeout(() => {
        if (!isCurrentSession(sessionToken)) {
          return;
        }

        const isCorrect = Math.random() < behavior.accuracy;
        const timeTaken = reactionTime / 1000;
        const score = calculateScore(isCorrect, timeTaken);
        const nextOpponentResult: RoundResult = {
          questionId: 'bot',
          correct: isCorrect,
          timeTaken,
          score,
        };

        opponentResultRef.current = nextOpponentResult;
        opponentAnsweredRef.current = true;
        setOpponentResult(nextOpponentResult);
        setOpponentAnswered(true);
      }, reactionTime);
    }
  }

  async function loadRound({
    mode = gameModeRef.current,
    round = battleStateRef.current?.round ?? 1,
    cases = dailyChallengeCasesRef.current,
    sessionToken = sessionTokenRef.current,
  }: {
    mode?: GameMode;
    round?: number;
    cases?: QuestionCase[];
    sessionToken?: number;
  } = {}) {
    if (!isCurrentSession(sessionToken)) {
      return;
    }

    onGameStateChange(GameState.LOADING_ROUND);
    setSelectedOption(null);
    hasAnsweredRef.current = false;
    opponentAnsweredRef.current = false;
    opponentResultRef.current = null;
    setHasAnswered(false);
    setOpponentAnswered(false);
    setOpponentResult(null);
    setTimeLeft(15);
    clearTimers();

    try {
      const caseData = mode === GameMode.DAILY_CHALLENGE
        ? cases[round - 1]
        : await fetchRandomCase(selectedQuestionBankIdRef.current);

      if (!caseData) {
        throw new Error('No case data available for this round.');
      }

      if (!isCurrentSession(sessionToken)) {
        return;
      }

      currentCaseRef.current = caseData;
      setCurrentCase(caseData);
      setShuffledOptions([...caseData.options].sort(() => Math.random() - 0.5));

      onGameStateChange(GameState.PLAYING);
      const nextRoundStartTime = Date.now();
      roundStartTimeRef.current = nextRoundStartTime;
      setRoundStartTime(nextRoundStartTime);
      startTimers(caseData.difficulty, mode, sessionToken);
    } catch (error) {
      console.error(error);
      if (!isCurrentSession(sessionToken)) {
        return;
      }

      retryTimerRef.current = window.setTimeout(() => {
        void loadRound({ mode, round, cases, sessionToken });
      }, 1000);
    }
  }

  function startSession() {
    sessionActiveRef.current = true;
    sessionTokenRef.current += 1;
    return sessionTokenRef.current;
  }

  function endSession() {
    sessionActiveRef.current = false;
    sessionTokenRef.current += 1;
    clearTimers();
    currentCaseRef.current = null;
    dailyChallengeCasesRef.current = [];
    battleStateRef.current = null;
    hasAnsweredRef.current = false;
    opponentAnsweredRef.current = false;
    opponentResultRef.current = null;
    setCurrentCase(null);
    setDailyChallengeCases([]);
    setBattleState(null);
    setSelectedOption(null);
    setHasAnswered(false);
    setOpponentAnswered(false);
    setOpponentResult(null);
  }

  function checkRoundEnd(playerRes: RoundResult) {
    const sessionToken = sessionTokenRef.current;
    const activeBattleState = battleStateRef.current;
    const activeCase = currentCaseRef.current;

    if (!sessionActiveRef.current || !activeBattleState || !activeCase) {
      return;
    }

    const finalize = () => {
      if (!isCurrentSession(sessionToken)) {
        return;
      }

      clearTimers();

      let finalOpponentRes = opponentResultRef.current;
      if (gameModeRef.current === GameMode.PVP_BATTLE && !finalOpponentRes) {
        const behavior = getBotBehavior(activeCase.difficulty);
        const timeTaken = (Date.now() - roundStartTimeRef.current) / 1000;
        const isCorrect = Math.random() < behavior.accuracy;
        finalOpponentRes = {
          questionId: 'bot',
          correct: isCorrect,
          timeTaken,
          score: calculateScore(isCorrect, timeTaken),
        };

        opponentResultRef.current = finalOpponentRes;
        opponentAnsweredRef.current = true;
        setOpponentResult(finalOpponentRes);
        setOpponentAnswered(true);
      } else if (gameModeRef.current !== GameMode.PVP_BATTLE) {
        finalOpponentRes = {
          questionId: 'dummy',
          correct: false,
          timeTaken: 0,
          score: 0,
        };
      }

      setBattleState((prev) => {
        if (!prev || !finalOpponentRes) {
          battleStateRef.current = prev;
          return prev;
        }

        const nextBattleState: BattleState = {
          ...prev,
          playerScore: prev.playerScore + playerRes.score,
          opponentScore: prev.opponentScore + finalOpponentRes.score,
          history: [...prev.history, { player: playerRes, opponent: finalOpponentRes }],
        };

        battleStateRef.current = nextBattleState;
        return nextBattleState;
      });

      onGameStateChange(GameState.ROUND_RESULT);
    };

    if (gameModeRef.current === GameMode.PVP_BATTLE && !opponentAnsweredRef.current) {
      roundEndTimerRef.current = window.setTimeout(finalize, 1000);
      return;
    }

    finalize();
  }

  function submitAnswer(option: string | null) {
    const activeCase = currentCaseRef.current;
    const activeBattleState = battleStateRef.current;

    if (!sessionActiveRef.current || hasAnsweredRef.current || !activeCase || !activeBattleState) {
      return;
    }

    hasAnsweredRef.current = true;
    setHasAnswered(true);
    setSelectedOption(option);

    const timeTaken = (Date.now() - roundStartTimeRef.current) / 1000;
    const isCorrect = option === activeCase.correctAnswer;
    const score = calculateScore(isCorrect, timeTaken);

    onAnswerSubmitted({
      mode: gameModeRef.current,
      questionId: activeCase.id,
      correct: isCorrect,
      timeTaken,
      selectedAnswer: option,
    });

    if (!isCorrect) {
      onWrongAnswer({
        mode: gameModeRef.current === GameMode.DAILY_CHALLENGE
          ? 'daily_challenge'
          : gameModeRef.current === GameMode.REVIEW_PRACTICE
            ? 'review_practice'
            : 'solo_streak',
        question: activeCase,
        selectedAnswer: option,
      });
    }

    checkRoundEnd({
      questionId: activeCase.id,
      correct: isCorrect,
      timeTaken,
      score,
      selectedAnswer: option,
    });
  }

  function handleTimeUp() {
    if (!sessionActiveRef.current) {
      return;
    }

    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!hasAnsweredRef.current) {
      submitAnswer(null);
    }
  }

  function startSolo() {
    const sessionToken = startSession();
    const initialBattleState: BattleState = {
      round: 1,
      totalRounds: 999,
      playerScore: 0,
      opponentScore: 0,
      opponent: { name: '训练机器人', avatar: '🤖', rating: 0 },
      history: [],
    };

    gameModeRef.current = GameMode.SOLO_STREAK;
    onSessionStarted(GameMode.SOLO_STREAK);
    dailyChallengeCasesRef.current = [];
    battleStateRef.current = initialBattleState;
    setGameMode(GameMode.SOLO_STREAK);
    setDailyChallengeCases([]);
    setBattleState(initialBattleState);
    void loadRound({ mode: GameMode.SOLO_STREAK, round: 1, cases: [], sessionToken });
  }

  function startPvP() {
    startSession();
    const initialBattleState: BattleState = {
      round: 1,
      totalRounds: 5,
      playerScore: 0,
      opponentScore: 0,
      opponent: generateOpponent(),
      history: [],
    };

    gameModeRef.current = GameMode.PVP_BATTLE;
    onSessionStarted(GameMode.PVP_BATTLE);
    dailyChallengeCasesRef.current = [];
    battleStateRef.current = initialBattleState;
    setGameMode(GameMode.PVP_BATTLE);
    setDailyChallengeCases([]);
    setBattleState(initialBattleState);
    onGameStateChange(GameState.MATCHMAKING);
  }

  async function startDailyChallenge() {
    const sessionToken = startSession();
    const cases = await fetchDailyChallengeCases(getTodayChallengeDateKey(), 5, selectedQuestionBankIdRef.current);
    if (!isCurrentSession(sessionToken)) {
      return;
    }

    const initialBattleState: BattleState = {
      round: 1,
      totalRounds: cases.length,
      playerScore: 0,
      opponentScore: 0,
      opponent: { name: '今日挑战', avatar: '📅', rating: 0 },
      history: [],
    };

    gameModeRef.current = GameMode.DAILY_CHALLENGE;
    onSessionStarted(GameMode.DAILY_CHALLENGE);
    dailyChallengeCasesRef.current = cases;
    battleStateRef.current = initialBattleState;
    setGameMode(GameMode.DAILY_CHALLENGE);
    setDailyChallengeCases(cases);
    setBattleState(initialBattleState);
    await loadRound({ mode: GameMode.DAILY_CHALLENGE, round: 1, cases, sessionToken });
  }

  function startWrongQuestionReview(entry: WrongQuestionEntry) {
    const sessionToken = startSession();
    const cases = [mapWrongQuestionEntryToCase(entry)];
    const initialBattleState: BattleState = {
      round: 1,
      totalRounds: cases.length,
      playerScore: 0,
      opponentScore: 0,
      opponent: { name: '错题复练', avatar: '📘', rating: 0 },
      history: [],
    };

    gameModeRef.current = GameMode.REVIEW_PRACTICE;
    onSessionStarted(GameMode.REVIEW_PRACTICE);
    dailyChallengeCasesRef.current = cases;
    battleStateRef.current = initialBattleState;
    setGameMode(GameMode.REVIEW_PRACTICE);
    setDailyChallengeCases(cases);
    setBattleState(initialBattleState);
    void loadRound({ mode: GameMode.REVIEW_PRACTICE, round: 1, cases, sessionToken });
  }

  function restartWrongQuestionReview() {
    const cases = dailyChallengeCasesRef.current;
    if (cases.length === 0) {
      return;
    }

    const sessionToken = startSession();
    const initialBattleState: BattleState = {
      round: 1,
      totalRounds: cases.length,
      playerScore: 0,
      opponentScore: 0,
      opponent: { name: '错题复练', avatar: '📘', rating: 0 },
      history: [],
    };

    gameModeRef.current = GameMode.REVIEW_PRACTICE;
    onSessionStarted(GameMode.REVIEW_PRACTICE);
    battleStateRef.current = initialBattleState;
    setGameMode(GameMode.REVIEW_PRACTICE);
    setBattleState(initialBattleState);
    void loadRound({ mode: GameMode.REVIEW_PRACTICE, round: 1, cases, sessionToken });
  }

  function onMatchFound() {
    void loadRound({ mode: GameMode.PVP_BATTLE, round: 1, sessionToken: sessionTokenRef.current });
  }

  function nextRound() {
    if (!sessionActiveRef.current) {
      return;
    }

    const activeBattleState = battleStateRef.current;

    if (!activeBattleState) {
      return;
    }

    const correctCount = activeBattleState.history.filter((entry) => entry.player.correct).length;

    if (gameModeRef.current === GameMode.PVP_BATTLE && activeBattleState.round >= activeBattleState.totalRounds) {
      onSessionCompleted({
        mode: GameMode.PVP_BATTLE,
        score: activeBattleState.playerScore,
        correctCount,
        totalQuestions: activeBattleState.totalRounds,
      });
      onGameStateChange(GameState.GAME_OVER);
      return;
    }

    if (gameModeRef.current === GameMode.DAILY_CHALLENGE && activeBattleState.round >= activeBattleState.totalRounds) {
      onSessionCompleted({
        mode: GameMode.DAILY_CHALLENGE,
        score: activeBattleState.playerScore,
        correctCount,
        totalQuestions: activeBattleState.totalRounds,
      });
      onDailyChallengeComplete({
        score: activeBattleState.playerScore,
        correctCount,
        totalQuestions: activeBattleState.totalRounds,
        history: activeBattleState.history.map((entry) => entry.player),
        cases: dailyChallengeCasesRef.current,
      });
      onGameStateChange(GameState.GAME_OVER);
      return;
    }

    if (gameModeRef.current === GameMode.REVIEW_PRACTICE && activeBattleState.round >= activeBattleState.totalRounds) {
      onSessionCompleted({
        mode: GameMode.REVIEW_PRACTICE,
        score: activeBattleState.playerScore,
        correctCount,
        totalQuestions: activeBattleState.totalRounds,
      });
      onGameStateChange(GameState.GAME_OVER);
      return;
    }

    if (
      gameModeRef.current === GameMode.SOLO_STREAK &&
      activeBattleState.history[activeBattleState.history.length - 1]?.player.correct === false
    ) {
      const totalAnswered = activeBattleState.history.length;
      const correctAnswers = correctCount;
      onSessionCompleted({
        mode: GameMode.SOLO_STREAK,
        score: correctAnswers,
        correctCount: correctAnswers,
        totalQuestions: totalAnswered,
      });
      onSoloRunComplete({
        streakCount: correctAnswers,
        totalAnswered,
        correctAnswers,
        history: activeBattleState.history.map((entry) => entry.player),
      });
      onGameStateChange(GameState.GAME_OVER);
      return;
    }

    const nextRoundNumber = activeBattleState.round + 1;
    setBattleState((prev) => {
      if (!prev) {
        battleStateRef.current = prev;
        return prev;
      }

      const nextBattleState = {
        ...prev,
        round: nextRoundNumber,
      };

      battleStateRef.current = nextBattleState;
      return nextBattleState;
    });

    void loadRound({
      mode: gameModeRef.current,
      round: nextRoundNumber,
      cases: dailyChallengeCasesRef.current,
      sessionToken: sessionTokenRef.current,
    });
  }

  return {
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
    endSession,
    onMatchFound,
    submitAnswer,
    nextRound,
  };
};
