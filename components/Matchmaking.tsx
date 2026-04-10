import React, { useEffect, useState } from 'react';
import { PlayerProfile } from '../types';

interface MatchmakingProps {
  opponent: PlayerProfile;
  onMatchFound: () => void;
}

export const Matchmaking: React.FC<MatchmakingProps> = ({ opponent, onMatchFound }) => {
  const [status, setStatus] = useState("正在寻找对手...");
  const [found, setFound] = useState(false);

  useEffect(() => {
    // Phase 1: Search
    const t1 = setTimeout(() => {
      setStatus("已找到对手");
      setFound(true);
    }, 2000);

    // Phase 2: Start
    const t2 = setTimeout(() => {
      onMatchFound();
    }, 3500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onMatchFound]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-white/90 backdrop-blur-xl z-50 absolute inset-0">
      <div className="text-center w-full max-w-2xl">
        <div className="mb-12">
            <h2 className="text-3xl font-display font-black text-slate-800 uppercase tracking-tight mb-2">
            {status}
            </h2>
            <div className="h-1 w-16 bg-blue-500 mx-auto rounded-full"></div>
        </div>

        <div className="flex items-center justify-center relative">
          
          {/* Connecting Line */}
          <div className="absolute top-1/2 left-0 w-full h-px bg-slate-200 -z-10"></div>

          {/* You */}
          <div className="flex flex-col items-center bg-white p-6 rounded-2xl shadow-xl border border-slate-100 z-10 w-48">
            <div className="w-20 h-20 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center text-3xl mb-4 text-blue-600">
              👤
            </div>
            <div className="text-lg font-bold text-slate-900">你</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">积分 1500</div>
          </div>

          <div className="mx-8 bg-slate-900 text-white rounded-full w-12 h-12 flex items-center justify-center font-black italic shadow-lg z-20">
              VS
          </div>

          {/* Opponent */}
          <div className={`flex flex-col items-center bg-white p-6 rounded-2xl shadow-xl border border-slate-100 z-10 w-48 transition-all duration-500 ${found ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
            <div className="w-20 h-20 rounded-full bg-rose-50 border-2 border-rose-100 flex items-center justify-center text-3xl mb-4">
              {opponent.avatar}
            </div>
            <div className="text-lg font-bold text-slate-900">{opponent.name}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">积分 {opponent.rating}</div>
          </div>
        </div>
      </div>
    </div>
  );
};