import { GoogleGenAI, Type, Schema, GenerateContentResponse } from "@google/genai";
import { QuestionCase } from '../types';

// We use process.env.API_KEY as per instructions, but for image generation 
// we will rely on the app to re-instantiate with the user-selected key if needed.

const CASE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    category: { type: Type.STRING, description: "The medical imaging modality (e.g., MRI T2, Chest X-Ray, H&E Stain)." },
    description: { type: Type.STRING, description: "A brief clinical presentation (e.g., '50yo male with chronic cough')." },
    correctAnswer: { type: Type.STRING, description: "The specific diagnosis." },
    options: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "An array of 4 distinct possible diagnoses. One must be the correct answer.",
    },
    explanation: { type: Type.STRING, description: "A purely educational explanation of the findings supporting the diagnosis." },
    difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
    imagePrompt: { type: Type.STRING, description: "A highly detailed visual description of the medical image to be generated, focusing on visual features, contrast, and specific pathology appearance." },
  },
  required: ["category", "description", "correctAnswer", "options", "explanation", "difficulty", "imagePrompt"],
};

export const generateMedicalCase = async (apiKey: string): Promise<QuestionCase> => {
  const ai = new GoogleGenAI({ apiKey });
  
  // Randomize the domain slightly to ensure variety
  const domains = ["Radiology (X-Ray, CT, MRI)", "Pathology (Histology)", "Dermatology", "Ophthalmology (Fundus)"];
  const selectedDomain = domains[Math.floor(Math.random() * domains.length)];

  const prompt = `Generate a challenging medical imaging diagnosis case for a game in the domain of: ${selectedDomain}.
  Ensure the 'imagePrompt' is extremely descriptive so an AI can generate a realistic-looking medical scan or slide from it. 
  The 'options' must include the 'correctAnswer' and 3 plausible distractors.
  Do not mention the diagnosis name in the 'description'.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: CASE_SCHEMA,
        systemInstruction: "You are a senior medical educator designing a quiz.",
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