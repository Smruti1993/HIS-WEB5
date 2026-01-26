import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  // Use process.env.API_KEY as required by the library guidelines.
  // We assume this variable is injected and available in the environment.
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("Gemini API Key is missing. AI features will not work.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeSymptoms = async (symptoms: string, departments: string[]) => {
  const ai = getAiClient();
  if (!ai) return { departmentName: null, urgency: 'Unknown', reasoning: 'API Key missing or invalid.' };

  const deptList = departments.join(', ');

  const prompt = `
    You are a medical triage assistant.
    User Symptoms: "${symptoms}"
    Available Departments: ${deptList}

    Task:
    1. Identify the most suitable department from the list provided.
    2. Estimate urgency (Low, Medium, High).
    3. Provide a short reasoning.

    Output JSON format only:
    {
      "departmentName": "Exact Name from List",
      "urgency": "Low/Medium/High",
      "reasoning": "Brief explanation"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Triage Error:", error);
    return null;
  }
};