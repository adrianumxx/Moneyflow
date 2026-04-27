
import { GoogleGenAI } from "@google/genai";
import { Asset, Liability, FinancialGoal, Transaction, Income } from "../types";
import { getEnv } from "../utils/env";

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export async function chatWithFinancialAdvisor(
  history: ChatMessage[],
  context: {
    assets: Asset[];
    liabilities: Liability[];
    goals: FinancialGoal[];
    transactions: Transaction[];
    userDisplayName: string;
  }
): Promise<string> {
  const ai = new GoogleGenAI({ 
    apiKey: getEnv('GEMINI_API_KEY') 
  });
  
  const model = ai.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
    }
  });

  const systemPrompt = `
    You are "Moneyflow Assistant", a friendly and professional financial advisor.
    
    USER CONTEXT:
    - Name: ${context.userDisplayName}
    - Assets: Total ${context.assets.reduce((sum, a) => sum + (a.value || 0), 0)} (Details: ${JSON.stringify(context.assets.map(a => `${a.name}: ${a.value}`))})
    - Liabilities: Total ${context.liabilities.reduce((sum, l) => sum + (l.remainingAmount || 0), 0)} (Details: ${JSON.stringify(context.liabilities.map(l => `${l.name}: ${l.remainingAmount}`))})
    - Goals: ${JSON.stringify(context.goals.map(g => `${g.name} (${Math.round((g.currentAmount / (g.targetAmount || 1)) * 100)}% complete)`))}
    - Recent Flow: ${JSON.stringify(context.transactions.slice(0, 5).map(t => `${t.description}: ${t.amount}`))}
    
    GOAL: Answer questions about wealth, savings, and financial growth. 
    Use the user context to provide specific advice. 
    Keep your tone helpful, encouraging, and easy to understand.
    
    RESPONSE FORMAT: Use clean Markdown. Keep it concise.
  `;

  try {
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt + "\nI'm ready to help." }] },
        { role: 'model', parts: [{ text: "Hello! I've loaded your financial overview. How can I help you today?" }] },
        ...history.slice(-6).map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }))
      ]
    });

    const result = await chat.sendMessage(history[history.length - 1].content);
    return result.response.text();
  } catch (error) {
    console.error("AI Advisor Error:", error);
    return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again in a second.";
  }
}
