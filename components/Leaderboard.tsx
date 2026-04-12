
import React, { useEffect, useState } from 'react';
import { DailyChallengeRecord, LeaderboardData, LeaderboardType } from '../types';
import { fetchLeaderboardData } from '../services/data';
import { Button } from './Button';
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
    const playerHasScore = activeTab === 'rating'
      ? Boolean(dailyChallengeRecord && dailyChallengeRecord.score > 0)
      : bestSoloStreak > 0;

    const renderMedal = (rank: number) => {
        switch(rank) {
            case 1: return <span className="text-2xl drop-shadow-sm">🥇</span>;
            case 2: return <span className="text-2xl drop-shadow-sm">🥈</span>;
            case 3: return <span className="text-2xl drop-shadow-sm">🥉</span>;
            default: return <span className="text-slate-400 font-bold w-6 text-center">{rank}</span>;
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 animate-fade-in relative">
             {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-3xl opacity-30"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-teal-100 rounded-full blur-3xl opacity-30"></div>
            </div>

            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-8 pb-4 border-b border-slate-100 bg-white z-10">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-display font-extrabold text-slate-900">全球排名</h2>
                        <Button variant="ghost" onClick={onClose} className="!p-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </Button>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-2 bg-slate-100 p-1 rounded-xl">
                        <button 
                            onClick={() => setActiveTab('rating')}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${activeTab === 'rating' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            📅 每日挑战
                        </button>
                        <button 
                            onClick={() => setActiveTab('streak')}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${activeTab === 'streak' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            🔥 最高连胜
                        </button>
                    </div>
                </div>

                <div className="px-8 pb-6">
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4 flex items-center justify-between gap-4">
                        <div>
                            <div className="text-[10px] uppercase tracking-[0.24em] font-bold text-blue-400">我的名次</div>
                            <div className="text-lg font-bold text-slate-900 mt-1">{playerIdentity.displayName}</div>
                            <div className="text-sm text-slate-500 mt-1">
                                {playerHasScore
                                  ? currentUserEntry
                                    ? `当前排在第 ${currentUserEntry.rank} 名`
                                    : '成绩已记录，等待进入榜单刷新'
                                  : activeTab === 'rating'
                                    ? '先完成今日挑战，才能进入今日榜。'
                                    : '先打出历史最佳连胜，才能进入连胜榜。'}
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">
                                {activeTab === 'rating' ? '我的今日分数' : '我的最佳连胜'}
                            </div>
                            <div className="text-3xl font-display font-black text-slate-900 mt-1">
                                {activeTab === 'rating'
                                  ? dailyChallengeRecord?.score ?? '--'
                                  : bestSoloStreak > 0 ? bestSoloStreak : '--'}
                            </div>
                        </div>
                    </div>
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
                                <div key={entry.id} className={`group flex items-center p-4 bg-white border rounded-2xl transition-all ${
                                  entry.id === playerIdentity.id
                                    ? 'border-blue-300 shadow-md shadow-blue-100/60'
                                    : 'border-slate-100 hover:border-blue-200 hover:shadow-md'
                                }`}>
                                    <div className="w-12 flex justify-center items-center mr-4">
                                        {renderMedal(entry.rank)}
                                    </div>
                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-2xl mr-4 border border-slate-100 group-hover:scale-110 transition-transform">
                                        {entry.avatar}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-slate-900">{entry.name}</div>
                                        <div className="text-xs text-slate-400 font-medium">全球精英</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-display font-black text-xl text-slate-800 tabular-nums">
                                            {activeTab === 'rating' ? entry.score : `${entry.score}`}
                                        </div>
                                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
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
                <div className="p-6 border-t border-slate-100 bg-slate-50 text-center">
                    <p className="text-xs text-slate-400 font-medium">每日榜单按分数排序，同分时用总耗时更短者优先。</p>
                </div>
            </div>
        </div>
    );
};
