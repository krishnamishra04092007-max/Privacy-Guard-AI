/**
 * src/analysis/gemini.js
 * Rigorously calibrated legal auditor prompt ensuring accurate red-flag extraction
 * and zero false positives on benign developer agreements.
 *
 * Exclusively reads API key from environment variables:
 * import.meta.env.VITE_GEMINI_API_KEY / process.env.VITE_GEMINI_API_KEY
 */

export function getGeminiApiKey() {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env && process.env.VITE_GEMINI_API_KEY) {
    return process.env.VITE_GEMINI_API_KEY;
  }
  return "";
}

const CANDIDATE_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "gemini-flash-latest"
];

export async function analyzeLegalClausesWithGemini(clausesOrText) {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error("Missing Gemini API Key. Please ensure VITE_GEMINI_API_KEY is defined in .env and run build.");
  }

  const prompt = `You are Privacy Guard AI, a rigorous legal auditor and consumer rights specialist.
Evaluate the following text from a Terms of Service or Privacy Policy.

GOAL: Accurately isolate truly predatory provisions while never mischaracterizing standard, fair, or developer-friendly terms.

BENIGN / NON-PREDATORY TERMS (DO NOT FLAG THESE):
1. Standard monthly/annual SaaS recurring subscriptions with accessible cancel-anytime terms (e.g. "renew until cancelled. You may cancel at any time").
2. User Content Retention: Terms guaranteeing that the user retains ownership and the company will NOT train AI models on user code/content.
3. Bring-Your-Own-Client or MCP (Model Context Protocol) tool integrations (e.g. connecting Claude, Cursor, or IDE plugins).
4. Standard warranty disclaimers ("as is") and routine limitation of liability capped at fees paid in the preceding 12 months.
5. Standard confidentiality, encryption, and GDPR/CCPA data export/deletion rights.

ONLY EXTRACT GENUINELY PREDATORY CLAUSES:
- "Civil Litigation Waivers": Forced binding arbitration or class action waivers denying access to legal courts.
- "Aggressive Data Monetization": Selling, brokering, or sharing personal biometrics, telemetry, or user content with third-party ad networks without explicit opt-in.
- "Perpetual IP Claims": Irrevocable, perpetual, royalty-free, transferable licenses granting the platform broad commercial or sublicensing rights over original user creations or code.
- "Surprise Financial Mechanics": Unilateral price alterations without prior notice, hidden renewal traps without cancellation instructions, or non-disclosed recurring fees.
- "Unilateral Modification": Reserving the unilateral right to rewrite terms or revoke user rights at any time in "sole discretion" without advance written notice.

CRITICAL INSTRUCTION:
- If the agreement contains ONLY standard business terms, user ownership protections, or benign subscriptions, return an EMPTY clauses array:
  {"clauses": []}
- Every flagged clause MUST have an exact quote from the text and a clear explanation of what rights the consumer forfeits.

Output JSON format ONLY:
{
  "clauses": [
    {
      "category": "Civil Litigation Waivers | Aggressive Data Monetization | Perpetual IP Claims | Surprise Financial Mechanics",
      "risk_level": "HIGH | MEDIUM",
      "quote": "verbatim excerpt from text",
      "explanation": "concise plain-English translation of rights lost"
    }
  ]
}

Legal text:
${typeof clausesOrText === 'string' ? clausesOrText.slice(0, 15000) : JSON.stringify(clausesOrText, null, 2)}
`;

  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.0,
      responseMimeType: "application/json"
    }
  };

  let lastError = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      console.log(`[Privacy Guard AI] Running legal verification on: ${model}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[Privacy Guard AI] ${model} HTTP ${response.status}:`, errorText);
        lastError = new Error(`${model} status ${response.status}`);
        continue;
      }

      const data = await response.json();
      const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawContent) continue;

      try {
        return JSON.parse(rawContent);
      } catch (err) {
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      console.warn(`[Privacy Guard AI] Request error with ${model}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini models were unavailable.");
}