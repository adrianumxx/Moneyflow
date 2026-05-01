import { chatWithAIAssistant } from "./geminiService";
import { Asset, Liability, FinancialGoal, Transaction } from "../types";

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
    baseCurrency?: string;
    language?: string;
  }
): Promise<string> {
  const lastMessage = history[history.length - 1]?.content || "";
  
  // Construct the prompt manually since we are bypassing the local SDK
  const systemPrompt = `
    Strategic Advisor Context:
    - User: ${context.userDisplayName}
    - Assets: ${context.assets.length} items
    - Liabilities: ${context.liabilities.length} items
    - Objectives: ${context.goals.length} active goals
  `;

  return chatWithAIAssistant(`${systemPrompt}\n\nUser Question: ${lastMessage}`, {
    assets: context.assets,
    liabilities: context.liabilities,
    goals: context.goals,
    transactions: context.transactions,
    bankAccounts: [],
    userDisplayName: context.userDisplayName,
    baseCurrency: context.baseCurrency
  }, context.language || 'en');
}
