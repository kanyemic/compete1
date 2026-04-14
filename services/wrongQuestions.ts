import { QuestionCase, WrongQuestionEntry } from '../types';

const WRONG_QUESTIONS_STORAGE_KEY = 'medscan.wrongQuestions';

export interface WrongQuestionRecommendation {
  entry: WrongQuestionEntry;
  score: number;
  badge: string;
  reason: string;
}

export interface WrongQuestionReviewPlanItem {
  entry: WrongQuestionEntry;
  title: string;
  focus: string;
  estimatedMinutes: number;
  reason: string;
}

export interface WrongQuestionReviewPlan {
  items: WrongQuestionReviewPlanItem[];
  totalEstimatedMinutes: number;
  summary: string;
}

export interface WrongQuestionFocusArea {
  key: string;
  title: string;
  subtitle: string;
  badge: string;
  count: number;
  reason: string;
  query: string;
  representativeEntry: WrongQuestionEntry;
}

export const getLocalWrongQuestions = (): WrongQuestionEntry[] => {
  try {
    const raw = localStorage.getItem(WRONG_QUESTIONS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as WrongQuestionEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse local wrong questions:', error);
    return [];
  }
};

export const saveWrongQuestion = (payload: {
  mode: WrongQuestionEntry['mode'];
  question: QuestionCase;
  selectedAnswer: string | null;
}): WrongQuestionEntry[] => {
  const current = getLocalWrongQuestions();
  const nextEntry: WrongQuestionEntry = {
    id: crypto.randomUUID(),
    mode: payload.mode,
    questionId: payload.question.id,
    category: payload.question.category,
    specialty: payload.question.specialty,
    modality: payload.question.modality,
    description: payload.question.description,
    options: payload.question.options,
    correctAnswer: payload.question.correctAnswer,
    selectedAnswer: payload.selectedAnswer,
    explanation: payload.question.explanation,
    difficulty: payload.question.difficulty,
    imageUrl: payload.question.imageUrl,
    sourceName: payload.question.sourceName,
    sourceUrl: payload.question.sourceUrl,
    reviewStatus: payload.question.reviewStatus,
    reviewerName: payload.question.reviewerName,
    updatedAt: payload.question.updatedAt,
    createdAt: new Date().toISOString(),
  };

  const deduped = current.filter((entry) => !(entry.mode === nextEntry.mode && entry.questionId === nextEntry.questionId));
  const next = [nextEntry, ...deduped].slice(0, 100);
  localStorage.setItem(WRONG_QUESTIONS_STORAGE_KEY, JSON.stringify(next));
  return next;
};

const getHoursSinceCreated = (createdAt: string): number => {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) {
    return 999;
  }

  return Math.max((Date.now() - created) / (1000 * 60 * 60), 0);
};

const getDifficultyScore = (entry: WrongQuestionEntry): number => {
  if (entry.difficulty === 'Hard') {
    return 4;
  }

  if (entry.difficulty === 'Medium') {
    return 2;
  }

  return 1;
};

const getModeScore = (entry: WrongQuestionEntry): number => {
  if (entry.mode === 'daily_challenge') {
    return 3;
  }

  if (entry.mode === 'solo_streak') {
    return 2;
  }

  return 1;
};

const getRecencyScore = (entry: WrongQuestionEntry): number => {
  const hoursSinceCreated = getHoursSinceCreated(entry.createdAt);

  if (hoursSinceCreated <= 24) {
    return 4;
  }

  if (hoursSinceCreated <= 72) {
    return 3;
  }

  if (hoursSinceCreated <= 168) {
    return 2;
  }

  return 1;
};

const buildRecommendationReason = (entry: WrongQuestionEntry): string => {
  const reasonParts: string[] = [];

  if (entry.difficulty === 'Hard') {
    reasonParts.push('难度高');
  } else if (entry.difficulty === 'Medium') {
    reasonParts.push('中等难度');
  }

  if (entry.mode === 'daily_challenge') {
    reasonParts.push('来自每日挑战');
  } else if (entry.mode === 'solo_streak') {
    reasonParts.push('来自单人连胜');
  } else {
    reasonParts.push('曾进入复练');
  }

  const hoursSinceCreated = getHoursSinceCreated(entry.createdAt);
  if (hoursSinceCreated <= 24) {
    reasonParts.push('刚刚错过');
  } else if (hoursSinceCreated <= 72) {
    reasonParts.push('近 3 天内失误');
  } else {
    reasonParts.push('需要回顾');
  }

  return reasonParts.join(' · ');
};

const buildRecommendationBadge = (score: number): string => {
  if (score >= 10) {
    return '建议优先';
  }

  if (score >= 7) {
    return '本周复练';
  }

  return '可安排复盘';
};

const getEstimatedMinutes = (entry: WrongQuestionEntry): number => {
  if (entry.difficulty === 'Hard') {
    return 5;
  }

  if (entry.difficulty === 'Medium') {
    return 4;
  }

  return 3;
};

const buildPlanTitle = (index: number): string => {
  if (index === 0) {
    return '先纠正最近失误';
  }

  if (index === 1) {
    return '再补高频薄弱点';
  }

  return '最后做稳定性回顾';
};

const buildPlanFocus = (entry: WrongQuestionEntry): string => {
  if (entry.mode === 'daily_challenge') {
    return '优先修正每日挑战里的限时失误';
  }

  if (entry.mode === 'solo_streak') {
    return '补强单人连胜中容易断档的题型';
  }

  return '确认这道题是否已经真正吃透';
};

const buildFocusAreaKey = (entry: WrongQuestionEntry): string => {
  const specialty = entry.specialty?.trim() || entry.category.trim();
  const modality = entry.modality?.trim() || 'default';
  return `${specialty}::${modality}`;
};

const buildFocusAreaReason = (entries: WrongQuestionEntry[]): string => {
  const hardCount = entries.filter((entry) => entry.difficulty === 'Hard').length;
  const recentCount = entries.filter((entry) => getHoursSinceCreated(entry.createdAt) <= 72).length;

  if (hardCount >= 2 && recentCount >= 2) {
    return `这里既有高难度失分，也有近 3 天内的重复失误，建议优先集中补。`;
  }

  if (hardCount >= 2) {
    return `这个专题里困难题偏多，说明理解深度还可以再补一轮。`;
  }

  if (recentCount >= 2) {
    return `最近几次失误都集中在这里，优先处理能更快改善手感。`;
  }

  return `这里是当前最值得先回看的专题之一，适合先做一轮定向复练。`;
};

const buildFocusAreaBadge = (entries: WrongQuestionEntry[]): string => {
  const hardCount = entries.filter((entry) => entry.difficulty === 'Hard').length;
  const recentCount = entries.filter((entry) => getHoursSinceCreated(entry.createdAt) <= 72).length;

  if (hardCount >= 2) {
    return '高难专题';
  }

  if (recentCount >= 2) {
    return '近期集中';
  }

  return '建议聚焦';
};

export const buildWrongQuestionFocusAreas = (
  entries: WrongQuestionEntry[],
  limit: number = 3
): WrongQuestionFocusArea[] => {
  const grouped = entries.reduce<Map<string, WrongQuestionEntry[]>>((collection, entry) => {
    const key = buildFocusAreaKey(entry);
    const current = collection.get(key) ?? [];
    current.push(entry);
    collection.set(key, current);
    return collection;
  }, new Map());

  return Array.from(grouped.entries())
    .map(([key, groupEntries]) => {
      const representativeEntry = [...groupEntries].sort((left, right) => {
        const scoreDiff = getDifficultyScore(right) - getDifficultyScore(left);
        if (scoreDiff !== 0) {
          return scoreDiff;
        }

        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      })[0];
      const weightedScore = groupEntries.reduce((sum, entry) => (
        sum + getDifficultyScore(entry) + getRecencyScore(entry)
      ), 0);
      const specialtyLabel = representativeEntry.specialty?.trim() || representativeEntry.category;
      const subtitle = representativeEntry.modality
        ? `${representativeEntry.category} · ${representativeEntry.modality}`
        : representativeEntry.category;

      return {
        key,
        title: specialtyLabel,
        subtitle,
        badge: buildFocusAreaBadge(groupEntries),
        count: groupEntries.length,
        reason: buildFocusAreaReason(groupEntries),
        query: representativeEntry.specialty?.trim() || representativeEntry.category,
        representativeEntry,
        weightedScore,
      };
    })
    .sort((left, right) => {
      if (right.weightedScore !== left.weightedScore) {
        return right.weightedScore - left.weightedScore;
      }

      return right.count - left.count;
    })
    .slice(0, limit)
    .map(({ weightedScore, ...focusArea }) => focusArea);
};

export const getWrongQuestionRecommendations = (
  entries: WrongQuestionEntry[],
  limit: number = 3
): WrongQuestionRecommendation[] => entries
  .map((entry) => {
    const score = getDifficultyScore(entry) + getModeScore(entry) + getRecencyScore(entry);

    return {
      entry,
      score,
      badge: buildRecommendationBadge(score),
      reason: buildRecommendationReason(entry),
    };
  })
  .sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return new Date(right.entry.createdAt).getTime() - new Date(left.entry.createdAt).getTime();
  })
  .slice(0, limit);

export const buildWrongQuestionReviewPlan = (
  entries: WrongQuestionEntry[],
  limit: number = 3
): WrongQuestionReviewPlan | null => {
  const recommendations = getWrongQuestionRecommendations(entries, limit);
  if (recommendations.length === 0) {
    return null;
  }

  const items = recommendations.map((recommendation, index) => ({
    entry: recommendation.entry,
    title: buildPlanTitle(index),
    focus: buildPlanFocus(recommendation.entry),
    estimatedMinutes: getEstimatedMinutes(recommendation.entry),
    reason: recommendation.reason,
  }));
  const totalEstimatedMinutes = items.reduce((sum, item) => sum + item.estimatedMinutes, 0);

  return {
    items,
    totalEstimatedMinutes,
    summary: `今天建议先完成 ${items.length} 道复练题，预计花 ${totalEstimatedMinutes} 分钟，把最近最影响表现的失误先补掉。`,
  };
};
