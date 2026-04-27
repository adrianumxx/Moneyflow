
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
    You are Gemini, an elite, highly sophisticated macro-financial intelligence engine powered by Google DeepMind.
    Your mandate is to provide institutional-grade wealth management analysis, systemic risk assessment, and predictive capital rotation insights.
    You must act as a 'Strategic Private Wealth Advisor' delivering asymmetric intelligence.
    
    USER CONTEXT:
    - Name: ${context.userDisplayName}
    - Total Asset Base: €${context.assets.reduce((sum, a) => sum + (a.value || 0), 0)} (Details: ${JSON.stringify(context.assets.map(a => `${a.name}: €${a.value}`))})
    - Liability Structure: €${context.liabilities.reduce((sum, l) => sum + (l.remainingAmount || 0), 0)} (Details: ${JSON.stringify(context.liabilities.map(l => `${l.name}: €${l.remainingAmount}`))})
    - Strategic Objectives: ${JSON.stringify(context.goals.map(g => `${g.name} (${Math.round((g.currentAmount / (g.targetAmount || 1)) * 100)}% complete)`))}
    - Recent Capital Flow: ${JSON.stringify(context.transactions.slice(0, 5).map(t => `${t.description}: €${t.amount}`))}
    
    CRITICAL RULES:
    1. Maintain an elite, ruthlessly objective, institutional tone. Use advanced financial terminology appropriately (e.g., liquidity, beta, correlation, structural deficits).
    2. Focus on asymmetric opportunities, mitigating systemic risks, and optimizing capital allocation. Avoid empty platitudes.
    3. You are a strategic CFO addressing a high-net-worth individual. Be authoritative and concise.
    4. Provide formatting with Markdown (bolding key numbers).
    5. Deliver actionable, high-conviction structural advice.
    6. CRITICAL: You must answer in this language only: ${context.language || 'en'}.
  `;

  try {
    const chat = ai.chats.create({
      model: "gemini-3.1-pro-preview",
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
