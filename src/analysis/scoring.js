/**
 * src/analysis/scoring.js
 * Calibrated Legal Penalty Calculator with Category Caps and Severity Weighing.
 * Prevents score distortion and accurately scales between 1 and 100.
 */

export const CATEGORY_PENALTIES = {
  // Litigation & arbitration waivers
  "Civil Litigation Waivers": {
    baseHigh: 20,
    baseMedium: 15,
    maxCap: 25
  },
  // Data monetization, selling, tracking
  "Aggressive Data Monetization": {
    baseHigh: 25,
    baseMedium: 12,
    maxCap: 35
  },
  // Broad intellectual property expropriation
  "Perpetual IP Claims": {
    baseHigh: 25,
    baseMedium: 12,
    maxCap: 35
  },
  // Auto-renewals, unilateral policy changes
  "Surprise Financial Mechanics": {
    baseHigh: 15,
    baseMedium: 8,
    maxCap: 20
  },
  // Policy changes
  "Unilateral Modification": {
    baseHigh: 12,
    baseMedium: 6,
    maxCap: 15
  }
};

/**
 * Calculates a predictable, objective Safety Score between 1 and 100.
 * Implements category saturation caps so a single medium disclaimer cannot drop a score from 100 to 20.
 */
export function calculateSafetyScore(clauses) {
  if (!clauses || clauses.length === 0) {
    return {
      score: 100,
      rating: "SAFE / LOW RISK",
      summary: "Clean, standard terms with no predatory or anti-consumer provisions."
    };
  }

  // Accumulate penalty by category to apply fair category caps
  const categoryTotals = {};

  for (const clause of clauses) {
    const cat = clause.category || "Surprise Financial Mechanics";
    const rules = CATEGORY_PENALTIES[cat] || CATEGORY_PENALTIES["Surprise Financial Mechanics"];
    const penalty = clause.risk_level === "HIGH" ? rules.baseHigh : rules.baseMedium;

    categoryTotals[cat] = (categoryTotals[cat] || 0) + penalty;
  }

  // Sum capped penalties across categories
  let totalPenalty = 0;
  for (const [cat, rawTotal] of Object.entries(categoryTotals)) {
    const rules = CATEGORY_PENALTIES[cat] || CATEGORY_PENALTIES["Surprise Financial Mechanics"];
    totalPenalty += Math.min(rawTotal, rules.maxCap);
  }

  const finalScore = Math.max(1, Math.min(100, 100 - totalPenalty));

  let rating = "SAFE / LOW RISK";
  let summary = "Few or no predatory provisions identified.";

  if (finalScore < 50) {
    rating = "PREDATORY / HIGH RISK";
    summary = "Critical rights forfeitures, class action waivers, or data monetization detected.";
  } else if (finalScore < 80) {
    rating = "MODERATE RISK";
    summary = "Contains unilateral policy modification clauses or subscription auto-renewals.";
  }

  return {
    score: finalScore,
    rating,
    summary,
    totalPenalty
  };
}