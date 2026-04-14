import { QuestionCase } from '../types';

export type QuestionBankId =
  | 'all'
  | 'fundamentals'
  | 'chest'
  | 'neuro'
  | 'abdomen'
  | 'ortho'
  | 'women';

export interface QuestionBankOption {
  id: QuestionBankId;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  accent: 'blue' | 'amber' | 'rose' | 'emerald' | 'violet';
  specialties?: string[];
  modalities?: string[];
}

const QUESTION_BANK_STORAGE_KEY = 'medscan.selectedQuestionBank';

export const QUESTION_BANK_OPTIONS: QuestionBankOption[] = [
  {
    id: 'all',
    title: '综合题库',
    subtitle: 'Mixed Library',
    description: '覆盖当前全部题源，适合日常训练和综合热身。',
    icon: '🗂️',
    accent: 'blue',
  },
  {
    id: 'fundamentals',
    title: '影像基础',
    subtitle: 'Fundamentals',
    description: '更偏基础概念、影像原理和考试型判断题。',
    icon: '📘',
    accent: 'amber',
    specialties: ['影像基础'],
  },
  {
    id: 'chest',
    title: '胸部影像',
    subtitle: 'Chest',
    description: '以胸片、胸部 CT 和纵隔相关题目为主。',
    icon: '🫁',
    accent: 'blue',
    specialties: ['胸部'],
  },
  {
    id: 'neuro',
    title: '神经影像',
    subtitle: 'Neuro',
    description: '脑部 CT、MRI 和神经系统疾病判断。',
    icon: '🧠',
    accent: 'violet',
    specialties: ['神经'],
  },
  {
    id: 'abdomen',
    title: '腹部影像',
    subtitle: 'Abdomen',
    description: '聚焦消化与泌尿系统，适合腹部专项训练。',
    icon: '🫀',
    accent: 'emerald',
    specialties: ['消化', '泌尿'],
  },
  {
    id: 'ortho',
    title: '骨科 X 光',
    subtitle: 'Ortho',
    description: '以骨折、关节和运动系统影像题为主。',
    icon: '🦴',
    accent: 'rose',
    specialties: ['骨科'],
  },
  {
    id: 'women',
    title: '妇科与乳腺',
    subtitle: 'Women',
    description: '包含妇科超声和乳腺专项题，适合专题刷题。',
    icon: '🌸',
    accent: 'amber',
    specialties: ['妇科', '乳腺'],
  },
];

const FALLBACK_QUESTION_BANK_ID: QuestionBankId = 'all';

export const getQuestionBankById = (id: QuestionBankId | string | null | undefined): QuestionBankOption =>
  QUESTION_BANK_OPTIONS.find((item) => item.id === id) ?? QUESTION_BANK_OPTIONS[0];

export const readSelectedQuestionBank = (): QuestionBankId => {
  if (typeof window === 'undefined') {
    return FALLBACK_QUESTION_BANK_ID;
  }

  try {
    const raw = window.localStorage.getItem(QUESTION_BANK_STORAGE_KEY);
    return getQuestionBankById(raw).id;
  } catch (error) {
    console.error('Failed to read selected question bank:', error);
    return FALLBACK_QUESTION_BANK_ID;
  }
};

export const saveSelectedQuestionBank = (id: QuestionBankId) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(QUESTION_BANK_STORAGE_KEY, id);
  } catch (error) {
    console.error('Failed to persist selected question bank:', error);
  }
};

export const matchesQuestionBank = (question: Pick<QuestionCase, 'specialty' | 'modality'>, bankId: QuestionBankId): boolean => {
  if (bankId === 'all') {
    return true;
  }

  const bank = getQuestionBankById(bankId);
  const specialty = question.specialty ?? '';
  const modality = question.modality ?? '';

  const specialtyMatched = bank.specialties ? bank.specialties.includes(specialty) : true;
  const modalityMatched = bank.modalities ? bank.modalities.includes(modality) : true;

  return specialtyMatched && modalityMatched;
};

export const filterQuestionCasesByBank = <T extends Pick<QuestionCase, 'specialty' | 'modality'>>(
  cases: T[],
  bankId: QuestionBankId
): T[] => cases.filter((item) => matchesQuestionBank(item, bankId));

export const buildQuestionBankSeed = (dateSeed: string, bankId: QuestionBankId): string =>
  bankId === 'all' ? dateSeed : `${dateSeed}:${bankId}`;
