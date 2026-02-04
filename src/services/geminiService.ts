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

export const analyzeSymptoms = async (
  symptoms: string, 
  departments: string[],
  patientContext?: { age?: number; gender?: string; allergies?: string[] }
) => {
  const ai = getAiClient();
  if (!ai) return { departmentName: null, urgency: 'Unknown', reasoning: 'API Key missing or invalid.' };

  const deptList = departments.join(', ');
  
  let contextString = "";
  if (patientContext) {
      if (patientContext.age !== undefined) contextString += `Patient Age: ${patientContext.age} years old\n`;
      if (patientContext.gender) contextString += `Patient Gender: ${patientContext.gender}\n`;
      if (patientContext.allergies && patientContext.allergies.length > 0) {
          contextString += `Known Allergies: ${patientContext.allergies.join(', ')}\n`;
      }
  }

  const prompt = `
    You are a medical triage assistant.
    User Symptoms: "${symptoms}"
    Available Departments: ${deptList}
    ${contextString}

    Task:
    1. Identify the most suitable department from the list provided. Consider the patient's age (e.g. Pediatrics if applicable and available) and known allergies if relevant to the symptoms.
    2. Estimate urgency (Low, Medium, High). Consider potential severe allergic reactions (anaphylaxis) if symptoms match known allergies, or age-specific risks (e.g. high fever in infants).
    3. Provide a short reasoning explaining why this department and urgency were chosen, explicitly referencing the patient's age or allergies if they influenced the decision.

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