
import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../types';
import { fetchLeaderboard } from '../services/data';
import { Button } from './Button';

interface LeaderboardProps {
    onClose: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<'rating' | 'streak'>('rating');
    const [data, setData] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const res = await fetchLeaderboard(activeTab);
            setData(res);
            setLoading(false);
        };
        loadData();
    }, [activeTab]);

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
                        <h2 className="text-3xl font-display font-extrabold text-slate-900">Global Rankings</h2>
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
                            🏆 Competitive Rating
                        </button>
                        <button 
                            onClick={() => setActiveTab('streak')}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${activeTab === 'streak' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            🔥 Max Streak
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 space-y-4">
                             <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                             <span className="text-slate-400 text-sm font-medium">Fetching Data...</span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {data.map((entry) => (
                                <div key={entry.id} className="group flex items-center p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all">
                                    <div className="w-12 flex justify-center items-center mr-4">
                                        {renderMedal(entry.rank)}
                                    </div>
                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-2xl mr-4 border border-slate-100 group-hover:scale-110 transition-transform">
                                        {entry.avatar}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-slate-900">{entry.name}</div>
                                        <div className="text-xs text-slate-400 font-medium">Global Elite</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-display font-black text-xl text-slate-800 tabular-nums">
                                            {activeTab === 'rating' ? entry.score : `${entry.score}`}
                                        </div>
                                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                            {activeTab === 'rating' ? 'MMR' : 'WINS'}
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
                    <p className="text-xs text-slate-400 font-medium">Rankings update every 24 hours.</p>
                </div>
            </div>
        </div>
    );
};
