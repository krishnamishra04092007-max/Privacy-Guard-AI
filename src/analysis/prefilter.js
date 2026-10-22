/**
 * Tier 1 Deterministic Pre-Filter Layer
 * Synchronous regex pattern matching (<5ms)
 */

export const RISK_RULES = [
  {
    id: 'CLASS_ACTION',
    category: 'Civil Litigation Waivers',
    pattern: /(waiv|forfeit|relinquish).*(class[\s-]action|jury[\s-]trial)|binding[\s-]arbitration/i,
    weight: 30,
    severity: 'HIGH',
    title: 'Class Action & Jury Waiver'
  },
  {
    id: 'DATA_SALE',
    category: 'Aggressive Data Monetization',
    pattern: /(sell|monetize|broker|disclose to third parties).*(personal (data|information)|biometric|location)/i,
    weight: 25,
    severity: 'HIGH',
    title: 'Sale / Transfer of Personal Data'
  },
  {
    id: 'IP_CLAIM',
    category: 'Perpetual IP Claims',
    pattern: /(perpetual|irrevocable|worldwide|royalty[\s-]free).*(license|reproduce|distribute|derivative works)/i,
    weight: 20,
    severity: 'HIGH',
    title: 'Perpetual & Irrevocable IP License'
  },
  {
    id: 'AUTO_RENEWAL',
    category: 'Surprise Financial Mechanics',
    pattern: /(automatic(ally)?\s+renew(s|al)?|recurring\s+charge|without\s+prior\s+notice)/i,
    weight: 15,
    severity: 'MEDIUM',
    title: 'Automatic Subscription Renewal'
  },
  {
    id: 'UNILATERAL_CHANGE',
    category: 'Surprise Financial Mechanics',
    pattern: /(modify|change|terminate)\s+(these\s+terms|this\s+agreement)\s+(at\s+any\s+time|without\s+notice|in\s+our\s+sole\s+discretion)/i,
    weight: 15,
    severity: 'MEDIUM',
    title: 'Unilateral Contract Modification'
  },
  {
    id: 'LOCATION_TRACKING',
    category: 'Aggressive Data Monetization',
    pattern: /(precise\s+geolocation|track(ing)?\s+your\s+location|gps\s+coordinates)/i,
    weight: 10,
    severity: 'MEDIUM',
    title: 'Continuous Location Tracking'
  }
];

export function runDeterministicPreFilter(text) {
  const paragraphs = text
    .split(/\n{2,}|\.\s{1,2}(?=[A-Z])/)
    .map((p) => p.trim())
    .filter((p) => p.length > 40);

  const detectedClauses = [];
  let totalPenalty = 0;
  const matchedRuleIds = new Set();

  for (const p of paragraphs) {
    for (const rule of RISK_RULES) {
      if (rule.pattern.test(p)) {
        detectedClauses.push({
          ruleId: rule.id,
          category: rule.category,
          title: rule.title,
          severity: rule.severity,
          weight: rule.weight,
          quote: p.slice(0, 240).trim()
        });
        
        // Prevent stacking infinite penalties for identical duplicate triggers
        if (!matchedRuleIds.has(rule.id)) {
          totalPenalty += rule.weight;
          matchedRuleIds.add(rule.id);
        }
      }
    }
  }

  const baselineScore = Math.max(1, 100 - totalPenalty);
  return { baselineScore, detectedClauses, totalPenalty };
}