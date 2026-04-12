import React from 'react';
import { QuestionCase, ReviewStatus, WrongQuestionEntry } from '../types';

type MetaQuestion = Pick<
  QuestionCase,
  'specialty' | 'modality' | 'sourceName' | 'sourceUrl' | 'reviewStatus' | 'reviewerName' | 'updatedAt'
> | Pick<
  WrongQuestionEntry,
  'specialty' | 'modality' | 'sourceName' | 'sourceUrl' | 'reviewStatus' | 'reviewerName' | 'updatedAt'
>;

interface QuestionMetaPanelProps {
  item: MetaQuestion;
  compact?: boolean;
  title?: string;
}

const REVIEW_STATUS_STYLES: Record<ReviewStatus, string> = {
  approved: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  reviewing: 'text-amber-600 bg-amber-50 border-amber-100',
  archived: 'text-slate-500 bg-slate-50 border-slate-200',
  draft: 'text-slate-500 bg-slate-50 border-slate-200',
};

const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  approved: '已通过',
  reviewing: '审核中',
  archived: '已归档',
  draft: '草稿',
};

export const QuestionMetaPanel: React.FC<QuestionMetaPanelProps> = ({
  item,
  compact = false,
  title = '题目资料',
}) => {
  const reviewStatus = item.reviewStatus ?? 'draft';
  const updatedLabel = item.updatedAt
    ? new Date(item.updatedAt).toLocaleDateString('zh-CN')
    : '待补充';

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex items-center justify-between gap-4 mb-3">
        <div>
          <h4 className="text-slate-900 text-xs font-bold uppercase">{title}</h4>
          <div className="text-xs text-slate-400 mt-1">来源可追溯，审核状态可见</div>
        </div>
        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${REVIEW_STATUS_STYLES[reviewStatus]}`}>
          {REVIEW_STATUS_LABELS[reviewStatus]}
        </span>
      </div>

      <div className={`grid gap-3 ${compact ? 'md:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-4'}`}>
        <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">专科</div>
          <div className="text-sm font-semibold text-slate-900 mt-1">{item.specialty ?? '待补充'}</div>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">模态</div>
          <div className="text-sm font-semibold text-slate-900 mt-1">{item.modality ?? '待补充'}</div>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">审核人</div>
          <div className="text-sm font-semibold text-slate-900 mt-1">{item.reviewerName ?? '待补充'}</div>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">最近更新</div>
          <div className="text-sm font-semibold text-slate-900 mt-1">{updatedLabel}</div>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-3">
        <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">内容来源</div>
        <div className="text-sm font-semibold text-slate-900 mt-1">{item.sourceName ?? '暂未标注'}</div>
        {item.sourceUrl && (
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center text-sm text-blue-600 font-semibold hover:text-blue-700 mt-2"
          >
            查看来源链接
          </a>
        )}
      </div>
    </div>
  );
};
