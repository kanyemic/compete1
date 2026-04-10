import React from 'react';
import { ProfileSummary } from '../types';
import { Button } from './Button';

interface ProfileProps {
  summary: ProfileSummary;
  loading?: boolean;
  onClose: () => void;
}

const formatDate = (value: string | null): string => {
  if (!value) {
    return '暂无记录';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '暂无记录';
  }

  return parsed.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const Profile: React.FC<ProfileProps> = ({ summary, loading = false, onClose }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 animate-fade-in relative">
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-teal-100 rounded-full blur-3xl opacity-30"></div>
      </div>

      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="p-6 md:p-8 border-b border-slate-100 bg-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-display font-extrabold text-slate-900">个人主页</h2>
              <p className="text-sm text-slate-400 font-medium mt-1">查看你的训练轨迹、答题表现和每日挑战进度。</p>
            </div>
            <Button variant="ghost" onClick={onClose} className="!p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-slate-400 text-sm font-medium">正在加载个人数据...</span>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-3xl shadow-sm">
                    {summary.avatar}
                  </div>
                  <div>
                    <div className="text-sm uppercase tracking-wide font-bold text-slate-400">训练身份</div>
                    <div className="text-2xl font-display font-black text-slate-900">{summary.displayName}</div>
                    <div className="text-sm text-slate-500 font-medium mt-1">最近训练：{formatDate(summary.lastPlayedAt)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full md:w-auto md:min-w-[360px]">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4">
                    <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">历史最佳</div>
                    <div className="text-2xl font-black text-blue-600 mt-2">{summary.bestSoloStreak}</div>
                    <div className="text-xs text-slate-500 mt-1">单人连胜</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-4">
                    <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">正确率</div>
                    <div className="text-2xl font-black text-emerald-600 mt-2">{summary.correctRate}%</div>
                    <div className="text-xs text-slate-500 mt-1">累计作答</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">累计局数</div>
                  <div className="text-3xl font-black text-slate-900 mt-2">{summary.totalSoloRuns}</div>
                  <div className="text-sm text-slate-500 mt-1">单人连胜</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">累计作答</div>
                  <div className="text-3xl font-black text-slate-900 mt-2">{summary.totalQuestionsAnswered}</div>
                  <div className="text-sm text-slate-500 mt-1">病例题数量</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">答对题数</div>
                  <div className="text-3xl font-black text-slate-900 mt-2">{summary.totalCorrectAnswers}</div>
                  <div className="text-sm text-slate-500 mt-1">累计正确</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">错题积累</div>
                  <div className="text-3xl font-black text-amber-600 mt-2">{summary.wrongQuestionCount}</div>
                  <div className="text-sm text-slate-500 mt-1">等待复盘</div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-xs uppercase tracking-wide font-bold text-slate-400">每日挑战</div>
                      <div className="text-xl font-display font-black text-slate-900 mt-1">挑战摘要</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl">📅</div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">已完成天数</span>
                      <span className="text-lg font-black text-slate-900">{summary.dailyChallengesCompleted}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">最佳成绩</span>
                      <span className="text-lg font-black text-amber-600">{summary.bestDailyChallengeScore}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">最近一次成绩</span>
                      <span className="text-lg font-black text-slate-900">{summary.latestDailyChallengeScore ?? '--'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-xs uppercase tracking-wide font-bold text-slate-400">训练建议</div>
                      <div className="text-xl font-display font-black text-slate-900 mt-1">当前状态</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl">📈</div>
                  </div>

                  <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
                    <p>如果正确率还不高，优先多刷单人连胜，先把基础病例识别速度拉起来。</p>
                    <p>如果错题数积累明显，建议优先去错题本做复盘，再继续刷新局。</p>
                    <p>如果每日挑战成绩提升缓慢，通常说明你需要更稳定地处理限时高压答题。</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
