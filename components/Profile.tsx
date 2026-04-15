import React, { useEffect, useMemo, useState } from 'react';
import { ActivityDay, ProfileSummary, RankSnapshot, TrainingHistoryEntry } from '../types';
import { Button } from './Button';
import { ScreenHeader } from './ScreenHeader';
import { type LocalPlayerIdentity } from '../services/playerIdentity';
import { type AuthAccountSession } from '../services/auth';
import { QuestionBankId, QUESTION_BANK_OPTIONS } from '../services/questionBanks';
import { toDateKey } from '../services/playerHistory';

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
type ProfileSectionId = 'overview' | 'performance' | 'records' | 'banks' | 'settings';
type ContributionScale = 'month' | 'halfYear' | 'year' | 'lifetime';

type FeedbackState = {
  tone: 'success' | 'error';
  text: string;
} | null;

const PROFILE_SECTIONS: Array<{
  id: ProfileSectionId;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
}> = [
  {
    id: 'overview',
    label: '基础信息',
    eyebrow: 'Profile Hub',
    title: '用户中心',
    description: '这里先展示账号概览，再分层进入表现、记录、题库和设置，不再把所有信息堆在一页。',
  },
  {
    id: 'performance',
    label: '成绩表现',
    eyebrow: 'Performance',
    title: '成绩表现',
    description: '专门查看榜单位置、累计答题表现和每日挑战概览。',
  },
  {
    id: 'records',
    label: '训练记录',
    eyebrow: 'Training Records',
    title: '训练记录',
    description: '把最近训练轨迹和年度活跃热力图拆成独立页面，阅读层级更清楚，也更接近 GitHub 的贡献视图。',
  },
  {
    id: 'banks',
    label: '题库选择',
    eyebrow: 'Question Banks',
    title: '题库选择',
    description: '从这个页面切换题库，后续每日挑战、单人连胜和排位赛都会按当前题库出题。',
  },
  {
    id: 'settings',
    label: '个人设置',
    eyebrow: 'Account Settings',
    title: '个人设置',
    description: '账号昵称、登录注册和退出游客模式都单独收在设置页。',
  },
];

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

const CONTRIBUTION_LEVEL_CLASS_MAP: Record<ActivityDay['level'], string> = {
  0: 'border-[#ebedf0] bg-[#ebedf0]',
  1: 'border-[#9be9a8] bg-[#9be9a8]',
  2: 'border-[#40c463] bg-[#40c463]',
  3: 'border-[#30a14e] bg-[#30a14e]',
  4: 'border-[#216e39] bg-[#216e39]',
};

const CONTRIBUTION_WEEKDAY_LABELS: Array<string | null> = [null, '周二', null, '周四', null, '周六', null];
const CONTRIBUTION_SCALE_OPTIONS: Array<{
  id: ContributionScale;
  label: string;
  days?: number;
  description: string;
  cellSize: number;
  gap: number;
  centerWhenPossible: boolean;
  scrollToLatest: boolean;
}> = [
  { id: 'month', label: '30天', days: 30, description: '近 30 天', cellSize: 18, gap: 5, centerWhenPossible: true, scrollToLatest: false },
  { id: 'halfYear', label: '半年', days: 183, description: '近 6 个月', cellSize: 15, gap: 4, centerWhenPossible: true, scrollToLatest: false },
  { id: 'year', label: '年度', days: 365, description: '近 1 年', cellSize: 13, gap: 4, centerWhenPossible: false, scrollToLatest: true },
  { id: 'lifetime', label: 'Lifetime', description: '全部记录', cellSize: 11, gap: 3, centerWhenPossible: false, scrollToLatest: true },
];

const buildContributionWeeks = (
  activity: ActivityDay[]
): {
  weeks: Array<Array<ActivityDay | null>>;
  monthLabels: Array<{ weekIndex: number; label: string }>;
} => {
  if (activity.length === 0) {
    return {
      weeks: [],
      monthLabels: [],
    };
  }

  const firstDate = new Date(`${activity[0].dateKey}T00:00:00`);
  const startPadding = firstDate.getDay();
  const paddedDays: Array<ActivityDay | null> = [
    ...Array.from({ length: startPadding }, () => null),
    ...activity,
  ];
  const endPadding = (7 - (paddedDays.length % 7)) % 7;

  if (endPadding > 0) {
    paddedDays.push(...Array.from({ length: endPadding }, () => null));
  }

  const weeks: Array<Array<ActivityDay | null>> = [];
  for (let index = 0; index < paddedDays.length; index += 7) {
    weeks.push(paddedDays.slice(index, index + 7));
  }

  const monthLabels: Array<{ weekIndex: number; label: string }> = [];
  let previousLabel = '';

  weeks.forEach((week, weekIndex) => {
    const firstVisibleDay = week.find((day) => day !== null);
    if (!firstVisibleDay) {
      return;
    }

    const monthStartDay = week.find((day) => {
      if (!day) {
        return false;
      }

      return new Date(`${day.dateKey}T00:00:00`).getDate() === 1;
    }) ?? (weekIndex === 0 ? firstVisibleDay : null);

    if (!monthStartDay) {
      return;
    }

    const label = new Date(`${monthStartDay.dateKey}T00:00:00`).toLocaleDateString('zh-CN', {
      month: 'short',
    });

    if (label !== previousLabel) {
      monthLabels.push({ weekIndex, label });
      previousLabel = label;
    }
  });

  return {
    weeks,
    monthLabels,
  };
};

const buildFixedRangeActivity = (activity: ActivityDay[], days: number): ActivityDay[] => {
  const activityMap = new Map(activity.map((day) => [day.dateKey, day]));
  const today = new Date();

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - index));
    const dateKey = toDateKey(date);
    const existing = activityMap.get(dateKey);

    if (existing) {
      return existing;
    }

    return {
      dateKey,
      label: date.toLocaleDateString('zh-CN', { weekday: 'short' }),
      active: false,
      count: 0,
      level: 0,
    };
  });
};

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
  <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/18 p-4 backdrop-blur-xl">
    <div className="w-full max-w-lg overflow-hidden rounded-[32px] border border-white/95 bg-white/96 shadow-[0_22px_80px_rgba(15,23,42,0.14)] backdrop-blur-2xl animate-fade-in">
      <div className="border-b border-slate-200/80 bg-white/88 px-6 py-5 md:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Apple-Style Flow</div>
            <div className="mt-2 text-[28px] font-display font-bold leading-none text-slate-900">账号身份流程</div>
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

      <div className="bg-[linear-gradient(180deg,rgba(255,255,255,0.35),rgba(245,247,250,0.7))] px-6 py-6 md:px-8">
        <div className="mb-5 rounded-[24px] border border-white/95 bg-white/94 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
          <div className="text-sm font-semibold text-slate-900">当前游客资料</div>
          <div className="mt-2 text-sm leading-relaxed text-slate-500">
            当前昵称为“{guestDisplayName || '未设置昵称'}”，登录或注册成功后，现有游客成绩会自动并入账号。
          </div>
        </div>

        <div className="flex gap-1 rounded-[18px] bg-black/[0.06] p-1">
          <button
            onClick={() => onSwitchTab('signup')}
            className={`flex-1 rounded-[14px] px-4 py-2.5 text-sm font-semibold transition ${
              tab === 'signup'
                ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.14)]'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            注册
          </button>
          <button
            onClick={() => onSwitchTab('signin')}
            className={`flex-1 rounded-[14px] px-4 py-2.5 text-sm font-semibold transition ${
              tab === 'signin'
                ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.14)]'
                : 'text-slate-500 hover:text-slate-900'
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
          <div
            className={`mt-5 rounded-[18px] px-4 py-3 text-sm leading-relaxed ${
              feedback.tone === 'success'
                ? 'border border-emerald-100 bg-emerald-50/90 text-emerald-700'
                : 'border border-rose-100 bg-rose-50/90 text-rose-600'
            }`}
          >
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
  <div className="rounded-[24px] border border-white/80 bg-white/78 p-4 shadow-[0_6px_28px_rgba(15,23,42,0.05)] backdrop-blur-sm md:rounded-[26px] md:p-5">
    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{title}</div>
    <div className={`mt-3 text-[30px] font-display font-bold md:text-3xl ${accentClassName}`}>{formatRank(snapshot)}</div>
    <div className="mt-4 grid grid-cols-3 gap-2 md:gap-3">
      <div className="rounded-[16px] bg-[#f2f2f7] p-2.5 md:rounded-[18px] md:p-3">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">参与</div>
        <div className="mt-2 text-sm font-semibold text-slate-900">{snapshot.totalPlayers || '--'}</div>
      </div>
      <div className="rounded-[16px] bg-[#f2f2f7] p-2.5 md:rounded-[18px] md:p-3">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">榜首</div>
        <div className="mt-2 text-sm font-semibold text-slate-900">{snapshot.topScore ?? '--'}</div>
      </div>
      <div className="rounded-[16px] bg-[#f2f2f7] p-2.5 md:rounded-[18px] md:p-3">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">差距</div>
        <div className="mt-2 text-sm font-semibold text-slate-900">{snapshot.gapToTop ?? '--'}</div>
      </div>
    </div>
  </div>
);

const SectionButton: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`rounded-[18px] px-4 py-3 text-left text-sm font-semibold transition ${
      active
        ? 'bg-[#0a84ff] text-white shadow-[0_14px_30px_rgba(10,132,255,0.22)]'
        : 'bg-[#f2f2f7] text-slate-600 hover:bg-[#e8ebf2] hover:text-slate-900'
    }`}
  >
    {label}
  </button>
);

const QuickLinkCard: React.FC<{
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
  onOpen: () => void;
}> = ({ eyebrow, title, description, badge, onOpen }) => (
  <button
    onClick={onOpen}
    className="w-full rounded-[24px] border border-white/90 bg-white/96 p-4 text-left shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(15,23,42,0.08)] md:p-5"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{eyebrow}</div>
        <div className="mt-2 text-xl font-display font-bold leading-tight text-slate-900">{title}</div>
      </div>
      {badge ? (
        <span className="rounded-full bg-[#eef6ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#0a84ff]">
          {badge}
        </span>
      ) : null}
    </div>
    <div className="mt-3 text-sm leading-relaxed text-slate-500">{description}</div>
    <div className="mt-4 text-sm font-semibold text-[#0a84ff]">进入页面</div>
  </button>
);

const LockedSectionCard: React.FC<{
  title: string;
  description: string;
  onUnlock: () => void;
}> = ({ title, description, onUnlock }) => (
  <div className="rounded-[28px] border border-white/95 bg-white/96 p-5 shadow-[0_18px_56px_rgba(15,23,42,0.08)] md:p-6">
    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Locked Preview</div>
    <div className="mt-3 text-[24px] font-display font-bold leading-none text-slate-900 md:text-[28px]">{title}</div>
    <div className="mt-3 text-sm leading-relaxed text-slate-500">{description}</div>
    <div className="mt-5">
      <Button onClick={onUnlock} className="w-full">
        去完成注册 / 登录
      </Button>
    </div>
  </div>
);

const GuestPreviewMask: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <div className="relative overflow-hidden rounded-[28px]">
    <div className="pointer-events-none select-none blur-[7px] opacity-45 saturate-[0.8]">
      {children}
    </div>
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),rgba(255,255,255,0.3),rgba(255,255,255,0.56))]" />
  </div>
);

const GuestFloatingPrompt: React.FC<{
  displayName: string;
  onSignUp: () => void;
  onSignIn: () => void;
}> = ({ displayName, onSignUp, onSignIn }) => (
  <div className="pointer-events-none fixed left-1/2 top-1/2 z-[130] w-full max-w-[min(440px,calc(100vw-28px))] -translate-x-1/2 -translate-y-1/2 px-3 md:max-w-[480px]">
    <div className="absolute inset-x-[7%] top-[-10px] -z-10 h-8 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.65),rgba(255,255,255,0))] blur-xl" />
    <div className="absolute inset-x-[10%] bottom-[-26px] -z-10 h-16 rounded-full bg-[radial-gradient(circle,rgba(15,23,42,0.18),rgba(15,23,42,0))] blur-2xl" />
    <div className="pointer-events-auto relative overflow-hidden rounded-[30px] border border-white/95 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-5 text-center shadow-[0_34px_90px_rgba(15,23,42,0.18),0_12px_28px_rgba(15,23,42,0.07)] backdrop-blur-2xl md:p-6">
      <div className="pointer-events-none absolute inset-0 rounded-[30px] ring-1 ring-slate-200/55" />
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/90" />
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Guest Mode</div>
      <div className="mt-3 text-[28px] font-display font-bold leading-none text-slate-900 md:text-[30px]">登录后解锁完整用户中心</div>
      <div className="mt-3 text-sm leading-relaxed text-slate-500">
        当前以“{displayName || '游客'}”身份体验中。登录或注册后，会自动保留现在的训练进度，并解锁榜单、记录和长期成长数据。
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Button onClick={onSignUp} className="w-full shadow-[0_12px_30px_rgba(10,132,255,0.18)]">
          注册并保存进度
        </Button>
        <Button onClick={onSignIn} variant="secondary" className="w-full">
          登录已有账号
        </Button>
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
  const questionBankButtonRefs = React.useRef<Record<QuestionBankId, HTMLButtonElement | null>>({
    all: null,
    fundamentals: null,
    chest: null,
    neuro: null,
    abdomen: null,
    ortho: null,
    women: null,
  });
  const contributionScrollerRef = React.useRef<HTMLDivElement | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AuthTab>(initialAuthTab);
  const [activeSection, setActiveSection] = useState<ProfileSectionId>('overview');
  const [contributionScale, setContributionScale] = useState<ContributionScale>('halfYear');
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
  const selectedContributionScale = useMemo(
    () => CONTRIBUTION_SCALE_OPTIONS.find((item) => item.id === contributionScale) ?? CONTRIBUTION_SCALE_OPTIONS[0],
    [contributionScale]
  );
  const contributionActivity = useMemo(
    () => (
      selectedContributionScale.id === 'lifetime'
        ? summary.lifetimeActivity
        : buildFixedRangeActivity(summary.lifetimeActivity, selectedContributionScale.days ?? summary.lifetimeActivity.length)
    ),
    [selectedContributionScale.days, selectedContributionScale.id, summary.lifetimeActivity]
  );
  const contributionActiveDays = useMemo(
    () => contributionActivity.filter((day) => day.active).length,
    [contributionActivity]
  );
  const contributionCount = useMemo(
    () => contributionActivity.reduce((sum, day) => sum + day.count, 0),
    [contributionActivity]
  );
  const contributionAveragePerWeek = useMemo(
    () => Math.round(contributionCount / Math.max(contributionActivity.length / 7, 1)),
    [contributionActivity.length, contributionCount]
  );
  const contributionCalendar = useMemo(
    () => buildContributionWeeks(contributionActivity),
    [contributionActivity]
  );
  const contributionColumnStep = selectedContributionScale.cellSize + selectedContributionScale.gap;
  const selectedQuestionBank = useMemo(
    () => QUESTION_BANK_OPTIONS.find((item) => item.id === selectedQuestionBankId) ?? QUESTION_BANK_OPTIONS[0],
    [selectedQuestionBankId]
  );
  const selectedQuestionBankIndex = useMemo(
    () => QUESTION_BANK_OPTIONS.findIndex((item) => item.id === selectedQuestionBankId),
    [selectedQuestionBankId]
  );
  const currentSectionMeta = useMemo(
    () => PROFILE_SECTIONS.find((item) => item.id === activeSection) ?? PROFILE_SECTIONS[0],
    [activeSection]
  );
  const latestRecord = summary.recentRecords[0] ?? null;

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
    if (activeSection !== 'banks') {
      return;
    }

    const activeButton = questionBankButtonRefs.current[selectedQuestionBankId];
    activeButton?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [activeSection, selectedQuestionBankId]);

  useEffect(() => {
    if (activeSection !== 'records') {
      return;
    }

    const scroller = contributionScrollerRef.current;
    if (!scroller) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      scroller.scrollTo({
        left: selectedContributionScale.scrollToLatest ? scroller.scrollWidth : 0,
        behavior: 'smooth',
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeSection, contributionCalendar.weeks.length, selectedContributionScale.scrollToLatest]);

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

  const renderOverviewPage = () => (
    <div className="space-y-4 md:space-y-5">
      <section className="rounded-[28px] bg-[linear-gradient(135deg,#fdfdfd,#f1f6ff)] p-5 shadow-[0_10px_34px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Account Overview</div>
            <div className="mt-3 text-[28px] font-display font-bold leading-none text-slate-900">
              {summary.displayName}
            </div>
            <div className="mt-2 truncate text-sm text-slate-500">
              {accountSession?.email ?? '当前设备为游客身份，可先体验每日挑战。'}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                isGuestView ? 'bg-[#fff3d6] text-[#a16207]' : 'bg-[#e7f7ee] text-[#15803d]'
              }`}>
                {accountStatusLabel}
              </span>
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm">
                UID {identity.id.slice(0, 8)}
              </span>
            </div>
            {isGuestView ? (
              <div className="mt-4 max-w-xl rounded-[20px] border border-[#ffe2b8] bg-white/88 px-4 py-3 text-sm leading-relaxed text-[#9a6700] shadow-sm">
                登录后会自动保留当前游客进度，并解锁训练记录、榜单表现、活跃贡献图和更多长期数据。
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3 self-start md:min-w-[260px]">
            <div className="rounded-[20px] bg-white/88 p-4 shadow-sm">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">最近训练</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(summary.lastPlayedAt)}</div>
            </div>
            <div className="rounded-[20px] bg-white/88 p-4 shadow-sm">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">本周活跃</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">{activeDays} / 7 天</div>
            </div>
          </div>
        </div>
      </section>

      {isGuestView ? (
        <GuestPreviewMask>
          <div className="space-y-4 md:space-y-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-[22px] bg-white/96 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Solo Best</div>
                <div className="mt-3 text-[32px] font-display font-bold text-[#0a84ff]">{summary.bestSoloStreak}</div>
                <div className="mt-2 text-xs text-slate-500">历史最佳连胜</div>
              </div>
              <div className="rounded-[22px] bg-white/96 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Correct Rate</div>
                <div className="mt-3 text-[32px] font-display font-bold text-[#34c759]">{summary.correctRate}%</div>
                <div className="mt-2 text-xs text-slate-500">累计正确率</div>
              </div>
              <div className="rounded-[22px] bg-white/96 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Answered</div>
                <div className="mt-3 text-[32px] font-display font-bold text-slate-900">{summary.totalQuestionsAnswered}</div>
                <div className="mt-2 text-xs text-slate-500">累计作答题数</div>
              </div>
              <div className="rounded-[22px] bg-white/96 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Wrong Book</div>
                <div className="mt-3 text-[32px] font-display font-bold text-[#ff9f0a]">{summary.wrongQuestionCount}</div>
                <div className="mt-2 text-xs text-slate-500">待复盘错题</div>
              </div>
            </div>

            <section className="rounded-[28px] bg-white/96 p-4 shadow-[0_10px_34px_rgba(15,23,42,0.04)] md:p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Section Entry</div>
              <div className="mt-2 text-[24px] font-display font-bold leading-none text-slate-900">按页面进入功能</div>
              <div className="mt-3 text-sm leading-relaxed text-slate-500">
                现在用户中心拆成不同层级页面，移动端默认只看当前页面内容，不再一屏堆满。
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <QuickLinkCard
                  eyebrow="Performance"
                  title="成绩表现"
                  description="登录后查看今日榜位置、连胜榜位置和每日挑战表现。"
                  badge="需登录"
                  onOpen={() => setActiveSection('performance')}
                />
                <QuickLinkCard
                  eyebrow="Training Records"
                  title="训练记录"
                  description={
                    latestRecord
                      ? `最近一次 ${formatRecordMode(latestRecord)}，得分 ${latestRecord.score}。`
                      : '还没有训练记录，可以从这里查看后续训练轨迹。'
                  }
                  badge="需登录"
                  onOpen={() => setActiveSection('records')}
                />
                <QuickLinkCard
                  eyebrow="Question Banks"
                  title="题库选择"
                  description={`当前题库为 ${selectedQuestionBank.title}，可单独进入该页切换。`}
                  onOpen={() => setActiveSection('banks')}
                />
                <QuickLinkCard
                  eyebrow="Account Settings"
                  title="登录 / 注册"
                  description="注册和登录流程都放在设置页里，沿用个人中心层级。"
                  onOpen={() => setActiveSection('settings')}
                />
              </div>
            </section>
          </div>
        </GuestPreviewMask>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-[22px] bg-white/96 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Solo Best</div>
              <div className="mt-3 text-[32px] font-display font-bold text-[#0a84ff]">{summary.bestSoloStreak}</div>
              <div className="mt-2 text-xs text-slate-500">历史最佳连胜</div>
            </div>
            <div className="rounded-[22px] bg-white/96 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Correct Rate</div>
              <div className="mt-3 text-[32px] font-display font-bold text-[#34c759]">{summary.correctRate}%</div>
              <div className="mt-2 text-xs text-slate-500">累计正确率</div>
            </div>
            <div className="rounded-[22px] bg-white/96 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Answered</div>
              <div className="mt-3 text-[32px] font-display font-bold text-slate-900">{summary.totalQuestionsAnswered}</div>
              <div className="mt-2 text-xs text-slate-500">累计作答题数</div>
            </div>
            <div className="rounded-[22px] bg-white/96 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Wrong Book</div>
              <div className="mt-3 text-[32px] font-display font-bold text-[#ff9f0a]">{summary.wrongQuestionCount}</div>
              <div className="mt-2 text-xs text-slate-500">待复盘错题</div>
            </div>
          </div>

          <section className="rounded-[28px] bg-white/96 p-4 shadow-[0_10px_34px_rgba(15,23,42,0.04)] md:p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Section Entry</div>
            <div className="mt-2 text-[24px] font-display font-bold leading-none text-slate-900">按页面进入功能</div>
            <div className="mt-3 text-sm leading-relaxed text-slate-500">
              现在用户中心拆成不同层级页面，移动端默认只看当前页面内容，不再一屏堆满。
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <QuickLinkCard
                eyebrow="Performance"
                title="成绩表现"
                description={`今日榜 ${formatRank(summary.dailyChallengeRank)}，连胜榜 ${formatRank(summary.soloStreakRank)}。`}
                onOpen={() => setActiveSection('performance')}
              />
              <QuickLinkCard
                eyebrow="Training Records"
                title="训练记录"
                description={
                  latestRecord
                    ? `最近一次 ${formatRecordMode(latestRecord)}，得分 ${latestRecord.score}。`
                    : '还没有训练记录，可以从这里查看后续训练轨迹。'
                }
                onOpen={() => setActiveSection('records')}
              />
              <QuickLinkCard
                eyebrow="Question Banks"
                title="题库选择"
                description={`当前题库为 ${selectedQuestionBank.title}，可单独进入该页切换。`}
                onOpen={() => setActiveSection('banks')}
              />
              <QuickLinkCard
                eyebrow="Account Settings"
                title="个人设置"
                description="昵称、邮箱和退出游客模式都收在设置页，不占概览空间。"
                onOpen={() => setActiveSection('settings')}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );

  const renderPerformancePage = () => {
    if (isGuestView) {
      return (
        <LockedSectionCard
          title="登录后查看成绩表现"
          description="这里会展示你的今日榜位置、连胜榜位置和每日挑战概览。游客先在设置页完成登录或注册。"
          onUnlock={() => openAuthModal(activeTab)}
        />
      );
    }

    return (
      <div className="space-y-4 md:space-y-5">
        <div className="grid gap-4 xl:grid-cols-2">
          <RankCard title="今日榜位置" accentClassName="text-amber-600" snapshot={summary.dailyChallengeRank} />
          <RankCard title="连胜榜位置" accentClassName="text-blue-600" snapshot={summary.soloStreakRank} />
        </div>

        <section className="rounded-[28px] bg-white/96 p-4 shadow-[0_10px_34px_rgba(15,23,42,0.04)] md:p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Daily Snapshot</div>
          <div className="mt-2 text-[24px] font-display font-bold leading-none text-slate-900">每日挑战概览</div>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-[18px] bg-[#f2f2f7] p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">已完成</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">{summary.dailyChallengesCompleted}</div>
            </div>
            <div className="rounded-[18px] bg-[#f2f2f7] p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">最佳成绩</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">{summary.bestDailyChallengeScore}</div>
            </div>
            <div className="rounded-[18px] bg-[#f2f2f7] p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">最近成绩</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">{summary.latestDailyChallengeScore ?? '--'}</div>
            </div>
          </div>
        </section>
      </div>
    );
  };

  const renderRecordsPage = () => {
    if (isGuestView) {
      return (
        <LockedSectionCard
          title="登录后查看训练记录"
          description="最近训练轨迹和年度活跃贡献图会收在这个页面。游客身份下先完成登录。"
          onUnlock={() => openAuthModal(activeTab)}
        />
      );
    }

    return (
      <div className="space-y-4 md:space-y-5">
        <section className="rounded-[28px] bg-white/96 p-4 shadow-[0_10px_34px_rgba(15,23,42,0.04)] md:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Recent Sessions</div>
              <div className="mt-2 text-[24px] font-display font-bold leading-none text-slate-900">最近记录</div>
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
                <div
                  key={record.id}
                  className="flex flex-col gap-3 rounded-[20px] bg-[#f2f2f7] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">{formatRecordMode(record)}</div>
                    <div className="mt-1 text-xs text-slate-500">{formatDateTime(record.completedAt)}</div>
                  </div>
                  <div className="sm:text-right">
                    <div className="text-[28px] font-display font-bold leading-none text-slate-900">{record.score}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {record.correctCount}/{record.totalQuestions} 题正确
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[28px] bg-white/96 p-4 shadow-[0_10px_34px_rgba(15,23,42,0.04)] md:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Contribution Calendar</div>
              <div className="mt-2 text-[24px] font-display font-bold leading-none text-slate-900">活跃贡献视图</div>
            </div>
            <div className="inline-flex rounded-[18px] bg-[#f2f2f7] p-1">
              {CONTRIBUTION_SCALE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setContributionScale(option.id)}
                  className={`rounded-[14px] px-4 py-2 text-sm font-semibold transition ${
                    contributionScale === option.id
                      ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.12)]'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[20px] bg-[#f6f8fb] px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Active Days</div>
              <div className="mt-2 text-[26px] font-display font-bold leading-none text-slate-900">{contributionActiveDays}</div>
              <div className="mt-2 text-xs text-slate-500">{selectedContributionScale.description}有训练的天数</div>
            </div>
            <div className="rounded-[20px] bg-[#f6f8fb] px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Sessions</div>
              <div className="mt-2 text-[26px] font-display font-bold leading-none text-slate-900">{contributionCount}</div>
              <div className="mt-2 text-xs text-slate-500">{selectedContributionScale.description}累计训练次数</div>
            </div>
            <div className="rounded-[20px] bg-[#f6f8fb] px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Pattern</div>
              <div className="mt-2 text-[26px] font-display font-bold leading-none text-slate-900">{contributionAveragePerWeek || 0}</div>
              <div className="mt-2 text-xs text-slate-500">平均每周训练次数</div>
            </div>
          </div>

          <div className="mt-5 rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-slate-900">{selectedContributionScale.label}训练贡献图</div>
                <div className="mt-1 text-xs leading-relaxed text-slate-500">
                  {selectedContributionScale.centerWhenPossible
                    ? `当前按${selectedContributionScale.label}尺度展示，短周期会尽量放大格子并保持视觉居中。`
                    : `当前按${selectedContributionScale.label}尺度展示，长周期会默认滑到最右边，优先看到最近一段训练。`}
                </div>
              </div>
              <div className="hidden rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-500 shadow-sm sm:block">
                {selectedContributionScale.description}
              </div>
            </div>

            <div ref={contributionScrollerRef} className="overflow-x-auto pb-1">
              <div className={`mt-5 ${selectedContributionScale.centerWhenPossible ? 'flex min-w-full justify-center' : 'min-w-max'}`}>
                <div className="min-w-max">
                <div className="pl-10">
                  <div
                    className="relative h-5 text-[11px] font-medium text-slate-400"
                    style={{ width: `${contributionCalendar.weeks.length * contributionColumnStep}px` }}
                  >
                    {contributionCalendar.monthLabels.map((item) => (
                      <span
                        key={`${item.weekIndex}-${item.label}`}
                        className="absolute top-0 whitespace-nowrap"
                        style={{ left: `${item.weekIndex * contributionColumnStep}px` }}
                      >
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-3 flex items-start">
                  <div
                    className="mr-3 grid grid-rows-7 pt-[1px]"
                    style={{ gap: `${selectedContributionScale.gap}px` }}
                  >
                    {CONTRIBUTION_WEEKDAY_LABELS.map((label, index) => (
                      <div
                        key={`weekday-${index}`}
                        className="flex items-center justify-end pr-1 text-[11px] font-medium text-slate-400"
                        style={{ height: `${selectedContributionScale.cellSize}px` }}
                      >
                        {label}
                      </div>
                    ))}
                  </div>

                  <div className="flex" style={{ gap: `${selectedContributionScale.gap}px` }}>
                    {contributionCalendar.weeks.map((week, weekIndex) => (
                      <div
                        key={`week-${weekIndex}`}
                        className="grid grid-rows-7"
                        style={{ gap: `${selectedContributionScale.gap}px` }}
                      >
                        {week.map((day, dayIndex) => {
                          if (!day) {
                            return (
                              <div
                                key={`empty-${weekIndex}-${dayIndex}`}
                                style={{ height: `${selectedContributionScale.cellSize}px`, width: `${selectedContributionScale.cellSize}px` }}
                              />
                            );
                          }

                          const formattedDate = new Date(`${day.dateKey}T00:00:00`).toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          });

                          return (
                            <div
                              key={day.dateKey}
                              title={`${formattedDate} · ${day.count === 0 ? '无训练' : `${day.count} 次训练`}`}
                              aria-label={`${formattedDate}，${day.count === 0 ? '无训练' : `${day.count} 次训练`}`}
                              className={`rounded-[3px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] transition hover:scale-[1.06] ${CONTRIBUTION_LEVEL_CLASS_MAP[day.level]}`}
                              style={{ height: `${selectedContributionScale.cellSize}px`, width: `${selectedContributionScale.cellSize}px` }}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              <span>Less</span>
              {[0, 1, 2, 3, 4].map((level) => (
                <span
                  key={`legend-${level}`}
                  className={`rounded-[3px] border ${CONTRIBUTION_LEVEL_CLASS_MAP[level as ActivityDay['level']]}`}
                  style={{ height: `${selectedContributionScale.cellSize}px`, width: `${selectedContributionScale.cellSize}px` }}
                />
              ))}
              <span>More</span>
            </div>
          </div>

          <div className="mt-4 text-sm leading-relaxed text-slate-500">
            {selectedContributionScale.description}活跃 {contributionActiveDays} 天，累计完成 {contributionCount} 次训练。保持稳定训练，比偶尔突击更容易把判断速度和正确率一起拉起来。
          </div>
        </section>
      </div>
    );
  };

  const renderBanksPage = () => (
    <section className="rounded-[28px] bg-white/96 p-4 shadow-[0_10px_34px_rgba(15,23,42,0.04)] md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Selected Library</div>
          <div className="mt-2 text-[24px] font-display font-bold leading-none text-slate-900">{selectedQuestionBank.title}</div>
          <div className="mt-3 text-sm leading-relaxed text-slate-500">{selectedQuestionBank.description}</div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => cycleQuestionBank(-1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f2f7] text-slate-500 shadow-sm transition hover:bg-[#e8ebf2] hover:text-slate-900"
            aria-label="上一题库"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={() => cycleQuestionBank(1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f2f7] text-slate-500 shadow-sm transition hover:bg-[#e8ebf2] hover:text-slate-900"
            aria-label="下一题库"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative mt-5 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-8 bg-[linear-gradient(90deg,rgba(255,255,255,0.96),rgba(255,255,255,0))] md:block" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-8 bg-[linear-gradient(270deg,rgba(255,255,255,0.96),rgba(255,255,255,0))] md:block" />

        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-0.5 pb-3 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                className={`shrink-0 snap-center rounded-[28px] border p-4 text-left transition-all duration-300 ${
                  isSelected
                    ? 'border-[#bfdcff] bg-white shadow-[0_18px_38px_rgba(10,132,255,0.14)]'
                    : 'border-slate-200 bg-[linear-gradient(180deg,#fdfdfd,#f6f8fb)] shadow-[0_8px_22px_rgba(15,23,42,0.05)] hover:border-slate-300 hover:bg-white'
                }`}
                style={{
                  width: 'min(320px, calc(100vw - var(--safe-left) - var(--safe-right) - 40px))',
                  minWidth: 'min(320px, calc(100vw - var(--safe-left) - var(--safe-right) - 40px))',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl text-2xl ${accentClass}`}>
                    {bank.icon}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
                      isSelected ? 'bg-[#0a84ff] text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isSelected ? '已选择' : '可切换'}
                  </span>
                </div>
                <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{bank.subtitle}</div>
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
  );

  const renderSettingsPage = () => {
    if (isGuestView) {
      return (
        <div className="space-y-4 md:space-y-5">
          <section className="rounded-[28px] bg-[linear-gradient(135deg,#fdfdfd,#f1f6ff)] p-5 shadow-[0_10px_34px_rgba(15,23,42,0.05)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Guest Identity</div>
            <div className="mt-3 text-[28px] font-display font-bold leading-none text-slate-900">{guestDisplayName}</div>
            <div className="mt-3 text-sm leading-relaxed text-slate-500">
              当前还是游客身份。注册和登录流程放在这个设置页的层级里，完成后会自动带走本机游客数据。
            </div>
          </section>

          <section className="rounded-[28px] bg-white/96 p-5 shadow-[0_10px_34px_rgba(15,23,42,0.04)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Account Flow</div>
            <div className="mt-2 text-[24px] font-display font-bold leading-none text-slate-900">登录 / 注册</div>
            <div className="mt-3 text-sm leading-relaxed text-slate-500">
              先注册绑定资料，或者直接登录已有账号。后续你在排行榜、错题本和排位赛里的数据都会持续保留。
            </div>

            <div className="mt-5 space-y-3">
              <Button onClick={() => openAuthModal('signup')} disabled={!authAvailable} className="w-full">
                注册并绑定当前游客资料
              </Button>
              <Button onClick={() => openAuthModal('signin')} disabled={!authAvailable} variant="secondary" className="w-full">
                登录已有账号
              </Button>
            </div>
          </section>
        </div>
      );
    }

    return (
      <section className="rounded-[28px] bg-white/96 p-5 shadow-[0_10px_34px_rgba(15,23,42,0.04)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Account Settings</div>
        <div className="mt-2 text-[24px] font-display font-bold leading-none text-slate-900">账号管理</div>

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
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">邮箱</div>
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
    );
  };

  const renderSectionContent = () => {
    if (activeSection === 'performance') {
      return renderPerformancePage();
    }

    if (activeSection === 'records') {
      return renderRecordsPage();
    }

    if (activeSection === 'banks') {
      return renderBanksPage();
    }

    if (activeSection === 'settings') {
      return renderSettingsPage();
    }

    return renderOverviewPage();
  };

  return (
    <div className="app-safe-screen relative min-h-screen overflow-hidden bg-[#f2f2f7] px-2 pb-2 md:px-5 md:pb-5">
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-8%] h-[360px] w-[360px] rounded-full bg-white blur-3xl opacity-90" />
        <div className="absolute bottom-[-14%] left-[-10%] h-[340px] w-[340px] rounded-full bg-sky-100 blur-3xl opacity-60" />
      </div>

      <div className="mx-auto max-w-6xl overflow-hidden rounded-[28px] border border-white/95 bg-white/92 shadow-[0_18px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl animate-fade-in md:rounded-[34px]">
        <ScreenHeader
          eyebrow={currentSectionMeta.eyebrow}
          title={currentSectionMeta.title}
          description={currentSectionMeta.description}
          backLabel={activeSection === 'overview' ? '返回' : '返回主页'}
          onBack={activeSection === 'overview' ? onClose : () => setActiveSection('overview')}
        />

        <div className="px-2.5 py-3 md:px-5 md:py-5">
          {loading ? (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4 rounded-[28px] bg-white/94">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              <div className="text-sm font-medium text-slate-500">正在加载个人中心数据...</div>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-5">
              <aside className="min-w-0 space-y-4">
                <section className="overflow-hidden rounded-[28px] border border-white/90 bg-[linear-gradient(180deg,#fbfcff,#f3f6fb)] shadow-[0_10px_34px_rgba(15,23,42,0.05)]">
                  <div className="border-b border-slate-200/70 px-4 py-4 md:px-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-[linear-gradient(180deg,#ffffff,#edf0f6)] text-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_10px_24px_rgba(15,23,42,0.08)]">
                        {summary.avatar}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">User Hub</div>
                        <div className="mt-2 truncate text-[24px] font-display font-bold leading-none text-slate-900">{summary.displayName}</div>
                        <div className="mt-1 truncate text-sm text-slate-500">
                          {accountSession?.email ?? '当前设备为游客身份'}
                        </div>
                        <div className="mt-3 flex items-end justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                              isGuestView ? 'bg-[#fff3d6] text-[#a16207]' : 'bg-[#e7f7ee] text-[#15803d]'
                            }`}>
                              {accountStatusLabel}
                            </span>
                            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm">
                              UID {identity.id.slice(0, 8)}
                            </span>
                          </div>
                          <button
                            onClick={() => setActiveSection('settings')}
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                            aria-label="进入个人设置"
                            title="进入个人设置"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.9}
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.757.426 1.757 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.757-2.924 1.757-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.757-.426-1.757-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065Z"
                              />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-4 md:px-5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Page Navigation</div>
                    <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
                      {PROFILE_SECTIONS.map((section) => (
                        <SectionButton
                          key={section.id}
                          label={section.label}
                          active={section.id === activeSection}
                          onClick={() => setActiveSection(section.id)}
                        />
                      ))}
                    </div>
                  </div>
                </section>

                {feedback ? (
                  <section
                    className={`rounded-[20px] px-4 py-3 text-sm leading-relaxed ${
                      feedback.tone === 'success'
                        ? 'bg-[#e7f7ee] text-[#15803d]'
                        : 'bg-[#fff1f2] text-[#dc2626]'
                    }`}
                  >
                    {feedback.text}
                  </section>
                ) : null}
              </aside>

              <section className="min-w-0">
                {renderSectionContent()}
              </section>
            </div>
          )}
        </div>
      </div>

      {isGuestView && !authModalOpen && !loading ? (
        <GuestFloatingPrompt
          displayName={guestDisplayName}
          onSignUp={() => openAuthModal('signup')}
          onSignIn={() => openAuthModal('signin')}
        />
      ) : null}

      {authModalOpen && isGuestView ? (
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
      ) : null}
    </div>
  );
};
