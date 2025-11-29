import { BotBehavior, PlayerProfile } from "../types";

const BOT_NAMES = [
  "Dr. House", "NeuroNinja", "RadGod99", "ScanMaster", 
  "GreyAnatomy", "MedStudent_42", "PathoLogic", "XRayVision"
];

const BOT_AVATARS = ["👨‍⚕️", "👩‍⚕️", "🧠", "💀", "🩺", "🔬", "💊", "🧬"];

export const generateOpponent = (): PlayerProfile => {
  return {
    name: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)],
    avatar: BOT_AVATARS[Math.floor(Math.random() * BOT_AVATARS.length)],
    rating: Math.floor(Math.random() * (2400 - 1200) + 1200),
  };
};

export const getBotBehavior = (difficulty: 'Easy' | 'Medium' | 'Hard'): BotBehavior => {
  switch (difficulty) {
    case 'Easy':
      return { reactionTimeMin: 4000, reactionTimeMax: 8000, accuracy: 0.7 };
    case 'Medium':
      return { reactionTimeMin: 2500, reactionTimeMax: 6000, accuracy: 0.85 };
    case 'Hard':
      return { reactionTimeMin: 1500, reactionTimeMax: 4000, accuracy: 0.95 };
  }
};

export const calculateScore = (isCorrect: boolean, timeTaken: number, maxTime: number = 15): number => {
  if (!isCorrect) return 0;
  // Base 500 + Time Bonus (up to 500)
  const timeBonus = Math.max(0, 500 * (1 - timeTaken / maxTime));
  return Math.round(500 + timeBonus);
};
