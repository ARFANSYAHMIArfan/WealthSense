
import { GoogleGenAI } from "@google/genai";
import { Transaction, Account } from "../types";

export const generateFinancialStatement = async (
  transactions: Transaction[],
  accounts: Account[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const transactionsContext = transactions.map(t => ({
    date: t.date,
    amount: t.amount,
    type: t.type,
    category: t.category,
    desc: t.description,
    account: accounts.find(a => a.id === t.accountId)?.name
  }));

  const prompt = `
    Act as a professional financial advisor. Analyze the following transaction history and provide a concise, high-level summary.
    Identify spending patterns, highlight any unusual activity, and give 3 actionable budgeting tips based on the data.
    
    Transactions:
    ${JSON.stringify(transactionsContext, null, 2)}
    
    Current Net Worth: $${accounts.reduce((acc, a) => acc + a.balance, 0).toFixed(2)}
    
    Keep the response professional, encouraging, and easy to read. Use Markdown for formatting.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Unable to generate insights at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "An error occurred while analyzing your financial data. Please try again later.";
  }
};
