import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import admin from 'firebase-admin';

const router = express.Router();

function getGenAI() {
  return new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || ''
  });
}

router.post('/chat', async (req, res) => {
  try {
    const { query, context, language } = req.body;
    const ai = getGenAI();

    const systemPrompt = `
      You are the "Neural Partner" of Moneyflow, a premium financial ecosystem. 
      You are a high-level Financial Partner, Entrepreneur, Investor, and Tax Expert.
      Your tone is sophisticated, professional, and actionable. You help the user manage their wealth.

      USER DATA (REAL-TIME CONTEXT):
      - Assets: ${JSON.stringify(context.assets?.map((a: any) => ({ name: a.name, val: a.value, type: a.type })))}
      - Bank Balances: ${JSON.stringify(context.bankAccounts?.map((b: any) => ({ name: b.institutionName, bal: b.balance })))}
      - Liabilities: ${JSON.stringify(context.liabilities?.map((l: any) => ({ name: l.name, rem: l.remainingAmount })))}
      - Recent Transactions: ${JSON.stringify(context.transactions?.slice(0, 10).map((t: any) => ({ desc: t.description, amt: t.amount, type: t.type, cat: t.category })))}
      - Goals: ${JSON.stringify(context.goals?.map((g: any) => ({ name: g.name, target: g.targetAmount, current: g.currentAmount })))}

      INSTRUCTIONS:
      1. Use the data provided above to answer specific questions. If the user asks about their balance, look at the bank accounts and assets.
      2. If they ask about spending, look at the transactions.
      3. Be precise with numbers. 
      4. Respond in ${language === 'it' ? 'Italian' : 'English'}.
      5. Always sound like a trusted partner, never a robot.
    `;

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'user', parts: [{ text: query }] }
      ],
    });

    res.json({ response: result.text || "Mi scuso, non sono riuscito a processare questa richiesta." });
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/insights', async (req, res) => {
  try {
    const { assets, liabilities, goals, incomes } = req.body;
    const ai = getGenAI();
    const prompt = `
      You are a professional Financial Strategist and Personal CFO. 
      Analyze the following financial data and provide 3-4 strategic, actionable insights.
      
      DATA:
      - Assets: ${JSON.stringify(assets?.map((a: any) => ({ name: a.name, type: a.type, value: a.value })))}
      - Liabilities: ${JSON.stringify(liabilities?.map((l: any) => ({ name: l.name, type: l.type, remaining: l.remainingAmount })))}
      - Goals: ${JSON.stringify(goals?.map((g: any) => ({ name: g.name, target: g.targetAmount, current: g.currentAmount })))}
      
      Focus on diversification, debt reduction, and real-time wealth optimization. 
      Provide advice that sounds like a premium Swiss banker: precise, high-level, and highly valuable.
      Each title should be catchy and professional.
    `;

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
              id: { type: Type.STRING, description: "A unique identifier" },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["warning", "optimization", "opportunity"], description: "The type of insight" },
            },
            required: ["id", "title", "description", "type"],
          }
        }
      }
    });

    const text = response.text || "[]";
    const insights = JSON.parse(text);
    res.json(insights);
  } catch (error: any) {
    console.error("Gemini Insights Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/categorize', async (req, res) => {
  try {
    const { description, amount } = req.body;
    const ai = getGenAI();
    const prompt = `
      Categorize this bank transaction into one of these categories: 
      housing, food, transport, entertainment, health, shopping, income, other.
      
      Transaction: "${description}"
      Amount: ${amount}
      
      Respond ONLY with the category name in lowercase.
    `;

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    const category = (result.text || "other").trim().toLowerCase();
    const validCategories = ['housing', 'food', 'transport', 'entertainment', 'health', 'shopping', 'income', 'other'];
    res.json({ category: validCategories.includes(category) ? category : 'other' });
  } catch (error: any) {
    console.error("Gemini Categorize Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/cfo-report', async (req, res) => {
  try {
    const { assets, liabilities, insights, language } = req.body;
    const ai = getGenAI();
    
    const languagePrompt = language === 'it' 
      ? "Rispondi in italiano in modo formale e professionale, come un analista di Deloitte o PwC."
      : "Reply in a formal, professional English, like an analyst from Deloitte or PwC.";

    const prompt = `You are a high-level CFO and wealth manager. Generate a comprehensive financial report.
    ${languagePrompt}
    
    User Data:
    Assets: ${JSON.stringify(assets)}
    Liabilities: ${JSON.stringify(liabilities)}
    Quick Scan Insights: ${JSON.stringify(insights)}

    Provide a JSON strictly matching this schema, completely empty of markdown blocks (just raw JSON):
    {
      "executiveSummary": "A very professional 3-4 sentence overview of their financial situation.",
      "quickScanAnalysis": [
        { "title": "...", "content": "Detailed professional analysis expanding on the Quick Scan insights." }
      ],
      "strategicRecommendations": [
        { "title": "...", "content": "Actionable, high-level strategic steps." }
      ],
      "riskAssessment": "Overall risk profile and immediate threats."
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (!response.text) throw new Error("No response from AI");
    res.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error("Gemini CFO Report Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/global-pulse', async (req, res) => {
  try {
    const { localTime, language, userContext, pastMemory, userProfile } = req.body;
    const ai = getGenAI();
    
    const dateAnchor = localTime ? new Date(localTime).toLocaleDateString('en-US', { dateStyle: 'full' }) : 'Today';
    
    let userArchetypeString = '';
    if (userProfile && userProfile.primaryGoal) {
      userArchetypeString = `
      USER STRATEGIC ARCHETYPE:
      - Primary Goal: ${userProfile.primaryGoal}
      - Financial Experience: ${userProfile.experienceLevel}
      - Preferred Currency: ${userProfile.baseCurrency || 'EUR'}
      TAILOR YOUR ENTIRE TONE AND RECOMMENDATIONS TO THIS ARCHETYPE.
      `;
    }

    let personalizedContextString = '';
    if (userContext && (userContext.assets?.length > 0 || userContext.liabilities?.length > 0)) {
      const totalAssets = userContext.assets.reduce((sum: number, a: any) => sum + (a.value || 0), 0);
      const totalLiabilities = userContext.liabilities.reduce((sum: number, l: any) => sum + (l.remainingAmount || 0), 0);
      personalizedContextString = `
      THE USER'S FINANCIAL CONTEXT (USE THIS TO TAILOR ADVICE AND NEWS RELEVANCE):
      - Total Assets: €${totalAssets} (Details: ${JSON.stringify(userContext.assets.map((a: any) => `${a.name}(${a.type}): €${a.value}`))})
      - Total Liabilities: €${totalLiabilities} (Details: ${JSON.stringify(userContext.liabilities.map((l: any) => `${l.name}(${l.type}): €${l.remainingAmount}`))})
      TAILOR THE 'strategicAdvice' AND POTENTIAL IMPACTS TO THIS SPECIFIC PORTFOLIO (without exposing their exact numbers publicly, just use the strategy).
      `;
    }

    let memoryContextString = '';
    if (pastMemory && pastMemory.length > 0) {
      memoryContextString = `
      PAST ADVICE LOG (MEMORY):
      These are the narratives you recently gave the user. Acknowledge them if relevant, saying things like "As I mentioned last time..." or "Following up on my previous warning...":
      ${pastMemory.map((msg: string, i: number) => `[Interaction -${i + 1}]: ${msg}`).join('\n')}
      `;
    }

    const contents = `You are Gemini, acting as PALANTIR, the elite predictive AI engine for the MoneyFlow app. Your job is to translate complex global signals into plain, actionable language. You MUST use your Google Search tool to scan Google News and Google Trends regarding Tech, Energy, Crypto, Banks, AI, Geopolitics, and Macroeconomics FOR TODAY (${dateAnchor}).
    
    CRITICAL OBJECTIVE: Identify emerging trends before they go mainstream. Look for spikes in search volume on Google Trends that correlate with financial news. 

    ${userArchetypeString}
    ${personalizedContextString}
    ${memoryContextString}
    
CRITICAL RULES:
1. Deliver sharp, predictive insights about upcoming macro trends, systemic risks, and massive capital rotational shifts. Use LIVE data from your search tool.
2. The tone MUST be confident, clear, honest, and slightly urgent when warranted. Never alarmist. Write as a brilliant, trusted friend who understands global finance, NOT a machine or Bloomberg terminal. Zero jargon.
3. You MUST provide exactly 8 real, recent news items. You MUST use your Google Search tool to find actual real-time news articles from today. Provide deeply analytical but plain-language summaries.
4. Each news item MUST include the real, clickable URL to the actual article. Do not hallucinate URLs!
5. No number should appear without a human translation in plain English explaining what it means for them.
6. VERY IMPORTANT: You MUST write EVERYTHING (titles, summaries, advice, descriptions, etc) in this language code: ${(language || 'en').toUpperCase()}.
7. CALCULATE YIELD: Using current real-world interest rates and inflation (use Google Search), generate a 'yieldOptimizer' strategy specifically tailored to the user's cash reserves.
8. CALCULATE TAX SHIELD: Predict if the user is near a higher tax bracket and suggest a loophole (deduction, donation) to save taxes.
9. CALCULATE NEGOTIATOR: Identify fixed cost optimizations (utilities, subscriptions) and suggest switches.
10. CALCULATE BLACK SWAN: Determine how many months the user's liquid cash can cover their expenses/liabilities if income goes to 0.
11. CALCULATE ARBITRAGE: Compare debt interest rates vs savings yield to find a guaranteed arbitrage spread.

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
    "loopholeAction": string (e.g. "Donate $500 to a registered charity to save $1200 in taxes")
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
  ]
}`;

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
    res.json(parsed);
  } catch (error: any) {
    console.error("Gemini Global Pulse Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
