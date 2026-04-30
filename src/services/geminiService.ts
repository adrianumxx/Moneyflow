import { Asset, Liability, FinancialGoal, AIInsight, Income, TransactionCategory } from "../types";
import { Timestamp, collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { authenticatedFetch } from "../utils/api";

export async function chatWithAIAssistant(
  query: string,
  context: {
    assets: any[];
    liabilities: any[];
    goals: any[];
    transactions: any[];
    bankAccounts: any[];
    userDisplayName?: string;
    baseCurrency?: string;
  },
  language: string = 'en'
): Promise<string> {
  try {
    const response = await authenticatedFetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, context, language })
    });
    if (!response.ok) throw new Error('Failed to chat with AI');
    const { response: aiResponse } = await response.json();
    return aiResponse;
  } catch (error) {
    console.error("Chat Error:", error);
    return "I apologize, I'm having trouble connecting to the assistant right now. Please try again soon.";
  }
}

export async function logPalantirMemory(userId: string, narrative: string) {
  if (!userId || userId.startsWith('demo-')) return;
  try {
    await addDoc(collection(db, 'users', userId, 'palantir_memory'), {
      narrative,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Failed to log Palantir memory", error);
  }
}

export async function getRecentPalantirMemory(userId: string): Promise<string[]> {
  if (!userId || userId.startsWith('demo-')) return [];
  try {
    const q = query(
      collection(db, 'users', userId, 'palantir_memory'),
      orderBy('timestamp', 'desc'),
      limit(3)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data().narrative);
  } catch (error) {
    console.error("Failed to fetch Palantir memory", error);
    return [];
  }
}

export async function generateFinancialInsights(
  assets: Asset[],
  liabilities: Liability[],
  goals: FinancialGoal[],
  incomes: Income[]
): Promise<AIInsight[]> {
  try {
    const response = await authenticatedFetch('/api/gemini/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assets, liabilities, goals, incomes })
    });
    if (!response.ok) throw new Error('Failed to fetch insights');
    const insights = await response.json();
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
  try {
    const response = await authenticatedFetch('/api/gemini/categorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, amount })
    });
    if (!response.ok) throw new Error('Failed to categorize');
    const { category } = await response.json();
    return category as TransactionCategory;
  } catch (error) {
    console.error("Error categorizing transaction:", error);
    return "other";
  }
}

export interface CFOReportSection {
  title: string;
  content: string;
}

export interface CFOReportData {
  executiveSummary: string;
  quickScanAnalysis: CFOReportSection[];
  strategicRecommendations: CFOReportSection[];
  riskAssessment: string;
}

export async function generateCFOReportData(
  assets: any[],
  liabilities: any[],
  insights: any[],
  language: string = 'en'
): Promise<CFOReportData> {
  try {
    const response = await authenticatedFetch('/api/gemini/cfo-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assets, liabilities, insights, language })
    });
    if (!response.ok) throw new Error('Failed to generate CFO report');
    return await response.json();
  } catch (err) {
    console.error("Failed to generate CFO Report:", err);
    throw err;
  }
}

export interface PalantirOrb {
  confidenceScore: number;
  statusLine: string;
  state: 'stable' | 'caution' | 'critical';
  activeRisksCount: number;
}

export interface PalantirSemaphoreSignal {
  category: 'savings' | 'business_costs' | 'investment_climate' | 'borrowing';
  state: 'GREEN' | 'YELLOW' | 'RED';
  explanation: string;
}

export interface PalantirMetric {
  id: 'cost_of_money' | 'purchasing_power' | 'market_mood' | 'energy_cost' | 'safe_harbor' | 'global_stability';
  value: string | number;
  explanation: string;
  alertState: 'GREEN' | 'YELLOW' | 'RED';
  trend?: 'up' | 'down' | 'stable';
}

export interface PalantirProbabilityVector {
  title: string;
  probability: number;
  severity: 'EXTREME' | 'HIGH' | 'MEDIUM' | 'LOW';
  meaning: string;
  affects: string;
  cluster: string;
}

export interface PalantirSignalAlpha {
  title: string;
  explanation: string;
  urgency: 'IMMEDIATE' | 'THIS WEEK' | 'THIS MONTH';
  type: 'OPPORTUNITY' | 'STRUCTURAL' | 'WARNING';
  cluster: string;
}

export interface PalantirActiveRisk {
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  explanation: string;
  escalationProbability: number;
  cluster: string;
}

export interface PalantirNewsItem {
  id: string;
  category: 'MACRO' | 'ENERGY' | 'CRYPTO' | 'GEOPOLITICS' | 'TECH' | 'MARKETS';
  source: string;
  headline: string;
  impactScore: number;
  meaning: string;
  escalationProbability: number;
  affects: string;
  trend: 'up' | 'down' | 'neutral';
  aiSummary: string;
  url: string;
}

export interface PalantirIntelligenceArticle {
  title: string;
  source?: string;
  url?: string;
  publishedAt?: string;
  category?: 'macro' | 'geopolitics' | 'markets' | 'energy' | 'currency' | 'crypto' | 'local';
  summary?: string;
  relevanceToUser?: string;
  impactScore?: number;
  actionSignal?: 'observe' | 'prepare' | 'act';
  affectedAreas?: string[];
  confidenceScore?: number;
}

export interface PalantirEducationalInsight {
  concept: string;
  explanation: string;
  relevanceToday: string;
}

export interface PalantirYieldOptimizer {
  detectedInefficiency: string;
  actionableStrategy: string;
  estimatedAnnualAlpha: number;
  confidenceScore: number;
}

export interface PalantirTaxShield {
  riskLevel: 'SAFE' | 'WARNING' | 'CRITICAL';
  description: string;
  taxOptimizationAction: string;
}

export interface PalantirNegotiator {
  targetExpense: string;
  currentMarketRate: string;
  potentialSavings: number;
}

export interface PalantirBlackSwan {
  runwayMonths: number;
  survivalAssessment: string;
}

export interface PalantirArbitrageFinder {
  inefficientDebt: string;
  idleAsset: string;
  arbitrageSpread: number;
  action: string;
}

export interface GeoRing {
  title?: string;
  summary?: string;
  riskScore?: number;
  opportunityScore?: number;
  impactScore?: number;
  confidenceScore?: number;
  actionSignal?: 'observe' | 'prepare' | 'act';
  affectedAreas?: string[];
  missingData?: string[];
}

export interface PalantirGeopoliticalRings {
  state?: GeoRing;
  neighborhood?: GeoRing;
  continent?: GeoRing;
  superpowers?: GeoRing;
  world?: GeoRing;
}

export interface PalantirIntelligence {
  orb: PalantirOrb;
  narrative: string;
  semaphore: PalantirSemaphoreSignal[];
  metrics: PalantirMetric[];
  probabilityVectors: PalantirProbabilityVector[];
  signalsAndAlpha: PalantirSignalAlpha[];
  activeRisks: PalantirActiveRisk[];
  newsFeed: PalantirNewsItem[];
  educationalInsight: PalantirEducationalInsight;
  yieldOptimizer?: PalantirYieldOptimizer;
  taxShield?: PalantirTaxShield;
  negotiator?: PalantirNegotiator;
  blackSwan?: PalantirBlackSwan;
  arbitrageFinder?: PalantirArbitrageFinder;
  intelligenceFeed?: PalantirIntelligenceArticle[];
  // Scenario Engine
  scenarios?: Array<{
    title: string;
    probability?: number;
    confidenceScore?: number;
    impactScore?: number;
    timeHorizon?: '0-30d' | '1-6m' | '6m+';
    actionSignal?: 'observe' | 'prepare' | 'act';
    affectedAreas?: string[];
    rationale?: string;
  }>;
  geopoliticalRings?: PalantirGeopoliticalRings;
  // Metadata & Data Quality
  confidenceScore?: number;
  dataQuality?: 'connected_data' | 'user_data' | 'estimated_data' | 'sandbox_data' | 'fallback_data' | 'insufficient_data';
  sourceStatus?: 'live_search' | 'user_data' | 'connected_data' | 'cached' | 'fallback' | 'model_inference';
  missingData?: string[];
  actionQueue?: Array<{
    title: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    actionSignal?: 'observe' | 'prepare' | 'act';
    reason?: string;
    affectedAreas?: string[];
    timeHorizon?: '0-30d' | '1-6m' | '6m+';
    confidenceScore?: number;
    missingData?: string[];
  }>;
}

export const FALLBACK_PALANTIR_DATA: PalantirIntelligence = {
  orb: {
    confidenceScore: 68,
    statusLine: "Volatility rising. Focus on stable yields.",
    state: "caution",
    activeRisksCount: 3
  },
  narrative: "Global markets are experiencing a temporary contraction due to hawkish central bank rhetoric. While equity volatility is elevated, safe-harbor assets remain attractive. This is not a panic scenario, but a time for strategic patience. Ensure your savings are generating real yield and avoid unnecessary debt expansion in the short term.",
  semaphore: [
    { category: 'savings', state: 'GREEN', explanation: 'High rates make cash holding profitable.' },
    { category: 'business_costs', state: 'YELLOW', explanation: 'Supply chains are stable, but credit is tight.' },
    { category: 'investment_climate', state: 'YELLOW', explanation: 'Selective opportunities exist, broad indices are risky.' },
    { category: 'borrowing', state: 'RED', explanation: 'Mortgage and loan rates remain restrictively high.' }
  ],
  metrics: [
    { id: 'cost_of_money', value: '5.25%', explanation: 'Borrowing costs are currently elevated due to central bank positioning.', alertState: 'RED' },
    { id: 'purchasing_power', value: '3.1%', explanation: 'What cost 100 units in January now costs 103.10 due to inflation.', alertState: 'YELLOW' },
    { id: 'market_mood', value: 42, explanation: 'Fear is present. Historically from here, markets can be volatile.', alertState: 'YELLOW', trend: 'down' },
    { id: 'energy_cost', value: '84.50', explanation: 'Fuel and logistics trending UP this week.', alertState: 'YELLOW', trend: 'up' },
    { id: 'safe_harbor', value: '4.8%', explanation: 'Doing nothing earns you yield — beating inflation comfortably.', alertState: 'GREEN' },
    { id: 'global_stability', value: 65, explanation: 'The world is tense but contained right now.', alertState: 'YELLOW' }
  ],
  probabilityVectors: [
    { title: 'Energy Supply Shock', probability: 45, severity: 'HIGH', meaning: 'Gas prices could surge significantly next month.', affects: 'Everyone', cluster: 'Energy / Minerals' }
  ],
  signalsAndAlpha: [
    { title: 'AI INFRASTRUCTURE MONOPOLIES', explanation: 'Capital is flowing to companies building the physical data centers for AI.', urgency: 'THIS MONTH', type: 'STRUCTURAL', cluster: 'AI Infrastructure' }
  ],
  activeRisks: [
    { title: 'Commercial Real Estate Debt', severity: 'HIGH', explanation: 'Regional banks hold significant debt. Could trigger a localized credit freeze.', escalationProbability: 60, cluster: 'Macro Finance' }
  ],
  educationalInsight: {
    concept: 'Yield Curve Inversion',
    explanation: 'When short-term bonds pay more than long-term bonds. It usually means investors expect the economy to slow down soon. It is considered one of the most reliable recession indicators.',
    relevanceToday: 'The curve has been inverted for some time, signaling structural stress.'
  },
  yieldOptimizer: {
    detectedInefficiency: "Optimization Potential: Uninvested cash losing purchasing power to inflation.",
    actionableStrategy: "Consider rotating a portion of idle cash to an MMF (Money Market Fund).",
    estimatedAnnualAlpha: 570,
    confidenceScore: 88
  },
  taxShield: {
    riskLevel: 'WARNING',
    description: 'Fiscal Awareness: You are approaching a higher tax bracket.',
    taxOptimizationAction: 'Consider contributions to a pension fund to potentially lower taxable income.'
  },
  negotiator: {
    targetExpense: 'Utility Bills',
    currentMarketRate: 'Declining vs last year',
    potentialSavings: 312
  },
  blackSwan: {
    runwayMonths: 4.2,
    survivalAssessment: 'You have approximately 4.2 months of liquid runway. Consider reaching 6 months for optimal security.'
  },
  arbitrageFinder: {
    inefficientDebt: 'High-interest debt',
    idleAsset: 'Low-yield savings',
    arbitrageSpread: 4.5,
    action: 'Consider a potential efficiency gap strategy by paying down debt with idle savings.'
  },
  newsFeed: [
    { id: '1', category: 'MACRO', source: 'Financial Times', headline: 'Central Banks Hold Rates Steady', impactScore: 8, meaning: 'Borrowing costs are expected to remain stable for now.', escalationProbability: 20, affects: 'Borrowers', trend: 'neutral', aiSummary: 'Banks are waiting for more data before cutting rates.', url: '#' }
  ],
  scenarios: [],
  geopoliticalRings: {
    world: { title: 'Global', summary: 'Macroeconomic stabilization in progress.', riskScore: 40, opportunityScore: 50, impactScore: 45, confidenceScore: 70, actionSignal: 'observe' }
  },
  actionQueue: [],
  intelligenceFeed: [],
  dataQuality: 'fallback_data',
  sourceStatus: 'fallback'
};

/**
 * Deep merges API response with fallback structure to ensure partial responses don't crash the UI.
 */
function safeMergePalantirIntelligence(partial: any): PalantirIntelligence {
  const base = { ...FALLBACK_PALANTIR_DATA };
  
  if (!partial || typeof partial !== 'object') return base;

  return {
    ...base,
    ...partial,
    orb: partial.orb ? { ...base.orb, ...partial.orb } : base.orb,
    semaphore: Array.isArray(partial.semaphore) ? partial.semaphore : base.semaphore,
    metrics: Array.isArray(partial.metrics) ? partial.metrics : base.metrics,
    probabilityVectors: Array.isArray(partial.probabilityVectors) ? partial.probabilityVectors : base.probabilityVectors,
    signalsAndAlpha: Array.isArray(partial.signalsAndAlpha) ? partial.signalsAndAlpha : base.signalsAndAlpha,
    activeRisks: Array.isArray(partial.activeRisks) ? partial.activeRisks : base.activeRisks,
    newsFeed: Array.isArray(partial.newsFeed) ? partial.newsFeed : base.newsFeed,
    scenarios: Array.isArray(partial.scenarios) ? partial.scenarios : base.scenarios,
    actionQueue: Array.isArray(partial.actionQueue) ? partial.actionQueue : base.actionQueue,
    intelligenceFeed: Array.isArray(partial.intelligenceFeed) ? partial.intelligenceFeed : base.intelligenceFeed,
    geopoliticalRings: partial.geopoliticalRings ? { ...base.geopoliticalRings, ...partial.geopoliticalRings } : base.geopoliticalRings,
    missingData: Array.isArray(partial.missingData) ? partial.missingData : (base.missingData || []),
    // Preserve live metadata if present, else use fallback markers
    dataQuality: partial.dataQuality || 'fallback_data',
    sourceStatus: partial.sourceStatus || 'fallback'
  };
}

export async function getPalantirIntelligence(
  userId: string,
  localTime?: string, 
  timezone?: string, 
  language: string = 'en',
  userContext?: { 
    assets: any[], 
    liabilities: any[], 
    goals: any[],
    transactions?: any[],
    bankAccounts?: any[],
    connectedInstitutions?: any[],
    connectedAccounts?: any[],
    cryptoWallets?: any[],
    investmentAccounts?: any[],
    income?: any[]
  },
  userProfile?: any
): Promise<PalantirIntelligence> {
  const contextLengths = userContext ? 
    `${userContext.assets.length}_${userContext.liabilities.length}_${userContext.bankAccounts?.length || 0}_${userContext.transactions?.length || 0}` : 
    '0_0_0_0';
  const cacheKey = `palantir_intel_v1_${new Date().toISOString().split('T')[0]}_${language}_${contextLengths}`;
  
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 45 * 60 * 1000) return data;
    }
  } catch (e) { localStorage.removeItem(cacheKey); }

  try {
    const pastMemory = await getRecentPalantirMemory(userId);

    const response = await authenticatedFetch('/api/gemini/global-pulse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ localTime, timezone, language, userContext, pastMemory, userProfile })
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error body');
      console.error(`[geminiService] API Error ${response.status}: ${errorText}`);
      throw new Error(`Failed to fetch global intelligence: ${response.status}`);
    }
    
    const parsed = await response.json();
    
    if (parsed && parsed.orb) {
      const merged = safeMergePalantirIntelligence(parsed);
      localStorage.setItem(cacheKey, JSON.stringify({ data: merged, timestamp: Date.now() }));
      logPalantirMemory(userId, merged.narrative).catch(console.error);
      return merged;
    }
    
    throw new Error("EMPTY");
  } catch (error) {
    console.warn("Intelligence engine is using strategic buffer fallback.");
    return FALLBACK_PALANTIR_DATA;
  }
}
