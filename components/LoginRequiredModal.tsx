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
  confirmLabel = '去个人中心登录',
  onClose,
  onGoToProfile,
}) => {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/18 backdrop-blur-xl p-4"
      style={{
        paddingTop: 'max(16px, calc(var(--safe-top) + 8px))',
        paddingBottom: 'max(16px, calc(var(--safe-bottom) + 8px))',
      }}
    >
      <div className="w-full max-w-md rounded-[32px] border border-white/95 bg-white/96 shadow-[0_22px_80px_rgba(15,23,42,0.14)] backdrop-blur-2xl p-6 md:p-8 animate-fade-in">
        <div className="w-14 h-14 rounded-[20px] bg-[#eaf4ff] text-[#0a84ff] flex items-center justify-center text-3xl mb-5">
          🔐
        </div>
        <h3 className="text-[28px] leading-none font-display font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 mt-3 leading-relaxed">{description}</p>
        <div className="mt-4 rounded-[22px] bg-[#f2f2f7] px-4 py-3 text-sm text-slate-500 leading-relaxed">
          登录、注册和身份绑定都会在个人中心里完成，当前设备的游客资料也会一起带过去。
        </div>
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
