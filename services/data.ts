
import { QuestionCase, LeaderboardEntry } from '../types';

// Simulated database of cases
const MOCK_DATABASE: Omit<QuestionCase, 'id'>[] = [
  {
    category: "胸部 X 光",
    description: "35岁男性，进行入职前筛查。无呼吸道症状。",
    correctAnswer: "正常胸部 X 光片",
    options: ["肺炎", "正常胸部 X 光片", "心脏扩大", "胸腔积液"],
    explanation: "肺野清晰，心脏轮廓大小正常（心胸比 <50%），肋膈角锐利。未见急性病变。",
    difficulty: "Easy",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a1/Normal_posteroanterior_%28PA%29_chest_radiograph_%28X-ray%29.jpg"
  },
  {
    category: "脑部 MRI",
    description: "28岁女性，有偏头痛史。矢状面 T1 加权序列。",
    correctAnswer: "正常脑部 MRI",
    options: ["胶质母细胞瘤", "多发性硬化症", "正常脑部 MRI", "脑积水"],
    explanation: "包括胼胝体、脑干和小脑在内的正中矢状结构表现正常。未观察到占位效应或异常信号强度。",
    difficulty: "Easy",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5f/MRI_head_side.jpg"
  },
  {
    category: "组织病理学",
    description: "一名丙型肝炎肝硬化患者的肝活检，显示不规则的小梁结构。",
    correctAnswer: "肝细胞癌",
    options: ["肝脂肪变性", "肝细胞癌", "正常肝组织", "肝血管瘤"],
    explanation: "切片显示肝细胞小梁增厚（超过 3 个细胞厚）和细胞异型性，这是肝细胞癌 (HCC) 的特征。",
    difficulty: "Hard",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Hepatocellular_carcinoma_histopathology_%282%29.jpg/640px-Hepatocellular_carcinoma_histopathology_%282%29.jpg"
  },
  {
    category: "骨科 (X 光)",
    description: "60岁女性，摔倒时手掌着地。腕部疼痛且畸形。",
    correctAnswer: "Colles 骨折",
    options: ["舟骨骨折", "Colles 骨折", "Smith 骨折", "Galeazzi 骨折"],
    explanation: "桡骨远端横行骨折，远端碎片向背侧移位，这是典型的 Colles 骨折。",
    difficulty: "Medium",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Colles_fracture.jpg/600px-Colles_fracture.jpg"
  },
  {
    category: "眼科",
    description: "55岁糖尿病患者。眼底照相显示点状和斑块状出血。",
    correctAnswer: "糖尿病视网膜病变",
    options: ["青光眼", "糖尿病视网膜病变", "黄斑变性", "视网膜脱离"],
    explanation: "微动脉瘤、点状和斑块状出血以及硬性渗出的存在是非增殖性糖尿病视网膜病变的标志性体征。",
    difficulty: "Medium",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Diabetic_retinopathy.jpg/600px-Diabetic_retinopathy.jpg"
  },
  {
    category: "头部 CT",
    description: "70岁男性，突然出现左侧肢体无力。头部平扫 CT。",
    correctAnswer: "缺血性脑卒中 (MCA 区域)",
    options: ["蛛网膜下腔出血", "缺血性脑卒中 (MCA 区域)", "硬膜下血肿", "正常头部 CT"],
    explanation: "右侧大脑中动脉 (MCA) 区域出现低密度影，灰白质分界模糊，符合急性缺血性脑卒中。",
    difficulty: "Medium",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/MCA_Territory_Infarct.jpg/600px-MCA_Territory_Infarct.jpg"
  }
];

// Simulate API call to backend
export const fetchRandomCase = async (): Promise<QuestionCase> => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 600));

  const randomIndex = Math.floor(Math.random() * MOCK_DATABASE.length);
  const data = MOCK_DATABASE[randomIndex];

  return {
    id: crypto.randomUUID(),
    ...data
  };
};

// Mock Leaderboard Data
const NAMES = ["豪斯医生", "神经忍者", "扫描大师", "格蕾医生", "病理逻辑", "X射线视界", "42号医学生", "自愈者", "希波克拉底_AI", "骨骼巫师"];
const AVATARS = ["👨‍⚕️", "👩‍⚕️", "🧠", "💀", "🩺", "🔬", "💊", "🧬", "🏥", "🚑"];

export const fetchLeaderboard = async (type: 'rating' | 'streak'): Promise<LeaderboardEntry[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return Array.from({ length: 10 }).map((_, i) => {
        const score = type === 'rating' 
            ? 2800 - (i * Math.floor(Math.random() * 100 + 50)) 
            : 50 - (i * Math.floor(Math.random() * 3 + 1));
        
        return {
            id: `user-${i}`,
            rank: i + 1,
            name: NAMES[i % NAMES.length],
            avatar: AVATARS[i % AVATARS.length],
            score: score,
            trend: Math.random() > 0.7 ? 'up' : Math.random() > 0.7 ? 'down' : 'same'
        };
    });
};
