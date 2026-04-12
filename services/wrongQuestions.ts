import { QuestionCase, WrongQuestionEntry } from '../types';

const WRONG_QUESTIONS_STORAGE_KEY = 'medscan.wrongQuestions';

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
