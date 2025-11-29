
import React, { useState, useEffect, useRef } from 'react';
import { GameState, GameMode, QuestionCase, BattleState, RoundResult } from './types';
import { fetchRandomCase } from './services/data';
import { generateOpponent, getBotBehavior, calculateScore } from './services/bot';
import { getBestRating, getBestStreak, saveBestRating, saveBestStreak } from './services/storage';
import { Button } from './components/Button';
import { Matchmaking } from './components/Matchmaking';
import { LoadingScreen } from './components/LoadingScreen';
import { Leaderboard } from './components/Leaderboard';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.SOLO_STREAK);
  
  // Game Data
  const [currentCase, setCurrentCase] = useState<QuestionCase | null>(null);
  
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

  // Records
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [bestRating, setBestRating] = useState<number>(0);
  const [recordMessage, setRecordMessage] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState<{ accuracy: number; avgTime: number } | null>(null);

  // Timers
  const timerRef = useRef<number | null>(null);
  const botTimerRef = useRef<number | null>(null);

  // --- Game Loop Control ---

  const startSolo = () => {
    setGameMode(GameMode.SOLO_STREAK);
    setRecordMessage(null);
    setSessionStats(null);
    setBattleState({
      round: 1,
      totalRounds: 999, // Infinite
      playerScore: 0,
      opponentScore: 0,
      opponent: { name: "Training Bot", avatar: "🤖", rating: 0 },
      history: []
    });
    loadRound();
  };

  const startPvP = () => {
    setGameMode(GameMode.PVP_BATTLE);
    setRecordMessage(null);
    setSessionStats(null);
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

  useEffect(() => {
    setBestStreak(getBestStreak());
    setBestRating(getBestRating());

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, []);

  const onMatchFound = () => {
    loadRound();
  };

  const loadRound = async () => {
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
      const caseData = await fetchRandomCase();
      setCurrentCase(caseData);
      setShuffledOptions([...caseData.options].sort(() => Math.random() - 0.5));
      
      // Start Round
      setGameState(GameState.PLAYING);
      setRoundStartTime(Date.now());
      startTimers(caseData.difficulty);
    } catch (error) {
      console.error(error);
      // Retry
      setTimeout(loadRound, 1000);
    }
  };

  const startTimers = (difficulty: 'Easy' | 'Medium' | 'Hard') => {
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
    if (gameMode === GameMode.PVP_BATTLE && battleState) {
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

    // Save Player Result (Wait for bot if necessary)
    checkRoundEnd({
      questionId: currentCase.id,
      correct: isCorrect,
      timeTaken,
      score
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
      } else if (gameMode === GameMode.SOLO_STREAK) {
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
      finalizeSession(battleState);
    } else if (gameMode === GameMode.SOLO_STREAK && battleState.history[battleState.history.length - 1].player.correct === false) {
      finalizeSession(battleState); // Streak ends
    } else {
      setBattleState(prev => prev ? ({ ...prev, round: prev.round + 1 }) : null);
      loadRound();
    }
  };

  const getSoloStreakLength = (history: BattleState['history']) => {
    const firstFailure = history.findIndex(round => !round.player.correct);
    return firstFailure === -1 ? history.length : firstFailure;
  };

  const finalizeSession = (finalState: BattleState) => {
    const roundsPlayed = finalState.history.length;
    const correctRounds = finalState.history.filter(r => r.player.correct).length;
    const totalTime = finalState.history.reduce((acc, r) => acc + r.player.timeTaken, 0);
    const avgTime = roundsPlayed ? totalTime / roundsPlayed : 0;
    setSessionStats({
      accuracy: roundsPlayed ? Math.round((correctRounds / roundsPlayed) * 100) : 0,
      avgTime: Number(avgTime.toFixed(1))
    });

    if (gameMode === GameMode.SOLO_STREAK) {
      const streak = getSoloStreakLength(finalState.history);
      const previousBest = bestStreak;
      const updatedBest = Math.max(previousBest, streak);
      if (updatedBest !== previousBest) {
        setRecordMessage(`New personal best streak: ${updatedBest}`);
        saveBestStreak(updatedBest);
        setBestStreak(updatedBest);
      } else {
        setRecordMessage(null);
      }
    } else {
      const previousBest = bestRating;
      const updatedBest = Math.max(previousBest, finalState.playerScore);
      if (updatedBest !== previousBest) {
        setRecordMessage(`New best battle rating: ${updatedBest}`);
        saveBestRating(updatedBest);
        setBestRating(updatedBest);
      } else {
        setRecordMessage(null);
      }
    }

    setGameState(GameState.GAME_OVER);
  };

  // --- Views ---

  const renderMenu = () => (
    <div className="flex flex-col items-center justify-start md:justify-center min-h-screen px-4 py-8 md:py-12 relative overflow-x-hidden w-full">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] right-[-5%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-blue-100 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-teal-100 rounded-full blur-3xl opacity-50"></div>
        </div>

      <div className="text-center mb-8 md:mb-16 animate-fade-in w-full max-w-4xl mx-auto mt-8 md:mt-0">
        <div className="inline-flex items-center justify-center p-2.5 md:p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 mb-4 md:mb-6">
            <span className="text-3xl md:text-4xl">🩺</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight text-slate-900 mb-3 break-words leading-tight">
          MedScan<span className="text-blue-600">Challenge</span>
        </h1>
        <p className="text-slate-500 text-base md:text-xl max-w-2xl mx-auto font-medium px-2 leading-snug">
          The premier platform for testing medical diagnostic skills.
        </p>
        <div className="mt-4 flex flex-col md:flex-row gap-3 md:gap-4 items-center justify-center text-xs md:text-sm text-slate-500 font-semibold">
          <span className="px-3 py-2 bg-white border border-slate-100 rounded-xl shadow-sm">🏅 Best Streak: {bestStreak} cases</span>
          <span className="px-3 py-2 bg-white border border-slate-100 rounded-xl shadow-sm">🎯 Best Arena Score: {bestRating}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-5xl w-full animate-fade-in relative z-10 px-2 md:px-0" style={{animationDelay: '0.1s'}}>
        {/* Solo Module */}
        <div 
          onClick={startSolo}
          className="group cursor-pointer relative bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:shadow-blue-200/50 hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1"
        >
           <div className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-blue-50 text-blue-600 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
               <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
           </div>
           <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-4 md:mb-6 text-blue-600 group-hover:scale-110 transition-transform duration-300">
             🧩
           </div>
           <h3 className="text-xl md:text-2xl font-display font-bold text-slate-900 mb-2">Solo Streak</h3>
           <p className="text-slate-500 text-sm md:text-base mb-4 md:mb-6 leading-relaxed">
             Test your endurance in an infinite streak mode. One mistake ends the run. How far can you go?
           </p>
           <div className="flex items-center text-xs md:text-sm font-semibold text-blue-600 uppercase tracking-wide">
             Start Solo Session
           </div>
        </div>

        {/* Battle Module */}
        <div 
          onClick={startPvP}
          className="group cursor-pointer relative bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:shadow-rose-200/50 hover:border-rose-200 transition-all duration-300 transform hover:-translate-y-1"
        >
           <div className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-rose-50 text-rose-600 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
               <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
           </div>
           <div className="w-12 h-12 md:w-16 md:h-16 bg-rose-100 rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-4 md:mb-6 text-rose-600 group-hover:scale-110 transition-transform duration-300">
             ⚔️
           </div>
           <h3 className="text-xl md:text-2xl font-display font-bold text-slate-900 mb-2">Ranked Battle</h3>
           <p className="text-slate-500 text-sm md:text-base mb-4 md:mb-6 leading-relaxed">
             Compete 1v1 against AI opponents in a 5-round speed match. Accuracy and reaction time are key.
           </p>
           <div className="flex items-center text-xs md:text-sm font-semibold text-rose-600 uppercase tracking-wide">
             Enter Arena
           </div>
        </div>
      </div>
      
      {/* Footer / Leaderboard Button */}
      <div className="mt-8 md:mt-12 flex flex-col items-center justify-center animate-fade-in w-full mb-4" style={{animationDelay: '0.2s'}}>
         <button 
           onClick={() => setGameState(GameState.LEADERBOARD)}
           className="flex items-center space-x-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm text-sm md:text-base mb-8"
         >
           <span>🏆</span>
           <span>View Global Rankings</span>
         </button>

         <footer className="text-slate-400 text-[10px] md:text-sm font-medium text-center px-4 leading-tight">
            © 2025 MedScan Challenge. Data simulated for educational purposes.
         </footer>
      </div>
    </div>
  );

  const renderGame = () => {
    if (!currentCase || !battleState) return null;
    const isResult = gameState === GameState.ROUND_RESULT;

    // Light Theme Score Bar
    const ScoreBar = () => (
      <div className="h-16 md:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-12 shadow-sm relative z-20 shrink-0">
        {/* Player */}
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-base md:text-xl shadow-sm text-blue-700">
            👤
          </div>
          <div>
            <div className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider">Player</div>
            <div className="text-lg md:text-xl font-display font-bold text-slate-800 tabular-nums">{battleState!.playerScore}</div>
          </div>
        </div>

        {/* Center Timer/Round */}
        <div className="flex flex-col items-center bg-slate-50 px-4 py-1.5 md:px-6 md:py-2 rounded-xl border border-slate-200">
            <div className="text-xl md:text-2xl font-display font-black tabular-nums text-slate-800">
              {isResult ? (
                 <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-slate-400">Round Complete</span>
              ) : (
                 <span className={`${timeLeft <= 5 ? 'text-red-500' : 'text-slate-800'}`}>00:{timeLeft.toString().padStart(2, '0')}</span>
              )}
            </div>
            <div className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Round {battleState!.round}{gameMode === GameMode.PVP_BATTLE ? ` / ${battleState!.totalRounds}` : ''}
            </div>
        </div>

        {/* Opponent */}
        <div className="flex items-center space-x-2 md:space-x-4 flex-row-reverse space-x-reverse">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-base md:text-xl shadow-sm relative">
            {battleState!.opponent.avatar}
            {!isResult && gameMode === GameMode.PVP_BATTLE && (
               <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border-2 border-white ${opponentAnswered ? 'bg-green-500' : 'bg-slate-300'}`}></div>
            )}
          </div>
          <div className="text-right">
            <div className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider">{battleState!.opponent.name}</div>
            <div className="text-lg md:text-xl font-display font-bold text-slate-800 tabular-nums">{battleState!.opponentScore}</div>
          </div>
        </div>
      </div>
    );

    return (
      <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
        <ScoreBar />
        
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
            {/* Feedback Toast */}
            {opponentAnswered && !hasAnswered && !isResult && gameMode === GameMode.PVP_BATTLE && (
                <div className="absolute top-4 right-4 z-50 bg-white text-slate-800 text-xs font-bold py-2 px-4 rounded-full shadow-lg border border-slate-100 animate-bounce flex items-center space-x-2">
                    <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                    <span>Opponent Answered!</span>
                </div>
            )}

            {/* Left: Image Area - Mobile fixed height, Desktop flex-1 */}
            <div className="h-[35vh] md:h-auto md:flex-1 bg-slate-900 relative flex items-center justify-center overflow-hidden p-4 shrink-0">
                <img 
                    src={currentCase.imageUrl} 
                    alt="Case" 
                    className="max-w-full max-h-full object-contain rounded shadow-2xl bg-black"
                />
            </div>

            {/* Right: Controls (Light) - Mobile flex-1, Desktop fixed width */}
            <div className="flex-1 md:flex-none w-full md:w-[450px] bg-white border-t md:border-t-0 md:border-l border-slate-200 flex flex-col z-10 shadow-xl overflow-hidden">
                <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                    <div className="mb-6 md:mb-8">
                        <div className="flex items-center gap-2 mb-2 md:mb-3">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-md text-[9px] md:text-[10px] font-bold uppercase tracking-wider">
                                {currentCase.category}
                            </span>
                            <span className={`px-2.5 py-1 rounded-md text-[9px] md:text-[10px] font-bold uppercase tracking-wider border ${currentCase.difficulty === 'Hard' ? 'text-red-600 bg-red-50 border-red-100' : currentCase.difficulty === 'Medium' ? 'text-orange-600 bg-orange-50 border-orange-100' : 'text-green-600 bg-green-50 border-green-100'}`}>
                                {currentCase.difficulty}
                            </span>
                        </div>
                        <p className="text-slate-700 text-base md:text-lg font-medium leading-relaxed">{currentCase.description}</p>
                    </div>

                    <div className="space-y-2 md:space-y-3">
                        {shuffledOptions.map((opt, idx) => {
                            let statusClass = "border-slate-200 bg-white hover:border-blue-400 hover:bg-slate-50";
                            
                            if (hasAnswered) {
                                if (opt === currentCase.correctAnswer) {
                                    statusClass = "border-green-500 bg-green-50 text-green-800 shadow-[inset_0_0_0_1px_rgba(34,197,94,1)]";
                                } else if (opt === selectedOption) {
                                    statusClass = "border-red-500 bg-red-50 text-red-800 shadow-[inset_0_0_0_1px_rgba(239,68,68,1)]";
                                } else {
                                    statusClass = "border-slate-100 bg-slate-50 text-slate-400";
                                }
                            } else {
                                statusClass += " cursor-pointer shadow-sm active:scale-[0.99]";
                            }

                            return (
                                <div 
                                    key={idx}
                                    onClick={() => !hasAnswered && submitAnswer(opt)}
                                    className={`relative p-3 md:p-4 rounded-xl border transition-all duration-200 ${statusClass}`}
                                >
                                    <div className="flex items-center">
                                        <div className={`w-6 h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center mr-3 md:mr-4 text-xs md:text-sm font-bold border ${hasAnswered && opt === currentCase.correctAnswer ? 'bg-green-100 border-green-200 text-green-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span className="font-semibold text-xs md:text-sm">{opt}</span>
                                    </div>
                                    
                                    {/* Opponent Selection Marker */}
                                    {isResult && gameMode === GameMode.PVP_BATTLE && battleState!.history[battleState!.history.length-1].opponent.correct && opt === currentCase.correctAnswer && (
                                        <div className="absolute -right-2 -top-2 w-5 h-5 md:w-6 md:h-6 bg-rose-500 text-white rounded-full border-2 border-white shadow-sm flex items-center justify-center text-[10px] md:text-xs" title="Opponent chose this">
                                            {battleState!.opponent.avatar}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {isResult && (
                        <div className="mt-6 md:mt-8 animate-fade-in pb-4">
                            <div className="bg-slate-50 p-4 md:p-5 rounded-xl border border-slate-200 mb-6">
                                <h4 className="text-slate-900 text-[10px] md:text-xs font-bold uppercase mb-2 flex items-center">
                                    <svg className="w-3 h-3 md:w-4 md:h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Explanation
                                </h4>
                                <p className="text-xs md:text-sm text-slate-600 leading-relaxed">{currentCase.explanation}</p>
                            </div>

                            {/* Round Summary Card */}
                            <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                                <div>
                                    <div className="text-[9px] md:text-[10px] text-slate-400 uppercase font-bold">You Earned</div>
                                    <div className={`font-display font-bold text-xl md:text-2xl ${selectedOption === currentCase.correctAnswer ? 'text-green-600' : 'text-slate-300'}`}>
                                        +{battleState!.history[battleState!.history.length-1].player.score}
                                    </div>
                                </div>
                                <div className="h-8 w-px bg-slate-200"></div>
                                <div className="text-right">
                                    <div className="text-[9px] md:text-[10px] text-slate-400 uppercase font-bold">Opponent</div>
                                    <div className={`font-display font-bold text-xl md:text-2xl ${battleState!.history[battleState!.history.length-1].opponent.score > 0 ? 'text-rose-500' : 'text-slate-300'}`}>
                                        +{battleState!.history[battleState!.history.length-1].opponent.score}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 md:p-6 border-t border-slate-100 bg-white shrink-0">
                    {isResult && (
                        <Button onClick={nextRound} className="w-full py-3 md:py-4 text-sm md:text-base shadow-lg shadow-blue-500/20">
                            Continue to Next Case
                        </Button>
                    )}
                </div>
            </div>
        </div>
      </div>
    );
  };

  const renderGameOver = () => {
    if (!battleState) return null;
    const playerWon = battleState.playerScore > battleState.opponentScore;
    const isPvP = gameMode === GameMode.PVP_BATTLE;
    const soloStreak = gameMode === GameMode.SOLO_STREAK ? getSoloStreakLength(battleState.history) : null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 overflow-y-auto">
            <div className="max-w-md w-full bg-white p-6 md:p-8 rounded-3xl shadow-2xl border border-slate-100 text-center animate-fade-in my-8">
                <div className="mb-6 md:mb-8">
                    <div className="text-5xl md:text-6xl mb-4 md:mb-6 shadow-sm inline-block p-4 rounded-full bg-slate-50">
                        {isPvP ? (playerWon ? '🏆' : '📉') : '🏁'}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-display font-extrabold text-slate-900 mb-2">
                        {isPvP ? (playerWon ? "Victory!" : "Match Lost") : "Session Ended"}
                    </h2>
                    <p className="text-slate-500 text-sm md:text-base font-medium">
                        {isPvP ? "Great effort in the arena." : "Good practice run."}
                    </p>
                    {recordMessage && (
                      <div className="mt-3 inline-flex items-center px-3 py-2 bg-green-50 text-green-700 rounded-xl border border-green-100 text-xs font-semibold">
                        <span className="mr-1">✨</span>{recordMessage}
                      </div>
                    )}
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 md:p-6 mb-6 md:mb-8">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider">Final Score</span>
                        <span className="text-3xl md:text-4xl font-display font-black text-slate-900">{battleState.playerScore}</span>
                    </div>
                    {gameMode === GameMode.SOLO_STREAK && soloStreak !== null && (
                      <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                        <span className="text-xs md:text-sm font-medium text-slate-500 flex items-center">
                          <span className="mr-2">🔥</span>Longest streak this run
                        </span>
                        <span className="text-lg md:text-xl font-bold text-blue-600">{soloStreak} cases</span>
                      </div>
                    )}
                    {sessionStats && (
                      <div className="grid grid-cols-2 gap-3 mt-4 text-left">
                        <div className="bg-white border border-slate-100 rounded-xl p-3">
                          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Accuracy</div>
                          <div className="text-lg md:text-xl font-display font-black text-slate-800">{sessionStats.accuracy}%</div>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-xl p-3">
                          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Avg Time</div>
                          <div className="text-lg md:text-xl font-display font-black text-slate-800">{sessionStats.avgTime}s</div>
                        </div>
                      </div>
                    )}
                    {isPvP && (
                        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                             <span className="text-xs md:text-sm font-medium text-slate-500 flex items-center">
                                 <span className="mr-2 text-base md:text-lg">{battleState.opponent.avatar}</span>
                                 {battleState.opponent.name}
                             </span>
                             <span className="text-lg md:text-xl font-bold text-rose-500">{battleState.opponentScore}</span>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <Button onClick={isPvP ? startPvP : startSolo} className="w-full">Play Again</Button>
                    <Button onClick={() => setGameState(GameState.MENU)} variant="secondary" className="w-full">Back to Menu</Button>
                </div>
            </div>
        </div>
    );
  };

  return (
    <>
      {gameState === GameState.MATCHMAKING && battleState && (
        <Matchmaking opponent={battleState.opponent} onMatchFound={onMatchFound} />
      )}
      {gameState === GameState.LEADERBOARD && (
        <Leaderboard onClose={() => setGameState(GameState.MENU)} />
      )}
      {gameState === GameState.MENU && renderMenu()}
      {gameState === GameState.LOADING_ROUND && (
        <LoadingScreen />
      )}
      {(gameState === GameState.PLAYING || gameState === GameState.ROUND_RESULT) && renderGame()}
      {gameState === GameState.GAME_OVER && renderGameOver()}
    </>
  );
};

export default App;
