/**
 * MSME Financial Health Card — Scoring Engine
 *
 * Deterministic, transparent scoring formula.
 * Weights and thresholds are documented here (not buried in logic).
 *
 * Overall Score = 0–1000 (higher = healthier)
 * Composed of 5 weighted sub-scores:
 *
 *  1. Cash-Flow Strength         — weight 25%
 *  2. Revenue Consistency        — weight 20%
 *  3. Compliance Behavior        — weight 20%
 *  4. Operational Continuity     — weight 20%
 *  5. Financial Resilience       — weight 15%
 *
 * Cross-validation penalty: applied if GST declared turnover diverges
 * >40% from bank/UPI actuals (fraud/inconsistency flag).
 */

const getActiveWeights = () => {
  try {
    const config = JSON.parse(localStorage.getItem("msme_system_config"));
    if (config && config.weights) {
      return config.weights;
    }
  } catch {}
  return {
    cashFlowStrength:      0.25,
    revenueConsistency:    0.20,
    complianceBehavior:    0.20,
    operationalContinuity: 0.20,
    financialResilience:   0.15,
  };
};

// ── Weight configuration (dynamic getters link to Admin system config) ─────
export const WEIGHTS = {
  get cashFlowStrength() { return getActiveWeights().cashFlowStrength; },
  get revenueConsistency() { return getActiveWeights().revenueConsistency; },
  get complianceBehavior() { return getActiveWeights().complianceBehavior; },
  get operationalContinuity() { return getActiveWeights().operationalContinuity; },
  get financialResilience() { return getActiveWeights().financialResilience; },
};

// ── Risk band thresholds (score out of 1000) ────────────────────────────────
export const RISK_BANDS = {
  LOW:    { min: 700, label: "Low Risk",    color: "#22c55e", bgColor: "#dcfce7" },
  MEDIUM: { min: 450, label: "Medium Risk", color: "#f59e0b", bgColor: "#fef3c7" },
  HIGH:   { min: 0,   label: "High Risk",   color: "#ef4444", bgColor: "#fee2e2" },
};

// ── Recommended actions ─────────────────────────────────────────────────────
export const ACTIONS = {
  APPROVE:            { label: "Approve",                   color: "#22c55e", icon: "check" },
  APPROVE_CONDITIONS: { label: "Approve with Conditions",   color: "#3b82f6", icon: "info" },
  REVIEW_MANUALLY:    { label: "Review Manually",           color: "#f59e0b", icon: "eye" },
  REQUEST_MORE_DATA:  { label: "Request More Data",         color: "#8b5cf6", icon: "upload" },
  DECLINE:            { label: "Decline",                   color: "#ef4444", icon: "x" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper utilities
// ─────────────────────────────────────────────────────────────────────────────

const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));

const avg = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;

const stdDev = (arr) => {
  const mean = avg(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length);
};

const coefficientOfVariation = (arr) => {
  const mean = avg(arr);
  return mean === 0 ? 1 : stdDev(arr) / mean;
};

// Trend slope: positive = growing, negative = declining (normalized to [-1,1])
const trendSlope = (arr) => {
  const n = arr.length;
  const xMean = (n - 1) / 2;
  const yMean = avg(arr);
  const num = arr.reduce((s, v, i) => s + (i - xMean) * (v - yMean), 0);
  const den = arr.reduce((s, _, i) => s + (i - xMean) ** 2, 0);
  const slope = den === 0 ? 0 : num / den;
  return clamp(slope / (yMean || 1), -1, 1);
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-score 1: Cash-Flow Strength (0–1)
// Measures adequacy and growth of net cash flows across UPI + AA bank data
// ─────────────────────────────────────────────────────────────────────────────
const scoreCashFlowStrength = (msme) => {
  const { upi, aaBankData } = msme;

  // Net cash margin (inflow - outflow) / inflow
  const bankNetMargins = aaBankData.monthlyInflow.map(
    (v, i) => aaBankData.monthlyOutflow[i] === 0 ? 0.5 :
              (v - aaBankData.monthlyOutflow[i]) / (v || 1)
  );
  const avgNetMargin = avg(bankNetMargins); // typically -0.2 to 0.4

  // UPI inflow growth trend
  const upiTrend = trendSlope(upi.monthlyInflow);

  // UPI payer diversification (lower concentration = better)
  const diversification = clamp(1 - upi.payerConcentration, 0, 1);

  // Average monthly inflow vs loan ask ratio
  const avgMonthlyInflow = avg(aaBankData.monthlyInflow);
  const inflow_to_loan_ratio = clamp(
    (avgMonthlyInflow * 12) / msme.loanAmountRequested, 0, 3
  ) / 3;

  const raw = (
    clamp((avgNetMargin + 0.1) / 0.5, 0, 1) * 0.35 +
    clamp((upiTrend + 1) / 2, 0, 1)         * 0.25 +
    diversification                           * 0.20 +
    inflow_to_loan_ratio                      * 0.20
  );

  return {
    score: clamp(raw),
    breakdown: {
      avgNetMargin: +(avgNetMargin * 100).toFixed(1),
      upiGrowthTrend: +(upiTrend * 100).toFixed(1),
      payerDiversification: +(diversification * 100).toFixed(0),
      inflowToLoanRatio: +((avgMonthlyInflow * 12 / msme.loanAmountRequested)).toFixed(2),
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-score 2: Revenue Consistency (0–1)
// Measures stability and reliability of GST-declared turnover
// ─────────────────────────────────────────────────────────────────────────────
const scoreRevenueConsistency = (msme) => {
  const { gst, upi } = msme;

  // Filter out zero-turnover months for seasonal businesses
  const nonZeroTurnover = gst.monthlyTurnover.filter((v) => v > 0);
  const cv = coefficientOfVariation(nonZeroTurnover); // lower = more stable
  const cvScore = clamp(1 - cv, 0, 1);

  // Minimum months with revenue (penalize businesses with many zero months)
  const activeMonths = gst.monthlyTurnover.filter((v) => v > 0).length;
  const activenessScore = activeMonths / 12;

  // GST vs UPI alignment (both trending same direction = credibility signal)
  const gstNonZero = gst.monthlyTurnover.map((v, i) =>
    v === 0 ? null : [v, upi.monthlyInflow[i]]
  ).filter(Boolean);
  const correlation = gstNonZero.length > 3 ? clamp(
    1 - Math.abs(
      trendSlope(gstNonZero.map((d) => d[0])) -
      trendSlope(gstNonZero.map((d) => d[1]))
    ) / 2,
    0, 1
  ) : 0.5;

  const raw = cvScore * 0.40 + activenessScore * 0.35 + correlation * 0.25;

  return {
    score: clamp(raw),
    breakdown: {
      coefficientOfVariation: +(cv * 100).toFixed(1),
      activeMonths,
      gstUpiAlignment: +(correlation * 100).toFixed(0),
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-score 3: Compliance Behavior (0–1)
// Measures GST filing regularity + EPFO contribution regularity
// ─────────────────────────────────────────────────────────────────────────────
const scoreComplianceBehavior = (msme) => {
  const { gst, epfo } = msme;

  // GST compliance rate (filed on time / total months)
  const gstScore = clamp(gst.gstCompliance);

  // Filing delays severity (more delays = worse)
  const totalDelays = gst.filingDelays.reduce((s, v) => s + v, 0);
  const delayPenalty = clamp(1 - totalDelays / 12, 0, 1);

  // EPFO regularity
  const epfoScore = clamp(epfo.filingRegularity);

  // Missing EPFO months penalty
  const missingPenalty = clamp(1 - epfo.missingMonths / 12, 0, 1);

  const raw = gstScore * 0.30 + delayPenalty * 0.30 + epfoScore * 0.25 + missingPenalty * 0.15;

  return {
    score: clamp(raw),
    breakdown: {
      gstComplianceRate: +(gst.gstCompliance * 100).toFixed(0),
      totalGSTDelays: totalDelays,
      epfoRegularity: +(epfo.filingRegularity * 100).toFixed(0),
      missingEPFOMonths: epfo.missingMonths,
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-score 4: Operational Continuity (0–1)
// Measures workforce stability (EPFO trend) + utility consumption stability
// ─────────────────────────────────────────────────────────────────────────────
const scoreOperationalContinuity = (msme) => {
  const { epfo, utility } = msme;

  // Employee count trend (growth = good, decline = concerning)
  const empTrend = trendSlope(epfo.employeeCountTrend);
  const empTrendScore = clamp((empTrend + 1) / 2, 0, 1);

  // Employee count stability (CV — lower = more stable)
  const empCV = coefficientOfVariation(epfo.employeeCountTrend);
  const empStability = clamp(1 - empCV, 0, 1);

  // Utility consumption trend (proxy for business activity)
  const nonZeroUnits = utility.monthlyUnits.filter((v) => v > 0);
  const utilityTrend = nonZeroUnits.length > 2 ? trendSlope(nonZeroUnits) : 0;
  const utilityScore = clamp((utilityTrend + 1) / 2, 0, 1);

  // Utility payment regularity
  const utilityRegularity = clamp(utility.paymentRegularity);

  // Disconnection penalty
  const disconnectionPenalty = clamp(1 - utility.disconnectionEvents * 0.3, 0, 1);

  const raw = (
    empTrendScore       * 0.25 +
    empStability        * 0.25 +
    utilityScore        * 0.20 +
    utilityRegularity   * 0.20 +
    disconnectionPenalty * 0.10
  );

  return {
    score: clamp(raw),
    breakdown: {
      employeeTrend: +(empTrend * 100).toFixed(1),
      employeeStability: +(empStability * 100).toFixed(0),
      utilityTrend: +(utilityTrend * 100).toFixed(1),
      utilityPaymentRegularity: +(utility.paymentRegularity * 100).toFixed(0),
      disconnectionEvents: utility.disconnectionEvents,
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-score 5: Financial Resilience (0–1)
// Measures buffer against low-balance and bounce events
// ─────────────────────────────────────────────────────────────────────────────
const scoreFinancialResilience = (msme) => {
  const { aaBankData } = msme;

  // Average balance adequacy (relative to avg inflow)
  const avgInflow = avg(aaBankData.monthlyInflow);
  const balanceRatio = clamp(aaBankData.avgBalance / (avgInflow || 1), 0, 0.5) / 0.5;

  // Low-balance months penalty
  const lowBalancePenalty = clamp(1 - aaBankData.lowBalanceMonths / 6, 0, 1);

  // Bounce incidents severity
  const bouncePenalty = clamp(1 - aaBankData.bounceIncidents / 10, 0, 1);

  // OD/CC utilization (lower = better buffer)
  const odPenalty = clamp(1 - aaBankData.od_cc_utilized, 0, 1);

  const raw = (
    balanceRatio       * 0.30 +
    lowBalancePenalty  * 0.30 +
    bouncePenalty      * 0.25 +
    odPenalty          * 0.15
  );

  return {
    score: clamp(raw),
    breakdown: {
      avgBalanceToInflowRatio: +(aaBankData.avgBalance / (avgInflow || 1) * 100).toFixed(1),
      lowBalanceMonths: aaBankData.lowBalanceMonths,
      bounceIncidents: aaBankData.bounceIncidents,
      odCcUtilization: +(aaBankData.od_cc_utilized * 100).toFixed(0),
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Cross-validation check: GST declared vs. bank/UPI actuals
// Flags if divergence > 40% (potential fraud or mis-reporting)
// ─────────────────────────────────────────────────────────────────────────────
const crossValidate = (msme) => {
  const { gst, upi, aaBankData } = msme;

  const totalGST = gst.totalGSTTurnover;
  const totalUPI = upi.monthlyInflow.reduce((s, v) => s + v, 0);
  const totalBank = aaBankData.monthlyInflow.reduce((s, v) => s + v, 0);

  const upiDivergence = Math.abs(totalGST - totalUPI) / (totalGST || 1);
  const bankDivergence = Math.abs(totalGST - totalBank) / (totalGST || 1);

  const avgDivergence = (upiDivergence + bankDivergence) / 2;
  const flagThreshold = 0.40;

  return {
    totalGSTTurnover: totalGST,
    totalUPIInflow: totalUPI,
    totalBankInflow: totalBank,
    upiDivergence: +(upiDivergence * 100).toFixed(1),
    bankDivergence: +(bankDivergence * 100).toFixed(1),
    avgDivergence: +(avgDivergence * 100).toFixed(1),
    isFlagged: avgDivergence > flagThreshold,
    flagMessage: avgDivergence > flagThreshold
      ? `GST declared turnover diverges ${(avgDivergence * 100).toFixed(0)}% from bank/UPI actuals — manual verification required before underwriting`
      : null,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Data sufficiency indicator
// How many of the 5 data sources are present and have ≥6 months of history
// ─────────────────────────────────────────────────────────────────────────────
const dataSufficiency = (msme) => {
  const checks = [
    { source: "GST", present: msme.gst.monthlyTurnover.filter((v) => v > 0).length >= 6 },
    { source: "UPI", present: msme.upi.monthlyInflow.filter((v) => v > 0).length >= 6 },
    { source: "AA Bank Data", present: msme.aaBankData.monthlyInflow.filter((v) => v > 0).length >= 6 },
    { source: "EPFO", present: msme.epfo.monthlyContributions.filter((v) => v > 0).length >= 6 },
    { source: "Utility", present: msme.utility.monthlyUnits.filter((v) => v > 0).length >= 6 },
  ];
  const presentCount = checks.filter((c) => c.present).length;
  const bureauNote = msme.bureau.available ? " + Bureau score available" : "";
  return {
    sources: checks,
    presentCount,
    total: 5,
    percentComplete: +(presentCount / 5 * 100).toFixed(0),
    label: presentCount >= 4 ? "High" : presentCount >= 2 ? "Medium" : "Low",
    bureauNote,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Risk classification and recommended action
// ─────────────────────────────────────────────────────────────────────────────
const classifyRisk = (overallScore, crossVal, dataSuf, msme) => {
  let band;
  if (overallScore >= RISK_BANDS.LOW.min)    band = "LOW";
  else if (overallScore >= RISK_BANDS.MEDIUM.min) band = "MEDIUM";
  else band = "HIGH";

  // Override to manual review if fraud flagged
  const isFraud = crossVal.isFlagged;
  const dataThin = dataSuf.percentComplete < 60;

  let action;
  if (isFraud) {
    action = "REVIEW_MANUALLY";
  } else if (band === "LOW" && !dataThin) {
    action = "APPROVE";
  } else if (band === "LOW" && dataThin) {
    action = "APPROVE_CONDITIONS";
  } else if (band === "MEDIUM" && !dataThin) {
    action = "APPROVE_CONDITIONS";
  } else if (band === "MEDIUM" && dataThin) {
    action = "REQUEST_MORE_DATA";
  } else if (band === "HIGH" && dataSuf.percentComplete >= 80) {
    action = "DECLINE";
  } else {
    action = "REQUEST_MORE_DATA";
  }

  // Loan-to-income check
  const annualInflow = avg(msme.aaBankData.monthlyInflow) * 12;
  const loanToIncomeRatio = msme.loanAmountRequested / (annualInflow || 1);
  if (loanToIncomeRatio > 1.5 && band !== "HIGH") {
    action = action === "APPROVE" ? "APPROVE_CONDITIONS" : action;
  }

  return { band, action, loanToIncomeRatio: +loanToIncomeRatio.toFixed(2) };
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN: Score a single MSME
// ─────────────────────────────────────────────────────────────────────────────
export const scoreMSME = (msme) => {
  const cashFlow     = scoreCashFlowStrength(msme);
  const revenue      = scoreRevenueConsistency(msme);
  const compliance   = scoreComplianceBehavior(msme);
  const operations   = scoreOperationalContinuity(msme);
  const resilience   = scoreFinancialResilience(msme);

  const compositeRaw = (
    cashFlow.score    * WEIGHTS.cashFlowStrength      +
    revenue.score     * WEIGHTS.revenueConsistency    +
    compliance.score  * WEIGHTS.complianceBehavior    +
    operations.score  * WEIGHTS.operationalContinuity +
    resilience.score  * WEIGHTS.financialResilience
  );

  // Cross-validation penalty: up to 20% reduction for divergence
  const crossVal = crossValidate(msme);
  const fraudPenalty = crossVal.isFlagged
    ? clamp(crossVal.avgDivergence / 100 * 0.20, 0, 0.20)
    : 0;

  const penalizedScore = clamp(compositeRaw * (1 - fraudPenalty));
  const overallScore   = Math.round(penalizedScore * 1000);

  const dataSuf  = dataSufficiency(msme);
  const risk     = classifyRisk(overallScore, crossVal, dataSuf, msme);

  const subScores = {
    cashFlowStrength:      { score: Math.round(cashFlow.score * 1000),    weight: WEIGHTS.cashFlowStrength,      breakdown: cashFlow.breakdown },
    revenueConsistency:    { score: Math.round(revenue.score * 1000),     weight: WEIGHTS.revenueConsistency,    breakdown: revenue.breakdown },
    complianceBehavior:    { score: Math.round(compliance.score * 1000),  weight: WEIGHTS.complianceBehavior,    breakdown: compliance.breakdown },
    operationalContinuity: { score: Math.round(operations.score * 1000),  weight: WEIGHTS.operationalContinuity, breakdown: operations.breakdown },
    financialResilience:   { score: Math.round(resilience.score * 1000),  weight: WEIGHTS.financialResilience,   breakdown: resilience.breakdown },
  };

  return {
    id: msme.id,
    name: msme.name,
    overallScore,
    subScores,
    crossValidation: crossVal,
    dataSufficiency: dataSuf,
    riskBand: risk.band,
    recommendedAction: risk.action,
    loanToIncomeRatio: risk.loanToIncomeRatio,
    fraudPenaltyApplied: +(fraudPenalty * 100).toFixed(1),
    riskBandConfig: RISK_BANDS[risk.band],
    actionConfig: ACTIONS[risk.action],
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Score all MSMEs in the dataset
// ─────────────────────────────────────────────────────────────────────────────
export const scoreAllMSMEs = (msmeList) =>
  msmeList.map((msme) => ({ ...msme, ...scoreMSME(msme) }));
