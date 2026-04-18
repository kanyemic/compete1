import React from 'react';
import { DailyChallengeRecord, TrainingHistoryEntry } from '../types';

interface MenuScreenProps {
  bestSoloStreak: number;
  dailyChallengeRecord: DailyChallengeRecord | null;
  latestTrainingRecord: TrainingHistoryEntry | null;
  activeDaysThisWeek: number;
  profileEntryLabel: string;
  onStartSolo: () => void;
  onStartDailyChallenge: () => void;
  onStartPvP: () => void;
  onOpenProfile: () => void;
  onOpenLeaderboard: () => void;
  onOpenWrongQuestions: () => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
  bestSoloStreak,
  dailyChallengeRecord,
  latestTrainingRecord,
  activeDaysThisWeek,
  profileEntryLabel,
  onStartSolo,
  onStartDailyChallenge,
  onStartPvP,
  onOpenProfile,
  onOpenLeaderboard,
  onOpenWrongQuestions,
}) => {
  const recentSummary = latestTrainingRecord
    ? latestTrainingRecord.mode === 'daily_challenge'
      ? `最近一次每日挑战拿到 ${latestTrainingRecord.score} 分，答对 ${latestTrainingRecord.correctCount}/${latestTrainingRecord.totalQuestions} 题。`
      : `最近一次单人连胜完成 ${latestTrainingRecord.score} 连胜，共答 ${latestTrainingRecord.totalQuestions} 题。`
    : '还没有训练记录，先从一局单人连胜开始热身。';

  return (
    <div className="app-safe-screen relative flex min-h-screen w-full flex-col items-center justify-start overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.10),_transparent_38%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-8 md:justify-center md:py-12">
      <div
        className="absolute right-4 top-4 z-30 flex flex-col items-end gap-2 rounded-[24px] border border-white/80 bg-white/86 p-2 shadow-[0_14px_36px_rgba(15,23,42,0.10)] backdrop-blur-xl md:hidden"
        style={{ top: 'max(16px, calc(var(--safe-top) + 12px))' }}
      >
        <button
          onClick={onOpenProfile}
          className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#f2f2f7] text-lg text-slate-700 shadow-sm transition-all hover:bg-[#e8e9ef]"
          aria-label={profileEntryLabel}
        >
          <span>👤</span>
        </button>

        <button
          onClick={onOpenLeaderboard}
          className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#f2f2f7] text-lg text-slate-700 shadow-sm transition-all hover:bg-[#e8e9ef]"
          aria-label="查看全球排名"
        >
          <span>🏆</span>
        </button>

        <button
          onClick={onOpenWrongQuestions}
          className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#f2f2f7] text-lg text-slate-700 shadow-sm transition-all hover:bg-[#e8e9ef]"
          aria-label="查看错题本"
        >
          <span>📘</span>
        </button>
      </div>

      <div className="mb-8 mt-8 w-full max-w-4xl animate-fade-in md:mx-auto md:mb-16 md:mt-0 md:text-center">
        <div className="inline-flex items-center justify-center rounded-[20px] bg-[#0a84ff] p-2.5 shadow-[0_12px_26px_rgba(10,132,255,0.25)] mb-4 md:mb-6 md:p-3">
          <span className="text-3xl md:text-4xl">🩺</span>
        </div>
        <h1 className="mb-3 break-words text-4xl font-display font-bold leading-tight tracking-tight text-slate-900 md:text-6xl">
          医影<span className="text-[#0a84ff]">挑战赛</span>
        </h1>
        <p className="max-w-2xl text-base font-medium leading-snug text-slate-500 md:mx-auto md:px-2 md:text-xl">
          测试医学诊断技能的首选平台。
        </p>

        <button
          onClick={onStartDailyChallenge}
          className="mt-6 mx-auto block w-full max-w-3xl rounded-[28px] border border-white/95 bg-white/94 p-4 text-left shadow-[0_10px_36px_rgba(15,23,42,0.05)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(255,159,10,0.10)] md:p-5"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">今日提示</div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff4e5] text-[#ff9f0a] shadow-[0_8px_18px_rgba(255,159,10,0.16)]">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
              <div className="mt-2 text-base font-semibold text-slate-900 md:text-lg">
                {dailyChallengeRecord ? '今日挑战已完成，可以去看看榜单位置。' : '今日挑战还没开始，点这里进入今天这 5 道固定题。'}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{recentSummary}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:min-w-[220px]">
              <div className="rounded-[22px] bg-[#f2f2f7] p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">本周活跃</div>
                <div className="mt-1 text-2xl font-bold text-[#0a84ff]">{activeDaysThisWeek}</div>
                <div className="text-xs text-slate-500">近 7 天</div>
              </div>
              <div className="rounded-[22px] bg-[#f2f2f7] p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">今日状态</div>
                <div className="mt-2 text-sm font-bold text-slate-900">
                  {dailyChallengeRecord ? `${dailyChallengeRecord.score} 分` : '待完成'}
                </div>
                <div className="text-xs text-slate-500">每日挑战</div>
              </div>
            </div>
          </div>
        </button>
      </div>

      <div className="grid w-full max-w-6xl animate-fade-in grid-cols-1 gap-4 px-2 md:grid-cols-2 md:gap-8 md:px-0" style={{ animationDelay: '0.1s' }}>
        <div
          onClick={onStartSolo}
          className="group cursor-pointer relative bg-white/94 backdrop-blur-xl rounded-[28px] md:rounded-[32px] p-6 md:p-8 shadow-[0_10px_30px_rgba(15,23,42,0.05)] border border-white/95 hover:shadow-[0_18px_40px_rgba(10,132,255,0.10)] transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-[#eaf4ff] text-[#0a84ff] rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </div>
          <div className="w-12 h-12 md:w-16 md:h-16 bg-[#eaf4ff] rounded-[20px] flex items-center justify-center text-2xl md:text-3xl mb-4 md:mb-6 text-[#0a84ff] group-hover:scale-110 transition-transform duration-300">
            🧩
          </div>
          <h3 className="text-xl md:text-2xl font-display font-bold text-slate-900 mb-2">单人连胜</h3>
          <p className="text-slate-500 text-sm md:text-base mb-4 md:mb-6 leading-relaxed">
            在无限连胜模式中测试您的耐力。一次失误即结束。您能走多远？
          </p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center text-xs md:text-sm font-semibold text-blue-600 uppercase tracking-wide">
              开始单人模式
            </div>
            <div className="text-right">
              <div className="text-[10px] md:text-xs uppercase tracking-wide text-slate-400 font-semibold">历史最佳</div>
              <div className="text-sm md:text-base font-bold text-slate-800">
                {bestSoloStreak} 连胜
              </div>
            </div>
          </div>
        </div>

        <div
          onClick={onStartPvP}
          className="group cursor-pointer relative bg-white/94 backdrop-blur-xl rounded-[28px] md:rounded-[32px] p-6 md:p-8 shadow-[0_10px_30px_rgba(15,23,42,0.05)] border border-white/95 hover:shadow-[0_18px_40px_rgba(255,59,48,0.10)] transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-[#fff1f2] text-[#ff3b30] rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </div>
          <div className="w-12 h-12 md:w-16 md:h-16 bg-[#fff1f2] rounded-[20px] flex items-center justify-center text-2xl md:text-3xl mb-4 md:mb-6 text-[#ff3b30] group-hover:scale-110 transition-transform duration-300">
            ⚔️
          </div>
          <h3 className="text-xl md:text-2xl font-display font-bold text-slate-900 mb-2">排位赛</h3>
          <p className="text-slate-500 text-sm md:text-base mb-4 md:mb-6 leading-relaxed">
            在 5 轮速度赛中与 AI 对手进行 1v1 竞争。准确性和反应时间是关键。
          </p>
          <div className="flex items-center text-xs md:text-sm font-semibold text-rose-600 uppercase tracking-wide">
            进入竞技场
          </div>
        </div>
      </div>

      <div className="mt-8 md:mt-12 flex flex-col items-center justify-center animate-fade-in w-full mb-4" style={{ animationDelay: '0.2s' }}>
        <div
          className="hidden md:flex md:flex-row items-center gap-3 mb-8 rounded-[26px] bg-white/92 backdrop-blur-xl px-3 py-3 shadow-[0_8px_28px_rgba(15,23,42,0.04)]"
          style={{ paddingBottom: 'max(12px, var(--safe-bottom))' }}
        >
          <button
            onClick={onOpenProfile}
            className="flex items-center space-x-2 px-6 py-3 bg-[#f2f2f7] rounded-[18px] text-slate-600 font-semibold hover:bg-[#e8e9ef] transition-all shadow-sm text-sm md:text-base"
          >
            <span>👤</span>
            <span>{profileEntryLabel}</span>
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="flex items-center space-x-2 px-6 py-3 bg-[#f2f2f7] rounded-[18px] text-slate-600 font-semibold hover:bg-[#e8e9ef] transition-all shadow-sm text-sm md:text-base"
          >
            <span>🏆</span>
            <span>查看全球排名</span>
          </button>

          <button
            onClick={onOpenWrongQuestions}
            className="flex items-center space-x-2 px-6 py-3 bg-[#f2f2f7] rounded-[18px] text-slate-600 font-semibold hover:bg-[#e8e9ef] transition-all shadow-sm text-sm md:text-base"
          >
            <span>📘</span>
            <span>查看错题本</span>
          </button>
        </div>

        <footer className="text-slate-400 text-[10px] md:text-sm font-medium text-center px-4 leading-tight">
          © 2025 医影挑战赛。数据模拟仅用于教育目的。
        </footer>
      </div>
    </div>
  );
};
