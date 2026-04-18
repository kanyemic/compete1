import React, { useEffect, useMemo, useState } from 'react';
import { WrongQuestionEntry } from '../types';
import { Button } from './Button';
import { QuestionMetaPanel } from './QuestionMetaPanel';
import { ScreenHeader } from './ScreenHeader';
import { buildWrongQuestionFocusAreas, buildWrongQuestionReviewPlan, getWrongQuestionRecommendations } from '../services/wrongQuestions';

interface WrongQuestionsProps {
  entries: WrongQuestionEntry[];
  loading?: boolean;
  onRetryEntry: (entry: WrongQuestionEntry) => void;
  onClose: () => void;
}

export const WrongQuestions: React.FC<WrongQuestionsProps> = ({ entries, loading = false, onRetryEntry, onClose }) => {
  const [selectedEntry, setSelectedEntry] = useState<WrongQuestionEntry | null>(entries[0] ?? null);
  const [modeFilter, setModeFilter] = useState<'all' | WrongQuestionEntry['mode']>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | WrongQuestionEntry['difficulty']>('all');
  const [categoryQuery, setCategoryQuery] = useState('');
  const [activeFocusKey, setActiveFocusKey] = useState<string | null>(null);
  const recommendations = useMemo(() => getWrongQuestionRecommendations(entries, 3), [entries]);
  const reviewPlan = useMemo(() => buildWrongQuestionReviewPlan(entries, 3), [entries]);
  const focusAreas = useMemo(() => buildWrongQuestionFocusAreas(entries, 3), [entries]);
  const recommendedQuestionIds = new Set(recommendations.map((item) => item.entry.id));
  const normalizedQuery = categoryQuery.trim().toLowerCase();

  const filteredEntries = entries.filter((entry) => {
    const matchesMode = modeFilter === 'all' || entry.mode === modeFilter;
    const matchesDifficulty = difficultyFilter === 'all' || entry.difficulty === difficultyFilter;
    const matchesCategory = normalizedQuery.length === 0
      || [
        entry.category,
        entry.specialty ?? '',
        entry.modality ?? '',
      ].join(' ').toLowerCase().includes(normalizedQuery);

    return matchesMode && matchesDifficulty && matchesCategory;
  });
  useEffect(() => {
    setSelectedEntry(filteredEntries[0] ?? null);
  }, [entries, modeFilter, difficultyFilter, categoryQuery]);

  useEffect(() => {
    if (!activeFocusKey) {
      return;
    }

    if (!focusAreas.some((item) => item.key === activeFocusKey)) {
      setActiveFocusKey(null);
    }
  }, [activeFocusKey, focusAreas]);

  const applyFocusArea = (focusKey: string) => {
    const focusArea = focusAreas.find((item) => item.key === focusKey);
    if (!focusArea) {
      return;
    }

    setActiveFocusKey(focusArea.key);
    setCategoryQuery(focusArea.query);
    setSelectedEntry(focusArea.representativeEntry);
  };

  const clearFocusArea = () => {
    setActiveFocusKey(null);
    setCategoryQuery('');
  };

  const getReviewStatusLabel = (status: WrongQuestionEntry['reviewStatus']) => {
    if (status === 'approved') {
      return '已审核';
    }

    if (status === 'reviewing') {
      return '审核中';
    }

    if (status === 'archived') {
      return '已归档';
    }

    return '待补充';
  };

  return (
    <div className="app-safe-screen flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 animate-fade-in relative">
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-amber-100 rounded-full blur-3xl opacity-30"></div>
      </div>

      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        <ScreenHeader
          eyebrow="Wrong Book"
          title="错题本"
          description="优先显示最近的错题，用来快速复盘易错点。"
          backLabel="返回"
          onBack={onClose}
        />

        <div className="px-6 md:px-8 pb-5 bg-white">
          {recommendations.length > 0 && (
            <div className="mt-5 rounded-3xl border border-blue-100 bg-[linear-gradient(135deg,rgba(219,234,254,0.95),rgba(255,255,255,0.92))] p-5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] font-semibold text-blue-500">Review Focus</div>
                  <div className="text-xl font-display font-bold text-slate-900 mt-2">建议优先复练</div>
                  <div className="text-sm text-slate-500 mt-2 leading-relaxed">
                    我按难度、错题新鲜度和来源模式，先帮你排了本轮最值得复盘的题。
                  </div>
                </div>
                <Button onClick={() => onRetryEntry(recommendations[0].entry)}>
                  先练推荐第 1 题
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                {recommendations.map((item, index) => (
                  <button
                    key={item.entry.id}
                    onClick={() => setSelectedEntry(item.entry)}
                    className="rounded-2xl border border-white/80 bg-white/88 text-left p-4 transition hover:bg-white"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-blue-600">TOP {index + 1}</span>
                      <span className="px-2 py-1 rounded-full bg-blue-50 text-[10px] font-bold text-blue-600">
                        {item.badge}
                      </span>
                    </div>
                    <div className="mt-3 text-sm font-semibold text-slate-900">{item.entry.category}</div>
                    <div className="mt-2 text-xs text-slate-500 leading-relaxed">{item.reason}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {reviewPlan && (
            <div className="mt-5 rounded-3xl border border-emerald-100 bg-[linear-gradient(135deg,rgba(220,252,231,0.95),rgba(255,255,255,0.92))] p-5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] font-semibold text-emerald-600">Today Review Plan</div>
                  <div className="text-xl font-display font-bold text-slate-900 mt-2">今日复练计划</div>
                  <div className="text-sm text-slate-500 mt-2 leading-relaxed">
                    {reviewPlan.summary}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/88 px-4 py-3 text-right min-w-[120px]">
                  <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">预计耗时</div>
                  <div className="text-2xl font-display font-bold text-emerald-600 mt-1">
                    {reviewPlan.totalEstimatedMinutes} 分钟
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                {reviewPlan.items.map((item, index) => (
                  <div
                    key={item.entry.id}
                    className="rounded-2xl border border-white/80 bg-white/90 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-emerald-600">STEP {index + 1}</span>
                      <span className="px-2 py-1 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-600">
                        {item.estimatedMinutes} 分钟
                      </span>
                    </div>
                    <div className="mt-3 text-sm font-semibold text-slate-900">{item.title}</div>
                    <div className="mt-2 text-xs text-slate-600 leading-relaxed">{item.focus}</div>
                    <div className="mt-2 text-xs text-slate-500 leading-relaxed">{item.reason}</div>
                    <div className="mt-4">
                      <Button
                        onClick={() => onRetryEntry(item.entry)}
                        variant={index === 0 ? 'primary' : 'secondary'}
                        className="w-full"
                      >
                        {index === 0 ? '开始这一步' : '练这道题'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {focusAreas.length > 0 && (
            <div className="mt-5 rounded-3xl border border-violet-100 bg-[linear-gradient(135deg,rgba(243,232,255,0.9),rgba(255,255,255,0.94))] p-5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] font-semibold text-violet-600">Focus Areas</div>
                  <div className="text-xl font-display font-bold text-slate-900 mt-2">当前薄弱专题</div>
                  <div className="text-sm text-slate-500 mt-2 leading-relaxed">
                    我把错题按专科和模态聚到一起，先帮你找出最值得集中补的一组。
                  </div>
                </div>
                {activeFocusKey && (
                  <Button onClick={clearFocusArea} variant="secondary">
                    清除专题聚焦
                  </Button>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                {focusAreas.map((area) => (
                  <button
                    key={area.key}
                    onClick={() => applyFocusArea(area.key)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      activeFocusKey === area.key
                        ? 'border-violet-300 bg-white shadow-[0_12px_28px_rgba(139,92,246,0.12)]'
                        : 'border-white/80 bg-white/88 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-violet-600">{area.title}</span>
                      <span className="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-bold text-violet-600">
                        {area.badge}
                      </span>
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{area.subtitle}</div>
                    <div className="mt-2 text-xs text-slate-500 leading-relaxed">{area.reason}</div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">
                        {area.count} 道错题
                      </span>
                      <span className="font-semibold text-violet-600">
                        聚焦复练
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-[1fr_150px_150px] gap-3 mt-5">
            <input
              value={categoryQuery}
              onChange={(event) => setCategoryQuery(event.target.value)}
              placeholder="搜索专科或分类，例如 胸片 / 头颅 CT"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
            />
            <select
              value={modeFilter}
              onChange={(event) => setModeFilter(event.target.value as 'all' | WrongQuestionEntry['mode'])}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
            >
              <option value="all">全部模式</option>
              <option value="solo_streak">单人连胜</option>
              <option value="daily_challenge">每日挑战</option>
              <option value="review_practice">错题复练</option>
            </select>
            <select
              value={difficultyFilter}
              onChange={(event) => setDifficultyFilter(event.target.value as 'all' | WrongQuestionEntry['difficulty'])}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
            >
              <option value="all">全部难度</option>
              <option value="Easy">简单</option>
              <option value="Medium">中等</option>
              <option value="Hard">困难</option>
            </select>
          </div>
          {activeFocusKey && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                已聚焦专题
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 border border-slate-200">
                {focusAreas.find((item) => item.key === activeFocusKey)?.title ?? '当前专题'}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[320px_1fr]">
          <div className="border-r border-slate-100 overflow-y-auto p-4 space-y-3 bg-slate-50/70">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 space-y-4">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-slate-400 text-sm font-medium">正在加载错题...</span>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center px-6">
                <div className="text-4xl mb-3">{entries.length === 0 ? '🎉' : '🔎'}</div>
                <p className="text-slate-500 text-sm font-medium">
                  {entries.length === 0 ? '还没有错题记录，继续保持。' : '当前筛选条件下没有匹配的错题。'}
                </p>
              </div>
            ) : (
              <>
                <div className="px-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                  共 {filteredEntries.length} 条结果
                </div>
                {filteredEntries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className={`w-full text-left rounded-2xl border p-4 transition-all ${
                    selectedEntry?.id === entry.id
                      ? 'bg-white border-blue-200 shadow-md'
                      : recommendedQuestionIds.has(entry.id)
                        ? 'bg-blue-50/60 border-blue-100 hover:border-blue-200'
                        : 'bg-white/80 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wide font-bold text-slate-400">
                        {entry.mode === 'daily_challenge' ? '每日挑战' : entry.mode === 'review_practice' ? '错题复练' : '单人连胜'}
                      </span>
                      {recommendedQuestionIds.has(entry.id) && (
                        <span className="px-2 py-1 rounded-full bg-blue-50 text-[10px] font-bold text-blue-600">
                          建议优先
                        </span>
                      )}
                    </div>
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
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                      {entry.sourceName ?? '来源待补充'}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                      entry.reviewStatus === 'approved'
                        ? 'bg-emerald-50 text-emerald-600'
                        : entry.reviewStatus === 'reviewing'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-slate-100 text-slate-500'
                    }`}>
                      {getReviewStatusLabel(entry.reviewStatus)}
                    </span>
                  </div>
                </button>
                ))}
              </>
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

                <QuestionMetaPanel item={selectedEntry} title="来源与审核" />

                <div className="flex items-center gap-3">
                  <Button onClick={() => onRetryEntry(selectedEntry)} className="flex-1">
                    练这道题
                  </Button>
                  <Button onClick={onClose} variant="secondary" className="flex-1">
                    返回菜单
                  </Button>
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
