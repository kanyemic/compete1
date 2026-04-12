import React from 'react';
import { Button } from './Button';

interface LoginRequiredModalProps {
  title: string;
  description: string;
  confirmLabel?: string;
  onClose: () => void;
  onGoToProfile: () => void;
}

export const LoginRequiredModal: React.FC<LoginRequiredModalProps> = ({
  title,
  description,
  confirmLabel = '去个人主页登录',
  onClose,
  onGoToProfile,
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl p-6 md:p-8 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-3xl mb-5">
          🔐
        </div>
        <h3 className="text-2xl font-display font-black text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 mt-3 leading-relaxed">{description}</p>
        <div className="mt-6 space-y-3">
          <Button onClick={onGoToProfile} className="w-full">
            {confirmLabel}
          </Button>
          <Button onClick={onClose} variant="secondary" className="w-full">
            先看看每日挑战
          </Button>
        </div>
      </div>
    </div>
  );
};
