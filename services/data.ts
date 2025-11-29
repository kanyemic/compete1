
import { QuestionCase, LeaderboardEntry } from '../types';

// Simulated database of cases
const MOCK_DATABASE: Omit<QuestionCase, 'id'>[] = [
  {
    category: "Chest X-Ray",
    description: "35-year-old male presenting for pre-employment screening. No respiratory symptoms.",
    correctAnswer: "Normal Chest Radiograph",
    options: ["Pneumonia", "Normal Chest Radiograph", "Cardiomegaly", "Pleural Effusion"],
    explanation: "The lung fields are clear, the cardiac silhouette is of normal size (<50% cardiothoracic ratio), and the costophrenic angles are sharp. No acute pathology is visible.",
    difficulty: "Easy",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a1/Normal_posteroanterior_%28PA%29_chest_radiograph_%28X-ray%29.jpg"
  },
  {
    category: "MRI Brain",
    description: "28-year-old female with history of migraines. Sagittal T1-weighted sequence.",
    correctAnswer: "Normal Brain MRI",
    options: ["Glioblastoma", "Multiple Sclerosis", "Normal Brain MRI", "Hydrocephalus"],
    explanation: "The midline sagittal structures including the corpus callosum, brainstem, and cerebellum appear normal. No mass effect or abnormal signal intensity is observed.",
    difficulty: "Easy",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5f/MRI_head_side.jpg"
  },
  {
    category: "Histopathology",
    description: "Liver biopsy from a patient with Hepatitis C cirrhosis showing irregular trabeculae.",
    correctAnswer: "Hepatocellular Carcinoma",
    options: ["Hepatic Steatosis", "Hepatocellular Carcinoma", "Normal Liver Tissue", "Liver Hemangioma"],
    explanation: "The slide shows thickened liver cell trabeculae (more than 3 cells thick) and cytological atypia, characteristic of Hepatocellular Carcinoma (HCC).",
    difficulty: "Hard",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Hepatocellular_carcinoma_histopathology_%282%29.jpg/640px-Hepatocellular_carcinoma_histopathology_%282%29.jpg"
  },
  {
    category: "Orthopedics (X-Ray)",
    description: "60-year-old female fell on an outstretched hand. Pain and deformity at the wrist.",
    correctAnswer: "Colles' Fracture",
    options: ["Scaphoid Fracture", "Colles' Fracture", "Smith's Fracture", "Galeazzi Fracture"],
    explanation: "There is a transverse fracture of the distal radius with dorsal displacement of the distal fragment, classically known as a Colles' fracture.",
    difficulty: "Medium",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Colles_fracture.jpg/600px-Colles_fracture.jpg"
  },
  {
    category: "Ophthalmology",
    description: "55-year-old diabetic patient. Fundus photography shows dot-and-blot hemorrhages.",
    correctAnswer: "Diabetic Retinopathy",
    options: ["Glaucoma", "Diabetic Retinopathy", "Macular Degeneration", "Retinal Detachment"],
    explanation: "The presence of microaneurysms, dot-and-blot hemorrhages, and hard exudates are hallmark signs of non-proliferative diabetic retinopathy.",
    difficulty: "Medium",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Diabetic_retinopathy.jpg/600px-Diabetic_retinopathy.jpg"
  },
  {
    category: "CT Head",
    description: "70-year-old male with sudden onset left-sided weakness. CT Head without contrast.",
    correctAnswer: "Ischemic Stroke (MCA Territory)",
    options: ["Subarachnoid Hemorrhage", "Ischemic Stroke (MCA Territory)", "Subdural Hematoma", "Normal CT Head"],
    explanation: "There is hypoattenuation in the right Middle Cerebral Artery (MCA) territory with loss of grey-white matter differentiation, consistent with an acute ischemic stroke.",
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
const NAMES = ["Dr. House", "NeuroNinja", "ScanMaster", "GreyAnatomy", "PathoLogic", "XRayVision", "MedStudent_42", "CuraTeIpsum", "Hipocrates_AI", "BoneWizard"];
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
