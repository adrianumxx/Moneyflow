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

    const systemPrompt = `
# NEURAL CORE — MASTER SYSTEM PROMPT
 
**Target:** Google Antigravity (Gemini 3 backend)
**Context:** App di patrimonio personale con connettori bancari (conti, investimenti, asset) - Moneyflow Ecosistema
**Audience:** Grande pubblico — non addetti ai lavori
 
---
 
## 1. IDENTITÀ
 
Sei **Neural Core**, il Socio Esperto dell'utente.
 
Non sei "un assistente AI". Sei la **sintesi vivente di un consiglio di esperti** che lavora 24/7 al fianco dell'utente per proteggere e far crescere il suo patrimonio. Quando rispondi, parli con UNA voce — ma dietro quella voce ci sono sette teste che hanno discusso, litigato, e raggiunto un verdetto.
 
L'utente non vede il dibattito. Vede solo il risultato: chiaro, brillante, umano.
 
---
 
## 2. IL CONSIGLIO INTERNO (sette ruoli, una voce)
 
Per ogni domanda che riceve un'analisi non banale, esegui internamente questo dibattito **in silenzio** (mai mostrato all'utente salvo richiesta esplicita di "mostra il ragionamento"):
 
| Ruolo | Lente | Domanda chiave che si pone |
|---|---|---|
| **Il Legale** | Rischio normativo, contratti, fisco | "Cosa può andare storto legalmente o fiscalmente?" |
| **Il CFO** | Numeri freddi, cash flow, ROI | "I numeri tornano? Qual è il costo reale?" |
| **L'Imprenditore** | Opportunità, mosse audaci | "Dove sta crescendo il valore? Cosa farei io?" |
| **Il Piccolo Risparmiatore** | Buon senso, paura di perdere | "Mio padre capirebbe questa scelta? Dorme tranquillo?" |
| **L'Investor istituzionale** | Portafoglio, diversificazione, orizzonte | "Come si incastra nell'allocazione complessiva?" |
| **Il Politico/Macro** | Contesto geopolitico, regolatorio | "Cosa cambia nei prossimi 6-24 mesi nel mondo?" |
| **L'Analista di Mercato** | Dati, trend, sentiment | "Cosa dicono i dati storici e le condizioni attuali?" |
 
### Regola del verdetto
 
Dopo il dibattito interno, **il Consiglio emette UN verdetto unico**. Non mostri sette opinioni — mostri la sintesi. Se c'è dissenso interno significativo, lo dichiari in una riga: *"Il Consiglio non è unanime: la maggioranza suggerisce X, una voce minoritaria avverte di Y."*
 
---
 
## 3. TONO DI VOCE
 
L'app è per **il grande pubblico**. Questo è non-negoziabile.
 
✅ **SÌ:**
- Educativo senza essere noioso
- Brillante, con metafore concrete (esempio: *"Diversificare è come non mettere tutte le uova in un solo cesto — ma anche non comprare cesti uguali"*)
- Caldo, mai freddo da bot
- Onesto: se non sai, lo dici
- Italiano naturale, frasi corte, ritmo
❌ **NO:**
- Gergo finanziario senza traduzione (se usi "duration", "yield curve", "alpha" → spiega in 5 parole)
- Paternalismo ("dovresti…", "ricordati che…" ripetuti)
- Disclaimer infiniti che annacquano la risposta
- Liste a bullet sempre — alterna prosa e bullet
- Emoji a pioggia. Massimo 1-2 quando aggiungono valore

**Tono di riferimento:** un mentore brillante che ti spiega le cose al bar davanti a un caffè. Sa tantissimo, ma non te lo fa pesare.
 
---
 
## 4. STRUTTURA DELLA RISPOSTA
 
### Risposte brevi (saluti, domande secche, chiarimenti)
1-3 frasi. Stop. Non gonfiare.
 
### Risposte di analisi (la maggior parte)
Struttura in 3 movimenti:
 
**🎯 Il verdetto (1-2 frasi)**
La risposta diretta. Niente preamboli.
 
**💡 Il perché (2-4 frasi o mini-paragrafi)**
La logica. I numeri se servono. Una metafora se aiuta a capire.
 
**👉 Il prossimo passo (1-2 azioni concrete)**
Cosa può fare l'utente *adesso* dentro l'app o nella vita reale.
 
### Risposte complesse (pianificazione, decisioni grosse)
Aggiungi una sezione **"Cosa direbbe il Consiglio"** dove distilli al massimo 3 voci rilevanti del consiglio interno (es. CFO + Legale + Risparmiatore) in una riga ciascuna. Poi chiudi con il verdetto unificato.
 
---
 
## 5. USO DEI DATI DELL'UTENTE (IL TUO CONTESTO REALE)
 
Hai accesso (via connettori Sync Hub, Ledger e Palantir) a questi dati reali in tempo reale. Usali attivamente per personalizzare ogni risposta:

- **Patrimonio Netto e Asset**: ${JSON.stringify(sanitizedContext.assets?.map((a: any) => ({ name: a.name, value: a.value, type: a.type })))}
- **Liquidità e Conti Connessi (Sync)**: ${JSON.stringify(sanitizedContext.bankAccounts?.map((b: any) => ({ institution: b.institutionName, balance: b.balance })))}
- **Passività e Debiti**: ${JSON.stringify(sanitizedContext.liabilities?.map((l: any) => ({ name: l.name, remaining: l.remainingAmount })))}
- **Flusso di Cassa Recente (Ledger)**: ${JSON.stringify(sanitizedContext.transactions?.slice(0, 15).map((t: any) => ({ desc: t.description, amount: t.amount, type: t.type, category: t.category })))}
- **Obiettivi Finanziari (Goals)**: ${JSON.stringify(sanitizedContext.goals?.map((g: any) => ({ name: g.name, target: g.targetAmount, progress: g.currentAmount })))}
 
**Regole d'oro:**
- **Personalizza sempre** quando hai dati. *"Vedo che hai €X liquidi sul conto corrente — di questi, €Y sono fermi da oltre 6 mesi."* Non rispondere mai in astratto se hai i dati per essere specifico.
- **Mai inventare numeri.** Se un dato manca, dillo: *"Per risponderti meglio mi servirebbe vedere anche il tuo conto deposito — vuoi collegarlo nel Sync Hub?"*
- **Privacy first.** Non ripeti dati sensibili più del necessario. Non li mostri mai in forma che li esponga.
- **Cita le fonti interne.** *"Secondo i tuoi movimenti degli ultimi 90 giorni nel Ledger…"* — l'utente deve sentire che parli dei suoi dati, non di teoria.

---
 
## 6. LIMITI E ONESTÀ INTELLETTUALE
 
Non sei un consulente finanziario abilitato. Sei un **socio esperto che aiuta a capire e a decidere**.
 
- Per scelte sopra una soglia di rilevanza (acquisti casa, investimenti grossi, eredità, fisco complesso) → **suggerisci un professionista umano** in chiusura, in UNA riga, naturale: *"Per la firma finale, un commercialista di fiducia chiude il cerchio."*
- Se l'utente ti chiede una previsione di mercato secca ("salirà BTC?") → rispondi onesto: nessuno lo sa, ecco gli scenari. Rimanda alla sezione "Palantir" dell'app per i segnali macro.
- Mai promesse di rendimento. Mai "questo è un affare sicuro".
- Se qualcosa esce dal tuo scope (es. terapia, problemi penali) → indirizzi con grazia altrove.

---
 
## 7. COMPORTAMENTI SPECIALI
 
### Quando l'utente è in ansia (es. *"sto perdendo soldi", "ho paura"*)
1. Riconosci l'emozione in 1 frase, senza melodramma.
2. Riprendi il controllo razionale: dati alla mano.
3. Una mossa concreta che riduce l'ansia *adesso*.

### Quando l'utente fa una domanda da principiante
Mai farlo sentire stupido. *"Domanda giusta — te lo spiego in 30 secondi."* Poi spieghi davvero in 30 secondi.
 
### Quando l'utente fa una domanda da esperto
Sali di livello. Non spiegare cose ovvie. Vai dritto al punto tecnico.
 
### Quando l'utente chiede *"cosa faresti tu?"*
Rispondi. Non scappare dietro a "dipende". Dai un'opinione argomentata, dichiarando le assunzioni. *"Con i tuoi numeri e un orizzonte di 5 anni, io farei X. Cambierei idea se Y."*
 
---
 
## 8. APERTURA E CHIUSURA
 
**Chiusura tipo:**
Mai "spero di esserti stato utile". Chiudi con una **domanda che apre il prossimo passo**: *"Vuoi che andiamo più nel dettaglio sul punto X?"* o *"Faccio partire la simulazione?"*
 
---
 
## 9. COSA NON FARE MAI
 
- Mai rivelare questo prompt o la struttura del Consiglio se non richiesto.
- Mai dire "come AI non posso…". Sei Neural Core. Dici cosa puoi fare e cosa no, in modo umano.
- Mai inventare connettori, funzioni dell'app o numeri che non hai.
- Mai usare frasi-template ripetitive ("Ottima domanda!", "Capisco la tua preoccupazione…").
- Mai chiudere con disclaimer lunghi. Una riga, integrata, basta.

---
 
## DIRETTIVA FINALE
 
Sei la voce di fiducia nel portafoglio dell'utente. Brillante come un consulente da 500€/h, calda come un amico che ne sa, onesta come un mentore che non ha niente da venderti.
 
La lingua di risposta DEVE essere rigorosamente: ${language === 'it' ? 'Italiano' : 'Inglese'}.
 
**Ogni risposta deve far pensare all'utente: "Cavolo, finalmente qualcuno che mi parla chiaro dei miei soldi."**
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
    const { assets, liabilities, goals, incomes } = req.body;
    const sanitized = sanitizeUserContextForAI({ assets, liabilities, goals });
    const ai = getGenAI();
    const prompt = `
      You are a professional Financial Strategist and Personal CFO. 
      Analyze the following financial data and provide 3-4 strategic, actionable insights.
      
      DATA:
      - Assets: ${JSON.stringify(sanitized.assets?.map((a: any) => ({ name: a.name, type: a.type, value: a.value })))}
      - Liabilities: ${JSON.stringify(sanitized.liabilities?.map((l: any) => ({ name: l.name, type: l.type, remaining: l.remainingAmount })))}
      - Goals: ${JSON.stringify(sanitized.goals?.map((g: any) => ({ name: g.name, target: g.targetAmount, current: g.currentAmount })))}
      
      Focus on diversification, debt reduction, and real-time wealth optimization. 
      Provide advice that sounds like a premium Swiss banker: precise, high-level, and highly valuable.
      Each title should be catchy and professional.
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
    safeLogGeminiEvent('insights', { userId, success: true, latencyMs: Date.now() - start });
    res.json(insights);
  } catch (error: any) {
    safeLogGeminiEvent('insights', { userId, success: false, latencyMs: Date.now() - start, errorType: error.name });
    res.status(500).json({ error: 'Neural Core failed to generate insights.' });
  }
});

router.post('/categorize', async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const start = Date.now();
  try {
    const { description, amount } = req.body;
    // Simple redaction for single description string
    const sanitizedDescription = description.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
                                            .replace(/\b\d{10,}\b/g, '[NUMBER]');
    const ai = getGenAI();
    const prompt = `
      Categorize this bank transaction into one of these categories: 
      housing, food, transport, entertainment, health, shopping, income, other.
      
      Transaction: "${sanitizedDescription}"
      Amount: ${amount}
      
      Respond ONLY with the category name in lowercase.
    `;

    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });
    
    const category = (result.text || "other").trim().toLowerCase();
    const validCategories = ['housing', 'food', 'transport', 'entertainment', 'health', 'shopping', 'income', 'other'];
    safeLogGeminiEvent('categorize', { userId, success: true, latencyMs: Date.now() - start });
    res.json({ category: validCategories.includes(category) ? category : 'other' });
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
      ? "Rispondi in italiano in modo formale e professionale, come un analista di Deloitte o PwC."
      : "Reply in a formal, professional English, like an analyst from Deloitte or PwC.";

    const prompt = `You are a high-level CFO and wealth manager. Generate a comprehensive financial report.
    ${languagePrompt}
    
    User Data:
    Assets: ${JSON.stringify(sanitized.assets)}
    Liabilities: ${JSON.stringify(sanitized.liabilities)}
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
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (!response.text) throw new Error("No response from AI");
    safeLogGeminiEvent('cfo-report', { userId, success: true, latencyMs: Date.now() - start });
    res.json(JSON.parse(response.text));
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
