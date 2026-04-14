import React from 'react';
import { BattleState, GameMode, PlayerProfile, QuestionCase } from '../types';
import { Button } from './Button';
import { QuestionMetaPanel } from './QuestionMetaPanel';

interface GameScreenProps {
  currentCase: QuestionCase;
  battleState: BattleState;
  gameMode: GameMode;
  selectedQuestionBankLabel: string;
  playerIdentity: Pick<PlayerProfile, 'name' | 'avatar'>;
  timeLeft: number;
  opponentAnswered: boolean;
  hasAnswered: boolean;
  selectedOption: string | null;
  shuffledOptions: string[];
  onSubmitAnswer: (option: string | null) => void;
  onNextRound: () => void;
  onExit: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  currentCase,
  battleState,
  gameMode,
  selectedQuestionBankLabel,
  playerIdentity,
  timeLeft,
  opponentAnswered,
  hasAnswered,
  selectedOption,
  shuffledOptions,
  onSubmitAnswer,
  onNextRound,
  onExit,
}) => {
  const [exitConfirmOpen, setExitConfirmOpen] = React.useState(false);
  const latestHistoryEntry = battleState.history[battleState.history.length - 1];
  const isDaily = gameMode === GameMode.DAILY_CHALLENGE;
  const isReview = gameMode === GameMode.REVIEW_PRACTICE;
  const answeredCount = battleState.history.length;
  const correctCount = battleState.history.filter((entry) => entry.player.correct).length;
  const isLastFixedRound = gameMode !== GameMode.SOLO_STREAK && battleState.round >= battleState.totalRounds;
  const soloRunEnded = gameMode === GameMode.SOLO_STREAK && latestHistoryEntry?.player.correct === false;
  const isGeneratedPlaceholderImage = currentCase.imageUrl.startsWith('data:image/svg+xml');
  const hasVisualCase = Boolean(currentCase.imageUrl) && !isGeneratedPlaceholderImage;
  const todayLabel = new Date().toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
  const nextActionLabel = isLastFixedRound
    ? isDaily ? '查看挑战结果' : isReview ? '查看复练结果' : '查看对战结果'
    : soloRunEnded
      ? '查看本局结果'
      : '继续下一题';
  const ScoreBar = () => (
    <div
      className="bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-12 shadow-sm relative z-20 shrink-0"
      style={{
        minHeight: 'max(64px, calc(64px + var(--safe-top)))',
        paddingTop: 'max(8px, var(--safe-top))',
      }}
    >
      <div className="flex items-center space-x-2 md:space-x-4">
        <button
          onClick={() => setExitConfirmOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#e9ebf0] px-3 py-2 text-xs md:text-sm font-semibold text-slate-700 transition hover:bg-[#dfe3ea] hover:text-slate-900"
          aria-label="退出挑战"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 18l-6-6 6-6" />
          </svg>
          <span>退出挑战</span>
        </button>
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-base md:text-xl shadow-sm text-blue-700">
          {playerIdentity.avatar}
        </div>
        <div>
          <div className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider">{playerIdentity.name}</div>
          <div className="text-lg md:text-xl font-display font-bold text-slate-800 tabular-nums">{battleState.playerScore}</div>
        </div>
      </div>

      <div className="flex flex-col items-center bg-slate-50 px-4 py-1.5 md:px-6 md:py-2 rounded-xl border border-slate-200">
        <div className="text-xl md:text-2xl font-display font-black tabular-nums text-slate-800">
          {hasAnswered ? (
            <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-slate-400">本轮结束</span>
          ) : (
            <span className={`${timeLeft <= 5 ? 'text-red-500' : 'text-slate-800'}`}>00:{timeLeft.toString().padStart(2, '0')}</span>
          )}
        </div>
        <div className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
          第 {battleState.round} 轮{gameMode !== GameMode.SOLO_STREAK ? ` / ${battleState.totalRounds}` : ''}
        </div>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4 flex-row-reverse space-x-reverse">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-base md:text-xl shadow-sm relative">
          {battleState.opponent.avatar}
          {!hasAnswered && gameMode === GameMode.PVP_BATTLE && (
            <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border-2 border-white ${opponentAnswered ? 'bg-green-500' : 'bg-slate-300'}`}></div>
          )}
        </div>
        <div className="text-right">
          <div className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider">{battleState.opponent.name}</div>
          <div className="text-lg md:text-xl font-display font-bold text-slate-800 tabular-nums">{battleState.opponentScore}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <ScoreBar />

      {exitConfirmOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/20 backdrop-blur-xl p-4">
          <div className="w-full max-w-sm rounded-[28px] border border-white/80 bg-white/88 shadow-[0_22px_80px_rgba(15,23,42,0.18)] backdrop-blur-2xl p-6 animate-fade-in">
            <div className="w-12 h-12 rounded-[18px] bg-[#fff1f2] text-[#ff3b30] flex items-center justify-center text-2xl mb-4">
              !
            </div>
            <h3 className="text-[26px] leading-none font-display font-bold text-slate-900">确认退出挑战？</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              当前对局进度不会继续保留。确认后将直接返回首页。
            </p>
            <div className="mt-6 space-y-3">
              <Button onClick={onExit} variant="danger" className="w-full">
                确认退出
              </Button>
              <Button onClick={() => setExitConfirmOpen(false)} variant="secondary" className="w-full">
                继续挑战
              </Button>
            </div>
          </div>
        </div>
      )}

      {(isDaily || isReview) && (
        <div className="border-b border-amber-100 bg-[linear-gradient(135deg,rgba(251,191,36,0.10),rgba(245,158,11,0.04))] px-4 md:px-12 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] font-bold text-amber-500">
                {isDaily ? 'Daily Challenge' : 'Review Practice'}
              </div>
              <div className="text-xl md:text-2xl font-display font-black text-slate-900 mt-1">
                {isDaily ? '今日挑战' : '错题复练'}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                {isDaily ? todayLabel : '针对最近失误题目的定向复习'}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 lg:min-w-[430px]">
              <div className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur p-3">
                <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">当前进度</div>
                <div className="text-xl font-black text-slate-900 mt-1">
                  {battleState.round}/{battleState.totalRounds}
                </div>
                <div className="text-xs text-slate-500">{isDaily ? '固定题组' : '当前复练'}</div>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur p-3">
                <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">累计得分</div>
                <div className="text-xl font-black text-amber-600 mt-1">{battleState.playerScore}</div>
                <div className="text-xs text-slate-500">{isDaily ? '本轮前总分' : '本次复练'}</div>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur p-3">
                <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">已答对</div>
                <div className="text-xl font-black text-emerald-600 mt-1">{correctCount}</div>
                <div className="text-xs text-slate-500">{answeredCount} 题已完成</div>
              </div>
            </div>
          </div>

        </div>
      )}

      <div className={`flex-1 flex overflow-hidden relative ${hasVisualCase ? 'flex-col md:flex-row' : 'flex-col'}`}>
        {opponentAnswered && !hasAnswered && gameMode === GameMode.PVP_BATTLE && (
          <div className="absolute top-4 right-4 z-50 bg-white text-slate-800 text-xs font-bold py-2 px-4 rounded-full shadow-lg border border-slate-100 animate-bounce flex items-center space-x-2">
            <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
            <span>对手已作答！</span>
          </div>
        )}

        {hasVisualCase ? (
          <div className="h-[35vh] md:h-auto md:flex-1 bg-slate-900 relative flex items-center justify-center overflow-hidden p-4 shrink-0">
            <img
              src={currentCase.imageUrl}
              alt="Case"
              className="max-w-full max-h-full object-contain rounded shadow-2xl bg-black"
            />
          </div>
        ) : null}

        <div className={`bg-white flex flex-col z-10 shadow-xl overflow-hidden ${
          hasVisualCase
            ? 'flex-1 md:flex-none w-full md:w-[450px] border-t md:border-t-0 md:border-l border-slate-200'
            : 'flex-1 border-t border-slate-200'
        }`}>
          <div className={`flex-1 overflow-y-auto ${hasVisualCase ? 'p-6 md:p-8' : 'px-4 md:px-12 py-6 md:py-8'}`}>
            <div className={hasVisualCase ? '' : 'max-w-5xl mx-auto'}>
            <div className="mb-6 md:mb-8">
              {(isDaily || isReview) && (
                <div className="mb-4 rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-500">Challenge Status</div>
                      <div className="text-sm font-bold text-slate-900 mt-1">
                        {isDaily ? '所有人今天做的是同一套题，速度和稳定性都会影响最终排名。' : '复练模式只聚焦这道错题，优先把题干、答案和解析重新吃透。'}
                      </div>
                      <div className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 border border-amber-100">
                        当前题库：{selectedQuestionBankLabel}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">剩余题数</div>
                      <div className="text-lg font-black text-slate-900 mt-1">
                        {Math.max(battleState.totalRounds - battleState.round, 0)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 mb-2 md:mb-3">
                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-md text-[9px] md:text-[10px] font-bold uppercase tracking-wider">
                  {currentCase.category}
                </span>
                <span className={`px-2.5 py-1 rounded-md text-[9px] md:text-[10px] font-bold uppercase tracking-wider border ${
                  currentCase.difficulty === 'Hard'
                    ? 'text-red-600 bg-red-50 border-red-100'
                    : currentCase.difficulty === 'Medium'
                      ? 'text-orange-600 bg-orange-50 border-orange-100'
                    : 'text-green-600 bg-green-50 border-green-100'
                }`}>
                  {currentCase.difficulty === 'Hard' ? '困难' : currentCase.difficulty === 'Medium' ? '中等' : '简单'}
                </span>
                {!hasVisualCase && (
                  <span className="px-2.5 py-1 rounded-md text-[9px] md:text-[10px] font-bold uppercase tracking-wider border border-blue-100 bg-blue-50 text-blue-600">
                    文字题
                  </span>
                )}
              </div>
              {hasVisualCase ? (
                <p className="text-slate-700 text-base md:text-lg font-medium leading-relaxed">{currentCase.description}</p>
              ) : (
                <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.04)] p-5 md:p-7">
                  <div className="text-[11px] uppercase tracking-[0.2em] font-bold text-slate-400">Question Stem</div>
                  <p className="mt-4 text-xl md:text-[28px] leading-relaxed font-display font-bold text-slate-900">
                    {currentCase.description}
                  </p>
                </div>
              )}
            </div>

            <div className={`${hasVisualCase ? 'space-y-2 md:space-y-3' : 'grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4'}`}>
              {shuffledOptions.map((opt, idx) => {
                let statusClass = 'border-slate-200 bg-white hover:border-blue-400 hover:bg-slate-50';

                if (hasAnswered) {
                  if (opt === currentCase.correctAnswer) {
                    statusClass = 'border-green-500 bg-green-50 text-green-800 shadow-[inset_0_0_0_1px_rgba(34,197,94,1)]';
                  } else if (opt === selectedOption) {
                    statusClass = 'border-red-500 bg-red-50 text-red-800 shadow-[inset_0_0_0_1px_rgba(239,68,68,1)]';
                  } else {
                    statusClass = 'border-slate-100 bg-slate-50 text-slate-400';
                  }
                } else {
                  statusClass += ' cursor-pointer shadow-sm active:scale-[0.99]';
                }

                return (
                  <div
                    key={idx}
                    onClick={() => !hasAnswered && onSubmitAnswer(opt)}
                    className={`relative rounded-xl border transition-all duration-200 ${hasVisualCase ? 'p-3 md:p-4' : 'p-4 md:p-5'} ${statusClass}`}
                  >
                    <div className="flex items-center">
                      <div className={`rounded-lg flex items-center justify-center mr-3 md:mr-4 text-xs md:text-sm font-bold border ${
                        hasVisualCase ? 'w-6 h-6 md:w-8 md:h-8' : 'w-8 h-8 md:w-10 md:h-10'
                      } ${
                        hasAnswered && opt === currentCase.correctAnswer
                          ? 'bg-green-100 border-green-200 text-green-700'
                          : 'bg-slate-100 border-slate-200 text-slate-500'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className={`${hasVisualCase ? 'text-xs md:text-sm' : 'text-sm md:text-base'} font-semibold leading-relaxed`}>{opt}</span>
                    </div>

                    {hasAnswered && gameMode === GameMode.PVP_BATTLE && latestHistoryEntry?.opponent.correct && opt === currentCase.correctAnswer && (
                      <div className="absolute -right-2 -top-2 w-5 h-5 md:w-6 md:h-6 bg-rose-500 text-white rounded-full border-2 border-white shadow-sm flex items-center justify-center text-[10px] md:text-xs" title="Opponent chose this">
                        {battleState.opponent.avatar}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6">
              <QuestionMetaPanel item={currentCase} compact title="病例资料卡" />
            </div>

            {hasAnswered && latestHistoryEntry && (
              <div className="mt-6 md:mt-8 animate-fade-in pb-4">
                <div className="bg-slate-50 p-4 md:p-5 rounded-xl border border-slate-200 mb-6">
                  <h4 className="text-slate-900 text-[10px] md:text-xs font-bold uppercase mb-2 flex items-center">
                    <svg className="w-3 h-3 md:w-4 md:h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    解析
                  </h4>
                  <p className="text-xs md:text-sm text-slate-600 leading-relaxed">{currentCase.explanation}</p>
                </div>

                <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                  <div>
                    <div className="text-[9px] md:text-[10px] text-slate-400 uppercase font-bold">你获得</div>
                    <div className={`font-display font-bold text-xl md:text-2xl ${selectedOption === currentCase.correctAnswer ? 'text-green-600' : 'text-slate-300'}`}>
                      +{latestHistoryEntry.player.score}
                    </div>
                  </div>
                  <div className="h-8 w-px bg-slate-200"></div>
                  <div className="text-right">
                    <div className="text-[9px] md:text-[10px] text-slate-400 uppercase font-bold">
                      {isDaily ? '累计总分' : '对手'}
                    </div>
                    <div className={`font-display font-bold text-xl md:text-2xl ${latestHistoryEntry.opponent.score > 0 ? 'text-rose-500' : 'text-slate-300'}`}>
                      {isDaily || isReview ? battleState.playerScore : `+${latestHistoryEntry.opponent.score}`}
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>

          <div
            className="p-4 md:p-6 border-t border-slate-100 bg-white shrink-0"
            style={{
              paddingBottom: 'max(16px, var(--safe-bottom))',
            }}
          >
            {hasAnswered && (
              <Button onClick={onNextRound} className="w-full py-3 md:py-4 text-sm md:text-base shadow-lg shadow-blue-500/20">
                {nextActionLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
