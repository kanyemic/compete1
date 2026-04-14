import React, { useEffect, useMemo, useState } from 'react';
import { ProfileSummary, RankSnapshot, TrainingHistoryEntry } from '../types';
import { Button } from './Button';
import { ScreenHeader } from './ScreenHeader';
import { type LocalPlayerIdentity } from '../services/playerIdentity';
import { type AuthAccountSession } from '../services/auth';
import { QuestionBankId, QUESTION_BANK_OPTIONS } from '../services/questionBanks';

interface ProfileProps {
  summary: ProfileSummary;
  identity: LocalPlayerIdentity;
  accountSession: AuthAccountSession | null;
  authAvailable: boolean;
  authLoading?: boolean;
  accountStatusLabel: string;
  selectedQuestionBankId: QuestionBankId;
  initialAuthTab?: 'signin' | 'signup';
  loading?: boolean;
  onClose: () => void;
  onSelectQuestionBank: (id: QuestionBankId) => void;
  onUpdateDisplayName: (displayName: string) => Promise<{ success: boolean; message: string | null }>;
  onSignIn: (payload: {
    email: string;
    password: string;
    displayName?: string;
  }) => Promise<{ success: boolean; message: string | null }>;
  onSignUp: (payload: {
    email: string;
    password: string;
    displayName?: string;
  }) => Promise<{ success: boolean; message: string | null }>;
  onSignOut: () => Promise<{ success: boolean; message: string | null }>;
}

type AuthTab = 'signin' | 'signup';

type FeedbackState = {
  tone: 'success' | 'error';
  text: string;
} | null;

const formatDateTime = (value: string | null): string => {
  if (!value) {
    return '暂无记录';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '暂无记录';
  }

  return parsed.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRecordMode = (record: TrainingHistoryEntry): string => (
  record.mode === 'daily_challenge' ? '每日挑战' : '单人连胜'
);

const formatRank = (snapshot: RankSnapshot): string => (
  snapshot.rank ? `#${snapshot.rank}` : '--'
);

interface AuthFlowModalProps {
  tab: AuthTab;
  authAvailable: boolean;
  busy: boolean;
  guestDisplayName: string;
  signInEmail: string;
  signInPassword: string;
  signUpDisplayName: string;
  signUpEmail: string;
  signUpPassword: string;
  signUpConfirmPassword: string;
  feedback: FeedbackState;
  onClose: () => void;
  onSwitchTab: (tab: AuthTab) => void;
  onSignInEmailChange: (value: string) => void;
  onSignInPasswordChange: (value: string) => void;
  onSignUpDisplayNameChange: (value: string) => void;
  onSignUpEmailChange: (value: string) => void;
  onSignUpPasswordChange: (value: string) => void;
  onSignUpConfirmPasswordChange: (value: string) => void;
  onSubmitSignIn: () => void;
  onSubmitSignUp: () => void;
}

const AuthFlowModal: React.FC<AuthFlowModalProps> = ({
  tab,
  authAvailable,
  busy,
  guestDisplayName,
  signInEmail,
  signInPassword,
  signUpDisplayName,
  signUpEmail,
  signUpPassword,
  signUpConfirmPassword,
  feedback,
  onClose,
  onSwitchTab,
  onSignInEmailChange,
  onSignInPasswordChange,
  onSignUpDisplayNameChange,
  onSignUpEmailChange,
  onSignUpPasswordChange,
  onSignUpConfirmPasswordChange,
  onSubmitSignIn,
  onSubmitSignUp,
}) => (
  <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/18 backdrop-blur-xl p-4">
    <div className="w-full max-w-lg rounded-[32px] border border-white/95 bg-white/96 shadow-[0_22px_80px_rgba(15,23,42,0.14)] backdrop-blur-2xl animate-fade-in overflow-hidden">
      <div className="border-b border-slate-200/80 bg-white/88 px-6 py-5 md:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] font-semibold text-slate-400">Apple-Style Flow</div>
            <div className="mt-2 text-[28px] leading-none font-display font-bold text-slate-900">账号身份流程</div>
            <div className="mt-2 text-sm leading-relaxed text-slate-500">
              先完成登录或注册，再把当前设备上的游客资料带入正式账号。
            </div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100/90 text-slate-500 transition hover:bg-slate-200/90 hover:text-slate-900"
            aria-label="关闭身份流程"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-6 py-6 md:px-8 bg-[linear-gradient(180deg,rgba(255,255,255,0.35),rgba(245,247,250,0.7))]">
        <div className="rounded-[24px] border border-white/95 bg-white/94 p-4 mb-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
          <div className="text-sm font-semibold text-slate-900">当前游客资料</div>
          <div className="mt-2 text-sm leading-relaxed text-slate-500">
            当前昵称为“{guestDisplayName || '未设置昵称'}”，登录或注册成功后，现有游客成绩会自动并入账号。
          </div>
        </div>

        <div className="flex gap-1 rounded-[18px] bg-black/[0.06] p-1">
          <button
            onClick={() => onSwitchTab('signup')}
            className={`flex-1 rounded-[14px] px-4 py-2.5 text-sm font-semibold transition ${
              tab === 'signup' ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.14)]' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            注册
          </button>
          <button
            onClick={() => onSwitchTab('signin')}
            className={`flex-1 rounded-[14px] px-4 py-2.5 text-sm font-semibold transition ${
              tab === 'signin' ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.14)]' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            登录
          </button>
        </div>

        {tab === 'signin' ? (
          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">邮箱</label>
              <input
                value={signInEmail}
                onChange={(event) => onSignInEmailChange(event.target.value)}
                type="email"
                placeholder="name@example.com"
                className="w-full rounded-[18px] border border-white/70 bg-white/88 px-4 py-3.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">密码</label>
              <input
                value={signInPassword}
                onChange={(event) => onSignInPasswordChange(event.target.value)}
                type="password"
                placeholder="输入账号密码"
                className="w-full rounded-[18px] border border-white/70 bg-white/88 px-4 py-3.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
              />
            </div>
            <Button onClick={onSubmitSignIn} isLoading={busy} disabled={!authAvailable} className="w-full">
              登录并继续当前进度
            </Button>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">昵称</label>
              <input
                value={signUpDisplayName}
                onChange={(event) => onSignUpDisplayNameChange(event.target.value)}
                type="text"
                placeholder="设置公开昵称"
                className="w-full rounded-[18px] border border-white/70 bg-white/88 px-4 py-3.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">邮箱</label>
              <input
                value={signUpEmail}
                onChange={(event) => onSignUpEmailChange(event.target.value)}
                type="email"
                placeholder="name@example.com"
                className="w-full rounded-[18px] border border-white/70 bg-white/88 px-4 py-3.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">密码</label>
              <input
                value={signUpPassword}
                onChange={(event) => onSignUpPasswordChange(event.target.value)}
                type="password"
                placeholder="至少 6 位密码"
                className="w-full rounded-[18px] border border-white/70 bg-white/88 px-4 py-3.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">确认密码</label>
              <input
                value={signUpConfirmPassword}
                onChange={(event) => onSignUpConfirmPasswordChange(event.target.value)}
                type="password"
                placeholder="再输入一次密码"
                className="w-full rounded-[18px] border border-white/70 bg-white/88 px-4 py-3.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
              />
            </div>
            <Button onClick={onSubmitSignUp} isLoading={busy} disabled={!authAvailable} className="w-full">
              注册并绑定当前游客资料
            </Button>
          </div>
        )}

        {feedback && (
          <div className={`mt-5 rounded-[18px] px-4 py-3 text-sm leading-relaxed ${
            feedback.tone === 'success'
              ? 'border border-emerald-100 bg-emerald-50/90 text-emerald-700'
              : 'border border-rose-100 bg-rose-50/90 text-rose-600'
          }`}>
            {feedback.text}
          </div>
        )}
      </div>
    </div>
  </div>
);

const RankCard: React.FC<{
  title: string;
  accentClassName: string;
  snapshot: RankSnapshot;
}> = ({ title, accentClassName, snapshot }) => (
  <div className="rounded-[26px] border border-white/80 bg-white/78 p-5 shadow-[0_6px_28px_rgba(15,23,42,0.05)] backdrop-blur-sm">
    <div className="text-[11px] uppercase tracking-[0.24em] font-semibold text-slate-400">{title}</div>
    <div className={`mt-3 text-3xl font-display font-bold ${accentClassName}`}>{formatRank(snapshot)}</div>
    <div className="mt-4 grid grid-cols-3 gap-3">
      <div className="rounded-[18px] bg-[#f2f2f7] p-3">
        <div className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">参与</div>
        <div className="mt-2 text-sm font-semibold text-slate-900">{snapshot.totalPlayers || '--'}</div>
      </div>
      <div className="rounded-[18px] bg-[#f2f2f7] p-3">
        <div className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">榜首</div>
        <div className="mt-2 text-sm font-semibold text-slate-900">{snapshot.topScore ?? '--'}</div>
      </div>
      <div className="rounded-[18px] bg-[#f2f2f7] p-3">
        <div className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">差距</div>
        <div className="mt-2 text-sm font-semibold text-slate-900">{snapshot.gapToTop ?? '--'}</div>
      </div>
    </div>
  </div>
);

export const Profile: React.FC<ProfileProps> = ({
  summary,
  identity,
  accountSession,
  authAvailable,
  authLoading = false,
  accountStatusLabel,
  selectedQuestionBankId,
  initialAuthTab = 'signin',
  loading = false,
  onClose,
  onSelectQuestionBank,
  onUpdateDisplayName,
  onSignIn,
  onSignUp,
  onSignOut,
}) => {
  const questionBankCarouselRef = React.useRef<HTMLDivElement | null>(null);
  const questionBankButtonRefs = React.useRef<Record<QuestionBankId, HTMLButtonElement | null>>({
    all: null,
    fundamentals: null,
    chest: null,
    neuro: null,
    abdomen: null,
    ortho: null,
    women: null,
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AuthTab>(initialAuthTab);
  const [guestDisplayName, setGuestDisplayName] = useState(identity.displayName);
  const [signInEmail, setSignInEmail] = useState(identity.email ?? accountSession?.email ?? '');
  const [signInPassword, setSignInPassword] = useState('');
  const [signUpDisplayName, setSignUpDisplayName] = useState(identity.displayName);
  const [signUpEmail, setSignUpEmail] = useState(identity.email ?? '');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [memberDisplayName, setMemberDisplayName] = useState(identity.displayName);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [submitting, setSubmitting] = useState(false);

  const isGuestView = !accountSession;
  const busy = authLoading || submitting;
  const activeDays = useMemo(
    () => summary.weeklyActivity.filter((day) => day.active).length,
    [summary.weeklyActivity]
  );
  const selectedQuestionBank = useMemo(
    () => QUESTION_BANK_OPTIONS.find((item) => item.id === selectedQuestionBankId) ?? QUESTION_BANK_OPTIONS[0],
    [selectedQuestionBankId]
  );
  const selectedQuestionBankIndex = useMemo(
    () => QUESTION_BANK_OPTIONS.findIndex((item) => item.id === selectedQuestionBankId),
    [selectedQuestionBankId]
  );

  useEffect(() => {
    setActiveTab(initialAuthTab);
  }, [initialAuthTab]);

  useEffect(() => {
    setGuestDisplayName(identity.displayName);
    setSignUpDisplayName(identity.displayName);
    setMemberDisplayName(identity.displayName);
    setSignInEmail(identity.email ?? accountSession?.email ?? '');
    setSignUpEmail(identity.email ?? '');
  }, [accountSession?.email, identity.displayName, identity.email]);

  useEffect(() => {
    if (!accountSession) {
      return;
    }

    setAuthModalOpen(false);
    setSignInPassword('');
    setSignUpPassword('');
    setSignUpConfirmPassword('');
  }, [accountSession]);

  useEffect(() => {
    const activeButton = questionBankButtonRefs.current[selectedQuestionBankId];
    activeButton?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [selectedQuestionBankId]);

  const cycleQuestionBank = (direction: -1 | 1) => {
    const nextIndex = (selectedQuestionBankIndex + direction + QUESTION_BANK_OPTIONS.length) % QUESTION_BANK_OPTIONS.length;
    onSelectQuestionBank(QUESTION_BANK_OPTIONS[nextIndex].id);
  };

  const setResultFeedback = (result: { success: boolean; message: string | null }) => {
    setFeedback(result.message
      ? {
          tone: result.success ? 'success' : 'error',
          text: result.message,
        }
      : null);
  };

  const openAuthModal = (tab: AuthTab) => {
    setActiveTab(tab);
    setFeedback(null);
    setAuthModalOpen(true);
  };

  const handleSaveDisplayName = async () => {
    const normalized = memberDisplayName.trim();
    if (!normalized) {
      setFeedback({
        tone: 'error',
        text: '昵称不能为空。',
      });
      return;
    }

    setSubmitting(true);
    const result = await onUpdateDisplayName(normalized);
    setResultFeedback(result);
    setSubmitting(false);
  };

  const handleSignIn = async () => {
    if (!signInEmail.trim() || !signInPassword.trim()) {
      setFeedback({
        tone: 'error',
        text: '请输入邮箱和密码后再登录。',
      });
      return;
    }

    setSubmitting(true);
    const result = await onSignIn({
      email: signInEmail,
      password: signInPassword,
    });
    setResultFeedback(result);
    setSubmitting(false);
  };

  const handleSignUp = async () => {
    if (!signUpDisplayName.trim()) {
      setFeedback({
        tone: 'error',
        text: '请先设置昵称，再创建账号。',
      });
      return;
    }

    if (!signUpEmail.trim() || !signUpPassword.trim()) {
      setFeedback({
        tone: 'error',
        text: '请输入邮箱和密码后再注册。',
      });
      return;
    }

    if (signUpPassword.length < 6) {
      setFeedback({
        tone: 'error',
        text: '密码至少需要 6 位。',
      });
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setFeedback({
        tone: 'error',
        text: '两次输入的密码不一致。',
      });
      return;
    }

    setSubmitting(true);
    const result = await onSignUp({
      email: signUpEmail,
      password: signUpPassword,
      displayName: signUpDisplayName,
    });
    setResultFeedback(result);
    setSubmitting(false);
  };

  const handleSignOut = async () => {
    setSubmitting(true);
    const result = await onSignOut();
    setResultFeedback(result);
    setSubmitting(false);
  };

  return (
    <div className="app-safe-screen min-h-screen bg-[#f2f2f7] px-3 pb-3 md:px-5 md:pb-5 animate-fade-in relative overflow-hidden">
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-8%] h-[360px] w-[360px] rounded-full bg-white blur-3xl opacity-90" />
        <div className="absolute bottom-[-14%] left-[-10%] h-[340px] w-[340px] rounded-full bg-sky-100 blur-3xl opacity-60" />
      </div>

      <div className="mx-auto max-w-6xl overflow-hidden rounded-[34px] border border-white/95 bg-white/92 shadow-[0_18px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
        <ScreenHeader
          eyebrow="Profile Center"
          title="个人中心"
          description="这里承接身份与成长记录。未登录时先完成账号流程，登录后再查看完整训练数据。"
          backLabel="返回"
          onBack={onClose}
        />

        <div className="px-3 py-3 md:px-5 md:py-5">
          {loading ? (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4 rounded-[28px] bg-white/94">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              <div className="text-sm font-medium text-slate-500">正在加载个人中心数据...</div>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
              <aside className="space-y-5">
                <section className="rounded-[30px] bg-[linear-gradient(180deg,#fdfdfd,#f5f6fa)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_8px_28px_rgba(15,23,42,0.06)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.22em] font-semibold text-slate-400">Identity</div>
                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[linear-gradient(180deg,#ffffff,#edf0f6)] text-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_10px_24px_rgba(15,23,42,0.08)]">
                          {summary.avatar}
                        </div>
                        <div>
                          <div className="text-[28px] leading-none font-display font-bold text-slate-900">{summary.displayName}</div>
                          <div className="mt-1 text-sm text-slate-500">
                            {accountSession?.email ?? '当前设备为游客身份'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      isGuestView ? 'bg-[#fff3d6] text-[#a16207]' : 'bg-[#e7f7ee] text-[#15803d]'
                    }`}>
                      {accountStatusLabel}
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-[22px] bg-[#f2f2f7] p-4">
                      <div className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">最近训练</div>
                      <div className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(summary.lastPlayedAt)}</div>
                    </div>
                    <div className="rounded-[22px] bg-[#f2f2f7] p-4">
                      <div className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">本周活跃</div>
                      <div className="mt-2 text-sm font-semibold text-slate-900">{activeDays} / 7 天</div>
                    </div>
                  </div>
                </section>

                <section className="rounded-[30px] bg-white/94 p-4 shadow-[0_8px_28px_rgba(15,23,42,0.04)] md:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.22em] font-semibold text-slate-400">Question Bank</div>
                      <div className="mt-2 text-[28px] leading-none font-display font-bold text-slate-900">题库选择</div>
                    </div>
                    <div className="inline-flex w-fit rounded-full bg-[#f2f2f7] px-3 py-1.5 text-xs font-semibold text-slate-600">
                      当前：{selectedQuestionBank.title}
                    </div>
                  </div>
                  <div className="mt-3 text-sm leading-relaxed text-slate-500">
                    从这里切换后，单人连胜、每日挑战和排位赛都会按当前题库出题。
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 rounded-[22px] border border-slate-200 bg-[linear-gradient(135deg,#f8fafc,#eef4ff)] px-3.5 py-3">
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-400">Selected Library</div>
                      <div className="mt-1 truncate text-sm font-semibold text-slate-900">{selectedQuestionBank.title}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => cycleQuestionBank(-1)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition hover:bg-[#eef2f8] hover:text-slate-900"
                        aria-label="上一题库"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 18l-6-6 6-6" />
                        </svg>
                      </button>
                      <button
                        onClick={() => cycleQuestionBank(1)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition hover:bg-[#eef2f8] hover:text-slate-900"
                        aria-label="下一题库"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 6l6 6-6 6" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="relative mt-4 -mx-4 px-4 md:mx-0 md:px-0">
                    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-8 bg-[linear-gradient(90deg,rgba(255,255,255,0.96),rgba(255,255,255,0))] md:block" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-8 bg-[linear-gradient(270deg,rgba(255,255,255,0.96),rgba(255,255,255,0))] md:block" />

                    <div
                      ref={questionBankCarouselRef}
                      className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-0.5 pb-3 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                      {QUESTION_BANK_OPTIONS.map((bank) => {
                        const isSelected = bank.id === selectedQuestionBankId;
                        const accentClass = bank.accent === 'amber'
                          ? 'bg-[#fff7e8] text-[#d97706]'
                          : bank.accent === 'rose'
                            ? 'bg-[#fff1f2] text-[#e11d48]'
                            : bank.accent === 'emerald'
                              ? 'bg-[#edfdf3] text-[#16a34a]'
                              : bank.accent === 'violet'
                                ? 'bg-[#f5f3ff] text-[#7c3aed]'
                                : 'bg-[#eef6ff] text-[#0a84ff]';

                        return (
                          <button
                            key={bank.id}
                            ref={(node) => {
                              questionBankButtonRefs.current[bank.id] = node;
                            }}
                            onClick={() => onSelectQuestionBank(bank.id)}
                            className={`shrink-0 snap-center rounded-[28px] border p-4 text-left transition-all duration-300 basis-[calc(100%-18px)] sm:basis-[320px] ${
                              isSelected
                                ? 'border-[#bfdcff] bg-white shadow-[0_18px_38px_rgba(10,132,255,0.14)]'
                                : 'border-slate-200 bg-[linear-gradient(180deg,#fdfdfd,#f6f8fb)] shadow-[0_8px_22px_rgba(15,23,42,0.05)] hover:border-slate-300 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl text-2xl ${accentClass}`}>
                                {bank.icon}
                              </div>
                              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
                                isSelected ? 'bg-[#0a84ff] text-white' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {isSelected ? '已选择' : '可切换'}
                              </span>
                            </div>
                            <div className="mt-4 text-[11px] uppercase tracking-[0.2em] font-semibold text-slate-400">{bank.subtitle}</div>
                            <div className="mt-2 text-lg font-bold text-slate-900">{bank.title}</div>
                            <div className="mt-2 text-sm leading-relaxed text-slate-500">{bank.description}</div>
                            <div className="mt-4 flex items-center justify-between">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${accentClass}`}>
                                {bank.subtitle}
                              </span>
                              <span className="text-xs font-semibold text-slate-400">
                                {isSelected ? '当前题库' : '点按切换'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="text-xs text-slate-400">左右滑动切换题库</div>
                    <div className="flex items-center gap-1.5">
                      {QUESTION_BANK_OPTIONS.map((bank) => (
                        <span
                          key={bank.id}
                          className={`h-1.5 rounded-full transition-all ${
                            bank.id === selectedQuestionBankId ? 'w-5 bg-[#0a84ff]' : 'w-1.5 bg-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </section>

                {isGuestView ? (
                  <section className="rounded-[30px] bg-white/94 p-5 shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
                    <div className="text-[11px] uppercase tracking-[0.22em] font-semibold text-slate-400">Guest Gate</div>
                    <div className="mt-2 text-[28px] leading-none font-display font-bold text-slate-900">先解锁账号身份</div>
                    <div className="mt-3 text-sm leading-relaxed text-slate-500">
                      游客目前只能体验每日挑战。登录或注册后，才能继续进入单人连胜、排位赛、排行榜和错题本。
                    </div>

                    <div className="mt-5 rounded-[22px] bg-[#f2f2f7] p-4">
                      <div className="text-sm font-semibold text-slate-900">登录后会自动带走当前设备数据</div>
                      <div className="mt-2 text-sm leading-relaxed text-slate-500">
                        包括你的每日挑战成绩、错题积累和最近训练轨迹，不需要重新开始。
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      <Button onClick={() => openAuthModal(activeTab)} disabled={!authAvailable} className="w-full">
                        注册 / 登录
                      </Button>
                      <Button onClick={onClose} variant="secondary" className="w-full">
                        先体验每日挑战
                      </Button>
                    </div>
                  </section>
                ) : (
                  <section className="rounded-[30px] bg-white/94 p-5 shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
                    <div className="text-[11px] uppercase tracking-[0.22em] font-semibold text-slate-400">Account</div>
                    <div className="mt-2 text-[28px] leading-none font-display font-bold text-slate-900">账号管理</div>

                    <div className="mt-5 space-y-4">
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">昵称</label>
                        <input
                          value={memberDisplayName}
                          onChange={(event) => setMemberDisplayName(event.target.value)}
                          type="text"
                          placeholder="输入展示昵称"
                          className="w-full rounded-[18px] border border-white/70 bg-[#f2f2f7] px-4 py-3.5 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white"
                        />
                      </div>
                      <div className="rounded-[18px] bg-[#f2f2f7] px-4 py-3">
                        <div className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">邮箱</div>
                        <div className="mt-2 text-sm text-slate-700">{accountSession?.email ?? '未绑定邮箱'}</div>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      <Button onClick={handleSaveDisplayName} isLoading={busy} className="w-full">
                        保存昵称
                      </Button>
                      <Button onClick={handleSignOut} variant="secondary" isLoading={busy} className="w-full">
                        退出到游客模式
                      </Button>
                    </div>
                  </section>
                )}

                {feedback && (
                  <section className={`rounded-[20px] px-4 py-3 text-sm leading-relaxed ${
                    feedback.tone === 'success'
                      ? 'bg-[#e7f7ee] text-[#15803d]'
                      : 'bg-[#fff1f2] text-[#dc2626]'
                  }`}>
                    {feedback.text}
                  </section>
                )}
              </aside>

              <section className="relative">
                <div className={`${isGuestView ? 'pointer-events-none select-none blur-sm' : ''}`}>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[26px] bg-white/95 p-5 shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
                      <div className="text-[11px] uppercase tracking-[0.22em] font-semibold text-slate-400">Solo Best</div>
                      <div className="mt-3 text-4xl font-display font-bold text-[#0a84ff]">{summary.bestSoloStreak}</div>
                      <div className="mt-2 text-sm text-slate-500">历史最佳连胜</div>
                    </div>
                    <div className="rounded-[26px] bg-white/95 p-5 shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
                      <div className="text-[11px] uppercase tracking-[0.22em] font-semibold text-slate-400">Correct Rate</div>
                      <div className="mt-3 text-4xl font-display font-bold text-[#34c759]">{summary.correctRate}%</div>
                      <div className="mt-2 text-sm text-slate-500">累计正确率</div>
                    </div>
                    <div className="rounded-[26px] bg-white/95 p-5 shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
                      <div className="text-[11px] uppercase tracking-[0.22em] font-semibold text-slate-400">Answered</div>
                      <div className="mt-3 text-4xl font-display font-bold text-slate-900">{summary.totalQuestionsAnswered}</div>
                      <div className="mt-2 text-sm text-slate-500">累计作答题数</div>
                    </div>
                    <div className="rounded-[26px] bg-white/95 p-5 shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
                      <div className="text-[11px] uppercase tracking-[0.22em] font-semibold text-slate-400">Wrong Book</div>
                      <div className="mt-3 text-4xl font-display font-bold text-[#ff9f0a]">{summary.wrongQuestionCount}</div>
                      <div className="mt-2 text-sm text-slate-500">待复盘错题</div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 xl:grid-cols-2">
                    <RankCard title="今日榜位置" accentClassName="text-amber-600" snapshot={summary.dailyChallengeRank} />
                    <RankCard title="连胜榜位置" accentClassName="text-blue-600" snapshot={summary.soloStreakRank} />
                  </div>

                  <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-[26px] bg-white/95 p-5 shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.22em] font-semibold text-slate-400">Recent Sessions</div>
                          <div className="mt-2 text-[28px] leading-none font-display font-bold text-slate-900">最近记录</div>
                        </div>
                        <div className="rounded-full bg-[#f2f2f7] px-3 py-2 text-sm text-slate-500">
                          {summary.recentRecords.length} 条
                        </div>
                      </div>

                      {summary.recentRecords.length === 0 ? (
                        <div className="mt-5 rounded-[20px] bg-[#f2f2f7] p-6 text-sm text-slate-500">
                          还没有训练记录，先完成一局挑战后再回来查看成长轨迹。
                        </div>
                      ) : (
                        <div className="mt-5 space-y-3">
                          {summary.recentRecords.map((record) => (
                            <div key={record.id} className="flex items-center justify-between gap-4 rounded-[20px] bg-[#f2f2f7] p-4">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">{formatRecordMode(record)}</div>
                                <div className="mt-1 text-xs text-slate-500">{formatDateTime(record.completedAt)}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-[28px] leading-none font-display font-bold text-slate-900">{record.score}</div>
                                <div className="mt-1 text-xs text-slate-500">
                                  {record.correctCount}/{record.totalQuestions} 题正确
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-5">
                      <div className="rounded-[26px] bg-white/95 p-5 shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
                        <div className="text-[11px] uppercase tracking-[0.22em] font-semibold text-slate-400">Daily Snapshot</div>
                        <div className="mt-2 text-[28px] leading-none font-display font-bold text-slate-900">每日挑战概览</div>
                        <div className="mt-5 grid grid-cols-3 gap-3">
                          <div className="rounded-[18px] bg-[#f2f2f7] p-4">
                            <div className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">已完成</div>
                            <div className="mt-2 text-lg font-semibold text-slate-900">{summary.dailyChallengesCompleted}</div>
                          </div>
                          <div className="rounded-[18px] bg-[#f2f2f7] p-4">
                            <div className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">最佳成绩</div>
                            <div className="mt-2 text-lg font-semibold text-slate-900">{summary.bestDailyChallengeScore}</div>
                          </div>
                          <div className="rounded-[18px] bg-[#f2f2f7] p-4">
                            <div className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">最近成绩</div>
                            <div className="mt-2 text-lg font-semibold text-slate-900">{summary.latestDailyChallengeScore ?? '--'}</div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[26px] bg-white/95 p-5 shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
                        <div className="text-[11px] uppercase tracking-[0.22em] font-semibold text-slate-400">Weekly Rhythm</div>
                        <div className="mt-2 text-[28px] leading-none font-display font-bold text-slate-900">近 7 天活跃</div>
                        <div className="mt-5 grid grid-cols-7 gap-2">
                          {summary.weeklyActivity.map((day) => (
                            <div key={day.dateKey} className="text-center">
                              <div
                                className={`flex h-14 items-center justify-center rounded-2xl border text-lg font-black ${
                                  day.active
                                    ? 'border-[#b7ebc6] bg-[#e7f7ee] text-[#34c759]'
                                    : 'border-transparent bg-[#f2f2f7] text-slate-300'
                                }`}
                              >
                                {day.active ? '•' : '·'}
                              </div>
                              <div className="mt-2 text-[10px] uppercase tracking-wide font-semibold text-slate-400">{day.label}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 text-sm leading-relaxed text-slate-500">
                          最近 7 天活跃 {activeDays} 天，保持稳定训练比偶尔突击更容易提升限时判断稳定性。
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {isGuestView && (
                  <div className="absolute inset-0 flex items-center justify-center px-4">
                    <div className="max-w-md rounded-[28px] border border-white/95 bg-white/94 p-6 text-center shadow-[0_18px_56px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                      <div className="text-[11px] uppercase tracking-[0.24em] font-semibold text-slate-400">Locked Preview</div>
                      <div className="mt-3 text-[28px] leading-none font-display font-bold text-slate-900">登录后解锁完整个人中心</div>
                      <div className="mt-3 text-sm leading-relaxed text-slate-500">
                        右侧会展示完整训练轨迹、排行榜位置、每日挑战表现和近 7 天活跃情况。
                      </div>
                      <div className="mt-5">
                        <Button onClick={() => openAuthModal(activeTab)} disabled={!authAvailable} className="w-full">
                          去完成注册 / 登录
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>

      {authModalOpen && isGuestView && (
        <AuthFlowModal
          tab={activeTab}
          authAvailable={authAvailable}
          busy={busy}
          guestDisplayName={guestDisplayName}
          signInEmail={signInEmail}
          signInPassword={signInPassword}
          signUpDisplayName={signUpDisplayName}
          signUpEmail={signUpEmail}
          signUpPassword={signUpPassword}
          signUpConfirmPassword={signUpConfirmPassword}
          feedback={feedback}
          onClose={() => setAuthModalOpen(false)}
          onSwitchTab={setActiveTab}
          onSignInEmailChange={setSignInEmail}
          onSignInPasswordChange={setSignInPassword}
          onSignUpDisplayNameChange={(value) => {
            setSignUpDisplayName(value);
            setGuestDisplayName(value);
          }}
          onSignUpEmailChange={setSignUpEmail}
          onSignUpPasswordChange={setSignUpPassword}
          onSignUpConfirmPasswordChange={setSignUpConfirmPassword}
          onSubmitSignIn={handleSignIn}
          onSubmitSignUp={handleSignUp}
        />
      )}
    </div>
  );
};
