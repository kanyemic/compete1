import React from 'react';

interface ScreenHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  backLabel?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  description,
  eyebrow,
  backLabel = '返回',
  onBack,
  actions,
}) => {
  return (
    <div className="app-safe-header border-b border-slate-200/80 bg-white/90 backdrop-blur-xl px-4 py-4 md:px-8 md:py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#e9ebf0] px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#dfe3ea] hover:text-slate-900"
              aria-label={backLabel}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 18l-6-6 6-6" />
              </svg>
              <span>{backLabel}</span>
            </button>
          )}
          <div>
            {eyebrow && (
              <div className="text-[11px] uppercase tracking-[0.24em] font-semibold text-slate-500">
                {eyebrow}
              </div>
            )}
            <h2 className="mt-2 text-[32px] leading-none font-display font-bold text-slate-900">
              {title}
            </h2>
            {description && (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </div>
  );
};
