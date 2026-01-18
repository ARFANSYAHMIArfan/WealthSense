
import { GoogleGenAI } from "@google/genai";

export const getFinancialAdvice = async (transactions: any[], accounts: any[]) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const context = `
      User Transactions: ${JSON.stringify(transactions.slice(0, 20))}
      User Accounts: ${JSON.stringify(accounts)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are WealthSense AI, a witty and expert financial advisor. 
      Analyze the following data and provide 3 short, actionable bullet points to improve the user's financial health.
      Be encouraging but honest. Keep it under 100 words.
      Context: ${context}`,
    });

    return response.text;
  } catch (error) {
    console.error("AI Analysis failed", error);
    return "I couldn't analyze your data right now. Try adding more transactions!";
  }
};
