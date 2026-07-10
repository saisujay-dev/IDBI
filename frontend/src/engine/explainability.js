/**
 * MSME Financial Health Card — Explainability Layer
 *
 * Generates human-readable reason codes, positive/negative drivers,
 * and an underwriter-style narrative note for each scored MSME.
 *
 * Every driver references the actual underlying data point — no vague labels.
 */

import { RISK_BANDS, ACTIONS } from "./scoringEngine";

// ─────────────────────────────────────────────────────────────────────────────
// Driver extraction — find top positive and negative factors
// ─────────────────────────────────────────────────────────────────────────────

const _SUB_SCORE_LABELS = {
  cashFlowStrength:      "Cash-Flow Strength",
  revenueConsistency:    "Revenue Consistency",
  complianceBehavior:    "Compliance Behavior",
  operationalContinuity: "Operational Continuity",
  financialResilience:   "Financial Resilience",
};

/**
 * Generates specific driver strings from sub-score breakdowns.
 * Each driver is tied to a concrete data point.
 */
export const extractDrivers = (scoredMSME, _rawMSME) => {
  const { subScores, crossValidation } = scoredMSME;
  const drivers = [];

  // ── Cash-Flow Strength drivers ──────────────────────────────────────────
  const cf = subScores.cashFlowStrength.breakdown;
  if (cf.avgNetMargin > 15) {
    drivers.push({ type: "positive", category: "Cash-Flow Strength", weight: 0.25,
      text: `Healthy average net cash margin of ${cf.avgNetMargin}% (inflows consistently exceed outflows)` });
  } else if (cf.avgNetMargin < 0) {
    drivers.push({ type: "negative", category: "Cash-Flow Strength", weight: 0.25,
      text: `Negative average net cash margin of ${cf.avgNetMargin}% — outflows exceeding inflows for most months` });
  } else {
    drivers.push({ type: "neutral", category: "Cash-Flow Strength", weight: 0.25,
      text: `Moderate net cash margin of ${cf.avgNetMargin}% — inflows and outflows closely matched` });
  }

  if (cf.upiGrowthTrend > 10) {
    drivers.push({ type: "positive", category: "Cash-Flow Strength", weight: 0.25,
      text: `UPI collections showing ${cf.upiGrowthTrend}% positive growth trend over 12 months` });
  } else if (cf.upiGrowthTrend < -10) {
    drivers.push({ type: "negative", category: "Cash-Flow Strength", weight: 0.25,
      text: `UPI collections declining — ${Math.abs(cf.upiGrowthTrend)}% downward trend over 12 months` });
  }

  if (cf.payerDiversification >= 75) {
    drivers.push({ type: "positive", category: "Cash-Flow Strength", weight: 0.25,
      text: `Well-diversified customer base — top payer accounts for only ${(100 - cf.payerDiversification)}% of UPI inflows` });
  } else if (cf.payerDiversification < 45) {
    drivers.push({ type: "negative", category: "Cash-Flow Strength", weight: 0.25,
      text: `High payer concentration — top payer contributes ${(100 - cf.payerDiversification)}% of UPI inflows (concentration risk)` });
  }

  if (cf.inflowToLoanRatio > 2) {
    drivers.push({ type: "positive", category: "Cash-Flow Strength", weight: 0.25,
      text: `Strong repayment capacity — annual inflows are ${cf.inflowToLoanRatio}x the loan amount requested` });
  } else if (cf.inflowToLoanRatio < 0.8) {
    drivers.push({ type: "negative", category: "Cash-Flow Strength", weight: 0.25,
      text: `Repayment capacity concern — annual inflows are only ${cf.inflowToLoanRatio}x the loan amount requested` });
  }

  // ── Revenue Consistency drivers ──────────────────────────────────────────
  const rc = subScores.revenueConsistency.breakdown;
  if (rc.coefficientOfVariation < 20) {
    drivers.push({ type: "positive", category: "Revenue Consistency", weight: 0.20,
      text: `Highly stable GST turnover — revenue variation of only ${rc.coefficientOfVariation}% (low volatility)` });
  } else if (rc.coefficientOfVariation > 60) {
    drivers.push({ type: "negative", category: "Revenue Consistency", weight: 0.20,
      text: `Highly volatile GST turnover — revenue variation of ${rc.coefficientOfVariation}% (high seasonality or instability)` });
  }

  if (rc.activeMonths >= 11) {
    drivers.push({ type: "positive", category: "Revenue Consistency", weight: 0.20,
      text: `Business active in ${rc.activeMonths}/12 months with consistent GST filings` });
  } else if (rc.activeMonths <= 6) {
    drivers.push({ type: "negative", category: "Revenue Consistency", weight: 0.20,
      text: `Revenue recorded in only ${rc.activeMonths}/12 months — significant inactive periods detected` });
  }

  if (rc.gstUpiAlignment >= 80) {
    drivers.push({ type: "positive", category: "Revenue Consistency", weight: 0.20,
      text: `GST declared turnover and UPI inflows move in the same direction — strong data consistency` });
  } else if (rc.gstUpiAlignment < 50) {
    drivers.push({ type: "negative", category: "Revenue Consistency", weight: 0.20,
      text: `GST turnover and UPI collections diverge directionally — declared revenue patterns inconsistent with digital payments` });
  }

  // ── Compliance Behavior drivers ──────────────────────────────────────────
  const cb = subScores.complianceBehavior.breakdown;
  if (cb.gstComplianceRate >= 95) {
    drivers.push({ type: "positive", category: "Compliance Behavior", weight: 0.20,
      text: `Excellent GST compliance — ${cb.gstComplianceRate}% of returns filed on time with zero or minimal delays` });
  } else if (cb.gstComplianceRate < 60) {
    drivers.push({ type: "negative", category: "Compliance Behavior", weight: 0.20,
      text: `Poor GST compliance — only ${cb.gstComplianceRate}% of returns filed on time; ${cb.totalGSTDelays} delay instances over 12 months` });
  }

  if (cb.epfoRegularity >= 95) {
    drivers.push({ type: "positive", category: "Compliance Behavior", weight: 0.20,
      text: `Consistent EPFO contributions — payroll compliance at ${cb.epfoRegularity}% with no missing months` });
  } else if (cb.epfoRegularity < 60 || cb.missingEPFOMonths >= 3) {
    drivers.push({ type: "negative", category: "Compliance Behavior", weight: 0.20,
      text: `Irregular EPFO contributions — ${cb.missingEPFOMonths} missing months detected; payroll compliance at ${cb.epfoRegularity}%` });
  }

  // ── Operational Continuity drivers ──────────────────────────────────────────
  const oc = subScores.operationalContinuity.breakdown;
  if (oc.employeeTrend > 10) {
    drivers.push({ type: "positive", category: "Operational Continuity", weight: 0.20,
      text: `Growing workforce — employee count trending upward (+${oc.employeeTrend}% slope) indicating business expansion` });
  } else if (oc.employeeTrend < -10) {
    drivers.push({ type: "negative", category: "Operational Continuity", weight: 0.20,
      text: `Declining workforce — employee count trending downward (${oc.employeeTrend}% slope) indicating potential business contraction` });
  }

  if (oc.disconnectionEvents > 0) {
    drivers.push({ type: "negative", category: "Operational Continuity", weight: 0.20,
      text: `${oc.disconnectionEvents} utility disconnection event(s) recorded — indicates payment stress or operational disruption` });
  } else if (oc.utilityPaymentRegularity >= 95) {
    drivers.push({ type: "positive", category: "Operational Continuity", weight: 0.20,
      text: `Zero utility disconnections with ${oc.utilityPaymentRegularity}% payment regularity — consistent operational activity` });
  }

  // ── Financial Resilience drivers ──────────────────────────────────────────
  const fr = subScores.financialResilience.breakdown;
  if (fr.lowBalanceMonths === 0 && fr.bounceIncidents === 0) {
    drivers.push({ type: "positive", category: "Financial Resilience", weight: 0.15,
      text: `Zero low-balance months and zero bounce incidents over 12 months — strong liquidity buffer maintained` });
  } else if (fr.lowBalanceMonths >= 6) {
    drivers.push({ type: "negative", category: "Financial Resilience", weight: 0.15,
      text: `${fr.lowBalanceMonths} months with critically low bank balance — persistent liquidity stress detected` });
  } else if (fr.bounceIncidents >= 5) {
    drivers.push({ type: "negative", category: "Financial Resilience", weight: 0.15,
      text: `${fr.bounceIncidents} payment bounce incidents in 12 months — indicates recurring liquidity shortfalls` });
  }

  if (fr.odCcUtilization > 80) {
    drivers.push({ type: "negative", category: "Financial Resilience", weight: 0.15,
      text: `OD/CC facility utilized at ${fr.odCcUtilization}% — high credit line usage indicates thin liquidity cushion` });
  } else if (fr.odCcUtilization < 30) {
    drivers.push({ type: "positive", category: "Financial Resilience", weight: 0.15,
      text: `Low OD/CC utilization at ${fr.odCcUtilization}% — business not reliant on credit lines; good cash buffer` });
  }

  // ── Cross-validation flag ─────────────────────────────────────────────────
  if (crossValidation.isFlagged) {
    drivers.push({ type: "negative", category: "Cross-Validation", weight: 0.25,
      text: `⚠ Cross-validation alert: GST declared turnover (₹${(crossValidation.totalGSTTurnover/100000).toFixed(1)}L) diverges ${crossValidation.avgDivergence}% from bank/UPI actuals (₹${(crossValidation.totalBankInflow/100000).toFixed(1)}L) — manual verification required` });
  }

  // Sort: positives first by weight, then negatives
  const positives = drivers.filter((d) => d.type === "positive").slice(0, 3);
  const negatives = drivers.filter((d) => d.type === "negative").slice(0, 3);
  const neutral   = drivers.filter((d) => d.type === "neutral").slice(0, 1);

  return { positives, negatives, neutral, all: drivers };
};

// ─────────────────────────────────────────────────────────────────────────────
// Generate underwriter-style narrative note
// ─────────────────────────────────────────────────────────────────────────────
export const generateUnderwriterNote = (scoredMSME, rawMSME, drivers) => {
  const { overallScore, riskBand, recommendedAction, crossValidation, dataSufficiency } = scoredMSME;
  const _band = RISK_BANDS[riskBand];
  const action = ACTIONS[recommendedAction];
  const posDrivers = drivers.positives;
  const negDrivers = drivers.negatives;

  const scoreContext = overallScore >= 700
    ? "demonstrates strong financial health across multiple alternate data dimensions"
    : overallScore >= 450
    ? "presents a mixed financial profile with both positive signals and notable risks"
    : "shows material financial stress across several key dimensions";

  const openingLine = `${rawMSME.name} (${rawMSME.sector}, ${rawMSME.location}) ${scoreContext}, scoring ${overallScore}/1000 on the Financial Health Card.`;

  const posText = posDrivers.length > 0
    ? `Positive signals include: ${posDrivers.map((d) => d.text.replace(/^⚠\s/, "")).join("; ")}.`
    : "No material positive signals identified.";

  const negText = negDrivers.length > 0
    ? `Risk factors include: ${negDrivers.map((d) => d.text.replace(/^⚠\s/, "")).join("; ")}.`
    : "No material risk factors identified.";

  const fraudLine = crossValidation.isFlagged
    ? `\n\n⚠ CROSS-VALIDATION ALERT: Declared GST turnover diverges ${crossValidation.avgDivergence}% from bank and UPI actuals. This requires manual document verification before any credit decision.`
    : "";

  const dataLine = `Data sufficiency: ${dataSufficiency.label} (${dataSufficiency.presentCount}/${dataSufficiency.total} sources with 6+ months history).`;

  const conclusionLine = `Recommended action: ${action.label}.`;

  return `${openingLine}\n\n${posText}\n\n${negText}\n\n${dataLine}\n\n${conclusionLine}${fraudLine}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Portfolio analytics — aggregate stats across all scored MSMEs
// ─────────────────────────────────────────────────────────────────────────────
export const portfolioAnalytics = (scoredMSMEs) => {
  const total = scoredMSMEs.length;
  const low    = scoredMSMEs.filter((m) => m.riskBand === "LOW").length;
  const medium = scoredMSMEs.filter((m) => m.riskBand === "MEDIUM").length;
  const high   = scoredMSMEs.filter((m) => m.riskBand === "HIGH").length;
  const fraudFlags = scoredMSMEs.filter((m) => m.crossValidation.isFlagged).length;

  const avgScore = total === 0 ? 0 : Math.round(
    scoredMSMEs.reduce((s, m) => s + m.overallScore, 0) / total
  );

  const totalLoanAsk = scoredMSMEs.reduce((s, m) => s + m.loanAmountRequested, 0);
  const approvableAsk = scoredMSMEs
    .filter((m) => ["APPROVE", "APPROVE_CONDITIONS"].includes(m.recommendedAction))
    .reduce((s, m) => s + m.loanAmountRequested, 0);

  const actionBreakdown = {};
  scoredMSMEs.forEach((m) => {
    actionBreakdown[m.recommendedAction] = (actionBreakdown[m.recommendedAction] || 0) + 1;
  });

  const scoreDistribution = [
    { range: "800–1000", count: scoredMSMEs.filter((m) => m.overallScore >= 800).length },
    { range: "600–799",  count: scoredMSMEs.filter((m) => m.overallScore >= 600 && m.overallScore < 800).length },
    { range: "400–599",  count: scoredMSMEs.filter((m) => m.overallScore >= 400 && m.overallScore < 600).length },
    { range: "200–399",  count: scoredMSMEs.filter((m) => m.overallScore >= 200 && m.overallScore < 400).length },
    { range: "0–199",    count: scoredMSMEs.filter((m) => m.overallScore < 200).length },
  ];

  return {
    total, low, medium, high, fraudFlags,
    avgScore, totalLoanAsk, approvableAsk,
    actionBreakdown, scoreDistribution,
  };
};
