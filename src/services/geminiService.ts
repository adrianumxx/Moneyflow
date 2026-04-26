import { GoogleGenAI, Type } from "@google/genai";
import { Asset, Liability, FinancialGoal, AIInsight, Income, TransactionCategory } from "../types";
import { Timestamp } from "firebase/firestore";

  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY || "" 
  });

export async function generateFinancialInsights(
  assets: Asset[],
  liabilities: Liability[],
  goals: FinancialGoal[],
  incomes: Income[]
): Promise<AIInsight[]> {
  const prompt = `
    You are a professional Financial Strategist and Personal CFO. 
    Analyze the following financial data and provide 3-4 strategic, actionable insights.
    
    DATA:
    - Assets: ${JSON.stringify(assets.map(a => ({ name: a.name, type: a.type, value: a.value })))}
    - Liabilities: ${JSON.stringify(liabilities.map(l => ({ name: l.name, type: l.type, remaining: l.remainingAmount })))}
    - Goals: ${JSON.stringify(goals.map(g => ({ name: g.name, target: g.targetAmount, current: g.currentAmount })))}
    
    Focus on diversification, debt reduction, and real-time wealth optimization. 
    Provide advice that sounds like a premium Swiss banker: precise, high-level, and highly valuable.
    Each title should be catchy and professional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              type: { type: Type.STRING, description: "optimization, warning, or opportunity" },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              impact: { type: Type.STRING },
              suggestedAction: { type: Type.STRING }
            },
            required: ["id", "type", "title", "description", "impact", "suggestedAction"]
          }
        }
      }
    });

    const text = response.text || "[]";
    const insights = JSON.parse(text);
    
    return insights.map((insight: any) => ({
      ...insight,
      createdAt: Timestamp.now()
    }));
  } catch (error) {
    console.error("Error generating insights:", error);
    return [];
  }
}

export async function categorizeTransaction(description: string, amount: number): Promise<TransactionCategory> {
  const model = ai.models.get({ model: "gemini-3-flash-preview" });
  
  const prompt = `
    Categorize this bank transaction into one of these categories: 
    housing, food, transport, entertainment, health, shopping, income, other.
    
    Transaction: "${description}"
    Amount: ${amount}
    
    Respond ONLY with the category name in lowercase.
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    const category = (result.text || "other").trim().toLowerCase() as TransactionCategory;
    
    // Validate if it's a valid category
    const validCategories = ['housing', 'food', 'transport', 'entertainment', 'health', 'shopping', 'income', 'other'];
    return validCategories.includes(category) ? category : 'other';
  } catch (error) {
    console.error("Error categorizing transaction:", error);
    return "other";
  }
}
