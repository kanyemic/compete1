import React, { useEffect, useMemo, useState } from 'react';
import { AdminQuestionSummary, AdminSnapshot, ReviewStatus } from '../types';
import { fetchAdminSnapshot, getAdminQuestionSummaries, saveAdminDailyChallengeConfig, saveAdminQuestion, saveAdminQuestionBatch } from '../services/admin';
import { Button } from './Button';
import { ScreenHeader } from './ScreenHeader';

interface AdminDashboardProps {
  onClose: () => void;
}

type AdminTab = 'overview' | 'questions' | 'challenge' | 'analytics';
type AnalyticsWindow = 1 | 7 | 30;
type QuestionFilterStatus = ReviewStatus | 'all';
type QuestionOpsPreset = 'all' | 'pending_review' | 'missing_source' | 'missing_reviewer' | 'inactive_ready';

const reviewStatusLabelMap: Record<ReviewStatus, string> = {
  approved: '已通过',
  reviewing: '审核中',
  draft: '草稿',
  archived: '已归档',
};

const reviewStatusClassMap: Record<ReviewStatus, string> = {
  approved: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  reviewing: 'text-amber-600 bg-amber-50 border-amber-100',
  draft: 'text-slate-500 bg-slate-50 border-slate-200',
  archived: 'text-slate-500 bg-slate-50 border-slate-200',
};

const tabLabelMap: Record<AdminTab, string> = {
  overview: '总览',
  questions: '题目管理',
  challenge: '每日挑战',
  analytics: '埋点概览',
};

const hasCompleteSource = (question: AdminQuestionSummary) =>
  Boolean(question.sourceName?.trim() && question.sourceUrl?.trim());

const hasReviewer = (question: AdminQuestionSummary) =>
  Boolean(question.reviewerName?.trim());

const matchesQuestionOpsPreset = (question: AdminQuestionSummary, preset: QuestionOpsPreset) => {
  if (preset === 'pending_review') {
    return question.reviewStatus === 'draft' || question.reviewStatus === 'reviewing';
  }

  if (preset === 'missing_source') {
    return !hasCompleteSource(question);
  }

  if (preset === 'missing_reviewer') {
    return !hasReviewer(question);
  }

  if (preset === 'inactive_ready') {
    return question.reviewStatus === 'approved' && !question.isActive;
  }

  return true;
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(null);
  const [questionCatalog, setQuestionCatalog] = useState<AdminQuestionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [challengeDateKey, setChallengeDateKey] = useState(() => new Date().toISOString().slice(0, 10));
  const [analyticsWindow, setAnalyticsWindow] = useState<AnalyticsWindow>(7);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionReviewFilter, setQuestionReviewFilter] = useState<QuestionFilterStatus>('all');
  const [questionSpecialtyFilter, setQuestionSpecialtyFilter] = useState<'all' | string>('all');
  const [questionOpsPreset, setQuestionOpsPreset] = useState<QuestionOpsPreset>('all');
  const [batchReviewerName, setBatchReviewerName] = useState('');
  const [challengeSearch, setChallengeSearch] = useState('');
  const [challengeSpecialtyFilter, setChallengeSpecialtyFilter] = useState<'all' | string>('all');
  const [challengeReviewFilter, setChallengeReviewFilter] = useState<QuestionFilterStatus>('approved');
  const [challengeActiveOnly, setChallengeActiveOnly] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    reviewStatus: 'draft' as ReviewStatus,
    reviewerName: '',
    sourceName: '',
    sourceUrl: '',
    isActive: true,
  });
  const [challengeSelection, setChallengeSelection] = useState<string[]>([]);

  const loadData = async () => {
    setLoading(true);
    const [nextSnapshot, nextQuestions] = await Promise.all([
      fetchAdminSnapshot({
        challengeDateKey,
        analyticsWindowDays: analyticsWindow,
      }),
      getAdminQuestionSummaries(),
    ]);
    setSnapshot(nextSnapshot);
    setQuestionCatalog(nextQuestions);
    setSelectedQuestionId((prev) => prev ?? nextQuestions[0]?.id ?? null);
    setSelectedQuestionIds((prev) => prev.filter((id) => nextQuestions.some((question) => question.id === id)));
    setChallengeSelection(nextSnapshot.todayChallenge.cases.map((entry) => entry.id));
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, [analyticsWindow, challengeDateKey]);

  const selectedQuestion = useMemo(
    () => questionCatalog.find((question) => question.id === selectedQuestionId) ?? null,
    [questionCatalog, selectedQuestionId]
  );

  useEffect(() => {
    if (!selectedQuestion) {
      return;
    }

    setQuestionForm({
      reviewStatus: selectedQuestion.reviewStatus,
      reviewerName: selectedQuestion.reviewerName ?? '',
      sourceName: selectedQuestion.sourceName ?? '',
      sourceUrl: selectedQuestion.sourceUrl ?? '',
      isActive: selectedQuestion.isActive,
    });
  }, [selectedQuestion]);

  const selectedChallengeCases = useMemo(() => (
    challengeSelection
      .map((id) => questionCatalog.find((question) => question.id === id))
      .filter((entry): entry is AdminQuestionSummary => Boolean(entry))
  ), [challengeSelection, questionCatalog]);

  const specialtyOptions = useMemo(() => {
    const options = Array.from(new Set<string>(questionCatalog.map((question) => question.specialty)));
    return options.sort((left, right) => left.localeCompare(right, 'zh-CN'));
  }, [questionCatalog]);

  const filteredQuestionCatalog = useMemo(() => {
    const normalizedSearch = questionSearch.trim().toLowerCase();

    return questionCatalog.filter((question) => {
      const matchesSearch = normalizedSearch.length === 0
        || question.category.toLowerCase().includes(normalizedSearch)
        || question.description.toLowerCase().includes(normalizedSearch)
        || question.specialty.toLowerCase().includes(normalizedSearch)
        || question.modality.toLowerCase().includes(normalizedSearch);
      const matchesStatus = questionReviewFilter === 'all' || question.reviewStatus === questionReviewFilter;
      const matchesSpecialty = questionSpecialtyFilter === 'all' || question.specialty === questionSpecialtyFilter;
      const matchesOpsPreset = matchesQuestionOpsPreset(question, questionOpsPreset);

      return matchesSearch && matchesStatus && matchesSpecialty && matchesOpsPreset;
    });
  }, [questionCatalog, questionOpsPreset, questionReviewFilter, questionSearch, questionSpecialtyFilter]);

  const questionOpsCards = useMemo(() => ([
    {
      key: 'pending_review' as const,
      title: '待审核处理',
      count: questionCatalog.filter((question) => matchesQuestionOpsPreset(question, 'pending_review')).length,
      detail: '草稿和审核中题目',
      accent: 'amber',
    },
    {
      key: 'missing_source' as const,
      title: '缺来源信息',
      count: questionCatalog.filter((question) => matchesQuestionOpsPreset(question, 'missing_source')).length,
      detail: '来源名称或链接未补齐',
      accent: 'blue',
    },
    {
      key: 'missing_reviewer' as const,
      title: '缺审核人',
      count: questionCatalog.filter((question) => matchesQuestionOpsPreset(question, 'missing_reviewer')).length,
      detail: '尚未指派责任人',
      accent: 'violet',
    },
    {
      key: 'inactive_ready' as const,
      title: '可重新启用',
      count: questionCatalog.filter((question) => matchesQuestionOpsPreset(question, 'inactive_ready')).length,
      detail: '已通过但当前停用',
      accent: 'emerald',
    },
  ]), [questionCatalog]);

  const allFilteredSelected = filteredQuestionCatalog.length > 0
    && filteredQuestionCatalog.every((question) => selectedQuestionIds.includes(question.id));

  const remainingQuestionPool = useMemo(() => (
    questionCatalog.filter((question) => !challengeSelection.includes(question.id))
  ), [challengeSelection, questionCatalog]);

  const filteredChallengePool = useMemo(() => {
    const normalizedSearch = challengeSearch.trim().toLowerCase();

    return remainingQuestionPool.filter((question) => {
      const matchesSearch = normalizedSearch.length === 0
        || question.category.toLowerCase().includes(normalizedSearch)
        || question.description.toLowerCase().includes(normalizedSearch)
        || question.specialty.toLowerCase().includes(normalizedSearch)
        || question.modality.toLowerCase().includes(normalizedSearch);
      const matchesSpecialty = challengeSpecialtyFilter === 'all' || question.specialty === challengeSpecialtyFilter;
      const matchesReview = challengeReviewFilter === 'all' || question.reviewStatus === challengeReviewFilter;
      const matchesActive = !challengeActiveOnly || question.isActive;

      return matchesSearch && matchesSpecialty && matchesReview && matchesActive;
    });
  }, [challengeActiveOnly, challengeReviewFilter, challengeSearch, challengeSpecialtyFilter, remainingQuestionPool]);

  const challengeDifficultyBreakdown = useMemo(() => {
    const bucket = {
      Easy: 0,
      Medium: 0,
      Hard: 0,
    };

    selectedChallengeCases.forEach((entry) => {
      bucket[entry.difficulty] += 1;
    });

    return bucket;
  }, [selectedChallengeCases]);

  const challengeSpecialtySummary = useMemo(() => {
    const bucket = new Map<string, number>();
    selectedChallengeCases.forEach((entry) => {
      bucket.set(entry.specialty, (bucket.get(entry.specialty) ?? 0) + 1);
    });

    return Array.from(bucket.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, 'zh-CN'));
  }, [selectedChallengeCases]);

  const challengeHealthNotes = useMemo(() => {
    const notes: Array<{ tone: 'amber' | 'blue' | 'emerald'; title: string; detail: string }> = [];

    if (selectedChallengeCases.length < 5) {
      notes.push({
        tone: 'amber',
        title: '题组数量不足',
        detail: `当前只选了 ${selectedChallengeCases.length} 道题，建议至少补足到 5 道再发布。`,
      });
    } else {
      notes.push({
        tone: 'emerald',
        title: '题组数量达标',
        detail: `当前题组共 ${selectedChallengeCases.length} 道题，可以正常发布。`,
      });
    }

    if (challengeDifficultyBreakdown.Hard === 0 || challengeDifficultyBreakdown.Easy === 0) {
      notes.push({
        tone: 'blue',
        title: '难度层次偏单一',
        detail: '当前题组没有同时覆盖简单题和困难题，用户体感可能会偏平或偏陡。',
      });
    } else {
      notes.push({
        tone: 'emerald',
        title: '难度梯度正常',
        detail: `简单 ${challengeDifficultyBreakdown.Easy} / 中等 ${challengeDifficultyBreakdown.Medium} / 困难 ${challengeDifficultyBreakdown.Hard}`,
      });
    }

    if (challengeSpecialtySummary.length <= 2 && selectedChallengeCases.length >= 4) {
      notes.push({
        tone: 'amber',
        title: '专科覆盖偏窄',
        detail: `当前主要集中在 ${challengeSpecialtySummary.map((item) => item.label).slice(0, 2).join('、')}，可以补一题不同专科拉开覆盖面。`,
      });
    } else if (challengeSpecialtySummary.length > 0) {
      notes.push({
        tone: 'emerald',
        title: '专科覆盖较均衡',
        detail: `当前覆盖 ${challengeSpecialtySummary.length} 个专科，适合做日更题组。`,
      });
    }

    return notes;
  }, [challengeDifficultyBreakdown, challengeSpecialtySummary, selectedChallengeCases.length]);

  const challengeRecommendations = useMemo(() => {
    const selectedSpecialties = new Set(selectedChallengeCases.map((entry) => entry.specialty));
    const recommendations: Array<{ id: string; title: string; detail: string; entry: AdminQuestionSummary }> = [];

    const pushIfAbsent = (entry: AdminQuestionSummary | undefined, detail: string) => {
      if (!entry || recommendations.some((item) => item.entry.id === entry.id)) {
        return;
      }

      recommendations.push({
        id: entry.id,
        title: entry.category,
        detail,
        entry,
      });
    };

    if (challengeDifficultyBreakdown.Hard === 0) {
      pushIfAbsent(
        filteredChallengePool.find((entry) => entry.difficulty === 'Hard' && entry.reviewStatus === 'approved' && entry.isActive),
        '推荐补一题困难题，避免题组强度过平。'
      );
    }

    if (challengeDifficultyBreakdown.Easy === 0) {
      pushIfAbsent(
        filteredChallengePool.find((entry) => entry.difficulty === 'Easy' && entry.reviewStatus === 'approved' && entry.isActive),
        '推荐补一题简单题，给用户一个更自然的起手节奏。'
      );
    }

    if (challengeSpecialtySummary.length <= 2) {
      pushIfAbsent(
        filteredChallengePool.find((entry) => !selectedSpecialties.has(entry.specialty) && entry.reviewStatus === 'approved' && entry.isActive),
        '推荐补一个新专科，拉开题组覆盖面。'
      );
    }

    if (selectedChallengeCases.length < 5) {
      pushIfAbsent(
        filteredChallengePool.find((entry) => entry.reviewStatus === 'approved' && entry.isActive),
        '当前题组未补满，先加一题可发布候选。'
      );
    }

    return recommendations.slice(0, 3);
  }, [challengeDifficultyBreakdown, challengeSpecialtySummary.length, filteredChallengePool, selectedChallengeCases]);

  const updateQuestionForm = (patch: Partial<typeof questionForm>) => {
    setQuestionForm((prev) => ({ ...prev, ...patch }));
  };

  const appendChallengeSelection = (questionId: string) => {
    setChallengeSelection((prev) => (prev.includes(questionId) ? prev : [...prev, questionId]));
  };

  const handleSaveQuestion = async () => {
    if (!selectedQuestion) {
      return;
    }

    setSaving(true);
    const result = await saveAdminQuestion(selectedQuestion.id, questionForm);
    setMessage(result.message);
    await loadData();
    setSaving(false);
  };

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestionIds((prev) => prev.includes(questionId)
      ? prev.filter((id) => id !== questionId)
      : [...prev, questionId]);
  };

  const toggleSelectAllFiltered = () => {
    setSelectedQuestionIds((prev) => {
      if (allFilteredSelected) {
        return prev.filter((id) => !filteredQuestionCatalog.some((question) => question.id === id));
      }

      const next = new Set(prev);
      filteredQuestionCatalog.forEach((question) => next.add(question.id));
      return Array.from(next);
    });
  };

  const handleBatchQuestionUpdate = async (patch: {
    reviewStatus?: ReviewStatus;
    isActive?: boolean;
    reviewerName?: string | null;
  }) => {
    setSaving(true);
    const result = await saveAdminQuestionBatch(selectedQuestionIds, patch);
    setMessage(result.message);
    if (result.success) {
      await loadData();
    }
    setSaving(false);
  };

  const handleSaveChallenge = async () => {
    if (!snapshot) {
      return;
    }

    setSaving(true);
    const result = await saveAdminDailyChallengeConfig(challengeDateKey, challengeSelection);
    setMessage(result.message);
    await loadData();
    setSaving(false);
  };

  const moveChallengeItem = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= challengeSelection.length) {
      return;
    }

    const next = [...challengeSelection];
    const [moved] = next.splice(index, 1);
    next.splice(nextIndex, 0, moved);
    setChallengeSelection(next);
  };

  const renderOverview = () => {
    if (!snapshot) {
      return null;
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-5">
            <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">题目总量</div>
            <div className="text-3xl font-black text-slate-900 mt-2">{snapshot.questionCount}</div>
            <div className="text-sm text-slate-500 mt-1">当前题库总数</div>
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 p-5">
            <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">启用题目</div>
            <div className="text-3xl font-black text-emerald-600 mt-2">{snapshot.activeQuestionCount}</div>
            <div className="text-sm text-slate-500 mt-1">可参与出题</div>
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 p-5">
            <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">题组配置日期</div>
            <div className="text-3xl font-black text-amber-600 mt-2">{snapshot.todayChallenge.questionCount}</div>
            <div className="text-sm text-slate-500 mt-1">{challengeDateKey}</div>
            <div className="text-xs text-slate-400 mt-2">
              已完成 {snapshot.todayChallenge.completedCount} / 总尝试 {snapshot.todayChallenge.attemptCount}
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 p-5">
            <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">埋点事件</div>
            <div className="text-3xl font-black text-blue-600 mt-2">{snapshot.analytics.totalEvents}</div>
            <div className="text-sm text-slate-500 mt-1">
              {snapshot.analytics.source === 'supabase' ? 'Supabase 实时视图' : '本地已记录 / 可同步'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <div className="text-xs uppercase tracking-wide font-bold text-slate-400 mb-4">审核分布</div>
            <div className="space-y-3">
              {snapshot.reviewBreakdown.map((entry) => (
                <div key={entry.status} className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${reviewStatusClassMap[entry.status]}`}>
                    {reviewStatusLabelMap[entry.status]}
                  </span>
                  <span className="text-sm font-black text-slate-900">{entry.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <div className="text-xs uppercase tracking-wide font-bold text-slate-400 mb-4">专科分布</div>
            <div className="space-y-3">
              {snapshot.specialtyBreakdown.map((entry) => (
                <div key={entry.label} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{entry.label}</span>
                  <span className="text-sm font-black text-slate-900">{entry.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderQuestions = () => (
    <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3 max-h-[72vh] overflow-y-auto">
        <div className="space-y-3 sticky top-0 bg-white pb-3 z-10">
          <div className="grid grid-cols-2 gap-3">
            {questionOpsCards.map((card) => (
              <button
                key={card.key}
                onClick={() => setQuestionOpsPreset((current) => current === card.key ? 'all' : card.key)}
                className={`rounded-2xl border p-4 text-left transition ${
                  questionOpsPreset === card.key
                    ? card.accent === 'amber'
                      ? 'border-amber-200 bg-amber-50'
                      : card.accent === 'emerald'
                        ? 'border-emerald-200 bg-emerald-50'
                        : card.accent === 'violet'
                          ? 'border-violet-200 bg-violet-50'
                          : 'border-blue-200 bg-blue-50'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">待处理清单</div>
                <div className="text-lg font-black text-slate-900 mt-2">{card.count}</div>
                <div className="text-sm font-semibold text-slate-700 mt-1">{card.title}</div>
                <div className="text-xs text-slate-500 mt-1">{card.detail}</div>
              </button>
            ))}
          </div>
          <input
            value={questionSearch}
            onChange={(event) => setQuestionSearch(event.target.value)}
            placeholder="搜索题目、专科、模态"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={questionReviewFilter}
              onChange={(event) => setQuestionReviewFilter(event.target.value as QuestionFilterStatus)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
            >
              <option value="all">全部状态</option>
              <option value="approved">已通过</option>
              <option value="reviewing">审核中</option>
              <option value="draft">草稿</option>
              <option value="archived">已归档</option>
            </select>
            <select
              value={questionSpecialtyFilter}
              onChange={(event) => setQuestionSpecialtyFilter(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
            >
              <option value="all">全部专科</option>
              {specialtyOptions.map((specialty) => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
          </div>
          <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleSelectAllFiltered}
              className="h-4 w-4"
            />
            <span className="text-sm font-medium text-slate-700">
              当前筛选结果全选（{filteredQuestionCatalog.length}）
            </span>
          </label>
          {questionOpsPreset !== 'all' && (
            <button
              onClick={() => setQuestionOpsPreset('all')}
              className="w-full rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 hover:border-slate-400"
            >
              清除快捷筛选
            </button>
          )}
        </div>

        {filteredQuestionCatalog.map((question) => (
          <button
            key={question.id}
            onClick={() => setSelectedQuestionId(question.id)}
            className={`w-full text-left rounded-2xl border p-4 transition-all ${
              selectedQuestionId === question.id
                ? 'border-blue-300 bg-blue-50/60 shadow-sm'
                : 'border-slate-200 bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <label
                className="inline-flex items-center"
                onClick={(event) => event.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={selectedQuestionIds.includes(question.id)}
                  onChange={() => toggleQuestionSelection(question.id)}
                  className="h-4 w-4"
                />
              </label>
              <div>
                <div className="text-sm font-bold text-slate-900">{question.category}</div>
                <div className="text-xs text-slate-500 mt-1 line-clamp-2">{question.description}</div>
              </div>
              <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${reviewStatusClassMap[question.reviewStatus]}`}>
                {reviewStatusLabelMap[question.reviewStatus]}
              </span>
            </div>
          </button>
        ))}
        {filteredQuestionCatalog.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            当前筛选条件下没有找到题目。
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6">
        <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide font-bold text-slate-400">批量操作</div>
              <div className="text-sm text-slate-600 mt-1">已选 {selectedQuestionIds.length} 道题</div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <input
                value={batchReviewerName}
                onChange={(event) => setBatchReviewerName(event.target.value)}
                placeholder="批量指派审核人"
                className="min-w-[180px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-300"
              />
              <button
                onClick={() => void handleBatchQuestionUpdate({ reviewStatus: 'approved' })}
                disabled={saving || selectedQuestionIds.length === 0}
                className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-bold disabled:opacity-50"
              >
                批量通过
              </button>
              <button
                onClick={() => void handleBatchQuestionUpdate({ reviewStatus: 'reviewing' })}
                disabled={saving || selectedQuestionIds.length === 0}
                className="px-3 py-2 rounded-xl bg-amber-50 text-amber-600 text-sm font-bold disabled:opacity-50"
              >
                批量审核中
              </button>
              <button
                onClick={() => void handleBatchQuestionUpdate({ isActive: true })}
                disabled={saving || selectedQuestionIds.length === 0}
                className="px-3 py-2 rounded-xl bg-blue-50 text-blue-600 text-sm font-bold disabled:opacity-50"
              >
                批量启用
              </button>
              <button
                onClick={() => void handleBatchQuestionUpdate({ isActive: false })}
                disabled={saving || selectedQuestionIds.length === 0}
                className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold disabled:opacity-50"
              >
                批量停用
              </button>
              <button
                onClick={() => void handleBatchQuestionUpdate({ reviewerName: batchReviewerName.trim() || null })}
                disabled={saving || selectedQuestionIds.length === 0}
                className="px-3 py-2 rounded-xl bg-violet-50 text-violet-600 text-sm font-bold disabled:opacity-50"
              >
                批量指派审核人
              </button>
            </div>
          </div>
        </div>

        {selectedQuestion ? (
          <div className="space-y-5">
            <div>
              <div className="text-xs uppercase tracking-wide font-bold text-slate-400">当前题目</div>
              <div className="text-2xl font-display font-black text-slate-900 mt-2">{selectedQuestion.category}</div>
              <div className="text-sm text-slate-500 mt-2 leading-relaxed">{selectedQuestion.description}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-xs uppercase tracking-wide font-bold text-slate-400 mb-2">审核状态</span>
                <select
                  value={questionForm.reviewStatus}
                  onChange={(event) => updateQuestionForm({ reviewStatus: event.target.value as ReviewStatus })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
                >
                  <option value="approved">已通过</option>
                  <option value="reviewing">审核中</option>
                  <option value="draft">草稿</option>
                  <option value="archived">已归档</option>
                </select>
              </label>

              <label className="block">
                <span className="block text-xs uppercase tracking-wide font-bold text-slate-400 mb-2">审核人</span>
                <input
                  value={questionForm.reviewerName}
                  onChange={(event) => updateQuestionForm({ reviewerName: event.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="block text-xs uppercase tracking-wide font-bold text-slate-400 mb-2">来源名称</span>
                <input
                  value={questionForm.sourceName}
                  onChange={(event) => updateQuestionForm({ sourceName: event.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="block text-xs uppercase tracking-wide font-bold text-slate-400 mb-2">来源链接</span>
                <input
                  value={questionForm.sourceUrl}
                  onChange={(event) => updateQuestionForm({ sourceUrl: event.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
                />
              </label>
            </div>

            <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                type="checkbox"
                checked={questionForm.isActive}
                onChange={(event) => updateQuestionForm({ isActive: event.target.checked })}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium text-slate-700">启用这道题参与出题</span>
            </label>

            <div>
              <Button onClick={handleSaveQuestion} isLoading={saving}>
                保存题目配置
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500">请选择一题进行编辑。</div>
        )}
      </div>
    </div>
  );

  const renderChallenge = () => {
    if (!snapshot) {
      return null;
    }

    return (
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          {challengeHealthNotes.map((note) => (
            <div
              key={note.title}
              className={`rounded-2xl border p-4 ${
                note.tone === 'amber'
                  ? 'border-amber-100 bg-amber-50'
                  : note.tone === 'blue'
                    ? 'border-blue-100 bg-blue-50'
                    : 'border-emerald-100 bg-emerald-50'
              }`}
            >
              <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">题组健康度</div>
              <div className="text-sm font-bold text-slate-900 mt-2">{note.title}</div>
              <div className="text-xs text-slate-600 mt-2 leading-relaxed">{note.detail}</div>
            </div>
          ))}
        </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
            <div>
              <div className="text-xs uppercase tracking-wide font-bold text-slate-400">运营日期</div>
              <div className="text-sm text-slate-500 mt-1">可提前配置未来的每日挑战题组。</div>
            </div>
            <label className="block">
              <span className="block text-xs uppercase tracking-wide font-bold text-slate-400 mb-2">挑战日期</span>
              <input
                type="date"
                value={challengeDateKey}
                onChange={(event) => setChallengeDateKey(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">总尝试</div>
              <div className="text-2xl font-black text-slate-900 mt-2">{snapshot.todayChallenge.attemptCount}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">已完成</div>
              <div className="text-2xl font-black text-emerald-600 mt-2">{snapshot.todayChallenge.completedCount}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">平均分</div>
              <div className="text-2xl font-black text-amber-600 mt-2">{snapshot.todayChallenge.averageScore ?? '--'}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">最高分</div>
              <div className="text-2xl font-black text-blue-600 mt-2">{snapshot.todayChallenge.bestScore ?? '--'}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-4 mb-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">难度结构</div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white px-3 py-3">
                  <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">Easy</div>
                  <div className="text-xl font-black text-emerald-600 mt-1">{challengeDifficultyBreakdown.Easy}</div>
                </div>
                <div className="rounded-2xl bg-white px-3 py-3">
                  <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">Medium</div>
                  <div className="text-xl font-black text-amber-600 mt-1">{challengeDifficultyBreakdown.Medium}</div>
                </div>
                <div className="rounded-2xl bg-white px-3 py-3">
                  <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">Hard</div>
                  <div className="text-xl font-black text-rose-600 mt-1">{challengeDifficultyBreakdown.Hard}</div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">专科覆盖</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {challengeSpecialtySummary.length > 0 ? challengeSpecialtySummary.map((entry) => (
                  <span
                    key={entry.label}
                    className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200"
                  >
                    {entry.label} · {entry.count}
                  </span>
                )) : (
                  <span className="text-sm text-slate-500">当前还没有选中题目。</span>
                )}
              </div>
            </div>
          </div>
          <div className="text-xs uppercase tracking-wide font-bold text-slate-400 mb-4">已选题组</div>
          <div className="space-y-3">
            {selectedChallengeCases.map((entry, index) => (
              <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-slate-900">第 {index + 1} 题 · {entry.category}</div>
                    <div className="text-xs text-slate-500 mt-1">{entry.description}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => moveChallengeItem(index, -1)} className="text-xs font-bold text-slate-500">上移</button>
                    <button onClick={() => moveChallengeItem(index, 1)} className="text-xs font-bold text-slate-500">下移</button>
                    <button
                      onClick={() => setChallengeSelection((prev) => prev.filter((id) => id !== entry.id))}
                      className="text-xs font-bold text-rose-500"
                    >
                      移除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <Button onClick={handleSaveChallenge} isLoading={saving}>
              发布 {challengeDateKey} 题组
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6">
          <div className="space-y-3 mb-4">
            {challengeRecommendations.length > 0 && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="text-[10px] uppercase tracking-wide font-bold text-blue-500">推荐补位</div>
                <div className="mt-3 space-y-3">
                  {challengeRecommendations.map((recommendation) => (
                    <button
                      key={recommendation.id}
                      onClick={() => appendChallengeSelection(recommendation.entry.id)}
                      className="w-full rounded-2xl border border-white/90 bg-white p-4 text-left hover:border-blue-200"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-slate-900">{recommendation.title}</div>
                          <div className="text-xs text-slate-500 mt-1">{recommendation.entry.specialty} · {recommendation.entry.modality}</div>
                        </div>
                        <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600">
                          一键加入
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-2 leading-relaxed">{recommendation.detail}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="text-xs uppercase tracking-wide font-bold text-slate-400">题库候选池</div>
            <input
              value={challengeSearch}
              onChange={(event) => setChallengeSearch(event.target.value)}
              placeholder="搜索候选题目"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={challengeReviewFilter}
                onChange={(event) => setChallengeReviewFilter(event.target.value as QuestionFilterStatus)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
              >
                <option value="approved">仅已通过</option>
                <option value="all">全部状态</option>
                <option value="reviewing">审核中</option>
                <option value="draft">草稿</option>
                <option value="archived">已归档</option>
              </select>
              <select
                value={challengeSpecialtyFilter}
                onChange={(event) => setChallengeSpecialtyFilter(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
              >
                <option value="all">全部专科</option>
                {specialtyOptions.map((specialty) => (
                  <option key={specialty} value={specialty}>{specialty}</option>
                ))}
              </select>
            </div>
            <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                type="checkbox"
                checked={challengeActiveOnly}
                onChange={(event) => setChallengeActiveOnly(event.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium text-slate-700">仅显示已启用题目</span>
            </label>
            <div className="text-xs text-slate-500">
              当前可选 {filteredChallengePool.length} 道题，已入选 {challengeSelection.length} 道。
            </div>
          </div>
          <div className="space-y-3 max-h-[72vh] overflow-y-auto">
            {filteredChallengePool.map((entry) => (
              <button
                key={entry.id}
                onClick={() => appendChallengeSelection(entry.id)}
                className="w-full text-left rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-blue-300"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-slate-900">{entry.category}</div>
                    <div className="text-xs text-slate-500 mt-1 line-clamp-2">{entry.description}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${reviewStatusClassMap[entry.reviewStatus]}`}>
                    {reviewStatusLabelMap[entry.reviewStatus]}
                  </span>
                </div>
              </button>
            ))}
            {filteredChallengePool.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                当前筛选条件下没有可加入题组的候选题目。
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    if (!snapshot) {
      return null;
    }

    const exposureCount = snapshot.analytics.funnel.find((entry) => entry.label === '首页曝光')?.count ?? 0;
    const sessionStartedCount = snapshot.analytics.funnel.find((entry) => entry.label === '开始对局')?.count ?? 0;
    const sessionCompletedCount = snapshot.analytics.funnel.find((entry) => entry.label === '完成对局')?.count ?? 0;
    const homeToStartRate = exposureCount > 0
      ? Math.round((sessionStartedCount / exposureCount) * 100)
      : null;
    const startToCompleteRate = sessionStartedCount > 0
      ? Math.round((sessionCompletedCount / sessionStartedCount) * 100)
      : null;

    return (
      <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <div className="text-xs uppercase tracking-wide font-bold text-slate-400">数据来源</div>
              <div className="text-sm font-bold text-slate-900 mt-1">
                {snapshot.analytics.source === 'supabase' ? 'Supabase 已同步事件' : '当前设备本地事件'}
              </div>
              <div className="text-xs text-slate-500 mt-2">{snapshot.analytics.windowLabel}</div>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              snapshot.analytics.source === 'supabase'
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-slate-100 text-slate-600'
            }`}>
              {snapshot.analytics.source === 'supabase' ? '在线' : '本地模式'}
            </span>
          </div>

          <div className="flex gap-2 mb-5">
            {([
              { label: '24h', value: 1 },
              { label: '7d', value: 7 },
              { label: '30d', value: 30 },
            ] as Array<{ label: string; value: AnalyticsWindow }>).map((option) => (
              <button
                key={option.value}
                onClick={() => setAnalyticsWindow(option.value)}
                className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all ${
                  analyticsWindow === option.value
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-500 hover:text-slate-800'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">总事件</div>
              <div className="text-2xl font-black text-slate-900 mt-2">{snapshot.analytics.totalEvents}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">已同步</div>
              <div className="text-2xl font-black text-emerald-600 mt-2">{snapshot.analytics.syncedEvents}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">待同步本地</div>
              <div className="text-2xl font-black text-amber-600 mt-2">{snapshot.analytics.pendingLocalEvents}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">活跃用户</div>
              <div className="text-2xl font-black text-blue-600 mt-2">{snapshot.analytics.uniqueUsers}</div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 mb-5">
            <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">最近事件时间</div>
            <div className="text-sm font-black text-slate-900 mt-2">
              {snapshot.analytics.latestEventAt
                ? new Date(snapshot.analytics.latestEventAt).toLocaleString('zh-CN')
                : '--'}
            </div>
          </div>

          <div className="mb-5">
            <div className="text-xs uppercase tracking-wide font-bold text-slate-400 mb-3">核心漏斗</div>
            <div className="space-y-3">
              {snapshot.analytics.funnel.map((entry) => (
                <div key={entry.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-600">{entry.label}</span>
                  <span className="text-sm font-black text-slate-900">{entry.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">曝光开局转化</div>
              <div className="text-2xl font-black text-slate-900 mt-2">{homeToStartRate !== null ? `${homeToStartRate}%` : '--'}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">开局完赛转化</div>
              <div className="text-2xl font-black text-slate-900 mt-2">{startToCompleteRate !== null ? `${startToCompleteRate}%` : '--'}</div>
            </div>
          </div>

          <div className="space-y-3">
            {snapshot.analytics.topEvents.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-600">{entry.name}</span>
                <span className="text-sm font-black text-slate-900">{entry.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6">
          <div className="text-xs uppercase tracking-wide font-bold text-slate-400 mb-4">玩法分布</div>
          <div className="space-y-3 mb-6">
            {snapshot.analytics.modeBreakdown.length > 0 ? snapshot.analytics.modeBreakdown.map((entry) => (
              <div key={entry.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-900">{entry.label}</div>
                  <div className="text-xs text-slate-500">
                    开局 {entry.started} / 完赛 {entry.completed}
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-slate-900"
                    style={{ width: `${entry.started > 0 ? Math.min((entry.completed / entry.started) * 100, 100) : 0}%` }}
                  />
                </div>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                当前样本里还没有形成玩法分布数据。
              </div>
            )}
          </div>

          <div className="text-xs uppercase tracking-wide font-bold text-slate-400 mb-4">最近事件流</div>
          <div className="space-y-2 max-h-[56vh] overflow-y-auto">
            {snapshot.analytics.recentEvents.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-900">{entry.name}</div>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${
                    entry.syncedAt
                      ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
                      : 'text-amber-600 bg-amber-50 border-amber-100'
                  }`}>
                    {entry.syncedAt ? '已同步' : '待同步'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  {new Date(entry.createdAt).toLocaleString('zh-CN')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app-safe-screen min-h-screen bg-slate-50 p-4 md:p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          <ScreenHeader
            eyebrow="Internal Admin"
            title="内部管理台"
            description="这套后台只服务内部配置，不对普通用户开放。这里先把第一阶段最关键的题目审核、题组发布和埋点查看闭环打通。"
            backLabel="返回首页"
            onBack={onClose}
          />
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-2 flex gap-2">
          {(Object.keys(tabLabelMap) as AdminTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                activeTab === tab ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {tabLabelMap[tab]}
            </button>
          ))}
        </div>

        {message && (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            {message}
          </div>
        )}

        {loading || !snapshot ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-10 flex flex-col items-center justify-center min-h-[320px]">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-sm text-slate-500 font-medium mt-4">正在加载后台数据...</div>
          </div>
        ) : activeTab === 'overview' ? renderOverview()
          : activeTab === 'questions' ? renderQuestions()
            : activeTab === 'challenge' ? renderChallenge()
              : renderAnalytics()}
      </div>
    </div>
  );
};
