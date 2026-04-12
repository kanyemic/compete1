import React, { useEffect, useState } from 'react';
import { ProfileSummary, TrainingHistoryEntry } from '../types';
import { Button } from './Button';
import { type LocalPlayerIdentity } from '../services/playerIdentity';
import { type AuthAccountSession } from '../services/auth';

interface ProfileProps {
  summary: ProfileSummary;
  identity: LocalPlayerIdentity;
  accountSession: AuthAccountSession | null;
  authAvailable: boolean;
  authLoading?: boolean;
  accountStatusLabel: string;
  initialAuthTab?: 'signin' | 'signup';
  loading?: boolean;
  onClose: () => void;
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

export const Profile: React.FC<ProfileProps> = ({
  summary,
  identity,
  accountSession,
  authAvailable,
  authLoading = false,
  accountStatusLabel,
  initialAuthTab = 'signin',
  loading = false,
  onClose,
  onUpdateDisplayName,
  onSignIn,
  onSignUp,
  onSignOut,
}) => {
  const formatRecordLabel = (record: TrainingHistoryEntry): string => {
    return record.mode === 'daily_challenge' ? '每日挑战' : '单人连胜';
  };
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(initialAuthTab);
  const [displayName, setDisplayName] = useState(identity.displayName);
  const [email, setEmail] = useState(identity.email ?? '');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const busy = authLoading || submitting;
  const isGuestView = !accountSession;
  const authModeHint = authAvailable ? '当前可直接使用邮箱登录或注册，未接入云端时会先走本地模拟账号。' : '当前环境暂未开放账号服务。';

  useEffect(() => {
    setDisplayName(identity.displayName);
    setEmail(identity.email ?? accountSession?.email ?? '');
  }, [accountSession?.email, identity.displayName, identity.email]);

  useEffect(() => {
    setActiveTab(initialAuthTab);
  }, [initialAuthTab]);

  const handleProfileSave = async () => {
    setSubmitting(true);
    const result = await onUpdateDisplayName(displayName);
    setMessage(result.message);
    setSubmitting(false);
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setMessage('请输入邮箱和密码后再登录。');
      return;
    }

    setSubmitting(true);
    const result = await onSignIn({
      email,
      password,
      displayName,
    });
    setMessage(result.message);
    if (result.success) {
      setPassword('');
    }
    setSubmitting(false);
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      setMessage('请输入邮箱和密码后再注册。');
      return;
    }

    setSubmitting(true);
    const result = await onSignUp({
      email,
      password,
      displayName,
    });
    setMessage(result.message);
    if (result.success) {
      setPassword('');
      setActiveTab('signin');
    }
    setSubmitting(false);
  };

  const handleSignOut = async () => {
    setSubmitting(true);
    const result = await onSignOut();
    setMessage(result.message);
    setSubmitting(false);
  };

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
              <div className="bg-white border border-slate-200 rounded-3xl p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
                  <div>
                    <div className="text-xs uppercase tracking-wide font-bold text-slate-400">账号体系</div>
                    <div className="text-xl font-display font-black text-slate-900 mt-1">个人主页登录与注册</div>
                    <div className="text-sm text-slate-500 mt-2 leading-relaxed">
                      个人主页现在就是注册和登录入口。游客可以先体验每日挑战，想查看完整成长记录或解锁其他玩法，请先在这里完成登录。
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                    accountSession
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {accountSession ? '正式账号' : '游客模式'}
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 mb-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{identity.displayName}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {accountSession ? `已登录：${accountSession.email ?? '未同步邮箱'}` : '当前设备为游客身份'}
                      </div>
                      <div className="text-xs text-slate-400 mt-2 leading-relaxed">{authModeHint}</div>
                    </div>
                    <div className="text-2xl">{identity.avatar}</div>
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-xs uppercase tracking-wide font-bold text-slate-400 mb-2">昵称</label>
                  <div className="flex flex-col md:flex-row gap-3">
                    <input
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="输入你想展示的昵称"
                      className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
                    />
                    <Button onClick={handleProfileSave} isLoading={busy} className="md:min-w-[140px]">
                      保存昵称
                    </Button>
                  </div>
                </div>

                {accountSession ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="text-sm font-bold text-slate-900">当前账号已登录</div>
                    <div className="text-sm text-slate-500 mt-2 leading-relaxed">
                      当前设备上的训练记录会继续保留。退出后会回到游客模式，但本地数据不会立即清空。
                    </div>
                    <div className="mt-4">
                      <Button onClick={handleSignOut} variant="secondary" isLoading={busy}>
                        退出登录
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex space-x-2 bg-white p-1 rounded-xl mb-5 border border-slate-200">
                      <button
                        onClick={() => setActiveTab('signin')}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                          activeTab === 'signin' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        登录
                      </button>
                      <button
                        onClick={() => setActiveTab('signup')}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                          activeTab === 'signup' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        注册
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wide font-bold text-slate-400 mb-2">邮箱</label>
                        <input
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          type="email"
                          placeholder="name@example.com"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wide font-bold text-slate-400 mb-2">密码</label>
                        <input
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          type="password"
                          placeholder="至少 6 位密码"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-300"
                        />
                      </div>
                    </div>

                    <div className="mt-5">
                      <Button
                        onClick={activeTab === 'signin' ? handleSignIn : handleSignUp}
                        isLoading={busy}
                        className="w-full"
                      >
                        {activeTab === 'signin' ? '登录并解锁完整功能' : '注册并绑定当前设备'}
                      </Button>
                    </div>
                  </div>
                )}

                {message && (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {message}
                  </div>
                )}
              </div>

              <div className="relative">
                <div className={`space-y-8 transition-all duration-300 ${isGuestView ? 'blur-md select-none pointer-events-none' : ''}`}>
                  <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-3xl shadow-sm">
                        {summary.avatar}
                      </div>
                      <div>
                        <div className="text-sm uppercase tracking-wide font-bold text-slate-400">训练身份</div>
                        <div className="text-2xl font-display font-black text-slate-900">{summary.displayName}</div>
                        <div className="text-sm text-slate-500 font-medium mt-1">最近训练：{formatDate(summary.lastPlayedAt)}</div>
                        <div className="mt-3 inline-flex items-center px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold">
                          🔐 {accountStatusLabel}
                        </div>
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

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-xs uppercase tracking-wide font-bold text-slate-400">排行榜联动</div>
                          <div className="text-xl font-display font-black text-slate-900 mt-1">今日榜位置</div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl">🏆</div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                          <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">当前名次</div>
                          <div className="text-2xl font-black text-slate-900 mt-2">
                            {summary.dailyChallengeRank.rank ? `#${summary.dailyChallengeRank.rank}` : '--'}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                          <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">参与人数</div>
                          <div className="text-2xl font-black text-slate-900 mt-2">{summary.dailyChallengeRank.totalPlayers || '--'}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                          <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">距榜首</div>
                          <div className="text-2xl font-black text-amber-600 mt-2">
                            {summary.dailyChallengeRank.gapToTop !== null ? summary.dailyChallengeRank.gapToTop : '--'}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 text-sm text-slate-500 leading-relaxed">
                        {summary.dailyChallengeRank.rank
                          ? `你当前在今日榜排第 ${summary.dailyChallengeRank.rank} 名，榜首成绩是 ${summary.dailyChallengeRank.topScore ?? '--'} 分。`
                          : '今天还没有形成有效名次，先完成一局每日挑战后再回来查看位置。'}
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-3xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-xs uppercase tracking-wide font-bold text-slate-400">排行榜联动</div>
                          <div className="text-xl font-display font-black text-slate-900 mt-1">连胜榜位置</div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl">🔥</div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                          <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">当前名次</div>
                          <div className="text-2xl font-black text-slate-900 mt-2">
                            {summary.soloStreakRank.rank ? `#${summary.soloStreakRank.rank}` : '--'}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                          <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">参与人数</div>
                          <div className="text-2xl font-black text-slate-900 mt-2">{summary.soloStreakRank.totalPlayers || '--'}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                          <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">距榜首</div>
                          <div className="text-2xl font-black text-blue-600 mt-2">
                            {summary.soloStreakRank.gapToTop !== null ? summary.soloStreakRank.gapToTop : '--'}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 text-sm text-slate-500 leading-relaxed">
                        {summary.soloStreakRank.rank
                          ? `你的历史最佳当前排在第 ${summary.soloStreakRank.rank} 名，榜首连胜是 ${summary.soloStreakRank.topScore ?? '--'}。`
                          : '你还没有进入连胜榜，先去打出一次有效历史最佳。'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6">
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <div className="text-xs uppercase tracking-wide font-bold text-slate-400">最近记录</div>
                          <div className="text-xl font-display font-black text-slate-900 mt-1">训练轨迹</div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl">🗂️</div>
                      </div>

                      {summary.recentRecords.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                          还没有历史记录，完成一局挑战后这里会出现最近训练摘要。
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {summary.recentRecords.map((record) => (
                            <div key={record.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between gap-4">
                              <div>
                                <div className="text-sm font-bold text-slate-900">{formatRecordLabel(record)}</div>
                                <div className="text-xs text-slate-500 mt-1">
                                  {formatDate(record.completedAt)}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-black text-slate-900">{record.score}</div>
                                <div className="text-xs text-slate-500">
                                  {record.correctCount}/{record.totalQuestions} 题正确
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-3xl p-6">
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <div className="text-xs uppercase tracking-wide font-bold text-slate-400">最近 7 天</div>
                          <div className="text-xl font-display font-black text-slate-900 mt-1">活跃情况</div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl">📆</div>
                      </div>

                      <div className="grid grid-cols-7 gap-2">
                        {summary.weeklyActivity.map((day) => (
                          <div key={day.dateKey} className="text-center">
                            <div
                              className={`h-16 rounded-2xl border flex items-center justify-center text-lg font-black ${
                                day.active
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                  : 'bg-slate-50 border-slate-200 text-slate-300'
                              }`}
                            >
                              {day.active ? '•' : '·'}
                            </div>
                            <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400 mt-2">{day.label}</div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 text-sm text-slate-500 leading-relaxed">
                        最近 7 天共活跃 {summary.weeklyActivity.filter((day) => day.active).length} 天，保持连续训练更容易提升限时判断稳定性。
                      </div>
                    </div>
                  </div>
                </div>

                {isGuestView && (
                  <div className="absolute inset-0 flex items-center justify-center px-4">
                    <div className="max-w-md rounded-3xl border border-slate-200 bg-white/92 backdrop-blur p-6 text-center shadow-xl">
                      <div className="text-3xl mb-3">🔒</div>
                      <div className="text-lg font-display font-black text-slate-900">登录后查看完整个人主页</div>
                      <div className="text-sm text-slate-500 mt-3 leading-relaxed">
                        下方成长数据、训练轨迹、活跃统计会在登录后自动解锁。现在先在上方完成注册或登录即可。
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
