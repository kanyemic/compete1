import { DailyChallengeRecord, LeaderboardData, LeaderboardEntry, LeaderboardType, QuestionCase } from '../types';
import { buildLeaderboardInsights, compareLeaderboardEntries } from './leaderboard';
import { LocalPlayerIdentity } from './playerIdentity';
import { IMPORTED_QUESTION_BANK } from './importedQuestionBank';

const buildCommonsAsset = (filename: string) => ({
  imageUrl: `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(filename)}`,
  sourceName: 'Wikimedia Commons',
  sourceUrl: `https://commons.wikimedia.org/wiki/File:${filename.replace(/ /g, '_')}`,
});

const defaultReviewMeta = {
  reviewStatus: 'approved' as const,
  reviewerName: '内容初审组',
  updatedAt: '2026-04-12T10:00:00.000Z',
};

const buildPlaceholderImage = (payload: {
  specialty: string;
  modality: string;
  category: string;
}): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f8fafc" />
          <stop offset="100%" stop-color="#e2e8f0" />
        </linearGradient>
      </defs>
      <rect width="1200" height="800" rx="48" fill="url(#bg)" />
      <rect x="64" y="64" width="1072" height="672" rx="36" fill="#ffffff" stroke="#dbe4ee" stroke-width="4" />
      <text x="96" y="150" fill="#64748b" font-size="28" font-family="Arial, sans-serif">Imported Question Bank</text>
      <text x="96" y="250" fill="#0f172a" font-size="64" font-weight="700" font-family="Arial, sans-serif">${payload.modality}</text>
      <text x="96" y="330" fill="#334155" font-size="38" font-family="Arial, sans-serif">${payload.specialty}</text>
      <text x="96" y="430" fill="#475569" font-size="28" font-family="Arial, sans-serif">${payload.category}</text>
      <text x="96" y="690" fill="#94a3b8" font-size="24" font-family="Arial, sans-serif">题库已导入，当前题目暂无原始图像文件</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const importedQuestionCases: Omit<QuestionCase, 'id'>[] = IMPORTED_QUESTION_BANK.map((entry) => ({
  ...entry,
  imageUrl: buildPlaceholderImage({
    specialty: entry.specialty,
    modality: entry.modality,
    category: entry.category,
  }),
}));

export const MOCK_CASE_DATABASE: Omit<QuestionCase, 'id'>[] = [
  {
    category: '胸部 X 光',
    specialty: '胸部',
    modality: 'X 光',
    description: '35岁男性，进行入职前筛查。无呼吸道症状。',
    correctAnswer: '正常胸部 X 光片',
    options: ['肺炎', '正常胸部 X 光片', '心脏扩大', '胸腔积液'],
    explanation: '肺野清晰，心脏轮廓大小正常（心胸比 <50%），肋膈角锐利。未见急性病变。',
    difficulty: 'Easy',
    ...buildCommonsAsset('Normal_posteroanterior_(PA)_chest_radiograph_(X-ray).jpg'),
    ...defaultReviewMeta,
  },
  {
    category: '脑部 MRI',
    specialty: '神经',
    modality: 'MRI',
    description: '28岁女性，有偏头痛史。矢状面 T1 加权序列。',
    correctAnswer: '正常脑部 MRI',
    options: ['胶质母细胞瘤', '多发性硬化症', '正常脑部 MRI', '脑积水'],
    explanation: '包括胼胝体、脑干和小脑在内的正中矢状结构表现正常。未观察到占位效应或异常信号强度。',
    difficulty: 'Easy',
    ...buildCommonsAsset('MRI_head_side.jpg'),
    ...defaultReviewMeta,
  },
  {
    category: '组织病理学',
    specialty: '病理',
    modality: '组织病理学',
    description: '一名丙型肝炎肝硬化患者的肝活检，显示不规则的小梁结构。',
    correctAnswer: '肝细胞癌',
    options: ['肝脂肪变性', '肝细胞癌', '正常肝组织', '肝血管瘤'],
    explanation: '切片显示肝细胞小梁增厚（超过 3 个细胞厚）和细胞异型性，这是肝细胞癌 (HCC) 的特征。',
    difficulty: 'Hard',
    ...buildCommonsAsset('Hepatocellular_carcinoma_histopathology_(2).jpg'),
    ...defaultReviewMeta,
  },
  {
    category: '骨科 (X 光)',
    specialty: '骨科',
    modality: 'X 光',
    description: '60岁女性，摔倒时手掌着地。腕部疼痛且畸形。',
    correctAnswer: 'Colles 骨折',
    options: ['舟骨骨折', 'Colles 骨折', 'Smith 骨折', 'Galeazzi 骨折'],
    explanation: '桡骨远端横行骨折，远端碎片向背侧移位，这是典型的 Colles 骨折。',
    difficulty: 'Medium',
    ...buildCommonsAsset('Colles_fracture.jpg'),
    ...defaultReviewMeta,
  },
  {
    category: '眼科',
    specialty: '眼科',
    modality: '眼底照相',
    description: '55岁糖尿病患者。眼底照相显示点状和斑块状出血。',
    correctAnswer: '糖尿病视网膜病变',
    options: ['青光眼', '糖尿病视网膜病变', '黄斑变性', '视网膜脱离'],
    explanation: '微动脉瘤、点状和斑块状出血以及硬性渗出的存在是非增殖性糖尿病视网膜病变的标志性体征。',
    difficulty: 'Medium',
    ...buildCommonsAsset('Diabetic_retinopathy.jpg'),
    ...defaultReviewMeta,
  },
  {
    category: '头部 CT',
    specialty: '神经',
    modality: 'CT',
    description: '70岁男性，突然出现左侧肢体无力。头部平扫 CT。',
    correctAnswer: '缺血性脑卒中 (MCA 区域)',
    options: ['蛛网膜下腔出血', '缺血性脑卒中 (MCA 区域)', '硬膜下血肿', '正常头部 CT'],
    explanation: '右侧大脑中动脉 (MCA) 区域出现低密度影，灰白质分界模糊，符合急性缺血性脑卒中。',
    difficulty: 'Medium',
    ...buildCommonsAsset('MCA_Territory_Infarct.jpg'),
    ...defaultReviewMeta,
  },
  {
    category: '胸部 X 光',
    specialty: '胸部',
    modality: 'X 光',
    description: '24岁瘦高男性，突发胸痛伴气促。立位胸片可见右侧肺野透亮度增高。',
    correctAnswer: '自发性气胸',
    options: ['大叶性肺炎', '胸腔积液', '自发性气胸', '肺水肿'],
    explanation: '患侧胸膜线清晰、外周肺纹理消失，符合自发性气胸表现。',
    difficulty: 'Medium',
    ...buildCommonsAsset('Chest X-ray of pneumothorax.png'),
    ...defaultReviewMeta,
  },
  {
    category: '胸部 X 光',
    specialty: '胸部',
    modality: 'X 光',
    description: '61岁男性，发热、咳嗽 3 天。胸片见局灶性肺实变影。',
    correctAnswer: '肺炎',
    options: ['肺炎', '正常胸片', '肺栓塞', '慢阻肺'],
    explanation: '肺实变伴气支气管征倾向感染性浸润，最符合肺炎影像表现。',
    difficulty: 'Easy',
    ...buildCommonsAsset('Pneumonia_x-ray.jpg'),
    ...defaultReviewMeta,
  },
  {
    category: '脑部增强 CT',
    specialty: '神经',
    modality: 'CT',
    description: '52岁女性，渐进性头痛。增强扫描见边界清楚、强化明显的硬膜外占位。',
    correctAnswer: '脑膜瘤',
    options: ['脑膜瘤', '脑梗死', '蛛网膜囊肿', '正常增强 CT'],
    explanation: '边界较清、明显强化且常与硬膜相连，是脑膜瘤的典型影像线索。',
    difficulty: 'Medium',
    ...buildCommonsAsset('Contrast enhanced meningioma.jpg'),
    ...defaultReviewMeta,
  },
  {
    category: '头部 CT',
    specialty: '神经',
    modality: 'CT',
    description: '76岁老人跌倒后意识模糊。平扫 CT 见新月形高密度影沿大脑半球表面分布。',
    correctAnswer: '硬膜下血肿',
    options: ['脑内出血', '硬膜下血肿', '蛛网膜下腔出血', '脑梗死'],
    explanation: '新月形、可跨越缝合线的高密度积血影是急性硬膜下血肿常见表现。',
    difficulty: 'Medium',
    ...buildCommonsAsset('Ct-scan of the brain with an subdural hematoma.jpg'),
    ...defaultReviewMeta,
  },
  {
    category: '腹部超声',
    specialty: '消化',
    modality: '超声',
    description: '19岁男性，右下腹痛伴反跳痛。超声见盲端管状结构增粗、不可压缩。',
    correctAnswer: '急性阑尾炎',
    options: ['肠套叠', '急性阑尾炎', '克罗恩病', '正常阑尾'],
    explanation: '增粗、不可压缩的阑尾并伴周围炎性改变，是急性阑尾炎的关键超声表现。',
    difficulty: 'Medium',
    ...buildCommonsAsset('Appendicitis ultrasound.png'),
    ...defaultReviewMeta,
  },
  {
    category: '胆囊超声',
    specialty: '消化',
    modality: '超声',
    description: '47岁女性，右上腹绞痛。超声见胆囊颈部强回声并伴后方声影。',
    correctAnswer: '胆囊结石并胆囊炎倾向',
    options: ['胆囊息肉', '胆囊结石并胆囊炎倾向', '肝囊肿', '胆总管囊肿'],
    explanation: '结石强回声伴声影，若合并胆囊壁增厚则提示急性胆囊炎可能。',
    difficulty: 'Medium',
    ...buildCommonsAsset('Gallstones.PNG'),
    ...defaultReviewMeta,
  },
  {
    category: '胆道超声',
    specialty: '消化',
    modality: '超声',
    description: '66岁男性，黄疸。胆道超声见扩张胆管内强回声灶，后方伴声影。',
    correctAnswer: '胆总管结石',
    options: ['胆总管结石', '肝门胆管癌', '胰头癌', '门静脉血栓'],
    explanation: '胆管内强回声伴声影，且用多普勒可与血管结构区分，符合胆总管结石。',
    difficulty: 'Hard',
    ...buildCommonsAsset('Ultrasonography of common bile duct stone, with arrow.jpg'),
    ...defaultReviewMeta,
  },
  {
    category: '盆腔超声',
    specialty: '妇科',
    modality: '超声',
    description: '32岁女性，体检发现附件区囊性包块。超声示边界清楚的囊性病灶。',
    correctAnswer: '良性卵巢囊肿',
    options: ['异位妊娠', '良性卵巢囊肿', '卵巢扭转', '卵巢恶性肿瘤'],
    explanation: '边界清楚、以液性回声为主的附件区囊性病灶更支持良性卵巢囊肿。',
    difficulty: 'Easy',
    ...buildCommonsAsset('Benign Ovarian Cyst.jpg'),
    ...defaultReviewMeta,
  },
  {
    category: '盆腔超声',
    specialty: '妇科',
    modality: '超声',
    description: '26岁女性，月经稀发。超声见卵巢体积增大，周边分布多个小卵泡。',
    correctAnswer: '多囊卵巢改变',
    options: ['正常卵巢', '黄体囊肿', '多囊卵巢改变', '卵巢巧克力囊肿'],
    explanation: '卵巢周边多发小卵泡、呈“项链征”分布时，要考虑多囊卵巢改变。',
    difficulty: 'Medium',
    ...buildCommonsAsset('PCOS.jpg'),
    ...defaultReviewMeta,
  },
  {
    category: '乳腺钼靶',
    specialty: '乳腺',
    modality: '钼靶',
    description: '58岁女性，筛查性乳腺摄影发现一侧局灶性高密度异常影。',
    correctAnswer: '乳腺癌倾向',
    options: ['乳腺癌倾向', '单纯乳腺增生', '乳房脂肪坏死', '正常乳腺钼靶'],
    explanation: '乳腺摄影中局灶性异常高密度灶、结构扭曲或可疑钙化要警惕恶性病变。',
    difficulty: 'Medium',
    ...buildCommonsAsset('Mammo breast cancer.jpg'),
    ...defaultReviewMeta,
  },
  {
    category: '上臂 X 光',
    specialty: '骨科',
    modality: 'X 光',
    description: '69岁女性跌倒后肩部疼痛，活动明显受限。X 光见肱骨近端骨折。',
    correctAnswer: '肱骨近端骨折',
    options: ['肩关节脱位', '肱骨近端骨折', '锁骨骨折', '正常肩关节 X 光'],
    explanation: '肱骨头邻近可见明确骨皮质连续性中断和骨折线，符合肱骨近端骨折。',
    difficulty: 'Medium',
    ...buildCommonsAsset('Humerus fracture 1300272.JPG'),
    ...defaultReviewMeta,
  },
  {
    category: '膝关节 X 光',
    specialty: '骨科',
    modality: 'X 光',
    description: '63岁男性，慢性膝痛。X 光见关节间隙变窄并伴边缘骨赘形成。',
    correctAnswer: '膝骨关节炎',
    options: ['类风湿关节炎', '膝骨关节炎', '化脓性关节炎', '正常膝关节 X 光'],
    explanation: '关节间隙狭窄、软骨下硬化和边缘骨赘是骨关节炎的典型影像学表现。',
    difficulty: 'Easy',
    ...buildCommonsAsset('Osteoarthritis of the knee.jpg'),
    ...defaultReviewMeta,
  },
  {
    category: '组织病理学',
    specialty: '病理',
    modality: '组织病理学',
    description: '肾脏肿瘤切片可见透明胞浆细胞成巢状排列，间质血管丰富。',
    correctAnswer: '肾透明细胞癌',
    options: ['肾透明细胞癌', '肾嗜酸细胞瘤', '肾盂尿路上皮癌', '正常肾组织'],
    explanation: '透明胞浆、丰富毛细血管网和巢状结构是肾透明细胞癌常见病理表现。',
    difficulty: 'Hard',
    ...buildCommonsAsset('Histopathology of renal clear cell carcinoma.jpg'),
    ...defaultReviewMeta,
  },
  ...importedQuestionCases,
];

export const getMockQuestionCases = (): QuestionCase[] => (
  MOCK_CASE_DATABASE.map((entry, index) => ({
    id: `mock-question-${index + 1}`,
    ...entry,
  }))
);

const MOCK_NAMES = ['豪斯医生', '神经忍者', '扫描大师', '格蕾医生', '病理逻辑', 'X射线视界', '42号医学生', '自愈者', '希波克拉底_AI', '骨骼巫师'];
const MOCK_AVATARS = ['👨‍⚕️', '👩‍⚕️', '🧠', '💀', '🩺', '🔬', '💊', '🧬', '🏥', '🚑'];
const MOCK_RATING_SCORES = [980, 960, 935, 910, 890, 860, 845, 820, 790, 760];
const MOCK_RATING_TIMES_MS = [24100, 25600, 26800, 27400, 28900, 30100, 31500, 32800, 34000, 35600];
const MOCK_STREAK_SCORES = [28, 24, 21, 19, 17, 15, 13, 11, 10, 9];
const MOCK_TRENDS: LeaderboardEntry['trend'][] = ['up', 'same', 'up', 'down', 'same', 'up', 'same', 'down', 'same', 'up'];

export const buildMockLeaderboard = (type: LeaderboardType): LeaderboardEntry[] =>
  Array.from({ length: 10 }).map((_, index) => {
    const score = type === 'rating' ? MOCK_RATING_SCORES[index] : MOCK_STREAK_SCORES[index];

    return {
      id: `user-${index}`,
      rank: index + 1,
      name: MOCK_NAMES[index % MOCK_NAMES.length],
      avatar: MOCK_AVATARS[index % MOCK_AVATARS.length],
      score,
      trend: MOCK_TRENDS[index % MOCK_TRENDS.length],
      totalTimeMs: type === 'rating' ? MOCK_RATING_TIMES_MS[index] : null,
    };
  });

export const buildMockLeaderboardData = (payload: {
  type: LeaderboardType;
  identity: LocalPlayerIdentity;
  bestSoloStreak: number;
  dailyChallengeRecord: DailyChallengeRecord | null;
}): LeaderboardData => {
  const baseEntries = buildMockLeaderboard(payload.type);
  const currentScore = payload.type === 'rating'
    ? payload.dailyChallengeRecord?.score ?? 0
    : payload.bestSoloStreak;
  const currentTimeMs = payload.type === 'rating'
    ? payload.dailyChallengeRecord?.totalTimeMs ?? Number.MAX_SAFE_INTEGER
    : null;

  if (currentScore <= 0) {
    return {
      entries: baseEntries,
      currentUserEntry: null,
      totalPlayers: baseEntries.length,
      topScore: baseEntries[0]?.score ?? null,
      chaseMessage: null,
      stabilityMessage: null,
    };
  }

  const combinedEntries = [
    ...baseEntries,
    {
      id: payload.identity.id,
      rank: 0,
      name: payload.identity.displayName,
      avatar: payload.identity.avatar,
      score: currentScore,
      trend: 'same' as const,
      totalTimeMs: currentTimeMs,
    },
  ]
    .sort(compareLeaderboardEntries)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  const insights = buildLeaderboardInsights({
    entries: combinedEntries,
    currentUserId: payload.identity.id,
    type: payload.type,
  });
  const topEntries = combinedEntries
    .slice(0, 10)
    .map((entry) => ({
      ...entry,
      trend: entry.id === payload.identity.id ? 'same' : entry.trend,
    }));

  return {
    entries: topEntries,
    currentUserEntry: insights.currentUserEntry,
    totalPlayers: insights.totalPlayers,
    topScore: insights.topScore,
    chaseMessage: insights.chaseMessage,
    stabilityMessage: insights.stabilityMessage,
  };
};
