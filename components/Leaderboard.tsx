
import React, { useEffect, useState } from 'react';
import { DailyChallengeRecord, LeaderboardData, LeaderboardType } from '../types';
import { fetchLeaderboardData } from '../services/data';
import { buildLeaderboardTargets, formatLeaderboardTime } from '../services/leaderboard';
import { Button } from './Button';
import { ScreenHeader } from './ScreenHeader';
import { LocalPlayerIdentity } from '../services/playerIdentity';

interface LeaderboardProps {
  playerIdentity: LocalPlayerIdentity;
  bestSoloStreak: number;
  dailyChallengeRecord: DailyChallengeRecord | null;
  onClose: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  playerIdentity,
  bestSoloStreak,
  dailyChallengeRecord,
  onClose,
}) => {
    const [activeTab, setActiveTab] = useState<LeaderboardType>('rating');
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardData>({
      entries: [],
      currentUserEntry: null,
      nearbyEntries: [],
      totalPlayers: 0,
      topScore: null,
      chaseMessage: null,
      stabilityMessage: null,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const res = await fetchLeaderboardData({
              type: activeTab,
              identity: playerIdentity,
              bestSoloStreak,
              dailyChallengeRecord,
            });
            setLeaderboardData(res);
            setLoading(false);
        };
        void loadData();
    }, [activeTab, bestSoloStreak, dailyChallengeRecord, playerIdentity]);

    const data = leaderboardData.entries;
    const currentUserEntry = leaderboardData.currentUserEntry;
    const nearbyEntries = leaderboardData.nearbyEntries.filter((entry) => !data.some((topEntry) => topEntry.id === entry.id));
    const visibleEntryCount = data.length;
    const playerHasScore = activeTab === 'rating'
      ? Boolean(dailyChallengeRecord && dailyChallengeRecord.score > 0)
      : bestSoloStreak > 0;
    const leaderboardTargets = buildLeaderboardTargets({
      entries: data,
      currentUserEntry,
      type: activeTab,
    });
    const leaderboardFootnote = activeTab === 'rating'
      ? '每日榜单按分数排序，同分时用总耗时更短者优先。'
      : '连胜榜按历史最佳连胜排序，分数越高排名越靠前。';

    const renderMedal = (rank: number) => {
        switch(rank) {
            case 1: return <span className="text-2xl drop-shadow-sm">🥇</span>;
            case 2: return <span className="text-2xl drop-shadow-sm">🥈</span>;
            case 3: return <span className="text-2xl drop-shadow-sm">🥉</span>;
            default: return <span className="text-slate-400 font-bold w-6 text-center">{rank}</span>;
        }
    };

    return (
        <div className="app-safe-screen flex flex-col items-center justify-center min-h-screen bg-[#f2f2f7] p-4 animate-fade-in relative">
             {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-white rounded-full blur-3xl opacity-90"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-sky-100 rounded-full blur-3xl opacity-35"></div>
            </div>

            <div className="w-full max-w-2xl bg-white/94 backdrop-blur-xl rounded-[32px] shadow-[0_14px_42px_rgba(15,23,42,0.06)] border border-white/95 overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <ScreenHeader
                    eyebrow="Leaderboard"
                    title="全球排名"
                    backLabel="返回"
                    onBack={onClose}
                />

                <div className="px-8 pb-4 bg-white/78 z-10">

                    {/* Tabs */}
                    <div className="flex space-x-1 bg-black/[0.05] p-1 rounded-[18px]">
                        <button 
                            onClick={() => setActiveTab('rating')}
                            className={`flex-1 py-2.5 px-4 rounded-[14px] text-sm font-semibold transition-all ${activeTab === 'rating' ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.14)]' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            📅 每日挑战
                        </button>
                        <button 
                            onClick={() => setActiveTab('streak')}
                            className={`flex-1 py-2.5 px-4 rounded-[14px] text-sm font-semibold transition-all ${activeTab === 'streak' ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.14)]' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            🔥 最高连胜
                        </button>
                    </div>
                </div>

                <div className="px-8 pb-6">
                    <div className="rounded-[24px] bg-white/96 border border-white/95 p-4 flex items-center justify-between gap-4 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
                        <div>
                            <div className="text-[10px] uppercase tracking-[0.24em] font-semibold text-[#0a84ff]">我的名次</div>
                            <div className="text-lg font-semibold text-slate-900 mt-1">{playerIdentity.displayName}</div>
                            <div className="text-sm text-slate-500 mt-1">
                                {playerHasScore
                                  ? currentUserEntry
                                    ? `当前排在第 ${currentUserEntry.rank} 名，共 ${leaderboardData.totalPlayers} 人上榜，当前榜单展示前 ${visibleEntryCount} 位`
                                    : '成绩已记录，等待进入榜单刷新'
                                  : activeTab === 'rating'
                                    ? '先完成今日挑战，才能进入今日榜。'
                                    : '先打出历史最佳连胜，才能进入连胜榜。'}
                            </div>
                            {playerHasScore && currentUserEntry && (
                              <div className="mt-3 space-y-2">
                                {leaderboardData.chaseMessage && (
                                  <div className="text-xs text-slate-600 bg-[#f2f2f7] rounded-[16px] px-3 py-2">
                                    {leaderboardData.chaseMessage}
                                  </div>
                                )}
                                {leaderboardData.stabilityMessage && (
                                  <div className="text-xs text-slate-600 bg-[#f2f2f7] rounded-[16px] px-3 py-2">
                                    {leaderboardData.stabilityMessage}
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                        <div className="text-right shrink-0">
                            <div className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">
                                {activeTab === 'rating' ? '我的今日分数' : '我的最佳连胜'}
                            </div>
                            <div className="text-3xl font-display font-bold text-slate-900 mt-1">
                                {activeTab === 'rating'
                                  ? dailyChallengeRecord?.score ?? '--'
                                  : bestSoloStreak > 0 ? bestSoloStreak : '--'}
                            </div>
                        </div>
                    </div>

                    {playerHasScore && leaderboardTargets.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                        {leaderboardTargets.map((target) => (
                          <div
                            key={target.key}
                            className={`rounded-[20px] p-4 ${
                              target.accent === 'amber'
                                ? 'bg-[#fff7e8]'
                                : target.accent === 'emerald'
                                  ? 'bg-[#edfdf3]'
                                  : 'bg-[#eef6ff]'
                            }`}
                          >
                            <div className={`text-[10px] uppercase tracking-[0.2em] font-semibold ${
                              target.accent === 'amber'
                                ? 'text-[#d97706]'
                                : target.accent === 'emerald'
                                  ? 'text-[#16a34a]'
                                  : 'text-[#0a84ff]'
                            }`}>
                              Next Goal
                            </div>
                            <div className="mt-2 text-sm font-semibold text-slate-900">{target.title}</div>
                            <div className="mt-2 text-xs leading-relaxed text-slate-600">{target.detail}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {playerHasScore && currentUserEntry && nearbyEntries.length > 0 && (
                      <div className="mt-4 rounded-[24px] border border-[#d9e8ff] bg-[#f7fbff] p-4 shadow-[0_8px_24px_rgba(10,132,255,0.06)]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.24em] font-semibold text-[#0a84ff]">附近排名</div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">你当前前后最接近的对手</div>
                          </div>
                          <div className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-500 shadow-sm">
                            第 {currentUserEntry.rank} 名
                          </div>
                        </div>
                        <div className="mt-3 space-y-2">
                          {nearbyEntries.map((entry) => (
                            <div
                              key={entry.id}
                              className={`flex items-center gap-3 rounded-[18px] px-3 py-3 ${
                                entry.id === playerIdentity.id
                                  ? 'border border-[#b6dbff] bg-white shadow-[0_8px_20px_rgba(10,132,255,0.08)]'
                                  : 'bg-white/80'
                              }`}
                            >
                              <div className="w-8 text-center text-sm font-bold text-slate-400">#{entry.rank}</div>
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f2f7] text-xl">
                                {entry.avatar}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-semibold text-slate-900">{entry.name}</div>
                                <div className="text-[11px] text-slate-400">
                                  {activeTab === 'rating'
                                    ? (formatLeaderboardTime(entry.totalTimeMs) ? `总耗时 ${formatLeaderboardTime(entry.totalTimeMs)}` : '今日挑战')
                                    : '历史最佳连胜'}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-display font-bold text-slate-900 tabular-nums">
                                  {entry.score}
                                </div>
                                <div className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">
                                  {activeTab === 'rating' ? '积分' : '胜场'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 space-y-4">
                             <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                             <span className="text-slate-400 text-sm font-medium">正在获取数据...</span>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center">
                             <div className="text-5xl">📭</div>
                             <span className="text-slate-500 text-sm font-medium">
                               {activeTab === 'rating' ? '今天的每日挑战榜还没有成绩。' : '当前还没有连胜榜数据。'}
                             </span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {data.map((entry) => (
                                <div key={entry.id} className={`group flex items-center p-4 bg-white/96 backdrop-blur rounded-[22px] transition-all ${
                                  entry.id === playerIdentity.id
                                    ? 'border border-[#b6dbff] shadow-[0_10px_28px_rgba(10,132,255,0.08)]'
                                    : 'border border-white/80 hover:shadow-[0_10px_24px_rgba(15,23,42,0.06)]'
                                }`}>
                                    <div className="w-12 flex justify-center items-center mr-4">
                                        {renderMedal(entry.rank)}
                                    </div>
                                    <div className="w-12 h-12 bg-[#f2f2f7] rounded-full flex items-center justify-center text-2xl mr-4 group-hover:scale-110 transition-transform">
                                        {entry.avatar}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-slate-900">{entry.name}</div>
                                        <div className="text-xs text-slate-400 font-medium">
                                          {activeTab === 'rating'
                                            ? (formatLeaderboardTime(entry.totalTimeMs) ? `总耗时 ${formatLeaderboardTime(entry.totalTimeMs)}` : '今日挑战')
                                            : '历史最佳连胜'}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-display font-bold text-xl text-slate-800 tabular-nums">
                                            {activeTab === 'rating' ? entry.score : `${entry.score}`}
                                        </div>
                                        <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                                            {activeTab === 'rating' ? '积分' : '胜场'}
                                        </div>
                                    </div>
                                    <div className="w-8 flex justify-center ml-2">
                                        {entry.trend === 'up' && <span className="text-green-500 text-xs">▲</span>}
                                        {entry.trend === 'down' && <span className="text-red-400 text-xs">▼</span>}
                                        {entry.trend === 'same' && <span className="text-slate-300 text-xs">-</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="app-safe-bottom p-6 border-t border-slate-100 bg-white/84 text-center">
                    <p className="text-xs text-slate-500 font-medium mb-1">当前展示前 {visibleEntryCount} 名，共 {leaderboardData.totalPlayers} 人进入榜单</p>
                    <p className="text-xs text-slate-400 font-medium">{leaderboardFootnote}</p>
                </div>
            </div>
        </div>
    );
};
