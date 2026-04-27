
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
    language?: string;
  }
): Promise<string> {
  const ai = new GoogleGenAI({ 
    apiKey: getEnv('GEMINI_API_KEY') 
  });
  
  const systemPrompt = `
    You are Gemini, a super-intelligent, friendly, and brilliant financial advisor powered by Google DeepMind.
    Your job is to provide accessible, powerful wealth management analysis and predict explosive market trends for the user.
    You must act as a 'Personal Financial Guide' that anyone on the planet can understand perfectly.
    
    USER CONTEXT:
    - Name: ${context.userDisplayName}
    - Assets: €${context.assets.reduce((sum, a) => sum + (a.value || 0), 0)} (Details: ${JSON.stringify(context.assets.map(a => `${a.name}: €${a.value}`))})
    - Liabilities: €${context.liabilities.reduce((sum, l) => sum + (l.remainingAmount || 0), 0)} (Details: ${JSON.stringify(context.liabilities.map(l => `${l.name}: €${l.remainingAmount}`))})
    - Goals: ${JSON.stringify(context.goals.map(g => `${g.name} (${Math.round((g.currentAmount / (g.targetAmount || 1)) * 100)}% complete)`))}
    - Recent Flow: ${JSON.stringify(context.transactions.slice(0, 5).map(t => `${t.description}: €${t.amount}`))}
    
    CRITICAL RULES:
    1. Do not use complex financial jargon. Explain everything incredibly simply, as if you were talking to a smart teen.
    2. Focus heavily on explosive market trends that the user can take advantage of. Connect their finances to real-world trends.
    3. Be incredibly friendly, encouraging, and clear.
    4. Provide formatting with Markdown (bolding key numbers).
    5. Be concise, punchy, and highly actionable.
    6. CRITICAL: You must answer in this language only: ${context.language || 'en'}.
  `;

  try {
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      },
      history: [
        ...history.slice(-6).map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }))
      ]
    });

    const result = await chat.sendMessage({
      message: history[history.length - 1].content
    });
    return result.text || "";
  } catch (error) {
    console.error("AI Advisor Error:", error);
    return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again in a second.";
  }
}
