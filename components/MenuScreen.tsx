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
    <div className="flex flex-col items-center justify-start md:justify-center min-h-screen px-4 py-8 md:py-12 relative overflow-x-hidden w-full">
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-blue-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-teal-100 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="text-center mb-8 md:mb-16 animate-fade-in w-full max-w-4xl mx-auto mt-8 md:mt-0">
        <div className="inline-flex items-center justify-center p-2.5 md:p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 mb-4 md:mb-6">
          <span className="text-3xl md:text-4xl">🩺</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight text-slate-900 mb-3 break-words leading-tight">
          医影<span className="text-blue-600">挑战赛</span>
        </h1>
        <p className="text-slate-500 text-base md:text-xl max-w-2xl mx-auto font-medium px-2 leading-snug">
          测试医学诊断技能的首选平台。
        </p>

        <div className="mt-6 mx-auto max-w-3xl bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/40 p-4 md:p-5 text-left">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] font-bold text-slate-400">今日提示</div>
              <div className="text-base md:text-lg font-bold text-slate-900 mt-1">
                {dailyChallengeRecord ? '今日挑战已完成，可以去看看榜单位置。' : '今日挑战还没开始，先把今天这 5 道固定题做完。'}
              </div>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">{recentSummary}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:min-w-[220px]">
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3">
                <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">本周活跃</div>
                <div className="text-2xl font-black text-blue-600 mt-1">{activeDaysThisWeek}</div>
                <div className="text-xs text-slate-500">近 7 天</div>
              </div>
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3">
                <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">今日状态</div>
                <div className="text-sm font-black text-slate-900 mt-2">
                  {dailyChallengeRecord ? `${dailyChallengeRecord.score} 分` : '待完成'}
                </div>
                <div className="text-xs text-slate-500">每日挑战</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 max-w-6xl w-full animate-fade-in relative z-10 px-2 md:px-0" style={{ animationDelay: '0.1s' }}>
        <div
          onClick={onStartSolo}
          className="group cursor-pointer relative bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:shadow-blue-200/50 hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-blue-50 text-blue-600 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </div>
          <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-4 md:mb-6 text-blue-600 group-hover:scale-110 transition-transform duration-300">
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
              <div className="text-[10px] md:text-xs uppercase tracking-wide text-slate-400 font-bold">历史最佳</div>
              <div className="text-sm md:text-base font-black text-slate-800">
                {bestSoloStreak} 连胜
              </div>
            </div>
          </div>
        </div>

        <div
          onClick={onStartDailyChallenge}
          className="group cursor-pointer relative bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:shadow-amber-200/60 hover:border-amber-200 transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-amber-50 text-amber-600 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </div>
          <div className="w-12 h-12 md:w-16 md:h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-4 md:mb-6 text-amber-600 group-hover:scale-110 transition-transform duration-300">
            📅
          </div>
          <h3 className="text-xl md:text-2xl font-display font-bold text-slate-900 mb-2">每日挑战</h3>
          <p className="text-slate-500 text-sm md:text-base mb-4 md:mb-6 leading-relaxed">
            每天一套固定题组，和所有玩家做同样的 5 道病例题，看看你今天能排到第几。
          </p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center text-xs md:text-sm font-semibold text-amber-600 uppercase tracking-wide">
              {dailyChallengeRecord ? '今日已完成' : '开始今日挑战'}
            </div>
            <div className="text-right">
              <div className="text-[10px] md:text-xs uppercase tracking-wide text-slate-400 font-bold">今日记录</div>
              <div className="text-sm md:text-base font-black text-slate-800">
                {dailyChallengeRecord ? `${dailyChallengeRecord.score} 分` : '未作答'}
              </div>
            </div>
          </div>
        </div>

        <div
          onClick={onStartPvP}
          className="group cursor-pointer relative bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:shadow-rose-200/50 hover:border-rose-200 transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-rose-50 text-rose-600 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </div>
          <div className="w-12 h-12 md:w-16 md:h-16 bg-rose-100 rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-4 md:mb-6 text-rose-600 group-hover:scale-110 transition-transform duration-300">
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
        <div className="flex flex-col md:flex-row items-center gap-3 mb-8">
          <button
            onClick={onOpenProfile}
            className="flex items-center space-x-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm text-sm md:text-base"
          >
            <span>👤</span>
            <span>{profileEntryLabel}</span>
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="flex items-center space-x-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm text-sm md:text-base"
          >
            <span>🏆</span>
            <span>查看全球排名</span>
          </button>

          <button
            onClick={onOpenWrongQuestions}
            className="flex items-center space-x-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm text-sm md:text-base"
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
