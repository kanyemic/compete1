import React, { useEffect, useState } from 'react';
import { AdminSnapshot, ReviewStatus } from '../types';
import { fetchAdminSnapshot } from '../services/admin';
import { Button } from './Button';

interface AdminDashboardProps {
  onClose: () => void;
}

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

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSnapshot = async () => {
      setLoading(true);
      const nextSnapshot = await fetchAdminSnapshot();
      setSnapshot(nextSnapshot);
      setLoading(false);
    };

    void loadSnapshot();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] font-bold text-slate-400">Admin MVP</div>
              <h1 className="text-3xl md:text-4xl font-display font-black text-slate-900 mt-2">内部管理台</h1>
              <p className="text-sm md:text-base text-slate-500 mt-3 max-w-3xl leading-relaxed">
                先把第一阶段需要的题库概览、每日挑战预览和埋点数据放到一个轻量页面里，后面接真实题库和运营动作时可以直接延展。
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={onClose}>
                返回首页
              </Button>
            </div>
          </div>
        </div>

        {loading || !snapshot ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-10 flex flex-col items-center justify-center min-h-[320px]">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-sm text-slate-500 font-medium mt-4">正在加载后台数据...</div>
          </div>
        ) : (
          <>
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
                <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">今日挑战题数</div>
                <div className="text-3xl font-black text-amber-600 mt-2">{snapshot.todayChallenge.questionCount}</div>
                <div className="text-sm text-slate-500 mt-1">{snapshot.todayChallenge.dateKey}</div>
              </div>
              <div className="bg-white rounded-3xl border border-slate-200 p-5">
                <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">埋点事件</div>
                <div className="text-3xl font-black text-blue-600 mt-2">{snapshot.analytics.totalEvents}</div>
                <div className="text-sm text-slate-500 mt-1">本地已记录 / 可同步</div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
              <div className="bg-white rounded-3xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="text-xs uppercase tracking-wide font-bold text-slate-400">Question Bank</div>
                    <div className="text-xl font-display font-black text-slate-900 mt-1">题库概览</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl">🗂️</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400 mb-3">审核分布</div>
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

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400 mb-3">专科分布</div>
                    <div className="space-y-3">
                      {snapshot.specialtyBreakdown.length === 0 ? (
                        <div className="text-sm text-slate-500">暂无题库分布数据</div>
                      ) : (
                        snapshot.specialtyBreakdown.map((entry) => (
                          <div key={entry.label} className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">{entry.label}</span>
                            <span className="text-sm font-black text-slate-900">{entry.count}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400 mb-3">最近更新题目</div>
                  <div className="space-y-3">
                    {snapshot.recentQuestions.map((question) => (
                      <div key={question.id} className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-slate-900">{question.specialty} · {question.modality}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            来源：{question.sourceName ?? '暂未标注'} · 审核人：{question.reviewerName ?? '待补充'}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-400">{question.difficulty}</span>
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${reviewStatusClassMap[question.reviewStatus]}`}>
                            {reviewStatusLabelMap[question.reviewStatus]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <div className="text-xs uppercase tracking-wide font-bold text-slate-400">Daily Ops</div>
                      <div className="text-xl font-display font-black text-slate-900 mt-1">今日挑战预览</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl">📅</div>
                  </div>

                  <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 mb-4">
                    <div className="text-sm font-bold text-slate-900">{snapshot.todayChallenge.title}</div>
                    <div className="text-sm text-slate-500 mt-1">
                      当前预览题数：{snapshot.todayChallenge.questionCount}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {snapshot.todayChallenge.cases.map((entry, index) => (
                      <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-bold text-slate-900">第 {index + 1} 题 · {entry.category}</div>
                            <div className="text-xs text-slate-500 mt-1">
                              {entry.specialty ?? '未分类'} / {entry.modality ?? '待补充'}
                            </div>
                          </div>
                          <span className="text-xs font-bold text-slate-400">{entry.difficulty}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <div className="text-xs uppercase tracking-wide font-bold text-slate-400">Analytics</div>
                      <div className="text-xl font-display font-black text-slate-900 mt-1">埋点概览</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl">📊</div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                      <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">总事件</div>
                      <div className="text-2xl font-black text-slate-900 mt-2">{snapshot.analytics.totalEvents}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                      <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">已同步</div>
                      <div className="text-2xl font-black text-emerald-600 mt-2">{snapshot.analytics.syncedEvents}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                      <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">最近事件</div>
                      <div className="text-sm font-black text-slate-900 mt-2">
                        {snapshot.analytics.latestEventAt
                          ? new Date(snapshot.analytics.latestEventAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
                          : '--'}
                      </div>
                    </div>
                  </div>

                  <div className="mb-5">
                    <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400 mb-3">高频事件</div>
                    <div className="space-y-3">
                      {snapshot.analytics.topEvents.map((entry) => (
                        <div key={entry.name} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <span className="text-sm text-slate-600">{entry.name}</span>
                          <span className="text-sm font-black text-slate-900">{entry.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400 mb-3">最近事件流</div>
                    <div className="space-y-2 max-h-[280px] overflow-y-auto">
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
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
