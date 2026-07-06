import { useState, useMemo, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from "recharts";
import { MSME_DATA } from "./data/msmeData";
import { scoreAllMSMEs, RISK_BANDS, ACTIONS, WEIGHTS } from "./engine/scoringEngine";
import {
  extractDrivers,
  generateUnderwriterNote,
  portfolioAnalytics,
} from "./engine/explainability";
import { useAuth } from "./auth/AuthContext";
import AuthModal from "./auth/AuthModal";
import "./index.css";

// ── Pre-compute all scores ──────────────────────────────────────────────────
const SCORED = scoreAllMSMEs(MSME_DATA);

// ── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("en-IN").format(n);
const fmtL = (n) => `₹${(n / 100000).toFixed(1)}L`;
const pct = (n) => `${n}%`;

const scoreColor = (score) => {
  if (score >= 700) return "var(--risk-low-color)";
  if (score >= 450) return "var(--risk-medium-color)";
  return "var(--risk-high-color)";
};

const SUB_SCORE_NAMES = {
  cashFlowStrength:      "Cash-Flow Strength",
  revenueConsistency:    "Revenue Consistency",
  complianceBehavior:    "Compliance Behavior",
  operationalContinuity: "Operational Continuity",
  financialResilience:   "Financial Resilience",
};

// ── User Avatar ─────────────────────────────────────────────────────────────
function UserAvatar({ user, size = 32 }) {
  return (
    <div
      className="nav-avatar"
      style={{
        width: size,
        height: size,
        background: user.color || "#4F9DFF",
        fontSize: Math.round(size * 0.38),
      }}
      title={user.name}
      aria-label={`Signed in as ${user.name}`}
    >
      {user.initials || (user.name ? user.name[0].toUpperCase() : "?")}
    </div>
  );
}

// ── Landing View (public, no auth required) ───────────────────────────────────
function LandingView({ onGetStarted, onLogin }) {
  return (
    <div className="landing fade-in">
      {/* Hero */}
      <div className="landing-hero">
        <div className="landing-eyebrow">
          <span>🏦</span>
          <span>IDBI Bank · Prototype</span>
        </div>
        <h1 className="landing-title">
          AI-Powered{" "}
          <span className="landing-title-accent">MSME Financial</span>
          <br />
          Health Card
        </h1>
        <p className="landing-subtitle">
          Explainable credit scoring for New-to-Credit &amp; New-to-Bank enterprises
          using alternate digital data — GST, bank cash flows, UPI, EPFO, and utility
          signals — with full auditability.
        </p>
        <div className="landing-cta">
          <button className="landing-btn-primary" onClick={onGetStarted}>
            Get Started Free →
          </button>
          <button className="landing-btn-secondary" onClick={onLogin}>
            Log In
          </button>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="landing-features">
        <div className="feature-card">
          <span className="feature-icon">📊</span>
          <div className="feature-title">Deterministic Scoring</div>
          <p className="feature-desc">
            A transparent, auditable 0–1000 score computed from 5 independent
            sub-dimensions — no black-box ML, every parameter documented.
          </p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">🛡️</span>
          <div className="feature-title">Cross-Validation Engine</div>
          <p className="feature-desc">
            Automatic fraud detection by cross-validating GST declared turnover
            against bank inflows and UPI actuals, with configurable penalty bands.
          </p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">⚡</span>
          <div className="feature-title">Alternate Data Sources</div>
          <p className="feature-desc">
            Scores built from Account Aggregator data — GST, bank statements,
            UPI flows, EPFO contributions, and utility consumption patterns.
          </p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">📋</span>
          <div className="feature-title">Portfolio Risk View</div>
          <p className="feature-desc">
            Aggregate risk distribution, score histograms, recommended action
            breakdowns, and total pipeline analytics across all applications.
          </p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">🔍</span>
          <div className="feature-title">Underwriter Summaries</div>
          <p className="feature-desc">
            AI-generated natural language summaries highlighting key positive
            drivers and risk factors for each MSME application.
          </p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">⚖️</span>
          <div className="feature-title">Regulatory Compliant</div>
          <p className="feature-desc">
            Designed around RBI Digital Lending Directions, DPDP Act 2023,
            and the Account Aggregator consent architecture.
          </p>
        </div>
      </div>

      {/* Trust strip */}
      <div className="landing-trust">
        <div className="trust-item"><span>🔒</span><span>Secure by design</span></div>
        <div className="trust-item"><span>📑</span><span>RBI compliant</span></div>
        <div className="trust-item"><span>🏛️</span><span>DPDP Act 2023</span></div>
        <div className="trust-item"><span>🔗</span><span>AA Framework</span></div>
        <div className="trust-item"><span>🧪</span><span>Prototype · Demo data</span></div>
      </div>
    </div>
  );
}

// ── Access Gate (shown when unauthenticated user hits a protected view) ────────
function AccessGate() {
  const { openAuth } = useAuth();
  return (
    <div className="access-gate fade-in">
      <div className="access-gate-icon">🔐</div>
      <h2 className="access-gate-title">Authentication Required</h2>
      <p className="access-gate-subtitle">
        Please log in to access the MSME dashboard, portfolio, and analytics.
      </p>
      <button className="access-gate-btn" onClick={() => openAuth("login")}>
        Log In to Continue
      </button>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>
        Don't have an account?{" "}
        <button
          style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 12, fontFamily: "var(--font-sans)", fontWeight: 600 }}
          onClick={() => openAuth("signup")}
        >
          Sign up free
        </button>
      </p>
    </div>
  );
}

// ── Topbar ──────────────────────────────────────────────────────────────────
function Topbar({ view, setView }) {
  const { user, openAuth, logout } = useAuth();

  return (
    <header className="topbar">
      {/* Logo — clickable, goes to home or list */}
      <div
        className="topbar-logo"
        style={{ cursor: "pointer" }}
        onClick={() => setView(user ? "list" : "home")}
        role="link"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setView(user ? "list" : "home")}
      >
        <div className="logo-icon">🏦</div>
        <span>MSME Financial Health Card</span>
      </div>

      {/* Navigation — only shown when logged in */}
      {user && (
        <nav className="topbar-nav">
          <button className={`nav-btn ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>
            Applications
          </button>
          <button className={`nav-btn ${view === "portfolio" ? "active" : ""}`} onClick={() => setView("portfolio")}>
            Portfolio View
          </button>
          <button className={`nav-btn ${view === "methodology" ? "active" : ""}`} onClick={() => setView("methodology")}>
            Methodology
          </button>
        </nav>
      )}

      {/* Right side */}
      <div className="topbar-right">
        <span className="demo-badge">PROTOTYPE · DEMO DATA</span>

        {user ? (
          /* Logged-in: avatar + name + logout */
          <div className="nav-user">
            <div className="nav-user-info">
              <UserAvatar user={user} />
              <span className="nav-user-name">{user.name}</span>
            </div>
            <button className="btn-logout" onClick={logout} type="button">
              Log Out
            </button>
          </div>
        ) : (
          /* Logged-out: login + signup buttons */
          <div className="nav-auth-buttons">
            <button className="btn-login" onClick={() => openAuth("login")} type="button">
              Log In
            </button>
            <button className="btn-signup" onClick={() => openAuth("signup")} type="button">
              Sign Up
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

// ── Disclaimer Banner ───────────────────────────────────────────────────────
function DisclaimerBanner() {
  return (
    <div className="disclaimer-banner">
      <span style={{ flexShrink: 0 }}>ℹ️</span>
      <div>
        <strong>Demo Notice:</strong> All MSME data is <strong>synthetically generated</strong> for
        prototype demonstration only. Production deployment requires GSP/AA-FIU integration,
        RBI Digital Lending compliance, DPDP Act 2023 consent framework, and model bias/calibration
        validation before real underwriting use.
      </div>
    </div>
  );
}

// ── Risk Badge ──────────────────────────────────────────────────────────────
function RiskBadge({ band, isFraud }) {
  if (isFraud) return <span className="risk-badge FLAG">⚠ Cross-Val Flag</span>;
  return <span className={`risk-badge ${band}`}>{RISK_BANDS[band].label}</span>;
}

// ── Score Bar ───────────────────────────────────────────────────────────────
function ScoreBar({ score, showValue = true }) {
  const color = scoreColor(score);
  return (
    <div className="score-bar-container">
      <div className="score-bar-track">
        <div
          className="score-bar-fill"
          style={{ width: `${score / 10}%`, background: color }}
        />
      </div>
      {showValue && (
        <span className="score-value-inline" style={{ color }}>
          {score}
        </span>
      )}
    </div>
  );
}

// ── MSME List View ──────────────────────────────────────────────────────────
function MSMEListView({ onSelect }) {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");

  const filtered = useMemo(() =>
    SCORED.filter((m) => {
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
                          m.sector.toLowerCase().includes(search.toLowerCase()) ||
                          m.location.toLowerCase().includes(search.toLowerCase());
      const matchRisk = riskFilter === "ALL" || m.riskBand === riskFilter;
      return matchSearch && matchRisk;
    }),
    [search, riskFilter]
  );

  const stats = portfolioAnalytics(SCORED);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">MSME Credit Applications</h1>
        <p className="page-subtitle">
          Financial Health Card scoring for New-to-Credit &amp; New-to-Bank enterprises
        </p>
      </div>

      <DisclaimerBanner />

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Applications</div>
          <div className="stat-value" style={{ color: "var(--accent-blue-light)" }}>{stats.total}</div>
          <div className="stat-sub">in pipeline</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Low Risk</div>
          <div className="stat-value" style={{ color: "var(--risk-low-color)" }}>{stats.low}</div>
          <div className="stat-sub">eligible for approval</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Medium Risk</div>
          <div className="stat-value" style={{ color: "var(--risk-medium-color)" }}>{stats.medium}</div>
          <div className="stat-sub">need review</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">High Risk</div>
          <div className="stat-value" style={{ color: "var(--risk-high-color)" }}>{stats.high}</div>
          <div className="stat-sub">decline / more data</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Health Score</div>
          <div className="stat-value" style={{ color: scoreColor(stats.avgScore) }}>{stats.avgScore}</div>
          <div className="stat-sub">out of 1000</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cross-Val Flags</div>
          <div className="stat-value" style={{ color: stats.fraudFlags > 0 ? "#f97316" : "var(--text-secondary)" }}>
            {stats.fraudFlags}
          </div>
          <div className="stat-sub">requiring manual check</div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-toolbar">
          <input
            className="search-input"
            placeholder="Search by name, sector, or location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="filter-select"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            <option value="ALL">All Risk Bands</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)" }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        <table className="msme-table">
          <thead>
            <tr>
              <th>Business</th>
              <th>Sector</th>
              <th>Loan Ask</th>
              <th>Overall Score</th>
              <th>Risk Band</th>
              <th>Action</th>
              <th>Data Coverage</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} onClick={() => onSelect(m)}>
                <td>
                  <div className="msme-name-cell">
                    <span className="msme-name-primary">{m.name}</span>
                    <span className="msme-name-sub">{m.location} · {m.vintage} vintage</span>
                  </div>
                </td>
                <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>{m.sector}</td>
                <td style={{ fontWeight: 600 }}>{fmtL(m.loanAmountRequested)}</td>
                <td style={{ width: 180 }}>
                  <ScoreBar score={m.overallScore} />
                </td>
                <td>
                  <RiskBadge band={m.riskBand} isFraud={m.crossValidation.isFlagged} />
                </td>
                <td>
                  <span
                    className="action-badge"
                    style={{
                      background: `${m.actionConfig.color}18`,
                      color: m.actionConfig.color,
                      border: `1px solid ${m.actionConfig.color}40`,
                    }}
                  >
                    {m.actionConfig.label}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {m.dataSufficiency.presentCount}/5 sources
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── MSME Detail View ─────────────────────────────────────────────────────────
function MSMEDetailView({ msme, onBack }) {
  const rawMSME = MSME_DATA.find((m) => m.id === msme.id);
  const drivers = extractDrivers(msme, rawMSME);
  const note    = generateUnderwriterNote(msme, rawMSME, drivers);

  const radarData = Object.entries(msme.subScores).map(([key, val]) => ({
    subject: SUB_SCORE_NAMES[key],
    score: Math.round(val.score / 10),
    fullMark: 100,
  }));

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const cashflowData = monthLabels.map((m, i) => ({
    month: m,
    Inflow:  Math.round(rawMSME.aaBankData.monthlyInflow[i] / 1000),
    Outflow: Math.round(rawMSME.aaBankData.monthlyOutflow[i] / 1000),
  }));

  const gstData = monthLabels.map((m, i) => ({
    month: m,
    "GST Turnover": Math.round(rawMSME.gst.monthlyTurnover[i] / 1000),
    "UPI Inflow":   Math.round(rawMSME.upi.monthlyInflow[i] / 1000),
  }));

  return (
    <div className="fade-in">
      <button className="back-btn" onClick={onBack}>
        ← Back to Applications
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 className="page-title">{msme.name}</h1>
          <p className="page-subtitle">
            {rawMSME.sector} · {rawMSME.location} · {rawMSME.vintage} vintage · {rawMSME.employees} employees
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
            Udyam: {rawMSME.udyam} · ID: {msme.id}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <RiskBadge band={msme.riskBand} isFraud={msme.crossValidation.isFlagged} />
          <div style={{ marginTop: 6 }}>
            <span
              className="action-badge"
              style={{
                background: `${msme.actionConfig.color}18`,
                color: msme.actionConfig.color,
                border: `1px solid ${msme.actionConfig.color}40`,
              }}
            >
              {msme.actionConfig.label}
            </span>
          </div>
        </div>
      </div>

      <DisclaimerBanner />

      {/* Score Hero + Radar */}
      <div className="grid-2" style={{ marginBottom: 16 }}>
        {/* Overall Score Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Financial Health Score</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {msme.dataSufficiency.presentCount}/5 data sources
            </span>
          </div>
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div className="score-number" style={{ color: scoreColor(msme.overallScore) }}>
              {msme.overallScore}
            </div>
            <div className="score-max" style={{ marginTop: 4 }}>/1000</div>
            <div style={{ marginTop: 12 }}>
              <RiskBadge band={msme.riskBand} isFraud={msme.crossValidation.isFlagged} />
            </div>
          </div>
          <div className="section-divider" />
          {/* Key metrics */}
          <div className="metric-grid">
            <div className="metric-item">
              <div className="metric-item-label">Loan Requested</div>
              <div className="metric-item-value">{fmtL(rawMSME.loanAmountRequested)}</div>
            </div>
            <div className="metric-item">
              <div className="metric-item-label">Loan Purpose</div>
              <div className="metric-item-value" style={{ fontSize: 13 }}>{rawMSME.loanPurpose}</div>
            </div>
            <div className="metric-item">
              <div className="metric-item-label">Loan / Annual Inflow</div>
              <div className="metric-item-value" style={{
                color: msme.loanToIncomeRatio > 1.5 ? "var(--risk-medium-color)" : "var(--text-primary)"
              }}>
                {msme.loanToIncomeRatio}x
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-item-label">Employees</div>
              <div className="metric-item-value">{rawMSME.employees}</div>
            </div>
          </div>
          {msme.fraudPenaltyApplied > 0 && (
            <div style={{ marginTop: 12, fontSize: 11, color: "#f97316", background: "rgba(249,115,22,0.08)", padding: "6px 10px", borderRadius: 6 }}>
              ⚠ Cross-validation penalty applied: -{msme.fraudPenaltyApplied}%
            </div>
          )}
        </div>

        {/* Radar Chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Sub-Score Radar</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--bg-border)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke={scoreColor(msme.overallScore)}
                  fill={scoreColor(msme.overallScore)}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)", borderRadius: 8 }}
                  formatter={(v) => [`${v}/100`, "Score"]}
                  labelStyle={{ color: "var(--text-secondary)" }}
                  itemStyle={{ color: "var(--text-primary)" }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sub-scores detail */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">Score Breakdown by Dimension</span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Weights shown in parentheses
          </span>
        </div>
        <div className="subscore-list">
          {Object.entries(msme.subScores).map(([key, val]) => (
            <div key={key} className="subscore-item">
              <div className="subscore-header">
                <span className="subscore-label">
                  {SUB_SCORE_NAMES[key]}
                  <span className="subscore-weight">({pct(val.weight * 100)})</span>
                </span>
                <span className="subscore-score" style={{ color: scoreColor(val.score) }}>
                  {val.score}/1000
                </span>
              </div>
              <ScoreBar score={val.score} showValue={false} />
            </div>
          ))}
        </div>
      </div>

      {/* Drivers */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">Key Drivers</span>
        </div>
        <div className="drivers-section">
          <div className="drivers-column">
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--risk-low-color)", marginBottom: 6 }}>
              ↑ Positive Factors
            </div>
            {drivers.positives.length > 0 ? drivers.positives.map((d, i) => (
              <div key={i} className="driver-item positive">
                <div className="driver-icon positive">✓</div>
                <div>
                  <div className="driver-category">{d.category}</div>
                  <div className="driver-text">{d.text}</div>
                </div>
              </div>
            )) : (
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>No significant positive drivers identified.</div>
            )}
          </div>
          <div className="drivers-column">
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--risk-high-color)", marginBottom: 6 }}>
              ↓ Risk Factors
            </div>
            {drivers.negatives.length > 0 ? drivers.negatives.map((d, i) => (
              <div key={i} className="driver-item negative">
                <div className="driver-icon negative">✗</div>
                <div>
                  <div className="driver-category">{d.category}</div>
                  <div className="driver-text">{d.text}</div>
                </div>
              </div>
            )) : (
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>No significant risk factors identified.</div>
            )}
          </div>
        </div>
      </div>

      {/* Cross-validation */}
      {msme.crossValidation.isFlagged && (
        <div className="cv-alert" style={{ marginBottom: 16 }}>
          <div className="cv-alert-icon">⚠</div>
          <div>
            <div className="cv-alert-title">Cross-Validation Alert</div>
            <div className="cv-alert-text">{msme.crossValidation.flagMessage}</div>
            <div style={{ marginTop: 8, display: "flex", gap: 16, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                GST Declared: {fmtL(msme.crossValidation.totalGSTTurnover)}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                Bank Inflow: {fmtL(msme.crossValidation.totalBankInflow)}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                UPI Inflow: {fmtL(msme.crossValidation.totalUPIInflow)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Cashflow chart */}
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Bank Cash Flow (₹ thousands)</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowData} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)", borderRadius: 8 }}
                  labelStyle={{ color: "var(--text-secondary)" }}
                  itemStyle={{ color: "var(--text-primary)" }}
                  formatter={(v) => [`₹${v}K`]}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }} />
                <Bar dataKey="Inflow" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Outflow" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">GST vs UPI Inflow (₹ thousands)</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gstData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)", borderRadius: 8 }}
                  labelStyle={{ color: "var(--text-secondary)" }}
                  itemStyle={{ color: "var(--text-primary)" }}
                  formatter={(v) => [`₹${v}K`]}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }} />
                <Line type="monotone" dataKey="GST Turnover" stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="UPI Inflow" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data sources */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">Data Sources</span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Coverage: {msme.dataSufficiency.label} ({msme.dataSufficiency.percentComplete}% complete)
          </span>
        </div>
        <div className="data-sources-grid">
          {msme.dataSufficiency.sources.map((s) => (
            <div key={s.source} className={`data-source-chip ${s.present ? "present" : "absent"}`}>
              <span>{s.present ? "✓" : "○"}</span>
              <span>{s.source}</span>
            </div>
          ))}
          {rawMSME.bureau.available && (
            <div className="data-source-chip present">
              <span>✓</span>
              <span>Bureau Score: {rawMSME.bureau.score}</span>
            </div>
          )}
        </div>
      </div>

      {/* Underwriter note */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title">Underwriter Summary Note</span>
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>AI-generated · not a legal document</span>
        </div>
        <div className="underwriter-note">{note}</div>
      </div>
    </div>
  );
}

// ── Portfolio View ────────────────────────────────────────────────────────────
function PortfolioView({ onSelect }) {
  const stats = portfolioAnalytics(SCORED);

  const riskPieData = [
    { name: "Low Risk",    value: stats.low,    color: "var(--risk-low-color)" },
    { name: "Medium Risk", value: stats.medium, color: "var(--risk-medium-color)" },
    { name: "High Risk",   value: stats.high,   color: "var(--risk-high-color)" },
  ];

  const scoreDistData = stats.scoreDistribution;

  const actionData = Object.entries(stats.actionBreakdown).map(([action, count]) => ({
    action: ACTIONS[action]?.label || action,
    count,
    color: ACTIONS[action]?.color || "#666",
  }));

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Portfolio Risk View</h1>
        <p className="page-subtitle">
          Aggregate risk distribution across {stats.total} MSME applications
        </p>
      </div>

      <DisclaimerBanner />

      <div className="stats-row" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Loan Pipeline</div>
          <div className="stat-value" style={{ fontSize: 22, color: "var(--accent-blue-light)" }}>
            {fmtL(stats.totalLoanAsk)}
          </div>
          <div className="stat-sub">across {stats.total} applications</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Approvable Amount</div>
          <div className="stat-value" style={{ fontSize: 22, color: "var(--risk-low-color)" }}>
            {fmtL(stats.approvableAsk)}
          </div>
          <div className="stat-sub">Approve + Conditions</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Portfolio Avg Score</div>
          <div className="stat-value" style={{ color: scoreColor(stats.avgScore) }}>
            {stats.avgScore}
          </div>
          <div className="stat-sub">out of 1000</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Fraud/CV Flags</div>
          <div className="stat-value" style={{ color: stats.fraudFlags > 0 ? "#f97316" : "var(--text-muted)" }}>
            {stats.fraudFlags}
          </div>
          <div className="stat-sub">require manual review</div>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 16 }}>
        {/* Risk Distribution Pie */}
        <div className="card">
          <div className="card-header"><span className="card-title">Risk Band Distribution</span></div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {riskPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)", borderRadius: 8 }}
                  itemStyle={{ color: "var(--text-primary)" }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v) => <span style={{ color: "var(--text-secondary)" }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score Distribution */}
        <div className="card">
          <div className="card-header"><span className="card-title">Score Distribution</span></div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistData} layout="vertical" barSize={16}>
                <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="range" type="category" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip
                  contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)", borderRadius: 8 }}
                  itemStyle={{ color: "var(--text-primary)" }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {scoreDistData.map((d, i) => {
                    const colors = ["#22c55e", "#86efac", "#f59e0b", "#f97316", "#ef4444"];
                    return <Cell key={i} fill={colors[i]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Breakdown */}
        <div className="card">
          <div className="card-header"><span className="card-title">Recommended Actions</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 8 }}>
            {actionData.map((item) => (
              <div key={item.action} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "var(--text-secondary)", flex: 1 }}>{item.action}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All MSMEs mini table */}
      <div className="card">
        <div className="card-header"><span className="card-title">All Applications</span></div>
        <table className="msme-table">
          <thead>
            <tr>
              <th>Business</th>
              <th>Score</th>
              <th>Risk</th>
              <th>Action</th>
              <th>Loan Ask</th>
              <th>L/I Ratio</th>
            </tr>
          </thead>
          <tbody>
            {SCORED.sort((a, b) => b.overallScore - a.overallScore).map((m) => (
              <tr key={m.id} onClick={() => onSelect(m)} style={{ cursor: "pointer" }}>
                <td style={{ fontWeight: 600 }}>{m.name}</td>
                <td>
                  <span style={{ fontWeight: 700, color: scoreColor(m.overallScore) }}>
                    {m.overallScore}
                  </span>
                </td>
                <td><RiskBadge band={m.riskBand} isFraud={m.crossValidation.isFlagged} /></td>
                <td>
                  <span style={{ fontSize: 12, color: m.actionConfig.color }}>
                    {m.actionConfig.label}
                  </span>
                </td>
                <td style={{ color: "var(--text-secondary)" }}>{fmtL(m.loanAmountRequested)}</td>
                <td style={{ color: m.loanToIncomeRatio > 1.5 ? "var(--risk-medium-color)" : "var(--text-secondary)" }}>
                  {m.loanToIncomeRatio}x
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Methodology View ──────────────────────────────────────────────────────────
function MethodologyView() {
  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Scoring Methodology</h1>
        <p className="page-subtitle">
          Transparent, auditable formula — every parameter documented
        </p>
      </div>

      <DisclaimerBanner />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><span className="card-title">Formula Overview</span></div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.8 }}>
          The Financial Health Score (0–1000) is a weighted composite of 5 independent sub-scores.
          Each sub-score is computed deterministically from raw alternate data — no black-box ML.
          A cross-validation penalty (up to 20%) is applied if declared GST turnover diverges &gt;40%
          from bank/UPI actuals.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Object.entries(WEIGHTS).map(([key, weight]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: `${weight * 100 * 3}px`,
                height: 28,
                background: "rgba(59,130,246,0.15)",
                border: "1px solid rgba(59,130,246,0.3)",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                padding: "0 8px",
                minWidth: 60,
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-blue-light)" }}>
                  {pct(weight * 100)}
                </span>
              </div>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                {SUB_SCORE_NAMES[key]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-score descriptions */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><span className="card-title">Sub-Score Definitions</span></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {[
            {
              name: "Cash-Flow Strength (25%)",
              signals: ["Average net cash margin (bank inflow − outflow) / inflow", "UPI collection growth trend over 12 months", "Payer diversification (inverse of top-payer concentration)", "Annual inflow as multiple of loan amount requested"],
            },
            {
              name: "Revenue Consistency (20%)",
              signals: ["Coefficient of variation in monthly GST turnover (lower = stable)", "Active trading months out of 12", "Directional alignment between GST and UPI inflow trends"],
            },
            {
              name: "Compliance Behavior (20%)",
              signals: ["GST filing on-time rate", "Number of filing delay instances (penalty per instance)", "EPFO contribution regularity", "Missing EPFO months (penalty per missing month)"],
            },
            {
              name: "Operational Continuity (20%)",
              signals: ["Employee count trend (EPFO-derived)", "Employee count stability (coefficient of variation)", "Utility consumption growth trend", "Utility payment regularity + disconnection events"],
            },
            {
              name: "Financial Resilience (15%)",
              signals: ["Average bank balance as % of average monthly inflow", "Months with critically low balance (&lt; meaningful threshold)", "Cheque/payment bounce incidents (penalty per incident)", "OD/CC credit facility utilization rate"],
            },
          ].map((dim) => (
            <div key={dim.name}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
                {dim.name}
              </div>
              <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
                {dim.signals.map((s, i) => (
                  <li key={i} style={{ fontSize: 12, color: "var(--text-secondary)" }}
                    dangerouslySetInnerHTML={{ __html: s }} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Risk thresholds */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><span className="card-title">Risk Band Thresholds (Transparent Cutoffs)</span></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { band: "LOW",    range: "700–1000", desc: "Strong creditworthiness — eligible for approval", color: "var(--risk-low-color)", bg: "var(--risk-low-bg)" },
            { band: "MEDIUM", range: "450–699",  desc: "Mixed signals — conditional approval or manual review", color: "var(--risk-medium-color)", bg: "var(--risk-medium-bg)" },
            { band: "HIGH",   range: "0–449",    desc: "Material risk factors — decline or request more data", color: "var(--risk-high-color)", bg: "var(--risk-high-bg)" },
          ].map((b) => (
            <div key={b.band} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "12px 14px",
              background: b.bg, borderRadius: 8, border: `1px solid ${b.color}30`
            }}>
              <span className={`risk-badge ${b.band}`}>{b.band}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: b.color, minWidth: 80 }}>{b.range}</span>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{b.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance note */}
      <div className="card">
        <div className="card-header"><span className="card-title">Regulatory Context</span></div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8 }}>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: "var(--text-primary)" }}>RBI Digital Lending Directions:</strong>{" "}
            The regulated lender remains directly accountable for the credit decision. This system is a
            decision-support tool — the credit officer has final authority. All score components are
            traceable to specific data points to satisfy auditability requirements.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: "var(--text-primary)" }}>DPDP Act 2023 + DPDP Rules 2025:</strong>{" "}
            Data collection is purpose-limited to credit underwriting. The consent framework must be
            registered under Phase 2 compliance (effective 13 Nov 2026). Data retention follows
            purpose-limitation principles.
          </p>
          <p>
            <strong style={{ color: "var(--text-primary)" }}>Account Aggregator (AA) Framework:</strong>{" "}
            GST, bank transaction, and EPFO data access is designed to flow through the AA consent
            architecture — source-wise, purpose-bound, revocable. No portal credential scraping.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const { user, sessionLoading, openAuth } = useAuth();
  const [view,         setView]        = useState("home");
  const [selectedMSME, setSelectedMSME] = useState(null);

  // When user logs in → auto-navigate to the dashboard list
  useEffect(() => {
    if (user && view === "home") setView("list");
  }, [user]); // eslint-disable-line

  // When user logs out → return to home, clear selection
  useEffect(() => {
    if (!user) {
      setView("home");
      setSelectedMSME(null);
    }
  }, [user]);

  // Show a minimal loader while session is being restored from localStorage
  if (sessionLoading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", background: "var(--bg-primary)",
      }}>
        <span className="auth-spinner" style={{ width: 32, height: 32, borderTopColor: "var(--accent)" }} />
      </div>
    );
  }

  const handleSelect = (msme) => { setSelectedMSME(msme); setView("detail"); };
  const handleBack   = ()     => { setSelectedMSME(null); setView("list"); };
  const handleSetView = (v)   => { setSelectedMSME(null); setView(v); };

  // Route renderer
  const renderContent = () => {
    // ── Public route ──
    if (view === "home") {
      return (
        <LandingView
          onGetStarted={() => openAuth("signup")}
          onLogin={() => openAuth("login")}
        />
      );
    }

    // ── Protected routes ──
    if (!user) return <AccessGate />;

    if (view === "list" && !selectedMSME) return <MSMEListView onSelect={handleSelect} />;
    if (view === "detail" && selectedMSME) return <MSMEDetailView msme={selectedMSME} onBack={handleBack} />;
    if (view === "portfolio")              return <PortfolioView onSelect={handleSelect} />;
    if (view === "methodology")            return <MethodologyView />;

    // Fallback
    return <MSMEListView onSelect={handleSelect} />;
  };

  return (
    <div className="app-shell">
      {/* Auth modal — rendered at root level, portals-style */}
      <AuthModal />

      <Topbar
        view={selectedMSME ? "detail" : view}
        setView={handleSetView}
      />

      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}
