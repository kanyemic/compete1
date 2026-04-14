import { LeaderboardData, LeaderboardEntry, LeaderboardType } from '../types';

const formatDurationDiff = (valueMs: number): string => {
  if (valueMs >= 1000) {
    return `${(valueMs / 1000).toFixed(1)} 秒`;
  }

  return `${valueMs} 毫秒`;
};

export const formatLeaderboardTime = (valueMs: number | null | undefined): string | null => {
  if (valueMs === null || valueMs === undefined || !Number.isFinite(valueMs)) {
    return null;
  }

  if (valueMs >= 60000) {
    return `${(valueMs / 60000).toFixed(1)} 分钟`;
  }

  return `${(valueMs / 1000).toFixed(1)} 秒`;
};

export const compareLeaderboardEntries = (
  left: Pick<LeaderboardEntry, 'score' | 'totalTimeMs'>,
  right: Pick<LeaderboardEntry, 'score' | 'totalTimeMs'>
): number => {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  const leftTime = left.totalTimeMs ?? Number.MAX_SAFE_INTEGER;
  const rightTime = right.totalTimeMs ?? Number.MAX_SAFE_INTEGER;
  return leftTime - rightTime;
};

export interface LeaderboardTarget {
  key: string;
  title: string;
  detail: string;
  accent: 'blue' | 'amber' | 'emerald';
}

export interface DailyChallengeResultForecast {
  tierLabel: string;
  tierTone: 'blue' | 'amber' | 'emerald' | 'slate';
  zoneLabel: string;
  summary: string;
  actionMessage: string;
}

const DAILY_CHALLENGE_FALLBACK_ENTRIES: Array<Pick<LeaderboardEntry, 'rank' | 'score' | 'totalTimeMs'>> = [
  { rank: 1, score: 980, totalTimeMs: 24100 },
  { rank: 2, score: 960, totalTimeMs: 25600 },
  { rank: 3, score: 935, totalTimeMs: 26800 },
  { rank: 4, score: 910, totalTimeMs: 27400 },
  { rank: 5, score: 890, totalTimeMs: 28900 },
  { rank: 6, score: 860, totalTimeMs: 30100 },
  { rank: 7, score: 845, totalTimeMs: 31500 },
  { rank: 8, score: 820, totalTimeMs: 32800 },
  { rank: 9, score: 790, totalTimeMs: 34000 },
  { rank: 10, score: 760, totalTimeMs: 35600 },
];

const buildScoreGapDetail = (payload: {
  current: LeaderboardEntry;
  target: LeaderboardEntry;
  type: LeaderboardType;
}): string => {
  if (payload.type === 'streak') {
    const gap = Math.max(payload.target.score - payload.current.score, 1);
    return `还差 ${gap} 连胜即可超过当前门槛。`;
  }

  if (payload.target.score > payload.current.score) {
    return `还差 ${payload.target.score - payload.current.score} 分即可追上。`;
  }

  const currentTime = payload.current.totalTimeMs ?? null;
  const targetTime = payload.target.totalTimeMs ?? null;
  if (currentTime !== null && targetTime !== null) {
    return `同分情况下还要快 ${formatDurationDiff(Math.max(currentTime - targetTime, 0))}。`;
  }

  return '同分情况下还需要更短总耗时。';
};

export const buildLeaderboardTargets = (payload: {
  entries: LeaderboardEntry[];
  currentUserEntry: LeaderboardEntry | null;
  type: LeaderboardType;
}): LeaderboardTarget[] => {
  const current = payload.currentUserEntry;
  if (!current) {
    return [];
  }

  const targets: LeaderboardTarget[] = [];
  const previousVisibleEntry = payload.entries.find((entry) => entry.rank === current.rank - 1) ?? null;
  const thirdEntry = payload.entries.find((entry) => entry.rank === 3) ?? null;
  const tenthEntry = payload.entries.find((entry) => entry.rank === 10) ?? null;
  const topEntry = payload.entries.find((entry) => entry.rank === 1) ?? null;

  if (current.rank > 1) {
    if (previousVisibleEntry) {
      targets.push({
        key: 'next-rank',
        title: `冲击第 ${previousVisibleEntry.rank} 名`,
        detail: buildScoreGapDetail({
          current,
          target: previousVisibleEntry,
          type: payload.type,
        }),
        accent: 'blue',
      });
    } else if (current.rank > 10 && tenthEntry) {
      targets.push({
        key: 'enter-top10',
        title: '先挤进前 10',
        detail: buildScoreGapDetail({
          current,
          target: tenthEntry,
          type: payload.type,
        }),
        accent: 'blue',
      });
    }
  }

  if (current.rank > 3 && thirdEntry) {
    targets.push({
      key: 'top-3',
      title: '冲击前 3',
      detail: buildScoreGapDetail({
        current,
        target: thirdEntry,
        type: payload.type,
      }),
      accent: 'amber',
    });
  }

  if (current.rank > 10 && tenthEntry) {
    targets.push({
      key: 'top-10',
      title: '进入前 10',
      detail: buildScoreGapDetail({
        current,
        target: tenthEntry,
        type: payload.type,
      }),
      accent: 'emerald',
    });
  }

  if (current.rank > 1 && topEntry) {
    targets.push({
      key: 'top-1',
      title: '冲击榜首',
      detail: buildScoreGapDetail({
        current,
        target: topEntry,
        type: payload.type,
      }),
      accent: 'amber',
    });
  }

  return targets
    .filter((target, index, collection) => collection.findIndex((item) => item.key === target.key) === index)
    .slice(0, 3);
};

const buildDailyChallengeGapDetail = (
  candidate: Pick<LeaderboardEntry, 'score' | 'totalTimeMs'>,
  target: Pick<LeaderboardEntry, 'score' | 'totalTimeMs'>,
  label: string
): string => {
  if (candidate.score < target.score) {
    return `距离${label}还差 ${target.score - candidate.score} 分。`;
  }

  const candidateTime = candidate.totalTimeMs ?? null;
  const targetTime = target.totalTimeMs ?? null;
  if (candidateTime !== null && targetTime !== null && candidateTime > targetTime) {
    return `分数已达线，再快 ${formatDurationDiff(candidateTime - targetTime)} 会更稳。`;
  }

  return `你的分数和速度已经摸到${label}门槛。`;
};

export const buildDailyChallengeResultForecast = (payload: {
  score: number;
  totalTimeMs: number;
  entries?: Array<Pick<LeaderboardEntry, 'rank' | 'score' | 'totalTimeMs'>>;
}): DailyChallengeResultForecast => {
  const entries = (payload.entries && payload.entries.length > 0 ? payload.entries : DAILY_CHALLENGE_FALLBACK_ENTRIES)
    .slice()
    .sort(compareLeaderboardEntries);
  const candidate = {
    score: payload.score,
    totalTimeMs: payload.totalTimeMs,
  };
  const topEntry = entries.find((entry) => entry.rank === 1) ?? entries[0] ?? null;
  const thirdEntry = entries.find((entry) => entry.rank === 3) ?? entries[Math.min(2, entries.length - 1)] ?? null;
  const tenthEntry = entries.find((entry) => entry.rank === 10) ?? entries[Math.min(9, entries.length - 1)] ?? null;
  const medianEntry = entries[Math.floor(entries.length / 2)] ?? null;

  if (topEntry && compareLeaderboardEntries(candidate, topEntry) <= 0) {
    return {
      tierLabel: '大师手感',
      tierTone: 'amber',
      zoneLabel: '大概率榜首区',
      summary: '这次已经具备冲击今日榜首的完成度，属于非常强势的一局。',
      actionMessage: '去今日榜确认真实名次，并观察自己和第二名的耗时差。',
    };
  }

  if (thirdEntry && compareLeaderboardEntries(candidate, thirdEntry) <= 0) {
    return {
      tierLabel: '高光发挥',
      tierTone: 'emerald',
      zoneLabel: '大概率前 3',
      summary: '这次成绩已经进入头部竞争区，榜单曝光和成就感都会很强。',
      actionMessage: buildDailyChallengeGapDetail(candidate, topEntry ?? thirdEntry, '榜首'),
    };
  }

  if (tenthEntry && compareLeaderboardEntries(candidate, tenthEntry) <= 0) {
    return {
      tierLabel: '稳定上榜',
      tierTone: 'blue',
      zoneLabel: '大概率前 10',
      summary: '这次分数已经有明显上榜机会，适合马上去榜单验证位置。',
      actionMessage: buildDailyChallengeGapDetail(candidate, thirdEntry ?? tenthEntry, '前 3'),
    };
  }

  if (tenthEntry) {
    const scoreGapToTop10 = Math.max(tenthEntry.score - candidate.score, 0);
    const timeGapToTop10 = candidate.totalTimeMs - (tenthEntry.totalTimeMs ?? candidate.totalTimeMs);
    if (scoreGapToTop10 <= 40 || (scoreGapToTop10 === 0 && timeGapToTop10 > 0)) {
      return {
        tierLabel: '冲榜潜力',
        tierTone: 'blue',
        zoneLabel: '逼近前 10',
        summary: '已经非常接近上榜线，再提一点正确率或节奏就可能冲进去。',
        actionMessage: buildDailyChallengeGapDetail(candidate, tenthEntry, '前 10'),
      };
    }
  }

  if (medianEntry && compareLeaderboardEntries(candidate, medianEntry) <= 0) {
    return {
      tierLabel: '稳定发挥',
      tierTone: 'emerald',
      zoneLabel: '中上游区间',
      summary: '整体表现已经不错，继续优化答题节奏会更容易进入冲榜区。',
      actionMessage: buildDailyChallengeGapDetail(candidate, tenthEntry ?? medianEntry, '前 10'),
    };
  }

  return {
    tierLabel: '继续积累',
    tierTone: 'slate',
    zoneLabel: '仍在爬升期',
    summary: '这次更适合先稳住基础正确率，后面再冲更高榜位会更轻松。',
    actionMessage: buildDailyChallengeGapDetail(candidate, medianEntry ?? tenthEntry ?? candidate, '中上游'),
  };
};

export const buildLeaderboardInsights = (payload: {
  entries: LeaderboardEntry[];
  currentUserId: string;
  type: LeaderboardType;
}): Pick<LeaderboardData, 'currentUserEntry' | 'totalPlayers' | 'topScore' | 'chaseMessage' | 'stabilityMessage'> => {
  const currentUserEntry = payload.entries.find((entry) => entry.id === payload.currentUserId) ?? null;

  if (!currentUserEntry) {
    return {
      currentUserEntry: null,
      totalPlayers: payload.entries.length,
      topScore: payload.entries[0]?.score ?? null,
      chaseMessage: null,
      stabilityMessage: null,
    };
  }

  const currentIndex = currentUserEntry.rank - 1;
  const previousEntry = payload.entries[currentIndex - 1] ?? null;
  const nextEntry = payload.entries[currentIndex + 1] ?? null;

  let chaseMessage: string | null = null;
  let stabilityMessage: string | null = null;

  if (!previousEntry) {
    chaseMessage = payload.type === 'rating'
      ? '你现在就是今日榜榜首，继续保持答题速度。'
      : '你现在就是连胜榜榜首，继续保持状态。';
  } else if (payload.type === 'rating') {
    if (previousEntry.score > currentUserEntry.score) {
      chaseMessage = `距前一名还差 ${previousEntry.score - currentUserEntry.score} 分。`;
    } else {
      const previousTime = previousEntry.totalTimeMs ?? null;
      const currentTime = currentUserEntry.totalTimeMs ?? null;
      chaseMessage = previousTime !== null && currentTime !== null
        ? `与前一名同分，还差 ${formatDurationDiff(Math.max(currentTime - previousTime, 0))} 才能反超。`
        : '与前一名同分，还需要更短耗时才能反超。';
    }
  } else {
    const streakGap = previousEntry.score - currentUserEntry.score;
    chaseMessage = `距前一名还差 ${streakGap <= 0 ? 1 : streakGap} 连胜。`;
  }

  if (!nextEntry) {
    stabilityMessage = '当前后方暂无紧邻对手，名次相对稳。';
  } else if (payload.type === 'rating') {
    if (currentUserEntry.score > nextEntry.score) {
      stabilityMessage = `当前领先后一名 ${currentUserEntry.score - nextEntry.score} 分。`;
    } else {
      const currentTime = currentUserEntry.totalTimeMs ?? null;
      const nextTime = nextEntry.totalTimeMs ?? null;
      stabilityMessage = currentTime !== null && nextTime !== null
        ? `与后一名同分，仅领先 ${formatDurationDiff(Math.max(nextTime - currentTime, 0))}。`
        : '与后一名同分，名次波动空间较小。';
    }
  } else {
    if (currentUserEntry.score > nextEntry.score) {
      stabilityMessage = `当前领先后一名 ${currentUserEntry.score - nextEntry.score} 连胜。`;
    } else {
      stabilityMessage = `与后一名同为 ${currentUserEntry.score} 连胜，名次并不稳。`;
    }
  }

  return {
    currentUserEntry,
    totalPlayers: payload.entries.length,
    topScore: payload.entries[0]?.score ?? null,
    chaseMessage,
    stabilityMessage,
  };
};
