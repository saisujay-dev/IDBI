# AI-Powered MSME Financial Health Card
### Explainable Credit Scoring for New-to-Credit & New-to-Bank Enterprises

**Version:** 1.0 | **Status:** Concept + Prototype Brief | **Owner:** Om | **Last updated:** July 2026

---

## 1. Problem Statement (Understood)

Traditional MSME credit appraisal in India runs almost entirely on audited financials, ITRs, collateral, and bureau history. This structurally excludes **New-to-Credit (NTC)** and **New-to-Bank (NTB)** businesses that are operationally real but financially "thin-file" — they have no borrowing history, but they *do* leave behind a rich digital trail: GST filings, UPI collections, Account Aggregator-consented bank data, EPFO payroll contributions, and utility usage.

**The gap:** there is no unified, explainable, near-real-time system that turns this fragmented alternate data into a lender-ready financial health assessment. The result is slow underwriting, high false-rejection rates, and millions of viable MSMEs locked out of formal credit.

**The ask:** an AI/ML system that aggregates consented alternate data, engineers risk-relevant features, produces a transparent multidimensional score (not a black box), classifies risk (Low/Medium/High), and hands bankers a dashboard with reasons — not just a number — so the decision stays auditable and defensible.

---

## 2. Solution at a Glance

| Layer | Purpose |
|---|---|
| **Consent & Ingestion** | Source-wise, purpose-bound consent capture (AA-aligned); connectors for GST, UPI, AA, EPFO, electricity, bank statements |
| **Cleaning & Reconciliation** | Normalize, timestamp, and cross-validate multi-source data (e.g. declared turnover vs. GST vs. bank inflows) |
| **Feature Engineering** | Cash flow, compliance, momentum, volatility, seasonality, resilience, concentration risk |
| **Scoring Engine** | Interpretable scorecard + ML layer → Financial Health Score (0–1000) + sub-scores |
| **Explainability Layer** | SHAP-style reason codes, top positive/negative drivers, monotonic constraints |
| **Risk Classification** | Low / Medium / High + confidence/data-sufficiency indicator |
| **Dashboard** | Banker/credit-manager facing view with drill-down, recommended action, monitoring |

**Scope note:** GST, EPFO, and AA don't expose simple public APIs — real integration needs GSP/FIU partnerships. The build prompt in Section 8 targets a **realistic demo/prototype**: synthetic-but-representative data feeding a real scoring + explainability pipeline, so the methodology and UX are genuine even though the data sources are simulated.

---

## 3. Competitive Landscape & Differentiation

This space is not empty — three players already do parts of this:

- **CRIF India's MSME Rank** offers a 13-tier commercial risk rank for MSME credit assessment, positioned as a bureau-adjacent analytics layer for lenders.
- **Jocata** runs "SME DNA," a consent-led GST-data score that produces Go/No-Go underwriting decisions in under two minutes, plus a "Retail Persona" model built on banking transaction data for MSMEs outside the GST net, and "Sumpoorn," an MSME economic activity index built with SIDBI.
- **Perfios** does alternate-data cash-flow analytics for lenders, primarily bank-statement and transaction-pattern driven.

**Where this concept differs, honestly stated:**
- Most existing tools anchor on *one* dominant source (GST-first for Jocata's flagship product, bank-statement-first for Perfios) and treat other sources as supplementary. This design treats five sources — GST, UPI, AA banking data, EPFO, utilities — as co-equal inputs to a single composite score, which is harder to build but produces a more defensible picture for genuinely thin-file businesses that may be strong on one source and silent on another.
- Explainability here is designed in from the start as a *user-facing* reason-code system, not just a model-audit artifact — the credit manager sees why, not just what.
- The cross-validation layer (declared turnover vs. GST vs. bank inflow) is an explicit fraud/inconsistency check baked into the core score, not a bolt-on.
- Post-disbursal monitoring reuses the same scoring pipeline for early-warning deterioration alerts, so the product doesn't stop at the underwriting decision.

**What this is not:** a claim that this system is more accurate than CRIF or Jocata's production models — those are institutionally validated at scale. The honest differentiation is architectural breadth and explainability posture, not proven predictive performance.

---

## 4. Regulatory & Compliance Coverage

Two regimes apply, and both need to be named explicitly — not just "RBI digital lending" in general terms:

**RBI Digital Lending Directions** — require the regulated entity to remain directly accountable for the lending decision even when a data/scoring vendor is involved, mandate borrower-facing transparency on how a decision was reached, and prohibit collection of data (contacts, call logs, unrelated device data) beyond what's needed for the credit decision. This system's explainability layer and consent manager are designed to satisfy that accountability and transparency requirement directly.

**Digital Personal Data Protection (DPDP) Act, 2023 + DPDP Rules, 2025** — this was missing from the original PRD and matters here because GST, bank, and EPFO data are all personal/business data under this law. Current status: the DPDP Rules were notified on **13 November 2025**, and enforcement is staggered in three phases — Phase 1 (Nov 2025): Data Protection Board of India established; Phase 2 (13 Nov 2026): Consent Manager registration framework becomes operational; Phase 3 (13 May 2027): full substantive compliance becomes enforceable, including consent notices, breach notification within 72 hours, data principal rights, and mandatory security safeguards like encryption, access logging, and controlled retention.

**Design implication for this project:** the Consent Manager module (Section 4.2 of the source PRD) should be built to double as a DPDP-compliant consent record from day one — same consent capture, purpose limitation, and retention logic serves both AA's consent framework and DPDP obligations, rather than building two separate consent systems later.

---

## 5. User Personas

| Persona | Role | What they need from this system |
|---|---|---|
| **Credit Manager / Underwriter** | Reviews individual loan applications | A score they can defend in an audit — not just a number, but the specific data points behind it |
| **Portfolio Risk Manager** | Monitors the back book post-disbursal | Early-warning signals on deteriorating accounts, aggregated portfolio risk view |
| **Compliance Officer** | Owns audit and regulatory response | Full consent trail, model version history, and decision logs per applicant |
| **MSME Applicant** (indirect user) | Receives the credit decision | Plain-language explanation of why they were approved, conditioned, or declined |

---

## 6. Non-Functional Requirements

- **Latency:** Score generation should complete in seconds for a cached/complete data profile; near-real-time refresh (not literal real-time) when a new GST/bank/UPI signal arrives, on the order of minutes to hours, not instant.
- **Auditability:** Every score must be reproducible — same inputs plus same model version must yield the same output and the same reason codes, indefinitely, for regulatory replay.
- **Data retention:** Aligned to DPDP's purpose-limitation principle — retain only as long as needed for the credit decision and monitoring period, with defined deletion timelines.
- **Explainability latency:** Reason codes must generate alongside the score, not as a slower secondary process — a score without its reasons should never be shown standalone in the UI.

---

## 7. Phased Scope: Demo vs. Full Vision

| | MVP / Hackathon Demo (this build) | Full Production Vision |
|---|---|---|
| Data | Synthetic data simulating all 5 sources | Live GSP/AA-FIU/EPFO integrations |
| Scoring | Transparent weighted formula, rule-based | Formula + trained ML layer with monotonic constraints |
| Validation | None (demo only) | Bias checks, calibration, out-of-time testing |
| Consent | Simulated consent flow in UI | DPDP + AA-compliant Consent Manager, registered |
| Monitoring | Static portfolio view | Live monthly deterioration alerting |
| Compliance | Documented as a design intent | Legal/regulatory sign-off, RBI sandbox testing |

Being explicit about this split is itself a strength in a submission — it shows the team knows the difference between a demo and a bankable product, rather than overclaiming production-readiness on synthetic data.

---

## 8. AI Build Prompt

Copy the block below into Claude Code, Claude (chat), or any coding-capable AI tool to scaffold the working prototype.

```
You are building a working prototype of an "AI-Powered MSME Financial Health Card" —
a fintech dashboard that scores New-to-Credit / New-to-Bank MSMEs for creditworthiness
using alternate digital data, and explains the score instead of hiding it behind a
black box.

CONTEXT / WHO THIS IS FOR
This is a lender-facing tool. The primary user is a bank credit manager or underwriter
reviewing a thin-file MSME loan application. They need to trust the score, so every
number on screen must be traceable to a reason.

WHAT TO BUILD
A full-stack single-page app (React frontend + FastAPI backend, or a self-contained
React artifact if backend isn't feasible) with:

1. SYNTHETIC DATA LAYER
   Generate realistic mock data for a set of 6-10 sample MSMEs, simulating:
   - GST returns (monthly filed turnover, filing regularity/delays)
   - UPI collections (daily/monthly inflow patterns, payer concentration)
   - Account Aggregator bank transaction summaries (inflow/outflow, average balance,
     bounce/low-balance incidents)
   - EPFO contributions (employee count trend, contribution regularity)
   - Electricity/utility consumption (monthly units, payment regularity)
   Vary the businesses across risk profiles: at least 2 clearly strong, 2 clearly weak,
   2-3 ambiguous/mixed-signal cases (this matters — a demo where every business is
   obviously good or bad proves nothing).

2. SCORING ENGINE (deterministic, explainable — not a real ML model)
   Compute 5 weighted sub-scores per business:
     - Cash-flow strength
     - Revenue consistency
     - Compliance behavior (GST filing regularity, EPFO regularity)
     - Operational continuity (employee/utility stability)
     - Financial resilience (buffer against low-balance/bounce events)
   Combine into an Overall Financial Health Score (0-1000) using a transparent
   weighted formula (document the weights in a comments/config file, not buried in
   logic — this is the whole point of "explainable").
   Add a simple cross-validation check: flag if declared/GST turnover diverges
   significantly from bank/UPI inflow (this is the fraud/anomaly signal).

3. EXPLAINABILITY LAYER
   For each score, generate:
     - Top 3 positive drivers (e.g. "Consistent UPI inflows over 6 months")
     - Top 3 negative drivers (e.g. "2 GST filing delays in last quarter")
     - A confidence/data-sufficiency indicator (how many of the 5 data sources are
       present and how many months of history exist)
   Every driver must reference the actual underlying data point, not a vague label.

4. RISK CLASSIFICATION + RECOMMENDED ACTION
   Map score to Low/Medium/High risk band, and to a recommended action:
   approve / approve with conditions / review manually / request more data / decline.
   Show the threshold logic plainly (no hidden cutoffs).

5. DASHBOARD UI
   - MSME list view: name, score, risk band, one-line status
   - MSME detail view: score breakdown (radial/bar chart of the 5 sub-scores),
     driver list (positive/negative), raw data source summary, recommended action,
     a "why this score" panel that reads like an underwriter's note, not jargon
   - A simple portfolio view: distribution of scores/risk bands across all MSMEs
   - Aesthetic: professional financial-services dashboard — clean, data-dense,
     trustworthy. Think Stripe/Plaid dashboard conventions: neutral background,
     one accent color for risk bands (e.g. green/amber/red used sparingly and
     consistently), clear typographic hierarchy. Avoid a "hackathon neon" look.

6. HONEST LIMITATIONS PANEL (include this — it's a strength, not a weakness)
   Add a visible note in the UI or README stating: data sources are synthetic for
   demo purposes; production deployment requires GSP/AA-FIU integration, RBI digital
   lending and DPDP Act compliance review, and model validation (bias/calibration/
   out-of-time testing) before real underwriting use.

TECH CONSTRAINTS
- Frontend: React, Tailwind (core utility classes only), recharts for charts
- Backend: FastAPI if a real backend is used; otherwise keep all logic in
  well-organized frontend modules/state
- No external paid APIs — everything data-related must be synthetic/mocked
- Keep the scoring logic in a clearly separated, commented module so a reviewer
  can audit the formula independent of the UI code

DELIVERABLES
- Working app (all screens above)
- A short in-app or README note explaining the scoring formula in plain language
- Clean, presentable code — this will be reviewed/demoed live
```

---

## 9. Note on the Source PRD

The original PRD's Section 4.2 ("Suggested Modules") appears twice in the source document — once after the workflow diagram, and again duplicated after the Conclusion, most likely an export/copy-paste artifact. This README treats the module list as it appears the first time; the duplicate should be deleted from the source file before it's shared externally.

---

## 10. Implemented Prototype Enhancements (July 2026 Build)

We have successfully implemented a complete **Role-Based Authentication, KYC Verification, and Loan Request Workflow** on top of the original credit scoring logic, preserving all Recharts visualizations and explainability metrics.

### Key Implemented Features

1. **Role-Based Access Control**:
   - Designed a secure entry **Access Portal** when clicking **Log In**.
   - Three distinct roles: **MSME Applicant (User)**, **Bank Employee**, and **Super Admin**.
   - Secure routing namespace guards automatically redirect logged-in users to their respective portals.

2. **Simplified Onboarding & Dual Login**:
   - Applicants sign up using only **Full Name, Email, Mobile, and Password**. Sensitive identifiers (Aadhaar, PAN, GSTIN) are deferred to the application stage.
   - Built a simulated **6-Digit Email OTP Overlay** (default verification code: `123456`).
   - Supports dual-credential login (verifying using either registered Email or Mobile).

3. **Applicant KYC & Alternative Data Consent**:
   - **Pending-KYC Dashboard**: Newly registered applicants see a warning block preventing loan reviews until KYC is done.
   - **Multi-Step KYC Form**: Clicking "Apply for Loan" triggers the verification wizard:
     - **Step 1 (Personal ID)**: Aadhaar (12 digits) & PAN (10 chars).
     - **Step 2 (Business Details)**: Business Name, Structure Type, Address, and GSTIN (15 chars).
     - **Step 3 (Feeds Consent)**: Grants explicit permission to ingest monthly GST filings, UPI collection volumes, Account Aggregator ledgers, EPFO payroll, and utility payments.
   - **Background Auto-Mapping**: Maps the applicant to the corresponding synthetic seed profile (e.g. entering seed GSTIN `08IIIII9999I9Z9` maps to *Jaipur Craft Collective*). If no match is found, defaults to `MSME-009` to generate a realistic credit scorecard.

4. **Enhanced Settings Portal**:
   - **Account**: Update profile contact parameters and change passwords.
   - **Loan Services**: Manage and toggle DPDP data consents.
   - **Alert Notifications**: Manage Email/SMS preferences.
   - **Security**: Monitor active device sessions (user agents, IPs) and login history registries.
   - **Help & Live Support**:
     - Accordion FAQs for common underwriting questions.
     - Prototype Live Chat answering dynamic query terms (e.g. `score`, `loan`, `revoke`).
     - Raise Complaint forms creating reference tickets.
     - Rating and Feedback inputs.
   - **Prominent Logout**: Dialog overlay modal confirming log out actions.
