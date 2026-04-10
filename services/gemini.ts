import { GoogleGenAI, Type, Schema, GenerateContentResponse } from "@google/genai";
import { QuestionCase } from '../types';

// We use process.env.API_KEY as per instructions, but for image generation 
// we will rely on the app to re-instantiate with the user-selected key if needed.

const CASE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    category: { type: Type.STRING, description: "医学成像方式（例如：MRI T2、胸部 X 光、H&E 染色）。" },
    description: { type: Type.STRING, description: "简短的临床表现（例如：'50岁男性，慢性咳嗽'）。" },
    correctAnswer: { type: Type.STRING, description: "具体的诊断结果。" },
    options: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "包含 4 个不同可能诊断的数组。其中一个必须是正确答案。",
    },
    explanation: { type: Type.STRING, description: "支持该诊断的发现的纯教育性解释。" },
    difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
    imagePrompt: { type: Type.STRING, description: "要生成的医学图像的高度详细视觉描述，重点关注视觉特征、对比度和特定病变外观。" },
  },
  required: ["category", "description", "correctAnswer", "options", "explanation", "difficulty", "imagePrompt"],
};

export const generateMedicalCase = async (apiKey: string): Promise<QuestionCase> => {
  const ai = new GoogleGenAI({ apiKey });
  
  // Randomize the domain slightly to ensure variety
  const domains = ["放射学 (X光, CT, MRI)", "病理学 (组织学)", "皮肤病学", "眼科 (眼底)"];
  const selectedDomain = domains[Math.floor(Math.random() * domains.length)];

  const prompt = `在以下领域生成一个具有挑战性的医学影像诊断病例：${selectedDomain}。
  确保 'imagePrompt' 非常详细，以便 AI 可以根据它生成看起来真实的医学扫描图或切片图。
  'options' 必须包含 'correctAnswer' 和 3 个合理的干扰项。
  不要在 'description' 中提到诊断名称。
  所有文本内容必须使用中文。`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: CASE_SCHEMA,
        systemInstruction: "你是一位正在设计测验的高级医学教育专家。",
      },
    });

    const data = JSON.parse(response.text || "{}");
    return {
      id: crypto.randomUUID(),
      ...data,
    };
  } catch (error) {
    console.error("Failed to generate case:", error);
    throw new Error("Failed to generate medical case data.");
  }
};

export const generateMedicalImage = async (apiKey: string, prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });

  // Use the Pro Image model for high fidelity
  const modelName = 'gemini-3-pro-image-preview';

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { text: "A realistic, high-resolution medical image: " + prompt },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K", // High quality for medical detail
        },
      },
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data; // Base64 string
      }
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Image generation failed:", error);
    throw new Error("Failed to generate medical image.");
  }
};