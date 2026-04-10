import React, { useEffect, useState } from 'react';
import { WrongQuestionEntry } from '../types';
import { Button } from './Button';

interface WrongQuestionsProps {
  entries: WrongQuestionEntry[];
  loading?: boolean;
  onClose: () => void;
}

export const WrongQuestions: React.FC<WrongQuestionsProps> = ({ entries, loading = false, onClose }) => {
  const [selectedEntry, setSelectedEntry] = useState<WrongQuestionEntry | null>(entries[0] ?? null);

  useEffect(() => {
    setSelectedEntry(entries[0] ?? null);
  }, [entries]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 animate-fade-in relative">
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-amber-100 rounded-full blur-3xl opacity-30"></div>
      </div>

      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="p-6 md:p-8 border-b border-slate-100 bg-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-display font-extrabold text-slate-900">错题本</h2>
              <p className="text-sm text-slate-400 font-medium mt-1">优先显示最近的错题，用来快速复盘易错点。</p>
            </div>
            <Button variant="ghost" onClick={onClose} className="!p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[320px_1fr]">
          <div className="border-r border-slate-100 overflow-y-auto p-4 space-y-3 bg-slate-50/70">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 space-y-4">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-slate-400 text-sm font-medium">正在加载错题...</span>
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center px-6">
                <div className="text-4xl mb-3">🎉</div>
                <p className="text-slate-500 text-sm font-medium">还没有错题记录，继续保持。</p>
              </div>
            ) : (
              entries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className={`w-full text-left rounded-2xl border p-4 transition-all ${
                    selectedEntry?.id === entry.id
                      ? 'bg-white border-blue-200 shadow-md'
                      : 'bg-white/80 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-[10px] uppercase tracking-wide font-bold text-slate-400">
                      {entry.mode === 'daily_challenge' ? '每日挑战' : '单人连胜'}
                    </span>
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${
                      entry.difficulty === 'Hard' ? 'text-red-600 bg-red-50 border-red-100' :
                      entry.difficulty === 'Medium' ? 'text-orange-600 bg-orange-50 border-orange-100' :
                      'text-green-600 bg-green-50 border-green-100'
                    }`}>
                      {entry.difficulty === 'Hard' ? '困难' : entry.difficulty === 'Medium' ? '中等' : '简单'}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm mb-1">{entry.category}</div>
                  <div className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{entry.description}</div>
                </button>
              ))
            )}
          </div>

          <div className="overflow-y-auto p-6 md:p-8">
            {selectedEntry ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
                  <div className="bg-slate-900 rounded-3xl p-4 flex items-center justify-center min-h-[280px]">
                    <img
                      src={selectedEntry.imageUrl}
                      alt={selectedEntry.category}
                      className="max-w-full max-h-[360px] object-contain rounded-2xl bg-black"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-md text-[10px] font-bold uppercase tracking-wider">
                          {selectedEntry.category}
                        </span>
                        <span className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-md text-[10px] font-bold uppercase tracking-wider">
                          错题
                        </span>
                      </div>
                      <p className="text-slate-700 text-base font-medium leading-relaxed">{selectedEntry.description}</p>
                    </div>

                    <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                      <div className="text-xs uppercase tracking-wide font-bold text-red-500 mb-2">你的答案</div>
                      <div className="text-sm font-semibold text-red-700">{selectedEntry.selectedAnswer ?? '未作答 / 超时'}</div>
                    </div>

                    <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                      <div className="text-xs uppercase tracking-wide font-bold text-green-500 mb-2">正确答案</div>
                      <div className="text-sm font-semibold text-green-700">{selectedEntry.correctAnswer}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedEntry.options.map((option, index) => {
                    const isCorrect = option === selectedEntry.correctAnswer;
                    const isSelected = option === selectedEntry.selectedAnswer;

                    return (
                      <div
                        key={option}
                        className={`rounded-2xl border p-4 ${
                          isCorrect
                            ? 'border-green-500 bg-green-50 text-green-800'
                            : isSelected
                              ? 'border-red-500 bg-red-50 text-red-800'
                              : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/70 border border-current/10 flex items-center justify-center text-xs font-bold">
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span className="text-sm font-semibold">{option}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                  <h4 className="text-slate-900 text-xs font-bold uppercase mb-2">解析</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{selectedEntry.explanation}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm font-medium">
                选择一道错题查看详情
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
