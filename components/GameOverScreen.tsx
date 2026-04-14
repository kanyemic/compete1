import React from 'react';
import { BattleState, DailyChallengeRecord, GameMode } from '../types';
import { buildDailyChallengeResultForecast } from '../services/leaderboard';
import { Button } from './Button';

interface GameOverScreenProps {
  battleState: BattleState;
  gameMode: GameMode;
  bestSoloStreak: number;
  dailyChallengeRecord: DailyChallengeRecord | null;
  isGuest: boolean;
  onOpenProfile: () => void;
  onViewLeaderboard: () => void;
  onReplay: () => void;
  onBackToMenu: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  battleState,
  gameMode,
  bestSoloStreak,
  dailyChallengeRecord,
  isGuest,
  onOpenProfile,
  onViewLeaderboard,
  onReplay,
  onBackToMenu,
}) => {
  const playerWon = battleState.playerScore > battleState.opponentScore;
  const isPvP = gameMode === GameMode.PVP_BATTLE;
  const isDaily = gameMode === GameMode.DAILY_CHALLENGE;
  const isSolo = gameMode === GameMode.SOLO_STREAK;
  const isReview = gameMode === GameMode.REVIEW_PRACTICE;
  const correctCount = battleState.history.filter((entry) => entry.player.correct).length;
  const totalTimeSeconds = battleState.history.reduce((sum, entry) => sum + entry.player.timeTaken, 0);
  const accuracy = battleState.totalRounds > 0
    ? Math.round((correctCount / battleState.totalRounds) * 100)
    : 0;
  const totalTimeMs = Math.round(totalTimeSeconds * 1000);
  const todayLabel = new Date().toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
  const beatsTodayBest = isDaily && dailyChallengeRecord
    ? battleState.playerScore >= dailyChallengeRecord.score
    : false;
  const dailyForecast = isDaily
    ? buildDailyChallengeResultForecast({
        score: battleState.playerScore,
        totalTimeMs,
      })
    : null;
  const dailyForecastToneClass = dailyForecast?.tierTone === 'amber'
    ? 'bg-[#fff7e8] text-[#b45309]'
    : dailyForecast?.tierTone === 'emerald'
      ? 'bg-[#edfdf3] text-[#15803d]'
      : dailyForecast?.tierTone === 'blue'
        ? 'bg-[#eef6ff] text-[#0a84ff]'
        : 'bg-[#f1f5f9] text-slate-600';

  return (
    <div className="app-safe-screen min-h-screen flex items-center justify-center bg-slate-50 p-4 overflow-y-auto">
      <div className="max-w-md w-full bg-white p-6 md:p-8 rounded-3xl shadow-2xl border border-slate-100 text-center animate-fade-in my-8">
        <div className="mb-6 md:mb-8">
          <div className="text-5xl md:text-6xl mb-4 md:mb-6 shadow-sm inline-block p-4 rounded-full bg-slate-50">
            {isPvP ? (playerWon ? '🏆' : '📉') : isDaily ? '📅' : isReview ? '📘' : '🏁'}
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-extrabold text-slate-900 mb-2">
            {isPvP ? (playerWon ? '胜利！' : '比赛失败') : isDaily ? '今日挑战完成' : isReview ? '错题复练完成' : '会话结束'}
          </h2>
          <p className="text-slate-500 text-sm md:text-base font-medium">
            {isPvP ? '在竞技场表现出色。' : isDaily ? `你答对了 ${correctCount} / ${battleState.totalRounds} 题。` : isReview ? '这道错题已经完成一轮针对性复练。' : '不错的练习。'}
          </p>
        </div>

        {isDaily && (
          <div className="mb-6 md:mb-8 rounded-3xl border border-amber-100 bg-[linear-gradient(135deg,rgba(251,191,36,0.14),rgba(245,158,11,0.04))] p-5 text-left">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.24em] font-bold text-amber-500">Daily Challenge Result</div>
                <div className="text-lg font-display font-black text-slate-900 mt-2">今日挑战结果</div>
                <div className="text-sm text-slate-500 mt-1">{todayLabel}</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/80 border border-white/70 flex items-center justify-center text-2xl">📅</div>
            </div>
            <div className="mt-4 text-sm font-medium text-slate-600 leading-relaxed">
              {beatsTodayBest
                ? '这次成绩已经追平或刷新你今天的最好表现，可以直接去今日榜看位置。'
                : '今天已经有更高记录保存在本地，仍然可以去今日榜看看整体排名情况。'}
            </div>
            {dailyForecast && (
              <div className="mt-4 rounded-[28px] border border-white/90 bg-white/88 p-4 shadow-[0_10px_28px_rgba(245,158,11,0.08)]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${dailyForecastToneClass}`}>
                    {dailyForecast.tierLabel}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {dailyForecast.zoneLabel}
                  </span>
                </div>
                <div className="mt-3 text-sm font-semibold text-slate-900">
                  {dailyForecast.summary}
                </div>
                <div className="mt-2 text-sm leading-relaxed text-slate-500">
                  {dailyForecast.actionMessage}
                </div>
                {!isGuest && (
                  <div className="mt-4 rounded-2xl bg-[#f8fafc] px-4 py-3">
                    <div className="text-[11px] uppercase tracking-[0.2em] font-bold text-slate-400">Next Step</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">现在去今日榜，确认你的真实落点</div>
                    <div className="mt-1 text-sm text-slate-500">结果页先给你预估区间，榜单页再看准确名次、追赶差距和稳定性。</div>
                  </div>
                )}
              </div>
            )}
            {isGuest && (
              <div className="mt-4 rounded-2xl border border-blue-100 bg-white/80 p-4">
                <div className="text-sm font-bold text-slate-900">游客账号下一步建议先去个人中心</div>
                <div className="text-sm text-slate-500 mt-2 leading-relaxed">
                  登录或注册后，才能继续使用单人连胜、排行榜、错题本和完整成长记录。
                </div>
                <div className="mt-4">
                  <Button onClick={onOpenProfile} className="w-full">
                    去个人中心登录 / 注册
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 md:p-6 mb-6 md:mb-8">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider">最终得分</span>
            <span className="text-3xl md:text-4xl font-display font-black text-slate-900">{battleState.playerScore}</span>
          </div>
          {isPvP && (
            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <span className="text-xs md:text-sm font-medium text-slate-500 flex items-center">
                <span className="mr-2 text-base md:text-lg">{battleState.opponent.avatar}</span>
                {battleState.opponent.name}
              </span>
              <span className="text-lg md:text-xl font-bold text-rose-500">{battleState.opponentScore}</span>
            </div>
          )}
          {isDaily && dailyChallengeRecord && (
            <>
              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <span className="text-xs md:text-sm font-medium text-slate-500">今日最佳记录</span>
                <span className="text-lg md:text-xl font-bold text-amber-600">{dailyChallengeRecord.score} 分</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <span className="text-xs md:text-sm font-medium text-slate-500">正确率</span>
                <span className="text-lg md:text-xl font-bold text-slate-900">{accuracy}%</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <span className="text-xs md:text-sm font-medium text-slate-500">总耗时</span>
                <span className="text-lg md:text-xl font-bold text-slate-900">{totalTimeSeconds.toFixed(1)} 秒</span>
              </div>
            </>
          )}
          {isSolo && (
            <>
              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <span className="text-xs md:text-sm font-medium text-slate-500">历史最佳连胜</span>
                <span className="text-lg md:text-xl font-bold text-blue-600">{bestSoloStreak}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <span className="text-xs md:text-sm font-medium text-slate-500">本次答对</span>
                <span className="text-lg md:text-xl font-bold text-slate-900">{correctCount} 题</span>
              </div>
            </>
          )}
          {isReview && (
            <>
              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <span className="text-xs md:text-sm font-medium text-slate-500">复练结果</span>
                <span className={`text-lg md:text-xl font-bold ${correctCount > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {correctCount > 0 ? '已纠正' : '仍需复盘'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <span className="text-xs md:text-sm font-medium text-slate-500">总耗时</span>
                <span className="text-lg md:text-xl font-bold text-slate-900">{totalTimeSeconds.toFixed(1)} 秒</span>
              </div>
            </>
          )}
        </div>

        <div className="space-y-3">
          {!isPvP && !isReview && !isGuest && (
            <Button onClick={onViewLeaderboard} className="w-full">
              {isDaily ? '去今日榜确认名次' : '查看连胜榜'}
            </Button>
          )}
          <Button onClick={onReplay} variant={!isPvP ? 'secondary' : 'primary'} className="w-full">再玩一次</Button>
          <Button onClick={onBackToMenu} variant="secondary" className="w-full">返回菜单</Button>
        </div>
      </div>
    </div>
  );
};
