import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import admin from 'firebase-admin';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { getRelevantNewsSignals } from '../newsSources.js';
import { sanitizeUserContextForAI } from '../aiPrivacy.js';

const router = express.Router();

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  
  if (!apiKey) {
    console.warn("⚠️ GEMINI_API_KEY IS MISSING! Returning Mock AI.");
    return {
      models: {
        generateContent: async ({ contents, config }: any) => {
          if (config?.responseSchema) {
            return {
              text: JSON.stringify([
                {
                  id: "mock-1",
                  title: "⚠️ Neural Core Offline",
                  description: "Per abilitare le analisi reali, crea un file .env e inserisci GEMINI_API_KEY.",
                  type: "warning"
                }
              ])
            };
          }
          if (typeof contents === 'string' && contents.includes('Categorize')) {
             return { text: "other" };
          }
          return {
            text: `⚠️ **MODALITÀ DEMO - SISTEMA OFFLINE**\n\nNon posso elaborare la tua richiesta perché manca la mia connessione cerebrale (**Chiave API di Gemini**).\n\nPer risvegliare il Neural Core e attivare il *Master Prompt*:\n\n1. Crea un file \`.env\` nella cartella del progetto.\n2. Aggiungi la riga: \`GEMINI_API_KEY=la_tua_chiave\`\n3. Riavvia il server.\n\nAppena lo farai, sarò pronto ad analizzare i tuoi dati.`
          };
        }
      }
    } as unknown as GoogleGenAI;
  }

  return new GoogleGenAI({ apiKey });
}

router.post('/chat', async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { query, context, language } = req.body;
    const sanitizedContext = sanitizeUserContextForAI(context);
    const ai = getGenAI();

    // Live Aggregates for A.I. Reasoning
    const netWorth = (sanitizedContext.assets?.reduce((s: any, a: any) => s + (a.value || 0), 0) || 0) + 
                     (sanitizedContext.bankAccounts?.reduce((s: any, b: any) => s + (b.balance || 0), 0) || 0) +
                     (sanitizedContext.cryptoWallets?.reduce((s: any, w: any) => s + (w.nativeBalance || 0), 0) || 0) -
                     (sanitizedContext.liabilities?.reduce((s: any, l: any) => s + (l.remainingAmount || 0), 0) || 0);

    const systemPrompt = `
# NEURAL CORE — MASTER SYSTEM PROMPT
 
**Identity:** World-Class Board of Experts (CFO, Legal, Macro Analyst). speak with ONE human voice.
 
**THE USER'S LIVE DATA (THE WEALTH HUB):**
- **Net Worth (Live):** ${netWorth}
- **Assets:** ${JSON.stringify(sanitizedContext.assets?.map((a: any) => ({ name: a.name, value: a.value })))}
- **Banks:** ${JSON.stringify(sanitizedContext.bankAccounts?.map((b: any) => ({ institution: b.institutionName, balance: b.balance })))}
- **Crypto:** ${JSON.stringify(sanitizedContext.cryptoWallets?.map((w: any) => ({ chain: w.chain, balance: w.nativeBalance, sym: w.currency })))}
- **Debts:** ${JSON.stringify(sanitizedContext.liabilities?.map((l: any) => ({ name: l.name, rem: l.remainingAmount })))}
- **Recent Txs:** ${JSON.stringify(sanitizedContext.transactions?.slice(0, 10).map((t: any) => ({ d: t.description, a: t.amount, c: t.category })))}
 
**CRITICAL DIRECTIVES:**
1. **Context First:** Always reference the user's data. "Vedo che il tuo Net Worth è di ${netWorth}€..."
2. **Predictive Action:** Don't just answer; suggest the next growth move.
3. **Tone:** Precise Swiss Banker. No fluff.
4. **Language:** Respond in ${language === 'it' ? 'Italian' : 'English'}.
    `;

    const finalPrompt = `${systemPrompt}\n\nDOMANDA UTENTE: ${query}`;

    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: finalPrompt,
    });

    const aiResponse = result?.text || "Mi scuso, il Neural Core è temporaneamente sovraccarico. Riprova tra poco.";
    res.json({ response: aiResponse });
  } catch (error: any) {
    safeLogGeminiEvent('chat', { userId, success: false, latencyMs: 0, errorType: error.name });
    res.status(500).json({ error: 'Neural Core encountered an issue.' });
  }
});

/**
 * Structured logging for AI events.
 * Excludes prompt content and financial data.
 */
function safeLogGeminiEvent(action: string, context: { 
  userId?: string; 
  success: boolean; 
  latencyMs: number; 
  errorType?: string; 
  fallbackUsed?: boolean 
}) {
  console.log(`[GeminiEvent] ${action}`, {
    timestamp: new Date().toISOString(),
    ...context
  });
}

router.post('/insights', async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const start = Date.now();
  try {
    const { assets, liabilities, goals } = req.body;
    const sanitized = sanitizeUserContextForAI({ assets, liabilities, goals });
    const ai = getGenAI();
    
    const prompt = `
      You are the Neural Core, a Board of Financial Experts (CFO, Legal, Macro Analyst). 
      Analyze this user's normalized financial physics and provide 3-4 strategic, high-impact insights.
      
      USER DATA:
      - Assets: ${JSON.stringify(sanitized.assets)}
      - Liabilities: ${JSON.stringify(sanitized.liabilities)}
      - Goals: ${JSON.stringify(sanitized.goals)}
      
      CRITICAL FOCUS:
      - Capital Efficiency: Identify idle cash losing value.
      - Risk Concentration: Spot over-exposure to single asset classes.
      - Debt Arbitrage: Compare interest rates vs market yields.
      
      TONE: Premium Swiss Banker. Precise, actionable, zero fluff.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING, description: "Catchy, professional title" },
              description: { type: Type.STRING, description: "One-sentence high-impact advice" },
              type: { type: Type.STRING, enum: ["warning", "optimization", "opportunity"] },
              impact: { type: Type.STRING, enum: ["high", "medium", "low"] }
            },
            required: ["id", "title", "description", "type", "impact"],
          }
        }
      }
    });

    const insights = JSON.parse(response.text || "[]");
    safeLogGeminiEvent('insights', { userId, success: true, latencyMs: Date.now() - start });
    res.json(insights);
  } catch (error: any) {
    safeLogGeminiEvent('insights', { userId, success: false, latencyMs: Date.now() - start, errorType: error.name });
    res.status(500).json({ error: 'Neural Core failed to generate insights.' });
  }
});

router.post('/tactical-brief', async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const start = Date.now();
  try {
    const { assets, liabilities, goals, bankAccounts, cryptoWallets } = req.body;
    const sanitized = sanitizeUserContextForAI({ assets, liabilities, goals, bankAccounts, cryptoWallets });
    const ai = getGenAI();

    const prompt = `
      You are MISSION CONTROL, a high-level Wealth Intelligence Oracle. 
      Analyze the user's Unified Financial Physics and the current Global Macro Climate.
      
      DATA: ${JSON.stringify(sanitized)}
      
      GENERATE A TACTICAL BRIEFING WITH:
      1. Risk Score (0-100): Weighted calculation of volatility, concentration, and liquidity.
      2. Market Sentiment: Bullish/Neutral/Bearish based on current global tech/finance trends.
      3. Goal Probabilities: Percentage chance (0-100) of hitting each listed goal by its deadline.
      4. Macro Signals: 3 key global events (e.g. Fed rates, BTC halving, inflation) and their direct impact.
      5. Verdict: A sharp, italicized 1-sentence "Oracle Statement".
      6. Recommended Action: The single highest-leverage move for the next 7 days.
      
      TONE: Military-precise, high-fidelity, hyper-informed.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: { type: Type.NUMBER },
            marketSentiment: { type: Type.STRING, enum: ["bullish", "neutral", "bearish"] },
            goalProbabilities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  probability: { type: Type.NUMBER },
                  insight: { type: Type.STRING }
                },
                required: ["name", "probability", "insight"]
              }
            },
            macroSignals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  impact: { type: Type.STRING, enum: ["positive", "negative", "neutral"] },
                  value: { type: Type.STRING }
                },
                required: ["label", "impact", "value"]
              }
            },
            verdict: { type: Type.STRING },
            recommendedAction: { type: Type.STRING }
          },
          required: ["riskScore", "marketSentiment", "goalProbabilities", "macroSignals", "verdict", "recommendedAction"]
        }
      }
    });

    safeLogGeminiEvent('tactical-brief', { userId, success: true, latencyMs: Date.now() - start });
    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    safeLogGeminiEvent('tactical-brief', { userId, success: false, latencyMs: Date.now() - start, errorType: error.name });
    res.status(500).json({ error: 'Oracle failed to generate tactical briefing.' });
  }
});

router.post('/categorize', async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const start = Date.now();
  try {
    const { description, amount } = req.body;
    const sanitizedDescription = description.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
                                            .replace(/\b\d{10,}\b/g, '[NUMBER]');
    const ai = getGenAI();
    const prompt = `
      Categorize this transaction: "${sanitizedDescription}" (Amount: ${amount}). 
      Respond with one of the allowed categories.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, enum: ['housing', 'food', 'transport', 'entertainment', 'health', 'shopping', 'income', 'other'] }
          },
          required: ["category"]
        }
      }
    });
    
    const result = JSON.parse(response.text || '{"category":"other"}');
    safeLogGeminiEvent('categorize', { userId, success: true, latencyMs: Date.now() - start });
    res.json(result);
  } catch (error: any) {
    safeLogGeminiEvent('categorize', { userId, success: false, latencyMs: Date.now() - start, errorType: error.name });
    res.status(500).json({ error: 'Categorization failed.' });
  }
});

router.post('/cfo-report', async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const start = Date.now();
  try {
    const { assets, liabilities, insights, language } = req.body;
    const sanitized = sanitizeUserContextForAI({ assets, liabilities });
    const ai = getGenAI();
    
    const languagePrompt = language === 'it' 
      ? "Rispondi in italiano come un analista senior di Deloitte."
      : "Reply in formal English as a senior Deloitte analyst.";

    const prompt = `
      You are a World-Class CFO. Generate a comprehensive financial report for this portfolio.
      ${languagePrompt}
      
      DATA:
      - Assets: ${JSON.stringify(sanitized.assets)}
      - Liabilities: ${JSON.stringify(sanitized.liabilities)}
      - Previous Insights: ${JSON.stringify(insights)}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: { type: Type.STRING },
            quickScanAnalysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING }
                },
                required: ["title", "content"]
              }
            },
            strategicRecommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING }
                },
                required: ["title", "content"]
              }
            },
            riskAssessment: { type: Type.STRING }
          },
          required: ["executiveSummary", "quickScanAnalysis", "strategicRecommendations", "riskAssessment"]
        }
      }
    });

    safeLogGeminiEvent('cfo-report', { userId, success: true, latencyMs: Date.now() - start });
    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    safeLogGeminiEvent('cfo-report', { userId, success: false, latencyMs: Date.now() - start, errorType: error.name });
    res.status(500).json({ error: 'CFO Report generation failed.' });
  }
});

/**
 * Classifies a single transaction for cash flow analysis.
 * Priority: explicit type field → category → amount sign (fallback).
 * Refunds and transfers are EXCLUDED from stable income.
 * Returns: 'income' | 'expense' | 'transfer' | 'unknown'
 */
function classifyTransactionForCashFlow(t: any): 'income' | 'expense' | 'transfer' | 'unknown' {
  const type     = (t.type     || '').toLowerCase();
  const category = (t.category || '').toLowerCase();
  const amount   = typeof t.amount === 'number' ? t.amount : parseFloat(t.amount || '0') || 0;

  // 1. Explicit type field (highest priority)
  if (type === 'income')   return 'income';
  if (type === 'expense')  return 'expense';
  if (type === 'transfer') return 'transfer';
  if (type === 'refund')   return 'transfer'; // refunds are not stable income

  // 2. Category-based signal
  if (category === 'income')   return 'income';
  if (category === 'transfer') return 'transfer';
  if (['housing', 'food', 'transport', 'entertainment', 'health', 'shopping', 'other'].includes(category)) {
    return 'expense';
  }

  // 3. Amount sign fallback (least reliable)
  if (amount > 0) return 'income';
  if (amount < 0) return 'expense';

  return 'unknown';
}

router.post('/global-pulse', async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const start = Date.now();
  try {
    const { localTime, language, userContext, pastMemory, userProfile } = req.body;
    const sanitizedUserContext = sanitizeUserContextForAI(userContext);
    const ai = getGenAI();
    
    // Fetch external news signals from abstraction layer
    const externalNewsSignals = await getRelevantNewsSignals(userContext);
    
    const dateAnchor = localTime ? new Date(localTime).toLocaleDateString('en-US', { dateStyle: 'full' }) : 'Today';
    const currency = userProfile?.baseCurrency || 'EUR';

    // ── Safe defaults ────────────────────────────────────────────────────────
    const assets:               any[] = sanitizedUserContext?.assets               || [];
    const liabilities:          any[] = sanitizedUserContext?.liabilities          || [];
    const goals:                any[] = sanitizedUserContext?.goals                || [];
    const transactions:         any[] = sanitizedUserContext?.transactions         || [];
    const bankAccounts:         any[] = sanitizedUserContext?.bankAccounts         || [];
    const connectedAccounts:    any[] = sanitizedUserContext?.connectedAccounts    || [];
    const cryptoWallets:        any[] = sanitizedUserContext?.cryptoWallets        || [];
    const investmentAccounts:   any[] = sanitizedUserContext?.investmentAccounts   || [];
    const income:               any[] = sanitizedUserContext?.income               || [];

    // ── Net Worth calculation (balance-based ONLY — transactions excluded) ──
    const totalManualAssets        = assets.reduce((s: number, a: any) => s + (a.value || 0), 0);
    const totalBankBalances        = bankAccounts.reduce((s: number, b: any) => s + (b.balance || 0), 0);
    const totalConnectedBalances   = connectedAccounts.reduce((s: number, c: any) => s + (c.balance || 0), 0);
    const totalCryptoValue         = cryptoWallets.reduce((s: number, w: any) => s + (w.totalValue || w.estimatedValue || 0), 0);
    const totalInvestmentValue     = investmentAccounts.reduce((s: number, i: any) => s + (i.totalValue || 0), 0);
    const totalLiabilities         = liabilities.reduce((s: number, l: any) => s + (l.remainingAmount || 0), 0);
    const estimatedNetWorth        = totalManualAssets + totalBankBalances + totalConnectedBalances + totalCryptoValue + totalInvestmentValue - totalLiabilities;

    // ── Cash Flow (transactions ONLY — not included in net worth) ───────────
    // Uses classifyTransactionForCashFlow: type field → category → amount sign
    // Refunds and transfers are excluded from stable income.
    const classifiedTxs = transactions.map((t: any) => ({
      ...t,
      _class: classifyTransactionForCashFlow(t)
    }));
    const monthlyIncome    = classifiedTxs
      .filter((t: any) => t._class === 'income')
      .reduce((s: number, t: any) => s + Math.abs(typeof t.amount === 'number' ? t.amount : 0), 0);
    const monthlyExpenses  = classifiedTxs
      .filter((t: any) => t._class === 'expense')
      .reduce((s: number, t: any) => s + Math.abs(typeof t.amount === 'number' ? t.amount : 0), 0);
    const monthlyCashFlow  = monthlyIncome - monthlyExpenses;
    const incomeSourcesCount = income.length;
    const unknownTxCount   = classifiedTxs.filter((t: any) => t._class === 'unknown').length;
    // If > 20% of transactions are unclassified, flag cash flow as low confidence
    const cashFlowConfidence = transactions.length > 0
      ? (unknownTxCount / transactions.length < 0.2 ? 'high' : 'low')
      : 'insufficient_data';
    // Prefer userProfile fixed costs for runway if available and more reliable
    const monthlyFixedCosts = (userProfile?.monthlyFixedCostsEstimate as number | undefined) || 0;
    const runwayDenominator = monthlyFixedCosts > 0 ? monthlyFixedCosts : monthlyExpenses;

    // ── Connectivity Summary ─────────────────────────────────────────────────
    const activeConnectionsCount = [
      ...bankAccounts.filter((b: any) => b.status === 'connected'),
      ...connectedAccounts.filter((c: any) => c.status === 'connected')
    ].length;

    // ── Profile metadata ─────────────────────────────────────────────────────
    const country          = userProfile?.country        || 'Global';
    const taxResidence     = userProfile?.taxResidence   || userProfile?.country || 'Unknown';
    const financialMode    = userProfile?.financialMode  || 'balanced';
    const riskTolerance    = userProfile?.riskTolerance  || 'moderate';
    const currencyExposure = (userProfile?.currencyExposure as string[] | undefined)?.join(', ') || currency;
    const primaryGoal      = userProfile?.primaryGoal    || 'wealth_preservation';
    const experienceLevel  = userProfile?.experienceLevel || 'intermediate';
    const employmentStatus = userProfile?.employmentStatus || 'unknown';
    const incomeType       = userProfile?.incomeType      || 'unknown';

    // ── Context strings for the prompt ───────────────────────────────────────
    const userArchetypeString = `
    USER STRATEGIC PROFILE:
    - Primary Goal: ${primaryGoal}
    - Financial Mode: ${financialMode} (defensive / balanced / growth / aggressive)
    - Risk Tolerance: ${riskTolerance}
    - Financial Experience: ${experienceLevel}
    - Employment Status: ${employmentStatus}
    - Income Type: ${incomeType}
    - Legal Tax Residence: ${taxResidence} (USE THIS for legal/tax interpretation — this is the user's legal domicile)
    - Physical Country / Local Market: ${country} (USE THIS for local macro and geopolitical analysis)
    - Preferred Currency: ${currency}
    - Currency Exposure: ${currencyExposure}
    IMPORTANT: Tailor the TONE and RECOMMENDATION INTENSITY to financialMode and riskTolerance.
    - 'defensive' mode = conservative framing, capital preservation priority.
    - 'growth' or 'aggressive' mode = opportunity-first framing, higher-risk actions acceptable.
    - 'moderate' risk tolerance = balanced probabilities, avoid extreme calls.
    `;

    const personalizedContextString = `
    THE USER'S FULL FINANCIAL CONTEXT:
    
    [WEALTH SNAPSHOT — Balance-based. Transactions are excluded from net worth.]
    - Manual Assets (user-entered): ${currency} ${totalManualAssets.toFixed(2)}
    - Bank Account Balances (liquid): ${currency} ${totalBankBalances.toFixed(2)} across ${bankAccounts.length} accounts
    - Connected Account Balances (synced): ${currency} ${totalConnectedBalances.toFixed(2)}
    - Crypto Wallet Estimated Value (volatile): ${currency} ${totalCryptoValue.toFixed(2)}
    - Investment Portfolio Value: ${currency} ${totalInvestmentValue.toFixed(2)}
    - Total Liabilities (debt obligations): ${currency} ${totalLiabilities.toFixed(2)}
    - Estimated Net Worth: ${currency} ${estimatedNetWorth.toFixed(2)}
    - Active Data Connections: ${activeConnectionsCount}
    
    [CASH FLOW — Transaction velocity (NOT included in net worth)]
    - Classification method: type field → category → amount sign (fallback)
    - Cash Flow Data Confidence: ${cashFlowConfidence} (low = >20% transactions unclassified)
    - Monthly Income (classified income transactions only): ${currency} ${monthlyIncome.toFixed(2)}
    - Monthly Expenses (classified expense transactions only): ${currency} ${monthlyExpenses.toFixed(2)}
    - Monthly Cash Flow: ${currency} ${monthlyCashFlow.toFixed(2)}
    - Income Sources on record: ${incomeSourcesCount}
    ${runwayDenominator > 0
      ? `- Estimated Runway: ${totalBankBalances > 0 ? (totalBankBalances / runwayDenominator).toFixed(1) + ' months' + (monthlyFixedCosts > 0 ? ' (based on stated fixed costs)' : ' (based on transaction history)') : 'insufficient_data (no liquid balance)'}`
      : '- Runway: insufficient_data (no expense or fixed cost data available — low confidence)'}
    
    [ASSET CLASS BREAKDOWN]
    - Manual assets count: ${assets.length} items
    - Goals on track: ${goals.length} goals defined
    - Crypto wallets: ${cryptoWallets.length} wallets
    - Investment accounts: ${investmentAccounts.length} accounts
    
    INTERPRETATION RULES — MUST FOLLOW:
    1. Bank/connected account balances = LIQUIDITY. Use for runway and emergency analysis.
    2. Crypto wallets = VOLATILE assets. Flag separately in risk analysis. Never treat as stable reserves.
    3. Transactions = CASH FLOW VELOCITY only. Do NOT add transaction totals to net worth.
    4. Manual assets = USER-REPORTED VALUE. May be stale. Flag confidence accordingly.
    5. taxResidence = LEGAL jurisdiction for tax advice. Country = LOCAL macro context. These may differ.
    6. financialMode and riskTolerance = CALIBRATE recommendation intensity accordingly.
    7. If any value is 0 or data is unavailable, say insufficient_data — do not fabricate values.
    8. All tax-related advice must be framed as 'Legal Tax Optimization'. Never use the word 'loophole'.
    9. Market predictions must use probability/scenario language, not deterministic statements.
    10. Runway estimates with no expense data must be flagged with low confidence.

    DATA QUALITY TIERS — ADJUST CONFIDENCE ACCORDINGLY:
    - connected_data: institution status='connected' AND lastSyncedAt is recent → HIGH confidence. Use directly.
    - user_data: manually entered assets/liabilities → MEDIUM confidence. May be stale. Caveat advice.
    - estimated_data: crypto values from public scan, investment balances without live feed → MEDIUM-LOW. Flag as estimates.
    - sandbox_data: any record with status='demo' or status='sandbox' → LOW confidence. Do not base specific advice on it.
    - fallback_data: value inferred from amount sign or partial fields → LOW confidence. Flag uncertainty.
    - insufficient_data: field is missing, zero, or array is empty → Do NOT guess. Say 'insufficient_data'.
    Data quality signals available: connectedAccounts=${connectedAccounts.length} synced, bankAccounts=${bankAccounts.length} on file, assets=${assets.length} manual, cryptoWallets=${cryptoWallets.length}, cashFlowConfidence=${cashFlowConfidence}.
    If connected data is 0 and all values are manual, lower overall portfolio confidence and say so briefly in the narrative.
    `;

    let memoryContextString = '';
    if (pastMemory && pastMemory.length > 0) {
      memoryContextString = `
      PAST ADVICE LOG (MEMORY):
      These are the narratives you recently gave the user. Acknowledge them if relevant:
      ${pastMemory.map((msg: string, i: number) => `[Interaction -${i + 1}]: ${msg}`).join('\n')}
      `;
    }

    const contents = `You are Gemini, acting as PALANTIR, the elite predictive AI engine for the MoneyFlow app. Your job is to translate complex global signals into plain, actionable language. You MUST use your Google Search tool to scan Google News and Google Trends regarding Tech, Energy, Crypto, Banks, AI, Geopolitics, and Macroeconomics FOR TODAY (${dateAnchor}).
    
    CRITICAL OBJECTIVE: Identify emerging trends before they go mainstream. Look for spikes in search volume on Google Trends that correlate with financial news. 

    ${userArchetypeString}
    ${personalizedContextString}
    ${memoryContextString}
    
    [EXTERNAL NEWS SIGNALS — Use these as primary verified sources if available]:
    ${JSON.stringify(externalNewsSignals)}
    
    
CRITICAL RULES:
1. Deliver sharp, predictive insights about upcoming macro trends, systemic risks, and massive capital rotational shifts. Use LIVE data from your search tool.
2. The tone MUST be confident, clear, honest, and slightly urgent when warranted. Never alarmist. Write as a brilliant, trusted friend who understands global finance, NOT a machine or Bloomberg terminal. Zero jargon.
3. You MUST provide exactly 8 real, recent news items. You MUST use your Google Search tool to find actual real-time news articles from today. Provide deeply analytical but plain-language summaries.
4. Each news item MUST include the real, clickable URL to the actual article. Do not hallucinate URLs!
5. No number should appear without a human translation in plain English explaining what it means for them.
6. VERY IMPORTANT: You MUST write EVERYTHING (titles, summaries, advice, descriptions, etc) in this language code: ${(language || 'en').toUpperCase()}.
7. CALCULATE YIELD: Using current real-world interest rates and inflation (use Google Search), generate a 'yieldOptimizer' strategy specifically tailored to the user's cash reserves.
8. CALCULATE TAX SHIELD: Predict if the user is near a higher tax bracket and suggest a legal tax optimization (deduction, donation) to save taxes.
9. CALCULATE NEGOTIATOR: Identify fixed cost optimizations (utilities, subscriptions) and suggest switches.
10. CALCULATE BLACK SWAN: Determine how many months the user's liquid cash can cover their expenses/liabilities if income goes to 0.
11. CALCULATE ARBITRAGE: Compare debt interest rates vs savings yield to find a potential efficiency gap.
12. GEOPOLITICAL CONCENTRIC RINGS: Analyze the user's specific Country, their surrounding Neighborhood, their Continent, the impact of Superpowers (USA/China/Russia), and Global macro. Be extremely specific to their country.

Return JSON EXACTLY matching this schema:
{
  "orb": {
    "confidenceScore": number (0-100),
    "statusLine": string (max 8 words summarizing global state),
    "state": "stable" | "caution" | "critical",
    "activeRisksCount": number (count of critical/high risks)
  },
  "narrative": string (max 120 words briefing. What happened, why it matters, what to do. Plain language.),
  "semaphore": [
    // EXACTLY 4 ITEMS matching these categories: 'savings', 'business_costs', 'investment_climate', 'borrowing'
    { "category": "savings" | "business_costs" | "investment_climate" | "borrowing", "state": "GREEN" | "YELLOW" | "RED", "explanation": string (1 sentence plain language) }
  ],
  "metrics": [
    // EXACTLY 6 ITEMS matching these ids: 'cost_of_money', 'purchasing_power', 'market_mood', 'energy_cost', 'safe_harbor', 'global_stability'
    { "id": "cost_of_money" | "purchasing_power" | "market_mood" | "energy_cost" | "safe_harbor" | "global_stability", "value": string or number, "explanation": string (plain language translation of the metric), "alertState": "GREEN" | "YELLOW" | "RED", "trend": "up" | "down" | "stable" }
  ],
  "probabilityVectors": [
    { "title": string (max 5 words), "probability": number (0-100), "severity": "EXTREME" | "HIGH" | "MEDIUM" | "LOW", "meaning": string (1 sentence), "affects": string, "cluster": string }
  ],
  "signalsAndAlpha": [
    { "title": string (uppercase, max 5 words), "explanation": string (2-3 sentences), "urgency": "IMMEDIATE" | "THIS WEEK" | "THIS MONTH", "type": "OPPORTUNITY" | "STRUCTURAL" | "WARNING", "cluster": string }
  ],
  "activeRisks": [
    { "title": string (max 4 words), "severity": "CRITICAL" | "HIGH" | "MEDIUM", "explanation": string (2 sentences), "escalationProbability": number (0-100), "cluster": string }
  ],
  "educationalInsight": {
    "concept": string,
    "explanation": string (3 sentences plain language),
    "relevanceToday": string (1 sentence why it matters today)
  },
  "yieldOptimizer": {
    "detectedInefficiency": string (short explanation of lost yield, e.g. "Cash losing 2.5% to inflation"),
    "actionableStrategy": string (exact action, e.g. "Move 10k to XEON ETF for 3.8% yield"),
    "estimatedAnnualAlpha": number (estimated profit in USD/EUR),
    "confidenceScore": number (1-100)
  },
  "taxShield": {
    "riskLevel": "SAFE" | "WARNING" | "CRITICAL",
    "description": string (e.g. "You are $500 away from the next tax bracket"),
    "taxOptimizationAction": string (e.g. "Donate $500 to a registered charity to save $1200 in taxes")
  },
  "negotiator": {
    "targetExpense": string (e.g. "Energy Bill"),
    "currentMarketRate": string (e.g. "-30% vs last year"),
    "potentialSavings": number (annual savings in USD/EUR)
  },
  "blackSwan": {
    "runwayMonths": number,
    "survivalAssessment": string (e.g. "You have 4.2 months of liquid runway. Freeze high-risk investments.")
  },
  "arbitrageFinder": {
    "inefficientDebt": string (e.g. "Car Loan at 6.5%"),
    "idleAsset": string (e.g. "Savings at 2%"),
    "arbitrageSpread": number (percentage difference),
    "action": string (e.g. "Liquidate $5k from savings to pay off car loan")
  },
  "newsFeed": [
    { "id": string, "category": "MACRO" | "ENERGY" | "CRYPTO" | "GEOPOLITICS" | "TECH" | "MARKETS", "source": string, "headline": string, "impactScore": number (1-10), "meaning": string, "escalationProbability": number, "affects": string, "trend": "up" | "down" | "neutral", "aiSummary": string, "url": string }
  ],
  "intelligenceFeed": [
    // 3-6 RELEVANT ARTICLES. Use reputable sources only. 
    // - Require source name and URL when available (DO NOT invent URLs).
    // - If no reliable source is available, return empty array [].
    // - Summaries must be short, original, and avoid full article reproduction.
    // - Explain relevance to user's country, currency, portfolio, or geopolitical exposure.
    {
      "title": string,
      "source": string,
      "url": string (clickable URL if available),
      "publishedAt": string (ISO date),
      "category": "macro" | "geopolitics" | "markets" | "energy" | "currency" | "crypto" | "local",
      "summary": string (short, original summary),
      "relevanceToUser": string (why this matters for them),
      "impactScore": number (1-10),
      "actionSignal": "observe" | "prepare" | "act",
      "affectedAreas": string[],
      "confidenceScore": number (0-100)
    }
  ],
  "geopoliticalRings": {
    // ANALYZE IN CONCENTRIC LAYERS:
    // state: user country/tax residence/local economy
    // neighborhood: local economic zone/neighbors
    // continent: regional bloc (EU/ASEAN/Americas)
    // superpowers: USA/China/Russia impact
    // world: global macro/supply chains/energy
    "state": { "title": string, "summary": string (2 sentences), "riskScore": number (0-100), "opportunityScore": number (0-100), "impactScore": number (0-100), "confidenceScore": number (0-100), "actionSignal": "observe" | "prepare" | "act", "affectedAreas": string[], "missingData": string[] },
    "neighborhood": { "title": string, "summary": string, "riskScore": number, "opportunityScore": number, "impactScore": number, "confidenceScore": number, "actionSignal": "observe" | "prepare" | "act", "affectedAreas": string[], "missingData": string[] },
    "continent": { "title": string, "summary": string, "riskScore": number, "opportunityScore": number, "impactScore": number, "confidenceScore": number, "actionSignal": "observe" | "prepare" | "act", "affectedAreas": string[], "missingData": string[] },
    "superpowers": { "title": string, "summary": string, "riskScore": number, "opportunityScore": number, "impactScore": number, "confidenceScore": number, "actionSignal": "observe" | "prepare" | "act", "affectedAreas": string[], "missingData": string[] },
    "world": { "title": string, "summary": string, "riskScore": number, "opportunityScore": number, "impactScore": number, "confidenceScore": number, "actionSignal": "observe" | "prepare" | "act", "affectedAreas": string[], "missingData": string[] }
  },
  "actionQueue": [
    // 3-5 practical action items. NOT financial advice.
    // If data is weak, action must be 'observe' or 'prepare'.
    {
      "title": string (max 6 words),
      "priority": "low" | "medium" | "high" | "critical",
      "actionSignal": "observe" | "prepare" | "act",
      "reason": string (1-2 sentences),
      "affectedAreas": string[],
      "timeHorizon": "0-30d" | "1-6m" | "6m+",
      "confidenceScore": number (0-100),
      "missingData": string[]
    }
  ],
  "scenarios": [
    // 2-4 PROBABILISTIC scenarios — NOT deterministic predictions. Use probability language.
    {
      "title": string (max 6 words, e.g. "Rate Cut Accelerates Growth"),
      "probability": number (0-100, honest estimate — do NOT claim certainty),
      "confidenceScore": number (0-100, lower if data is weak or sparse),
      "impactScore": number (1-10, impact on this user's financial position),
      "timeHorizon": "0-30d" | "1-6m" | "6m+",
      "actionSignal": "observe" | "prepare" | "act",
      "affectedAreas": string[] (e.g. ["savings", "investments", "debt"]),
      "rationale": string (2-3 sentences explaining the probabilistic reasoning, NOT a prediction)
    }
  ],
  "confidenceScore": number (0-100 reflecting overall portfolio data trust),
  "dataQuality": "connected_data" | "user_data" | "estimated_data" | "sandbox_data" | "fallback_data" | "insufficient_data",
  "sourceStatus": "live_search" | "user_data" | "connected_data" | "cached" | "fallback" | "model_inference",
  "missingData": string[] (list specifically what fields or sources are missing, e.g. ["liabilities", "expense_history"])
}

IMPORTANT: The "dataQuality" and "confidenceScore" MUST reflect the reality of the provided context. If context is mostly manual, use "user_data". If mostly synced, use "connected_data". If data is sparse, use "insufficient_data" or "fallback_data" and set confidence below 50.`;

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: contents,
      config: { 
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }] 
      }
    });

    let rawText = result?.text || "";
    if (rawText.toLowerCase().includes("rate exceeded") || rawText.toLowerCase().includes("exhausted")) {
      throw new Error("RATE_LIMIT");
    }

    let cleanText = rawText.trim();
    const startIdx = cleanText.indexOf('{');
    const endIdx = cleanText.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) cleanText = cleanText.substring(startIdx, endIdx + 1);

    const parsed = JSON.parse(cleanText);
    safeLogGeminiEvent('global-pulse', { userId, success: true, latencyMs: Date.now() - start });
    res.json(parsed);
  } catch (error: any) {
    safeLogGeminiEvent('global-pulse', { userId, success: false, latencyMs: Date.now() - start, errorType: error.name || 'Error' });
    res.status(500).json({ error: 'Neural Core (Palantir) is temporarily unavailable.' });
  }
});

export default router;
