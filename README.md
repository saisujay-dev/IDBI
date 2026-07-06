# AI-Powered MSME Financial Health Card
### Explainable Credit Scoring for New-to-Credit & New-to-Bank Enterprises

**Version:** 2.0 | **Status:** Working Prototype | **Last updated:** July 2026

> ⚠️ **Demo Notice:** All MSME data in this prototype is **synthetically generated**. Production deployment requires GSP/AA-FIU integration, RBI Digital Lending compliance, DPDP Act 2023 consent framework, and model bias/calibration validation before real underwriting use.

---

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Project Structure

```
idbi/
├── README.md                          ← This file (always up to date)
├── Pasted text.txt                    ← Original problem statement
├── PRD_MSME_Financial_Health_Card.docx
├── Product_Requirements_Document_*.pdf
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx                   ← React entry point with AuthProvider wrapping
        ├── App.jsx                    ← Views (Landing, List, Detail, Portfolio, Methodology) + Protected Routes
        ├── index.css                  ← Premium Apple-inspired glassmorphism styles (with Auth UI)
        ├── auth/
        │   ├── AuthContext.jsx        ← Context for auth, login, signup, Google Sign-In & session persistence
        │   └── AuthModal.jsx          ← Glassmorphism auth modal with animated sliding glider toggle
        ├── data/
        │   └── msmeData.js            ← Synthetic dataset (9 MSMEs, all risk profiles)
        └── engine/
            ├── scoringEngine.js       ← Deterministic scoring formula (transparent)
            └── explainability.js      ← Driver extraction + underwriter narrative
```

---

## Problem Statement

Traditional MSME credit appraisal in India runs almost entirely on audited financials, ITRs, collateral, and bureau history. This structurally excludes **New-to-Credit (NTC)** and **New-to-Bank (NTB)** businesses that are operationally real but financially "thin-file."

**The gap:** no unified, explainable, near-real-time system converts fragmented alternate digital data into a lender-ready financial health assessment.

**One-line summary:** Build an AI-powered, explainable MSME Financial Health Card that uses consented alternate digital data (GST, UPI, AA, EPFO, utilities, bank activity) to assess the creditworthiness of NTC/NTB businesses in near real time — enabling faster, fairer, and more inclusive lending.

---

## Scoring Methodology

The **Financial Health Score (0–1000)** is a deterministic, auditable weighted composite. Weights and thresholds are documented in [`scoringEngine.js`](frontend/src/engine/scoringEngine.js).

### Sub-Scores & Weights

| Dimension | Weight | Data Sources | Key Signals |
|---|---|---|---|
| **Cash-Flow Strength** | 25% | UPI + AA Bank | Net margin, growth trend, payer diversification, inflow/loan ratio |
| **Revenue Consistency** | 20% | GST + UPI | Turnover volatility (CV), active months, GST-UPI alignment |
| **Compliance Behavior** | 20% | GST + EPFO | Filing on-time rate, delay frequency, EPFO regularity |
| **Operational Continuity** | 20% | EPFO + Utility | Employee trend, utility consumption, payment regularity |
| **Financial Resilience** | 15% | AA Bank | Balance buffer, low-balance months, bounces, OD utilization |

### Cross-Validation Check
If declared GST turnover diverges **>40%** from bank/UPI actuals → fraud/inconsistency flag + up to 20% score penalty.

### Risk Bands & Actions

| Score | Band | Recommended Action |
|---|---|---|
| 700–1000 | 🟢 Low Risk | Approve |
| 450–699 | 🟡 Medium Risk | Approve with Conditions / Review |
| 0–449 | 🔴 High Risk | Decline / Request More Data |
| Any | ⚠️ CV Flagged | Review Manually |

---

## Data Sources

| Source | What it captures | Demo status |
|---|---|---|
| **GST Returns** | Monthly turnover, filing regularity, e-invoice count | ✅ Synthetic |
| **UPI Collections** | Daily payment inflows, payer concentration | ✅ Synthetic |
| **Account Aggregator (AA)** | Bank inflow/outflow, balance, bounces, OD/CC | ✅ Synthetic |
| **EPFO Contributions** | Employee count trend, payroll compliance | ✅ Synthetic |
| **Electricity/Utility** | Operational activity proxy, payment regularity | ✅ Synthetic |
| **Bureau Score** | Prior credit history (when available) | ✅ Synthetic (2/9 MSMEs) |

---

## Synthetic Dataset

The prototype includes **9 MSME profiles** covering all meaningful risk scenarios:

| ID | Business | Sector | Risk Profile |
|---|---|---|---|
| MSME-001 | Riya Fabrics Pvt. Ltd. | Textile, Surat | ✅ Strong |
| MSME-002 | TechNova Solutions LLP | IT Services, Pune | ✅ Strong |
| MSME-003 | Kumar Auto Parts | Auto Trade, Kanpur | ❌ Weak (distressed) |
| MSME-004 | Madhya Foods Processing | Food, Bhopal | ❌ Weak (declining) |
| MSME-005 | GreenField Agri Inputs | Agriculture, Nashik | ⚡ Mixed (seasonal) |
| MSME-006 | PrintPro Packaging | Printing, Ahmedabad | ⚡ Mixed (growing, thin) |
| MSME-007 | Srinivas Infra Works | Construction, Hyderabad | ⚡ Mixed (project-based) |
| MSME-008 | MediQuick Distributors | Medical, Delhi | 🚨 Cross-Val Flagged |
| MSME-009 | Jaipur Craft Collective | Handicrafts, Jaipur | 🌱 NTC Strong |

---

## Dashboard Views

### 1. Applications List
- All 9 MSMEs with score, risk band, recommended action, data coverage
- Search by name / sector / location
- Filter by risk band

### 2. MSME Detail View
- **Financial Health Score** (0–1000) with risk band
- **Radar chart** of 5 sub-scores
- **Score breakdown** bar chart per dimension
- **Top 3 positive drivers** + **Top 3 negative drivers** (each tied to actual data)
- **Cash flow chart** (inflow vs. outflow, 12 months)
- **GST vs. UPI alignment chart** (cross-validation visual)
- **Cross-validation alert** if fraud-flagged
- **Data source coverage** chips (which sources present)
- **Underwriter summary note** (auto-generated plain-language narrative)

### 3. Portfolio View
- Risk band distribution (pie chart)
- Score distribution histogram
- Action breakdown
- Sortable full portfolio table

### 4. Methodology
- Full formula documentation
- Risk threshold table
- Regulatory context (RBI Digital Lending, DPDP Act, AA framework)

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19 + Vite 6 | SPA framework |
| **Charts** | Recharts | BarChart, RadarChart, PieChart, LineChart |
| **Icons** | Lucide React | UI icons |
| **Styling** | Vanilla CSS (custom design system) | Dark financial dashboard theme |
| **Fonts** | Inter (Google Fonts) | Professional typography |
| **Scoring** | Pure JS (no ML) | Deterministic, auditable formula |
| **Data** | Synthetic JS objects | All 9 MSME profiles inline |

---

## Architecture

```
Alternate Data Sources (Synthetic for Demo)
GST | UPI | AA Bank | EPFO | Electricity
        ↓
  msmeData.js (Data Layer)
        ↓
  scoringEngine.js (Feature Engineering + Scoring)
  ├── cashFlowStrength()
  ├── revenueConsistency()
  ├── complianceBehavior()
  ├── operationalContinuity()
  ├── financialResilience()
  └── crossValidate() → fraud flag + penalty
        ↓
  explainability.js (Reason Codes + Narrative)
  ├── extractDrivers() → top 3 positive, top 3 negative
  └── generateUnderwriterNote()
        ↓
  App.jsx (Dashboard UI)
  ├── MSMEListView
  ├── MSMEDetailView
  ├── PortfolioView
  └── MethodologyView
```

---

## Regulatory Compliance Context

### RBI Digital Lending Directions
- Regulated entity retains direct accountability for the credit decision
- Explainability layer satisfies auditability and borrower-transparency requirements
- No "black box" — every score traceable to specific data point

### DPDP Act 2023 + DPDP Rules 2025 (notified 13 Nov 2025)
- Phase 2 compliance (13 Nov 2026): Consent Manager registration becomes operational
- Phase 3 compliance (13 May 2027): Full enforcement (consent notices, breach notification, data rights)
- **Design implication:** Consent Manager doubles as AA consent record + DPDP consent record

### Account Aggregator (AA) Framework
- All data access via purpose-bound, revocable consent
- No portal credential scraping; no unrelated device data collection
- Compatible with OCEN and ULI-adjacent workflows

---

## What This Is Not

- ❌ Not a claim of production-grade predictive accuracy
- ❌ Not a replacement for RBI sandbox testing and regulatory sign-off
- ❌ Not trained on real historical credit data (no bias/calibration validation performed)
- ❌ Not connected to real GSP, AA-FIU, or EPFO APIs

---

## Competitive Landscape

| Player | Approach | This System's Differentiation |
|---|---|---|
| **CRIF India MSME Rank** | Bureau-adjacent 13-tier rank | Co-equal 5-source composite vs. bureau anchor |
| **Jocata SME DNA** | GST-first consent-led score | Multi-source parity; explainability-first |
| **Perfios** | Bank-statement cash-flow analytics | + GST/EPFO/utility; built-in fraud cross-check |

---

## Evaluation Metrics (Target for Production)

- Higher approval rate for creditworthy NTC/NTB MSMEs vs. baseline
- Lower default/delinquency rate vs. traditional underwriting
- Faster time-to-decision (target: seconds for cached profile)
- Better precision/recall on risk classification
- Higher onboarding of under-documented MSMEs
- Reduced manual document handling and turnaround time

---

## Changelog

| Date | Version | Changes |
|---|---|---|
| July 2026 | 1.0 | Initial concept + prototype brief (README_2.md) |
| July 2026 | 2.0 | Full working prototype: React SPA, scoring engine, explainability, 9 synthetic MSMEs, 4 dashboard views |
| July 2026 | 2.1 | **Authentication & Design System Overhaul**: Added a secure session-persisted auth system (simulated email/password and Google Sign-In), dynamic public Landing page, custom Access Gate for protected routes, and an animated glassmorphism sliding toggle indicator for Login/Signup transitions. |
