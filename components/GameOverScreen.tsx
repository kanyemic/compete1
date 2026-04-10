import React from 'react';
import { BattleState, DailyChallengeRecord, GameMode } from '../types';
import { Button } from './Button';

interface GameOverScreenProps {
  battleState: BattleState;
  gameMode: GameMode;
  bestSoloStreak: number;
  dailyChallengeRecord: DailyChallengeRecord | null;
  onReplay: () => void;
  onBackToMenu: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  battleState,
  gameMode,
  bestSoloStreak,
  dailyChallengeRecord,
  onReplay,
  onBackToMenu,
}) => {
  const playerWon = battleState.playerScore > battleState.opponentScore;
  const isPvP = gameMode === GameMode.PVP_BATTLE;
  const isDaily = gameMode === GameMode.DAILY_CHALLENGE;
  const isSolo = gameMode === GameMode.SOLO_STREAK;
  const correctCount = battleState.history.filter((entry) => entry.player.correct).length;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 overflow-y-auto">
      <div className="max-w-md w-full bg-white p-6 md:p-8 rounded-3xl shadow-2xl border border-slate-100 text-center animate-fade-in my-8">
        <div className="mb-6 md:mb-8">
          <div className="text-5xl md:text-6xl mb-4 md:mb-6 shadow-sm inline-block p-4 rounded-full bg-slate-50">
            {isPvP ? (playerWon ? '🏆' : '📉') : isDaily ? '📅' : '🏁'}
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-extrabold text-slate-900 mb-2">
            {isPvP ? (playerWon ? '胜利！' : '比赛失败') : isDaily ? '今日挑战完成' : '会话结束'}
          </h2>
          <p className="text-slate-500 text-sm md:text-base font-medium">
            {isPvP ? '在竞技场表现出色。' : isDaily ? `你答对了 ${correctCount} / ${battleState.totalRounds} 题。` : '不错的练习。'}
          </p>
        </div>

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
            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <span className="text-xs md:text-sm font-medium text-slate-500">今日最佳记录</span>
              <span className="text-lg md:text-xl font-bold text-amber-600">{dailyChallengeRecord.score} 分</span>
            </div>
          )}
          {isSolo && (
            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <span className="text-xs md:text-sm font-medium text-slate-500">历史最佳连胜</span>
              <span className="text-lg md:text-xl font-bold text-blue-600">{bestSoloStreak}</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Button onClick={onReplay} className="w-full">再玩一次</Button>
          <Button onClick={onBackToMenu} variant="secondary" className="w-full">返回菜单</Button>
        </div>
      </div>
    </div>
  );
};
