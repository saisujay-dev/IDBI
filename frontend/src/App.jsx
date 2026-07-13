import { useState, useMemo, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import { MSME_DATA } from "./data/msmeData";
import { scoreAllMSMEs, scoreMSME, RISK_BANDS, ACTIONS, WEIGHTS } from "./engine/scoringEngine";
import {
  extractDrivers,
  generateUnderwriterNote,
  portfolioAnalytics,
} from "./engine/explainability";
import { useAuth } from "./auth/AuthContext";
import AuthModal from "./auth/AuthModal";
import "./index.css";

// ── Helpers ─────────────────────────────────────────────────────────────────
const _fmt = (n) => new Intl.NumberFormat("en-IN").format(n);
const fmtL = (n) => `₹${(n / 100000).toFixed(1)}L`;
const pct = (n) => `${n}%`;

const scoreColor = (score) => {
  if (score >= 700) return "var(--risk-low-color)";
  if (score >= 450) return "var(--risk-medium-color)";
  return "var(--risk-high-color)";
};

const SUB_SCORE_NAMES = {
  cashFlowStrength: "Cash-Flow Strength",
  revenueConsistency: "Revenue Consistency",
  complianceBehavior: "Compliance Behavior",
  operationalContinuity: "Operational Continuity",
  financialResilience: "Financial Resilience",
};

// ── Spinner ─────────────────────────────────────────────────────────────────
function Spinner({ size = 18, light = true }) {
  return (
    <span
      className="auth-spinner"
      style={{
        width: size,
        height: size,
        borderTopColor: light ? "#fff" : "#333",
        borderColor: light ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.12)",
      }}
    />
  );
}

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
          AI-Powered <span className="landing-title-accent">MSME Financial</span>
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
        <div className="trust-item">
          <span>🔒</span>
          <span>Secure by design</span>
        </div>
        <div className="trust-item">
          <span>📑</span>
          <span>RBI compliant</span>
        </div>
        <div className="trust-item">
          <span>🏛️</span>
          <span>DPDP Act 2023</span>
        </div>
        <div className="trust-item">
          <span>🔗</span>
          <span>AA Framework</span>
        </div>
        <div className="trust-item">
          <span>🧪</span>
          <span>Prototype · Demo data</span>
        </div>
      </div>
    </div>
  );
}

// ── Access Gate ───────────────────────────────────────────────────────────────
function AccessGate() {
  const { openAuth } = useAuth();
  return (
    <div className="access-gate fade-in">
      <div className="access-gate-icon">🔐</div>
      <h2 className="access-gate-title">Authentication Required</h2>
      <p className="access-gate-subtitle">
        Please log in to access the MSME dashboard, portfolio, and analytics.
      </p>
      <button className="access-gate-btn" onClick={() => openAuth("portal")}>
        Log In to Continue
      </button>
    </div>
  );
}

// ── Topbar ────────────────────────────────────────────────────────────────────
function Topbar({ view, setView }) {
  const { user, openAuth, logout } = useAuth();

  const handleLogoClick = () => {
    if (!user) {
      setView("public");
    } else if (user.role === "applicant") {
      setView("applicant_dashboard");
    } else if (user.role === "employee") {
      setView("employee_dashboard");
    } else if (user.role === "admin") {
      setView("admin_dashboard");
    }
  };

  return (
    <header className="topbar">
      {/* Logo — clickable */}
      <div
        className="topbar-logo"
        style={{ cursor: "pointer" }}
        onClick={handleLogoClick}
        role="link"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleLogoClick()}
      >
        <div className="logo-icon">🏦</div>
        <span>MSME Financial Health Card</span>
      </div>

      {/* Role-Based Navigation */}
      {user && (
        <nav className="topbar-nav">
          {/* MSME Applicant Nav Links */}
          {user.role === "applicant" && (
            <>
              <button
                className={`nav-btn ${view === "applicant_dashboard" ? "active" : ""}`}
                onClick={() => setView("applicant_dashboard")}
              >
                Dashboard
              </button>
              <button
                className={`nav-btn ${view === "loan_products" ? "active" : ""}`}
                onClick={() => setView("loan_products")}
              >
                Loan Products
              </button>
              <button
                className={`nav-btn ${view === "my_applications" || view === "fhc" ? "active" : ""}`}
                onClick={() => setView("my_applications")}
              >
                My Applications
              </button>
              <button
                className={`nav-btn ${view === "profile" ? "active" : ""}`}
                onClick={() => setView("profile")}
              >
                Profile
              </button>
              <button
                className={`nav-btn ${view === "notifications" ? "active" : ""}`}
                onClick={() => setView("notifications")}
              >
                Notifications
              </button>
              <button
                className={`nav-btn ${view === "settings" ? "active" : ""}`}
                onClick={() => setView("settings")}
              >
                Settings
              </button>
            </>
          )}

          {/* Bank Employee Nav Links */}
          {user.role === "employee" && (
            <>
              <button
                className={`nav-btn ${view === "employee_dashboard" ? "active" : ""}`}
                onClick={() => setView("employee_dashboard")}
              >
                Dashboard
              </button>
              <button
                className={`nav-btn ${view === "list" || view === "detail" ? "active" : ""}`}
                onClick={() => setView("list")}
              >
                MSME Applications
              </button>
              <button
                className={`nav-btn ${view === "portfolio" ? "active" : ""}`}
                onClick={() => setView("portfolio")}
              >
                Portfolio Analytics
              </button>
              <button
                className={`nav-btn ${view === "reports" ? "active" : ""}`}
                onClick={() => setView("reports")}
              >
                Reports
              </button>
              <button
                className={`nav-btn ${view === "methodology" ? "active" : ""}`}
                onClick={() => setView("methodology")}
              >
                Methodology
              </button>
              <button
                className={`nav-btn ${view === "settings" ? "active" : ""}`}
                onClick={() => setView("settings")}
              >
                Settings
              </button>
            </>
          )}

          {/* Super Admin Nav Links */}
          {user.role === "admin" && (
            <>
              <button
                className={`nav-btn ${view === "admin_dashboard" ? "active" : ""}`}
                onClick={() => setView("admin_dashboard")}
              >
                Dashboard
              </button>
              <button
                className={`nav-btn ${view === "employees" ? "active" : ""}`}
                onClick={() => setView("employees")}
              >
                Employee Management
              </button>
              <button
                className={`nav-btn ${view === "users" ? "active" : ""}`}
                onClick={() => setView("users")}
              >
                User Management
              </button>
              <button
                className={`nav-btn ${view === "configuration" ? "active" : ""}`}
                onClick={() => setView("configuration")}
              >
                System Config
              </button>
              <button
                className={`nav-btn ${view === "audit_logs" ? "active" : ""}`}
                onClick={() => setView("audit_logs")}
              >
                Audit Logs
              </button>
              <button
                className={`nav-btn ${view === "role_management" ? "active" : ""}`}
                onClick={() => setView("role_management")}
              >
                Role Boundaries
              </button>
              <button
                className={`nav-btn ${view === "platform_monitoring" ? "active" : ""}`}
                onClick={() => setView("platform_monitoring")}
              >
                Platform Diagnostics
              </button>
            </>
          )}
        </nav>
      )}

      {/* Right side */}
      <div className="topbar-right">
        <span className="demo-badge">PROTOTYPE · DEMO DATA</span>

        {user ? (
          <div className="nav-user">
            <div className="nav-user-info">
              <UserAvatar user={user} />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span className="nav-user-name" style={{ lineHeight: "1.2" }}>
                  {user.name}
                </span>
                <span style={{ fontSize: "9px", color: "var(--accent-light)", fontWeight: 700 }}>
                  {user.role.toUpperCase()}
                </span>
              </div>
            </div>
            <button className="btn-logout" onClick={logout} type="button">
              Log Out
            </button>
          </div>
        ) : (
          <div className="nav-auth-buttons">
            <button className="btn-login" onClick={() => openAuth("portal")} type="button">
              Log In
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

// ── Disclaimer Banner ─────────────────────────────────────────────────────────
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

// ── Risk Badge ────────────────────────────────────────────────────────────────
function RiskBadge({ band, isFraud }) {
  if (isFraud) return <span className="risk-badge FLAG">⚠ Cross-Val Flag</span>;
  return <span className={`risk-badge ${band}`}>{RISK_BANDS[band]?.label || band}</span>;
}

// ── Score Bar ─────────────────────────────────────────────────────────────────
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

// ── MSME List View ────────────────────────────────────────────────────────────
function MSMEListView({ scoredMsmes, onSelect }) {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");

  const filtered = useMemo(
    () =>
      scoredMsmes.filter((m) => {
        const matchSearch =
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.sector.toLowerCase().includes(search.toLowerCase()) ||
          m.location.toLowerCase().includes(search.toLowerCase());
        const matchRisk = riskFilter === "ALL" || m.riskBand === riskFilter;
        return matchSearch && matchRisk;
      }),
    [scoredMsmes, search, riskFilter]
  );

  const stats = portfolioAnalytics(scoredMsmes);

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
          <div className="stat-value" style={{ color: "var(--accent-blue-light)" }}>
            {stats.total}
          </div>
          <div className="stat-sub">in pipeline</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Low Risk</div>
          <div className="stat-value" style={{ color: "var(--risk-low-color)" }}>
            {stats.low}
          </div>
          <div className="stat-sub">eligible for approval</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Medium Risk</div>
          <div className="stat-value" style={{ color: "var(--risk-medium-color)" }}>
            {stats.medium}
          </div>
          <div className="stat-sub">need review</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">High Risk</div>
          <div className="stat-value" style={{ color: "var(--risk-high-color)" }}>
            {stats.high}
          </div>
          <div className="stat-sub">decline / more data</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Health Score</div>
          <div className="stat-value" style={{ color: scoreColor(stats.avgScore) }}>
            {stats.avgScore}
          </div>
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", color: "var(--text-muted)", padding: "30px" }}>
                  No active loan applications found.
                </td>
              </tr>
            ) :
              filtered.map((m) => (
                <tr key={m.id} onClick={() => onSelect(m)}>
                <td>
                  <div className="msme-name-cell">
                    <span className="msme-name-primary">{m.name}</span>
                    <span className="msme-name-sub">
                      {m.location} · {m.vintage} vintage
                    </span>
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

const sanitizeForPDF = (str) => {
  if (!str) return "";
  const cleaned = str.toString()
    .replace(/[\u2018\u2019]/g, "'")    // curly single quotes
    .replace(/[\u201c\u201d]/g, '"')    // curly double quotes
    .replace(/[\u2013\u2014]/g, "-")    // en/em dashes
    .replace(/[\u2022]/g, "-")          // bullet point
    .replace(/\u20B9/g, "Rs.");         // Rupee symbol

  let result = "";
  for (let i = 0; i < cleaned.length; i++) {
    const code = cleaned.charCodeAt(i);
    if ((code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9) {
      result += cleaned[i];
    } else {
      result += " ";
    }
  }
  return result;
};

const escapePDFText = (str) => {
  if (!str) return "";
  const sanitized = sanitizeForPDF(str);
  return sanitized
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
};

const buildAppraisalPDF = (msme, rawMSME, drivers, note, user, reportId, reportDate) => {
  const name = msme.name || "N/A";
  const owner = rawMSME.owner || "Meera Agarwal";
  const sector = rawMSME.sector || "Manufacturing";
  const location = rawMSME.location || "HQ, Mumbai";
  const vintage = rawMSME.vintage || "5 Years";
  const employees = rawMSME.employees || "24";
  const udyam = rawMSME.udyam || "UDYAM-MH-12-0083124";
  const gstin = rawMSME.gst?.gstin || rawMSME.gstin || "27AAAAA1111A1Z1";
  const pan = rawMSME.pan || "ABCDE1234F";
  const businessType = rawMSME.businessType || "Pvt Ltd";
  const overallScore = msme.overallScore || 0;
  const riskLabel = msme.riskBandConfig?.label || "Medium Risk";
  const actionLabel = msme.actionConfig?.label || "MANUAL REVIEW REQUIRED";
  const loanAsk = `Rs. ${((rawMSME.loanAmountRequested || 0) / 100000).toFixed(1)} Lakhs`;
  const ratio = `${msme.loanToIncomeRatio || 0}x`;

  const stream = [];

  // Page 1 Border
  stream.push("q");
  stream.push("0.1 w");
  stream.push("0.5 0.5 0.5 RG");
  stream.push("20 20 555 802 re");
  stream.push("S");

  // Header background bar
  stream.push("0.0 0.34 0.7 r g");
  stream.push("20 770 555 52 re");
  stream.push("f");
  stream.push("Q");

  // Header text
  stream.push("BT");
  stream.push("50 800 Td");
  stream.push("1 1 1 rg");
  stream.push("/F2 18 Tf 22 TL (IDBI BANK - CREDIT APPRAISAL DIVISION) Tj");
  stream.push("T* /F1 9 Tf 11 TL (AI-POWERED ALTERNATE CREDIT HEALTH CARD REPORT) Tj");
  stream.push("ET");

  // Metadata block
  stream.push("BT");
  stream.push("380 802 Td");
  stream.push("1 1 1 rg");
  stream.push("/F2 9 Tf 12 TL");
  stream.push(`(Report ID: ${escapePDFText(reportId)}) Tj`);
  stream.push(`T* (Generated: ${escapePDFText(reportDate)}) Tj`);
  stream.push(`T* (Underwriter: ${escapePDFText(user?.name || "Senior Underwriter")}) Tj`);
  stream.push("ET");

  // Main content (Page 1)
  stream.push("BT");
  stream.push("50 740 Td");
  stream.push("0.1 0.1 0.1 rg");

  // Section 1: Business Profile
  stream.push("T* /F2 12 Tf 18 TL (1. APPLICANT & BUSINESS PROFILE) Tj");
  stream.push("T* /F1 10 Tf 14 TL");
  stream.push("(---------------------------------------------------------------------------------------------------------) Tj");
  stream.push(`T* (Business Name: ${escapePDFText(name)}) Tj`);
  stream.push(`T* (Owner / Promoter Name: ${escapePDFText(owner)}) Tj`);
  stream.push(`T* (Sector / Industry Type: ${escapePDFText(sector)} | Vintage: ${escapePDFText(vintage)}) Tj`);
  stream.push(`T* (Udyam Registration: ${escapePDFText(udyam)} | Employees: ${escapePDFText(employees)}) Tj`);
  stream.push(`T* (GSTIN: ${escapePDFText(gstin)} | PAN: ${escapePDFText(pan)} | Constitution: ${escapePDFText(businessType)}) Tj`);
  stream.push(`T* (Location/HQ Address: ${escapePDFText(location)}) Tj`);

  // Section 2: Assessment summary
  stream.push("T* T* /F2 12 Tf 18 TL (2. CREDIT HEALTH ASSESSMENT SUMMARY) Tj");
  stream.push("T* /F1 10 Tf 14 TL");
  stream.push("(---------------------------------------------------------------------------------------------------------) Tj");
  stream.push(`T* (Financial Health Score: ) Tj`);
  stream.push(`/F2 14 Tf (${overallScore} / 1000) Tj`);
  stream.push("T* /F1 10 Tf 14 TL");
  stream.push(`(Risk Classification: ) Tj`);
  stream.push(`/F2 10 Tf (${escapePDFText(riskLabel)}) Tj`);
  stream.push("T* /F1 10 Tf 14 TL");
  stream.push(`(Recommended Action: ) Tj`);
  stream.push(`/F2 10 Tf (${escapePDFText(actionLabel)}) Tj`);
  stream.push("T* /F1 10 Tf 14 TL");
  stream.push(`(Requested Loan Capital: ${escapePDFText(loanAsk)} | Loan-to-Income Ratio: ${escapePDFText(ratio)}) Tj`);

  // Section 3: Telemetry Dimension breakdown
  stream.push("T* T* /F2 12 Tf 18 TL (3. ALTERNATE TELEMETRY SCORE BREAKDOWN) Tj");
  stream.push("T* /F1 10 Tf 14 TL");
  stream.push("(---------------------------------------------------------------------------------------------------------) Tj");
  stream.push("T* /F2 9 Tf 12 TL (Scoring Dimension                               Weight   Score      Risk Level) Tj");
  stream.push("T* /F1 9 Tf 12 TL (-----------------------------------------------------------------------------------------) Tj");

  Object.entries(msme.subScores).forEach(([key, val]) => {
    const label = SUB_SCORE_NAMES[key] || key;
    const padding = " ".repeat(Math.max(1, 45 - label.length));
    const wt = `${(val.weight * 100).toFixed(0)}%`;
    const sc = `${val.score} / 1000`;
    const risk = val.score >= 700 ? "Low Risk" : val.score >= 450 ? "Medium Risk" : "High Risk";
    stream.push(`T* (${escapePDFText(label)}${padding}${wt}      ${sc}   ${risk}) Tj`);
  });

  // Section 4: Positive and Negative Drivers
  stream.push("T* T* /F2 12 Tf 18 TL (4. EXPLAINABILITY & CREDIT DRIVERS) Tj");
  stream.push("T* /F1 10 Tf 14 TL");
  stream.push("(---------------------------------------------------------------------------------------------------------) Tj");
  stream.push("T* /F2 10 Tf 14 TL (Key Positive Factors:) Tj");
  stream.push("/F1 9 Tf 12 TL");
  if (drivers.positives && drivers.positives.length > 0) {
    drivers.positives.slice(0, 3).forEach((d) => {
      stream.push(`T* (+ ${escapePDFText(d.category)}: ${escapePDFText(d.text)}) Tj`);
    });
  } else {
    stream.push("T* (+ No major positive factors identified.) Tj");
  }

  stream.push("T* T* /F2 10 Tf 14 TL (Key Risk Factors:) Tj");
  stream.push("/F1 9 Tf 12 TL");
  if (drivers.negatives && drivers.negatives.length > 0) {
    drivers.negatives.slice(0, 3).forEach((d) => {
      stream.push(`T* (- ${escapePDFText(d.category)}: ${escapePDFText(d.text)}) Tj`);
    });
  } else {
    stream.push("T* (- No major risk factors identified.) Tj");
  }

  stream.push("ET");

  // Page 2 Content
  const stream2 = [];
  stream2.push("q");
  stream2.push("0.1 w");
  stream2.push("0.5 0.5 0.5 RG");
  stream2.push("20 20 555 802 re");
  stream2.push("S");

  stream2.push("0.0 0.34 0.7 r g");
  stream2.push("20 790 555 32 re");
  stream2.push("f");
  stream2.push("Q");

  stream2.push("BT");
  stream2.push("50 802 Td");
  stream2.push("1 1 1 rg");
  stream2.push("/F2 12 Tf 14 TL (IDBI BANK - CREDIT APPRAISAL DIVISION - NARRATIVE AUDIT) Tj");
  stream2.push("ET");

  stream2.push("BT");
  stream2.push("50 750 Td");
  stream2.push("0.1 0.1 0.1 rg");

  // Section 5: Cross validation & data sources
  stream2.push("T* /F2 12 Tf 18 TL (5. INGESTION SUFFICIENCY & CROSS-VALIDATION FRAUD CHECKS) Tj");
  stream2.push("T* /F1 10 Tf 14 TL");
  stream2.push("(---------------------------------------------------------------------------------------------------------) Tj");
  stream2.push(`T* (GST Annual Inflows: Rs. ${((msme.crossValidation?.totalGSTTurnover || 0) / 100000).toFixed(1)}L | Bank Credits: Rs. ${((msme.crossValidation?.totalBankInflow || 0) / 100000).toFixed(1)}L) Tj`);
  stream2.push(`T* (UPI Collections: Rs. ${((msme.crossValidation?.totalUPIInflow || 0) / 100000).toFixed(1)}L | Inflow Mismatch: ${msme.crossValidation?.avgDivergence || 0}%) Tj`);
  stream2.push(`T* (Cross-Validation Assessment: ${msme.crossValidation?.isFlagged ? "WARNING: HIGHER THAN POLICY TOLERANCE" : "VERIFIED & ALIGNED"}) Tj`);
  if (msme.crossValidation?.isFlagged) {
    stream2.push(`T* (  Audit Alert message: ${escapePDFText(msme.crossValidation.flagMessage)}) Tj`);
  } else {
    stream2.push("T* (  Audit Alert: Inflow discrepancy is within acceptable bank policy limits of 40%.) Tj");
  }

  // Data feeds checklist
  stream2.push("T* T* /F2 10 Tf 14 TL (Data Source Feeds Ingested Checklist:) Tj");
  stream2.push("/F1 9 Tf 12 TL");
  if (msme.dataSufficiency && msme.dataSufficiency.sources) {
    msme.dataSufficiency.sources.forEach((s) => {
      stream2.push(`T* (${s.present ? "[YES]" : "[NO ]"} ${escapePDFText(s.source)}) Tj`);
    });
  }

  // Section 6: AI Underwriter Narrative
  stream2.push("T* T* /F2 12 Tf 18 TL (6. AI UNDERWRITING JUSTIFICATION NARRATIVE) Tj");
  stream2.push("T* /F1 10 Tf 14 TL");
  stream2.push("(---------------------------------------------------------------------------------------------------------) Tj");

  const noteLines = [];
  const words = (note || "").split(" ");
  let currentLine = "";
  words.forEach((w) => {
    if (currentLine.length + w.length > 85) {
      noteLines.push(currentLine);
      currentLine = w + " ";
    } else {
      currentLine += w + " ";
    }
  });
  if (currentLine) noteLines.push(currentLine);

  stream2.push("/F1 9.5 Tf 13 TL");
  noteLines.forEach((l) => {
    stream2.push(`T* (${escapePDFText(l.trim())}) Tj`);
  });

  // Section 7: Legal Disclaimer
  stream2.push("T* T* T* /F2 9 Tf 12 TL (7. REGULATORY & CREDIT POLICY DISCLAIMER) Tj");
  stream2.push("/F1 8 Tf 10 TL");
  stream2.push("T* (This report is dynamically generated under underwriter consent via digitized telemetry streams.) Tj");
  stream2.push("T* (It forms part of the alternate underwriting evaluation module for IDBI Bank MSME credits.) Tj");
  stream2.push("T* (This assessment card should be cross-referenced against standard RBI physical collateral audits,) Tj");
  stream2.push("T* (credit bureau reports, and IDBI Bank's internal core risk framework before loan disbursement.) Tj");

  stream2.push("ET");

  const contentStream1 = stream.join("\n");
  const contentStream2 = stream2.join("\n");

  const catalog = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  const pages = "2 0 obj\n<< /Type /Pages /Kids [6 0 R 8 0 R] /Count 2 >>\nendobj\n";
  const font1 = "3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";
  const font2 = "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n";
  const resources = "5 0 obj\n<< /Font << /F1 3 0 R /F2 4 0 R >> >>\nendobj\n";

  const page1 = "6 0 obj\n<< /Type /Page /Parent 2 0 R /Resources 5 0 R /MediaBox [0 0 595.28 841.89] /Contents 7 0 R >>\nendobj\n";
  const stream1Header = `7 0 obj\n<< /Length ${contentStream1.length} >>\nstream\n`;
  const stream1Footer = "\nendstream\nendobj\n";
  const fullStream1 = stream1Header + contentStream1 + stream1Footer;

  const page2 = "8 0 obj\n<< /Type /Page /Parent 2 0 R /Resources 5 0 R /MediaBox [0 0 595.28 841.89] /Contents 9 0 R >>\nendobj\n";
  const stream2Header = `9 0 obj\n<< /Length ${contentStream2.length} >>\nstream\n`;
  const stream2Footer = "\nendstream\nendobj\n";
  const fullStream2 = stream2Header + contentStream2 + stream2Footer;

  const pdfHeader = "%PDF-1.4\n";
  let offset = pdfHeader.length;

  const offsets = [];

  offsets.push(offset);
  offset += catalog.length;

  offsets.push(offset);
  offset += pages.length;

  offsets.push(offset);
  offset += font1.length;

  offsets.push(offset);
  offset += font2.length;

  offsets.push(offset);
  offset += resources.length;

  offsets.push(offset);
  offset += page1.length;

  offsets.push(offset);
  offset += fullStream1.length;

  offsets.push(offset);
  offset += page2.length;

  offsets.push(offset);
  offset += fullStream2.length;

  let xref = "xref\n0 10\n0000000000 65535 f \n";
  for (let i = 0; i < 9; i++) {
    const off = offsets[i].toString().padStart(10, "0");
    xref += `${off} 00000 n \n`;
  }

  const startxref = offset;
  const trailer = `trailer\n<< /Size 10 /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

  const fullPdfString = pdfHeader + catalog + pages + font1 + font2 + resources + page1 + fullStream1 + page2 + fullStream2 + xref + trailer;

  return fullPdfString;
};

// ── MSME Detail View ──────────────────────────────────────────────────────────
function MSMEDetailView({ msme, rawDataList, onBack, backText = "Back to Applications" }) {
  const { user } = useAuth();
  const [downloadingReport, setDownloadingReport] = useState(false);

  const rawMSME = rawDataList.find((m) => m.id === msme.id) || msme;
  const drivers = extractDrivers(msme, rawMSME);
  const note = generateUnderwriterNote(msme, rawMSME, drivers);

  const radarData = Object.entries(msme.subScores).map(([key, val]) => ({
    subject: SUB_SCORE_NAMES[key] || key,
    score: Math.round(val.score / 10),
    fullMark: 100,
  }));

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const cashflowData = monthLabels.map((m, i) => ({
    month: m,
    Inflow: Math.round((rawMSME.aaBankData?.monthlyInflow?.[i] || 0) / 1000),
    Outflow: Math.round((rawMSME.aaBankData?.monthlyOutflow?.[i] || 0) / 1000),
  }));

  const gstData = monthLabels.map((m, i) => ({
    month: m,
    "GST Turnover": Math.round((rawMSME.gst?.monthlyTurnover?.[i] || 0) / 1000),
    "UPI Inflow": Math.round((rawMSME.upi?.monthlyInflow?.[i] || 0) / 1000),
  }));

  const handleDownloadReport = () => {
    setDownloadingReport(true);
    const reportId = `FHC-${msme.id}-${Math.floor(100000 + Math.random() * 899999)}`;
    const reportDate = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const filename = `Financial_Health_Report_${msme.name.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;

    try {
      const pdfString = buildAppraisalPDF(msme, rawMSME, drivers, note, user, reportId, reportDate);

      const bytes = new Uint8Array(pdfString.length);
      for (let i = 0; i < pdfString.length; i++) {
        bytes[i] = pdfString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setDownloadingReport(false);
        alert("Report downloaded successfully");
      }, 150);
    } catch (err) {
      setDownloadingReport(false);
      alert(`Failed to generate credit report PDF: ${err.message}`);
    }
  };

  return (
    <div className="fade-in">
      {onBack && (
        <button className="back-btn" onClick={onBack}>
          ← {backText}
        </button>
      )}

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
          <div style={{ marginTop: 12 }}>
            <button
              onClick={handleDownloadReport}
              disabled={downloadingReport}
              className="landing-btn-primary"
              style={{
                padding: "8px 16px",
                fontSize: "12px",
                borderRadius: "8px",
                minHeight: "auto",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
              type="button"
            >
              <span>{downloadingReport ? "⏳" : "📥"}</span>
              {downloadingReport ? "Preparing..." : "Download Report"}
            </button>
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
            <div className="score-max" style={{ marginTop: 4 }}>
              /1000
            </div>
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
              <div className="metric-item-value" style={{ fontSize: 13 }}>
                {rawMSME.loanPurpose}
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-item-label">Loan / Annual Inflow</div>
              <div
                className="metric-item-value"
                style={{
                  color: msme.loanToIncomeRatio > 1.5 ? "var(--risk-medium-color)" : "var(--text-primary)",
                }}
              >
                {msme.loanToIncomeRatio}x
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-item-label">Employees</div>
              <div className="metric-item-value">{rawMSME.employees}</div>
            </div>
          </div>
          {msme.fraudPenaltyApplied > 0 && (
            <div
              style={{
                marginTop: 12,
                fontSize: 11,
                color: "#f97316",
                background: "rgba(249,115,22,0.08)",
                padding: "6px 10px",
                borderRadius: 6,
              }}
            >
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
                <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
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
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Weights shown in parentheses</span>
        </div>
        <div className="subscore-list">
          {Object.entries(msme.subScores).map(([key, val]) => (
            <div key={key} className="subscore-item">
              <div className="subscore-header">
                <span className="subscore-label">
                  {SUB_SCORE_NAMES[key] || key}
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
            {drivers.positives.length > 0 ? (
              drivers.positives.map((d, i) => (
                <div key={i} className="driver-item positive">
                  <div className="driver-icon positive">✓</div>
                  <div>
                    <div className="driver-category">{d.category}</div>
                    <div className="driver-text">{d.text}</div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>No significant positive drivers identified.</div>
            )}
          </div>
          <div className="drivers-column">
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--risk-high-color)", marginBottom: 6 }}>
              ↓ Risk Factors
            </div>
            {drivers.negatives.length > 0 ? (
              drivers.negatives.map((d, i) => (
                <div key={i} className="driver-item negative">
                  <div className="driver-icon negative">✗</div>
                  <div>
                    <div className="driver-category">{d.category}</div>
                    <div className="driver-text">{d.text}</div>
                  </div>
                </div>
              ))
            ) : (
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
          {rawMSME.bureau?.available && (
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
function PortfolioView({ scoredMsmes, onSelect }) {
  const stats = portfolioAnalytics(scoredMsmes);

  const riskPieData = [
    { name: "Low Risk", value: stats.low, color: "var(--risk-low-color)" },
    { name: "Medium Risk", value: stats.medium, color: "var(--risk-medium-color)" },
    { name: "High Risk", value: stats.high, color: "var(--risk-high-color)" },
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
        <p className="page-subtitle">Aggregate risk distribution across {stats.total} MSME applications</p>
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
          <div className="card-header">
            <span className="card-title">Risk Band Distribution</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {riskPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)", borderRadius: 8 }}
                  itemStyle={{ color: "var(--text-primary)" }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11 }}
                  formatter={(v) => <span style={{ color: "var(--text-secondary)" }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score Distribution */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Score Distribution</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistData} layout="vertical" barSize={16}>
                <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="range"
                  type="category"
                  tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
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
          <div className="card-header">
            <span className="card-title">Recommended Actions</span>
          </div>
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
        <div className="card-header">
          <span className="card-title">All Applications</span>
        </div>
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
            {scoredMsmes.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>
                  No applications in portfolio.
                </td>
              </tr>
            ) :
              scoredMsmes
                .slice()
                .sort((a, b) => b.overallScore - a.overallScore)
                .map((m) => (
                <tr key={m.id} onClick={() => onSelect(m)} style={{ cursor: "pointer" }}>
                  <td style={{ fontWeight: 600 }}>{m.name}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: scoreColor(m.overallScore) }}>{m.overallScore}</span>
                  </td>
                  <td>
                    <RiskBadge band={m.riskBand} isFraud={m.crossValidation.isFlagged} />
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: m.actionConfig.color }}>{m.actionConfig.label}</span>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>{fmtL(m.loanAmountRequested)}</td>
                  <td
                    style={{
                      color: m.loanToIncomeRatio > 1.5 ? "var(--risk-medium-color)" : "var(--text-secondary)",
                    }}
                  >
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
        <p className="page-subtitle">Transparent, auditable formula — every parameter documented</p>
      </div>

      <DisclaimerBanner />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">Formula Overview</span>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.8 }}>
          The Financial Health Score (0–1000) is a weighted composite of 5 independent sub-scores. Each sub-score is
          computed deterministically from raw alternate data — no black-box ML. A cross-validation penalty (up to 20%) is
          applied if declared GST turnover diverges &gt;40% from bank/UPI actuals.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Object.entries(WEIGHTS).map(([key, weight]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: `${weight * 100 * 3}px`,
                  height: 28,
                  background: "rgba(59,130,246,0.15)",
                  border: "1px solid rgba(59,130,246,0.3)",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 8px",
                  minWidth: 60,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-blue-light)" }}>
                  {pct(weight * 100)}
                </span>
              </div>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{SUB_SCORE_NAMES[key] || key}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-score definitions */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">Sub-Score Definitions</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {[
            {
              name: "Cash-Flow Strength (25%)",
              signals: [
                "Average net cash margin (bank inflow − outflow) / inflow",
                "UPI collection growth trend over 12 months",
                "Payer diversification (inverse of top-payer concentration)",
                "Annual inflow as multiple of loan amount requested",
              ],
            },
            {
              name: "Revenue Consistency (20%)",
              signals: [
                "Coefficient of variation in monthly GST turnover (lower = stable)",
                "Active trading months out of 12",
                "Directional alignment between GST and UPI inflow trends",
              ],
            },
            {
              name: "Compliance Behavior (20%)",
              signals: [
                "GST filing on-time rate",
                "Number of filing delay instances (penalty per instance)",
                "EPFO contribution regularity",
                "Missing EPFO months (penalty per missing month)",
              ],
            },
            {
              name: "Operational Continuity (20%)",
              signals: [
                "Employee count trend (EPFO-derived)",
                "Employee count stability (coefficient of variation)",
                "Utility consumption growth trend",
                "Utility payment regularity + disconnection events",
              ],
            },
            {
              name: "Financial Resilience (15%)",
              signals: [
                "Average bank balance as % of average monthly inflow",
                "Months with critically low balance (&lt; meaningful threshold)",
                "Cheque/payment bounce incidents (penalty per incident)",
                "OD/CC credit facility utilization rate",
              ],
            },
          ].map((dim) => (
            <div key={dim.name}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
                {dim.name}
              </div>
              <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
                {dim.signals.map((s, i) => (
                  <li
                    key={i}
                    style={{ fontSize: 12, color: "var(--text-secondary)" }}
                    dangerouslySetInnerHTML={{ __html: s }}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Risk thresholds */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">Risk Band Thresholds (Transparent Cutoffs)</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            {
              band: "LOW",
              range: "700–1000",
              desc: "Strong creditworthiness — eligible for approval",
              color: "var(--risk-low-color)",
              bg: "var(--risk-low-bg)",
            },
            {
              band: "MEDIUM",
              range: "450–699",
              desc: "Mixed signals — conditional approval or manual review",
              color: "var(--risk-medium-color)",
              bg: "var(--risk-medium-bg)",
            },
            {
              band: "HIGH",
              range: "0–449",
              desc: "Material risk factors — decline or request more data",
              color: "var(--risk-high-color)",
              bg: "var(--risk-high-bg)",
            },
          ].map((b) => (
            <div
              key={b.band}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 14px",
                background: b.bg,
                borderRadius: 8,
                border: `1px solid ${b.color}30`,
              }}
            >
              <span className={`risk-badge ${b.band}`}>{b.band}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: b.color, minWidth: 80 }}>{b.range}</span>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{b.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance note */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Regulatory Context</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8 }}>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: "var(--text-primary)" }}>RBI Digital Lending Directions:</strong> The regulated
            lender remains directly accountable for the credit decision. This system is a decision-support tool — the
            credit officer has final authority. All score components are traceable to specific data points to satisfy
            auditability requirements.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: "var(--text-primary)" }}>DPDP Act 2023 + DPDP Rules 2025:</strong> Data collection
            is purpose-limited to credit underwriting. The consent framework must be registered under Phase 2
            compliance (effective 13 Nov 2026). Data retention follows purpose-limitation principles.
          </p>
          <p>
            <strong style={{ color: "var(--text-primary)" }}>Account Aggregator (AA) Framework:</strong> GST, bank
            transaction, and EPFO data access is designed to flow through the AA consent architecture — source-wise,
            purpose-bound, revocable. No portal credential scraping.
          </p>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ── 5. MSME APPLICANT SUB-COMPONENTS ──────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ── Applicant Dashboard ──
function ApplicantDashboardView({ user, myMsme, activeLoan, setView }) {
  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Welcome, {user.name}</h1>
        <p className="page-subtitle">Applicant Portal · {user.kycCompleted ? user.kycDetails?.businessName : "KYC Pending Verification"}</p>
      </div>

      <DisclaimerBanner />

      {/* Uncompleted KYC View */}
      {!user.kycCompleted ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Warning Banner */}
          <div
            className="auth-alert auth-alert--error"
            style={{
              padding: "16px 20px",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              borderRadius: "14px",
              marginBottom: 0,
            }}
          >
            <span style={{ fontSize: "24px" }}>⚠️</span>
            <div>
              <strong style={{ fontSize: "14px", display: "block", marginBottom: "3px" }}>KYC Verification Pending</strong>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", lineHeight: "1.4" }}>
                Your account is active, but you must complete your identity and business KYC to browse available loan packages and generate your Financial Health scorecard.
              </span>
            </div>
          </div>

          <div className="grid-2">
            {/* User Profile Overview */}
            <div className="card" style={{ padding: "24px" }}>
              <div className="card-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px", marginBottom: "16px" }}>
                <span className="card-title">Registration Summary</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Account Holder</span>
                  <strong style={{ color: "var(--text-primary)" }}>{user.name}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Registered Email</span>
                  <strong style={{ color: "var(--text-primary)" }}>{user.email}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Mobile Number</span>
                  <strong style={{ color: "var(--text-primary)" }}>{user.mobileNumber}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>KYC Status</span>
                  <span style={{ color: "var(--risk-high-color)", fontWeight: "bold" }}>Pending Verification</span>
                </div>
              </div>
            </div>

            {/* KYC CTA Panel */}
            <div
              className="card"
              style={{
                background: "linear-gradient(135deg, rgba(79,157,255,0.08), rgba(110,107,245,0.05))",
                border: "1px solid rgba(79,157,255,0.22)",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
                  Unlock Scoring &amp; Loan Applications
                </h3>
                <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                  Submit Aadhaar, PAN, and GSTIN variables along with your data access consent in our secure multi-step portal to instantly evaluate your business parameters.
                </p>
              </div>
              <button
                className="landing-btn-primary"
                onClick={() => setView("loan_products")}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", marginTop: "16px" }}
              >
                Apply for Loan &amp; Verify KYC →
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Completed KYC View */
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="grid-2">
            {/* Business Ingestion Card */}
            <div
              className="card"
              style={{
                background: "linear-gradient(135deg, rgba(48,209,88,0.06), rgba(79,157,255,0.03))",
                border: "1px solid rgba(48,209,88,0.22)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "24px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: "28px" }}>🏢</span>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
                      {user.kycDetails?.businessName}
                    </h3>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                      Type: {user.kycDetails?.businessType} | Address: {user.kycDetails?.address}
                    </p>
                  </div>
                </div>
                <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                  Identity credentials verified (Aadhaar &amp; PAN matched). Ingested alternate data streams from GST, UPI, and Account Aggregator transaction flows are now securely synchronized.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 20,
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  paddingTop: 16,
                }}
              >
                <button
                  className="landing-btn-primary"
                  onClick={() => setView("fhc")}
                  style={{ padding: "10px 20px", fontSize: "13px", borderRadius: "10px" }}
                >
                  Open Health Card details
                </button>
                <button
                  className="landing-btn-secondary"
                  onClick={() => setView("loan_products")}
                  style={{ padding: "10px 20px", fontSize: "13px", borderRadius: "10px" }}
                >
                  Browse Loan Packages
                </button>
              </div>
            </div>

            {/* Score Ring Summary */}
            <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "30px 20px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>
                MSME Financial Health Score
              </span>
              <div
                className="score-number"
                style={{
                  color: scoreColor(myMsme?.overallScore || 0),
                  fontSize: "64px",
                  fontWeight: 800,
                  marginTop: "8px",
                  lineHeight: 1,
                }}
              >
                {myMsme?.overallScore || "---"}
              </div>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>out of 1000</span>
              <div style={{ marginTop: "14px" }}>
                {myMsme ? (
                  <RiskBadge band={myMsme.riskBand} isFraud={myMsme.crossValidation.isFlagged} />
                ) : (
                  <span className="risk-badge MEDIUM">Syncing Core</span>
                )}
              </div>

              <div style={{ width: "100%", marginTop: "24px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                  <span>Ingested alternate streams</span>
                  <span>{myMsme?.dataSufficiency?.presentCount || 0}/5 sources</span>
                </div>
                <div className="score-bar-track" style={{ height: "6px" }}>
                  <div
                    className="score-bar-fill"
                    style={{
                      width: `${((myMsme?.dataSufficiency?.presentCount || 0) / 5) * 100}%`,
                      background: "var(--accent)",
                      height: "100%",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid-2">
            {/* Active Loan Application Tracker */}
            <div className="card">
              <div className="card-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
                <span className="card-title">Active Loan Request Tracking</span>
                <button
                  onClick={() => setView("my_applications")}
                  style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                >
                  Loan Details →
                </button>
              </div>

              {activeLoan ? (
                <div style={{ padding: "8px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)" }}>
                        {fmtL(activeLoan.amount)} - {activeLoan.purpose}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: 2 }}>
                        Submitted on: {activeLoan.date} | ID: {activeLoan.id}
                      </div>
                    </div>
                    <div>
                      <span
                        className="action-badge"
                        style={{
                          background:
                            activeLoan.status === "Approved" || activeLoan.status === "Approved with Conditions"
                              ? "rgba(48,209,88,0.15)"
                              : activeLoan.status === "Declined"
                              ? "rgba(255,69,58,0.15)"
                              : "rgba(255,159,10,0.15)",
                          color:
                            activeLoan.status === "Approved" || activeLoan.status === "Approved with Conditions"
                              ? "#30D158"
                              : activeLoan.status === "Declined"
                              ? "#FF453A"
                              : "#FF9F0A",
                          border: "none",
                          fontSize: "11px",
                          padding: "4px 10px",
                        }}
                      >
                        {activeLoan.status}
                      </span>
                    </div>
                  </div>

                  {/* Visual Tracker Bar */}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginTop: "16px", marginBottom: "6px" }}>
                    <span>Application Ingested</span>
                    <span>Alternate Ingest Match</span>
                    <span>Underwriter Review</span>
                    <span>Disbursal Decision</span>
                  </div>
                  <div className="score-bar-track" style={{ height: "6px" }}>
                    <div
                      className="score-bar-fill"
                      style={{
                        width:
                          activeLoan.status === "Approved" || activeLoan.status === "Approved with Conditions" || activeLoan.status === "Declined"
                            ? "100%"
                            : activeLoan.status === "Under Review"
                            ? "75%"
                            : "50%",
                        background:
                          activeLoan.status === "Declined"
                            ? "var(--risk-high-color)"
                            : "var(--risk-low-color)",
                        height: "100%",
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 10px", color: "var(--text-muted)", fontSize: "13px" }}>
                  📋 No active loan application. Start a new loan request in the **Loan Products** tab.
                </div>
              )}
            </div>

            {/* DPDP Consent summaries */}
            <div className="card">
              <div className="card-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
                <span className="card-title">Ingested Feeds Consent Checklist</span>
                <button
                  onClick={() => setView("settings")}
                  style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                >
                  Manage Feeds →
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingTop: "6px" }}>
                {[
                  { label: "GST declared turnover & filing metrics" },
                  { label: "UPI collection daily volume histories" },
                  { label: "Account Aggregator bank transactional balances" },
                  { label: "EPFO compliance employer contributions" },
                  { label: "Utility electricity payment disconnections" },
                ].map((consent, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: "var(--risk-low-color)", fontWeight: "bold" }}>✓</span>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{consent.label}</span>
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: "9px",
                        background: "rgba(48,209,88,0.12)",
                        color: "#30D158",
                        padding: "2px 6px",
                        borderRadius: "6px",
                        fontWeight: 700,
                      }}
                    >
                      CONSENTED
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Applicant Profile ──
function ApplicantProfileView({ user, updateApplicantProfile }) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.mobileNumber);
  const [successMsg, setSuccessMsg] = useState("");

  const handleSave = (e) => {
    e.preventDefault();
    updateApplicantProfile(name, phone);
    setSuccessMsg("Contact profile details updated successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  return (
    <div className="fade-in card" style={{ maxWidth: 640, margin: "0 auto" }}>
      <div className="card-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "14px" }}>
        <span className="card-title">Registered Personal &amp; Identity Profile</span>
      </div>

      {successMsg && <div className="auth-alert auth-alert--success" style={{ marginTop: "12px" }}>{successMsg}</div>}

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div className="auth-field">
            <label className="auth-label">Full Name</label>
            <input className="auth-input" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="auth-field">
            <label className="auth-label">Mobile Number</label>
            <input className="auth-input" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-label">Registered Email</label>
          <input className="auth-input" type="email" value={user.email} disabled style={{ opacity: 0.6 }} />
        </div>

        {user.kycCompleted ? (
          <div style={{ marginTop: "14px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "18px" }}>
            <h4 style={{ fontSize: "12px", color: "var(--accent-light)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "14px" }}>
              Verified Business KYC Data (Read-Only)
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div className="auth-field">
                <label className="auth-label">Business Name</label>
                <input className="auth-input" type="text" value={user.kycDetails?.businessName} disabled style={{ opacity: 0.6 }} />
              </div>
              <div className="auth-field">
                <label className="auth-label">Business Structure Type</label>
                <input className="auth-input" type="text" value={user.kycDetails?.businessType} disabled style={{ opacity: 0.6 }} />
              </div>
            </div>

            <div className="auth-field" style={{ marginBottom: "16px" }}>
              <label className="auth-label">Business Operations Address</label>
              <input className="auth-input" type="text" value={user.kycDetails?.address} disabled style={{ opacity: 0.6 }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <div className="auth-field">
                <label className="auth-label">GSTIN</label>
                <input className="auth-input" type="text" value={user.kycDetails?.gstin} disabled style={{ opacity: 0.6 }} />
              </div>
              <div className="auth-field">
                <label className="auth-label">PAN</label>
                <input className="auth-input" type="text" value={user.kycDetails?.pan} disabled style={{ opacity: 0.6 }} />
              </div>
              <div className="auth-field">
                <label className="auth-label">Aadhaar (Last 4 Digits)</label>
                <input className="auth-input" type="text" value={"XXXX XXXX " + user.kycDetails?.aadhaar?.slice(-4)} disabled style={{ opacity: 0.6 }} />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: "14px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "14px", textAlign: "center" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              🔒 Complete your KYC registration during loan application to verify tax registries and unlock health scoring.
            </span>
          </div>
        )}

        <button className="auth-submit" type="submit" style={{ marginTop: "8px" }}>
          Update Profile Contact Data
        </button>
      </form>
    </div>
  );
}

// ── Browse Available Loan Products ──
function LoanProductsView({ user, activeLoan, setView, onSelectProduct }) {
  const products = [
    {
      id: "prod_wc",
      title: "IDBI Working Capital Digital Finance",
      desc: "Calibrated short-term credit facilities to bridge operational cash-flow gaps, inventory purchases, or payroll disbursements. Evaluates real-time cash ledger velocities.",
      tenure: "12 to 24 Months",
      rates: "8.5% - 11.2% p.a.",
      amountRange: "₹5 Lakhs - ₹50 Lakhs",
    },
    {
      id: "prod_asset",
      title: "IDBI Equipment & Machinery Finance",
      desc: "Collateral-free asset procurement options to finance operational equipment, server hardware, or logistics vehicles. Mapped directly to operational continuity signals.",
      tenure: "24 to 48 Months",
      rates: "9.0% - 12.0% p.a.",
      amountRange: "₹10 Lakhs - ₹75 Lakhs",
    },
    {
      id: "prod_ntc",
      title: "IDBI NTC/NTB Enterprise Growth Line",
      desc: "Custom credit options optimized specifically for New-to-Credit and New-to-Bank thin-file MSMEs. Scores creditworthiness based on compliance filings and utility consistencies.",
      tenure: "6 to 18 Months",
      rates: "9.5% - 13.0% p.a.",
      amountRange: "₹2 Lakhs - ₹30 Lakhs",
    },
  ];

  const handleApplyClick = (prod) => {
    if (activeLoan) {
      alert("You already have an active loan application under process. IDBI policy limits applicants to one active request.");
      return;
    }
    onSelectProduct(prod);
    setView("kyc_flow");
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Digital Lending Products</h1>
        <p className="page-subtitle">Explainable alternate cash-flow financing for thin-file MSMEs</p>
      </div>

      <DisclaimerBanner />

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "24px" }}>
        {products.map((p) => (
          <div
            key={p.id}
            className="card"
            style={{
              padding: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: "280px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
                {p.title}
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5", marginBottom: "16px" }}>
                {p.desc}
              </p>
              <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>FACILITY SIZE</span>
                  <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>{p.amountRange}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>TENURE TERM</span>
                  <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>{p.tenure}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>INTEREST BANDS</span>
                  <strong style={{ fontSize: "13px", color: "var(--risk-low-color)" }}>{p.rates}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch", minWidth: "160px" }}>
              <button className="landing-btn-primary" onClick={() => handleApplyClick(p)} style={{ padding: "12px 24px", borderRadius: "10px", fontSize: "13px" }}>
                {!user.kycCompleted ? "Complete KYC & Apply" : "Apply Instantly"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Multi-Step KYC & Consent Flow ──
function KYCFormView({ user: _user, completeKYC, selectedProduct, setView }) {
  const [step, setStep] = useState(1); // 1: Personal, 2: Business, 3: Consent

  // Step 1: Personal Verification
  const [aadhaar, setAadhaar] = useState("");
  const [pan, setPan] = useState("");

  // Step 2: Business Details
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("Proprietorship");
  const [address, setAddress] = useState("");
  const [gstin, setGstin] = useState("");

  // Request details
  const [loanAmount, setLoanAmount] = useState("1500000");
  const [loanPurpose, _setLoanPurpose] = useState(selectedProduct?.title || "Working Capital");

  // Step 3: Consent checkboxes
  const [consentGST, setConsentGST] = useState(false);
  const [consentUPI, setConsentUPI] = useState(false);
  const [consentAA, setConsentAA] = useState(false);
  const [consentEPFO, setConsentEPFO] = useState(false);
  const [consentUtility, setConsentUtility] = useState(false);
  const [consentAuthorization, setConsentAuthorization] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNextStep = () => {
    setError("");
    if (step === 1) {
      if (!aadhaar.trim() || !pan.trim()) {
        setError("Please enter your Aadhaar and PAN numbers.");
        return;
      }
      if (aadhaar.replace(/\s/g, "").length !== 12) {
        setError("Aadhaar Number must be exactly 12 digits.");
        return;
      }
      if (pan.length !== 10) {
        setError("PAN Number must be exactly 10 characters.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!businessName.trim() || !address.trim() || !gstin.trim() || !loanAmount.trim()) {
        setError("Please complete all business operations details.");
        return;
      }
      if (gstin.length !== 15) {
        setError("GSTIN must be exactly 15 characters.");
        return;
      }
      setStep(3);
    }
  };

  const handleBackStep = () => {
    setError("");
    setStep((s) => s - 1);
  };

  const handleSubmitKYC = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    if (!consentGST || !consentUPI || !consentAA || !consentEPFO || !consentUtility || !consentAuthorization) {
      setError("You must provide consent for all alternate data pipelines to process thin-file digital appraisal.");
      return;
    }

    setLoading(true);
    try {
      await completeKYC(
        {
          aadhaar,
          pan,
          businessName,
          businessType,
          address,
          gstin,
        },
        loanAmount,
        loanPurpose
      );
      alert("Verification successful! Scoring Engine triggered and credit file submitted to underwriter panel.");
      setView("applicant_dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const allConsentsChecked = consentGST && consentUPI && consentAA && consentEPFO && consentUtility && consentAuthorization;

  return (
    <div className="fade-in card" style={{ maxWidth: 650, margin: "0 auto" }}>
      <div className="card-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
        <span className="card-title">Credit Request &amp; KYC Verification</span>
      </div>

      {/* Progress Steps Indicators */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "24px 0" }}>
        {[
          { label: "1. Personal ID", active: step === 1, done: step > 1 },
          { label: "2. Business Data", active: step === 2, done: step > 2 },
          { label: "3. Access Consent", active: step === 3, done: false },
        ].map((s, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: s.done ? "var(--risk-low-color)" : s.active ? "var(--accent)" : "rgba(255,255,255,0.04)",
                color: s.done ? "#111" : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: "bold",
              }}
            >
              {s.done ? "✓" : idx + 1}
            </span>
            <span style={{ fontSize: "12px", color: s.active ? "var(--text-primary)" : "var(--text-muted)", fontWeight: s.active ? 600 : 400 }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {error && <div className="auth-alert auth-alert--error">{error}</div>}

      {/* ── STEP 1: Personal ID ── */}
      {step === 1 && (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="auth-field">
            <label className="auth-label">Applicant Aadhaar Number (UIDAI ID)</label>
            <input
              className="auth-input"
              type="text"
              placeholder="e.g. 5432 9988 1234"
              value={aadhaar}
              onChange={(e) => setAadhaar(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Permanent Account Number (PAN ID)</label>
            <input
              className="auth-input"
              type="text"
              placeholder="e.g. ABCDE1234F"
              value={pan}
              onChange={(e) => setPan(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "flex", gap: "12px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px", marginTop: "10px" }}>
            <button className="landing-btn-secondary" onClick={() => setView("loan_products")} style={{ padding: "10px 20px", fontSize: "13px", borderRadius: "10px" }}>
              Cancel
            </button>
            <button className="landing-btn-primary" onClick={handleNextStep} style={{ marginLeft: "auto", padding: "10px 20px", fontSize: "13px", borderRadius: "10px" }}>
              Next Step: Business Data
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Business & Loan Details ── */}
      {step === 2 && (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="auth-field">
              <label className="auth-label">Business Registered Name</label>
              <input
                className="auth-input"
                type="text"
                placeholder="Riya Fabrics Pvt Ltd"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">Business Structure Type</label>
              <select className="filter-select" style={{ width: "100%", height: "40px" }} value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
                <option value="Proprietorship">Proprietorship</option>
                <option value="Partnership">Partnership</option>
                <option value="Pvt Ltd">Private Limited Company (Pvt Ltd)</option>
                <option value="LLP">Limited Liability Partnership (LLP)</option>
              </select>
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">Operations Address</label>
            <input
              className="auth-input"
              type="text"
              placeholder="e.g. G-12, Textile Market, Surat, Gujarat"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="auth-field">
              <label className="auth-label">Goods &amp; Services Tax Number (GSTIN)</label>
              <input
                className="auth-input"
                type="text"
                placeholder="15-digit code, e.g. 24AAAAA1111A1Z1"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">Requested Loan Amount (INR)</label>
              <input
                className="auth-input"
                type="number"
                placeholder="1500000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px", marginTop: "10px" }}>
            <button className="landing-btn-secondary" onClick={handleBackStep} style={{ padding: "10px 20px", fontSize: "13px", borderRadius: "10px" }}>
              Back
            </button>
            <button className="landing-btn-primary" onClick={handleNextStep} style={{ marginLeft: "auto", padding: "10px 20px", fontSize: "13px", borderRadius: "10px" }}>
              Next Step: Consent Sign-off
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Consent & Ingestion ── */}
      {step === 3 && (
        <form onSubmit={handleSubmitKYC} className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5, background: "rgba(255,255,255,0.02)", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
            📜 **Alternate Credit Data consent directive (DPDP Rules 2025 compliant)**:
            <br />
            To perform digital credit assessment without collateral documentation, check all consent scopes below to authorize Account Aggregator retrieval.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "rgba(255,255,255,0.01)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <input type="checkbox" id="con-gst" checked={consentGST} onChange={(e) => setConsentGST(e.target.checked)} disabled={loading} style={{ cursor: "pointer" }} />
              <label htmlFor="con-gst" style={{ fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer" }}>
                I authorize ingestion of monthly GST returns (GSTR-1, GSTR-3B)
              </label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <input type="checkbox" id="con-upi" checked={consentUPI} onChange={(e) => setConsentUPI(e.target.checked)} disabled={loading} style={{ cursor: "pointer" }} />
              <label htmlFor="con-upi" style={{ fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer" }}>
                I authorize retrieval of UPI payment transactional volume metrics
              </label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <input type="checkbox" id="con-aa" checked={consentAA} onChange={(e) => setConsentAA(e.target.checked)} disabled={loading} style={{ cursor: "pointer" }} />
              <label htmlFor="con-aa" style={{ fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer" }}>
                I authorize Account Aggregator secure access to bank transaction statements
              </label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <input type="checkbox" id="con-epfo" checked={consentEPFO} onChange={(e) => setConsentEPFO(e.target.checked)} disabled={loading} style={{ cursor: "pointer" }} />
              <label htmlFor="con-epfo" style={{ fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer" }}>
                I authorize sync access to EPFO payroll compliance statistics
              </label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <input type="checkbox" id="con-util" checked={consentUtility} onChange={(e) => setConsentUtility(e.target.checked)} disabled={loading} style={{ cursor: "pointer" }} />
              <label htmlFor="con-util" style={{ fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer" }}>
                I authorize access to Utility billing disconnections logs
              </label>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "start", marginTop: "4px" }}>
            <input type="checkbox" id="con-auth" checked={consentAuthorization} onChange={(e) => setConsentAuthorization(e.target.checked)} disabled={loading} style={{ cursor: "pointer", marginTop: "3px" }} />
            <label htmlFor="con-auth" style={{ fontSize: "12px", color: "var(--text-muted)", cursor: "pointer", lineHeight: 1.4 }}>
              I hereby certify that I am the authorized owner/signatory of this enterprise, and all submitted personal &amp; business identity indicators are true and correct.
            </label>
          </div>

          <div style={{ display: "flex", gap: "12px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px", marginTop: "10px" }}>
            <button type="button" className="landing-btn-secondary" onClick={handleBackStep} style={{ padding: "10px 20px", fontSize: "13px", borderRadius: "10px" }} disabled={loading}>
              Back
            </button>
            <button className="landing-btn-primary" type="submit" style={{ marginLeft: "auto", padding: "10px 20px", fontSize: "13px", borderRadius: "10px" }} disabled={loading || !allConsentsChecked}>
              {loading ? <Spinner /> : "Confirm Consent &amp; Submit Application"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Applicant Loan Applications List & FHC Details view ──
function ApplicantLoanApplicationsView({ myMsme, myLoans, onSelectApplication }) {
  if (!myMsme) {
    return (
      <div className="fade-in card" style={{ textAlign: "center", padding: "64px 32px", color: "var(--text-muted)" }}>
        📋 No credit score found. Complete your identity verification in the **Loan Products** tab.
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="card">
        <div className="card-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "14px" }}>
          <span className="card-title">Submitted Loan Request Audits</span>
        </div>

        <table className="msme-table" style={{ marginTop: "16px" }}>
          <thead>
            <tr>
              <th>Application ID</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Purpose</th>
              <th>Health score</th>
              <th>Risk Category</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {myLoans.map((loan) => (
              <tr key={loan.id} onClick={() => onSelectApplication(myMsme)} style={{ cursor: "pointer" }}>
                <td style={{ fontWeight: "bold" }}>{loan.id}</td>
                <td>{loan.date}</td>
                <td style={{ fontWeight: 600 }}>{fmtL(loan.amount)}</td>
                <td>{loan.purpose}</td>
                <td>
                  <strong style={{ color: scoreColor(myMsme.overallScore) }}>{myMsme.overallScore}/1000</strong>
                </td>
                <td>
                  <RiskBadge band={myMsme.riskBand} isFraud={myMsme.crossValidation.isFlagged} />
                </td>
                <td>
                  <span
                    className="action-badge"
                    style={{
                      background: `${myMsme.actionConfig.color}15`,
                      color: myMsme.actionConfig.color,
                      border: `1px solid ${myMsme.actionConfig.color}30`,
                    }}
                  >
                    {myMsme.actionConfig.label}
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

// ── Notifications Tab ──
function NotificationsView({ user, activeLoan }) {
  const notifications = [
    { title: "Account Portal Activated", desc: "Welcome to IDBI Bank MSME Financial Health Card portal. Complete verification to unlock scoring.", date: "Just now" },
  ];

  if (user.kycCompleted) {
    notifications.unshift(
      { title: "Loan Application Logged", desc: `Application ${activeLoan?.id || "LN-101"} submitted for credit officer check.`, date: "Just now" },
      { title: "Financial Health score Calculated", desc: `Scoring scorecard prepared dynamically. Overall Score: ${activeLoan ? "Verified" : "Syncing"}`, date: "Just now" },
      { title: "Business KYC Verified", desc: "GSTIN tax indicators and personal UID successfully reconciled.", date: "1 minute ago" }
    );
  }

  return (
    <div className="fade-in card" style={{ maxWidth: 640, margin: "0 auto" }}>
      <div className="card-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
        <span className="card-title">Portal Notifications Alerts</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
        {notifications.map((n, idx) => (
          <div
            key={idx}
            style={{
              padding: "14px 18px",
              background: "rgba(255,255,255,0.01)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
            }}
          >
            <div>
              <h4 style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-primary)" }}>{n.title}</h4>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px", lineHeight: "1.4" }}>
                {n.desc}
              </p>
            </div>
            <span style={{ fontSize: "10.5px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{n.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Applicant Settings ──
function ApplicantSettingsView() {
  const { user, resetPassword, updateApplicantProfile, logout } = useAuth();
  
  // Category tabs
  const [activeTab, setActiveTab] = useState("account"); // "account" | "loans" | "notifications" | "security" | "support" | "about"
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Profile Edit State
  const [profileName, setProfileName] = useState(user.name);
  const [profilePhone, setProfilePhone] = useState(user.mobileNumber);
  const [profileSuccess, setProfileSuccess] = useState("");

  // Password reset state
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [passError, setPassError] = useState("");

  // DPDP Consents (mirrored from local memory or parent states)
  const [consents, setConsents] = useState({
    gst: true,
    upi: true,
    aa: true,
    epfo: true,
    utility: true,
  });

  // Notification toggles
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(true);
  const [alertFreq, setAlertFreq] = useState("instant"); // "instant" | "daily" | "weekly"

  // FAQ Accordion states
  const [faqActive, setFaqActive] = useState(null);

  // Live Chat simulation
  const [chatMessages, setChatMessages] = useState([
    { text: "Hello! How can I assist you with your MSME Credit appraisal today?", sender: "bot", time: "Just now" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Complaints logger
  const [complaints, setComplaints] = useState([
    { id: "CMP-4012", subject: "KYC Aadhaar Matching Timeout", category: "Appraisal Error", date: "2026-07-07", status: "Resolved" }
  ]);
  const [complaintSubject, setComplaintSubject] = useState("");
  const [complaintCategory, setComplaintCategory] = useState("Appraisal Error");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [complaintSuccess, setComplaintSuccess] = useState("");

  // Feedback State
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState("");

  const handleConsentToggle = (key, label) => {
    const nextVal = !consents[key];
    if (!nextVal) {
      const confirmFreeze = window.confirm(
        `Under DPDP Act 2023 Rules: Revoking consent for "${label}" will prevent IDBI Bank from retrieving new transactions, freezing your scoring updates for this category. Are you sure you wish to freeze updates?`
      );
      if (!confirmFreeze) return;
    }
    setConsents((curr) => ({ ...curr, [key]: nextVal }));
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    updateApplicantProfile(profileName, profilePhone);
    setProfileSuccess("Contact profile details updated successfully!");
    setTimeout(() => setProfileSuccess(""), 3000);
  };

  const handleResetPass = async (e) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");
    if (newPass !== confirmPass) {
      setPassError("Passwords do not match.");
      return;
    }
    try {
      await resetPassword(user.email, "applicant", newPass);
      setPassSuccess("Your account password has been updated!");
      setNewPass("");
      setConfirmPass("");
    } catch (err) {
      setPassError(err.message);
    }
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    const newMsgs = [...chatMessages, { text: userMsg, sender: "user", time: "Just now" }];
    setChatMessages(newMsgs);
    setChatInput("");
    setIsTyping(true);

    setTimeout(() => {
      let botText = "Thank you for reaching out to IDBI Support. Your credit health card appraisal is fully digital and paperless. Please let me know if you need help with KYC verification, score breakdown, or loan limits!";
      const cleanMsg = userMsg.toLowerCase();
      if (cleanMsg.includes("score") || cleanMsg.includes("health") || cleanMsg.includes("calculate")) {
        botText = "The MSME Financial Health Score is computed deterministically based on your GST tax filings, bank cash flows, UPI collections, EPFO payroll contributions, and utility bills consistency. Completing KYC automatically retrieves these feeds.";
      } else if (cleanMsg.includes("loan") || cleanMsg.includes("apply") || cleanMsg.includes("limit")) {
        botText = "You can browse loan packages (Working Capital, Equipment Procurement, NTC Growth Line) under the 'Loan Products' tab. Click 'Apply Now' to initialize underwriting.";
      } else if (cleanMsg.includes("consent") || cleanMsg.includes("dpdp") || cleanMsg.includes("revoke")) {
        botText = "According to DPDP Act 2023, you retain absolute authority to revoke consents. Go to 'Loan Services & Consent' in Settings to freeze or resume monthly transaction updates.";
      }

      setChatMessages((curr) => [...curr, { text: botText, sender: "bot", time: "Just now" }]);
      setIsTyping(false);
    }, 1000);
  };

  const handleRaiseComplaint = (e) => {
    e.preventDefault();
    if (!complaintSubject.trim() || !complaintDesc.trim()) return;

    const newComp = {
      id: `CMP-${Math.floor(4000 + Math.random() * 5999)}`,
      subject: complaintSubject.trim(),
      category: complaintCategory,
      date: new Date().toISOString().split("T")[0],
      status: "Open",
    };

    setComplaints([newComp, ...complaints]);
    setComplaintSubject("");
    setComplaintDesc("");
    setComplaintSuccess(`Complaint registered successfully under reference ID: ${newComp.id}`);
    setTimeout(() => setComplaintSuccess(""), 4000);
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    setFeedbackSuccess("Thank you for your feedback! Your inputs help us refine our lending algorithms.");
    setFeedbackText("");
    setTimeout(() => setFeedbackSuccess(""), 4000);
  };

  return (
    <div className="settings-container fade-in" style={{ display: "flex", gap: "24px", minHeight: "680px", flexWrap: "wrap" }}>
      
      {/* ── Left Sidebar Navigation ── */}
      <div 
        className="card" 
        style={{ 
          flex: "1 1 240px", 
          padding: "16px", 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "space-between",
          minWidth: "220px",
          background: "var(--bg-card)",
          border: "1px solid var(--bg-border)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", padding: "8px 10px", marginBottom: "10px" }}>
            Settings Menu
          </h2>
          
          {[
            { id: "account", label: "👤 Account Profile" },
            { id: "loans", label: "📋 Loan Services & Consent" },
            { id: "notifications", label: "🔔 Alert Notifications" },
            { id: "security", label: "🔒 Security & Sessions" },
            { id: "support", label: "💬 Help & Live Support" },
            { id: "about", label: "ℹ️ About Application" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "none",
                background: activeTab === tab.id ? "var(--accent)" : "none",
                color: activeTab === tab.id ? "#fff" : "var(--text-secondary)",
                textAlign: "left",
                cursor: "pointer",
                fontWeight: activeTab === tab.id ? 600 : 400,
                transition: "all 0.2s ease",
                fontSize: "13px",
              }}
              className="settings-nav-btn"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Global Prominent Logout */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          style={{
            marginTop: "30px",
            width: "100%",
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid rgba(255, 69, 58, 0.4)",
            background: "rgba(255, 69, 58, 0.12)",
            color: "#FF453A",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "all 0.2s ease",
            fontSize: "13px",
          }}
          className="settings-logout-btn"
          type="button"
        >
          🚪 Log Out Account
        </button>
      </div>

      {/* ── Right Content Details Panel ── */}
      <div className="card" style={{ flex: "3 1 500px", padding: "24px", minWidth: "300px" }}>
        
        {/* ── SECTION: ACCOUNT ── */}
        {activeTab === "account" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>Account Profile</h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Update contact details or change portal access passwords.</p>
            </div>

            <div className="section-divider" style={{ margin: 0 }} />

            {/* Profile read/edit */}
            <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <h4 style={{ fontSize: "13px", color: "var(--accent-light)", fontWeight: 700 }}>PROFILE DETAILS</h4>
              {profileSuccess && <div className="auth-alert auth-alert--success">{profileSuccess}</div>}
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", flexWrap: "wrap" }}>
                <div className="auth-field">
                  <label className="auth-label">Full Name</label>
                  <input className="auth-input" type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} required />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Mobile Number</label>
                  <input className="auth-input" type="text" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} required />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Registered Email</label>
                <input className="auth-input" type="email" value={user.email} disabled style={{ opacity: 0.6 }} />
              </div>

              <button className="auth-submit" type="submit" style={{ alignSelf: "flex-start", width: "auto", minWidth: "160px" }}>
                Save Profile Changes
              </button>
            </form>

            <div className="section-divider" style={{ margin: 0 }} />

            {/* Password Reset */}
            <form onSubmit={handleResetPass} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <h4 style={{ fontSize: "13px", color: "var(--accent-light)", fontWeight: 700 }}>CHANGE PASSWORD</h4>
              {passSuccess && <div className="auth-alert auth-alert--success">{passSuccess}</div>}
              {passError && <div className="auth-alert auth-alert--error">{passError}</div>}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="auth-field">
                  <label className="auth-label">New Password</label>
                  <input className="auth-input" type="password" placeholder="Minimum 6 characters" value={newPass} onChange={(e) => setNewPass(e.target.value)} required />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Confirm Password</label>
                  <input className="auth-input" type="password" placeholder="Confirm new password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} required />
                </div>
              </div>

              <button className="auth-submit" type="submit" style={{ alignSelf: "flex-start", width: "auto", minWidth: "160px" }}>
                Update Secure Password
              </button>
            </form>
          </div>
        )}

        {/* ── SECTION: LOAN SERVICES & CONSENT ── */}
        {activeTab === "loans" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>Loan Services &amp; Regulatory Policies</h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Consent management dashboards and compliance certifications.</p>
            </div>

            <div className="section-divider" style={{ margin: 0 }} />

            {/* DPDP Consent management */}
            <div>
              <h4 style={{ fontSize: "13px", color: "var(--accent-light)", fontWeight: 700, marginBottom: "10px" }}>CONSENT MANAGEMENT</h4>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "14px" }}>
                Under the **DPDP Act 2023**, you hold the right to revoke consent for any ingested alternate cash flow streams at any time. Revoking consent freezes new statement fetches.
              </p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { key: "gst", label: "GST filings data ingestion (GSTR-1, GSTR-3B)" },
                  { key: "upi", label: "UPI collection daily volume histories" },
                  { key: "aa", label: "Account Aggregator transactional statements" },
                  { key: "epfo", label: "EPFO payroll compliance numbers" },
                  { key: "utility", label: "Electricity & Utility billing logs" },
                ].map((item) => (
                  <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "10px" }}>
                    <span style={{ fontSize: "12.5px", color: "var(--text-secondary)", fontWeight: 550 }}>{item.label}</span>
                    <button
                      type="button"
                      onClick={() => handleConsentToggle(item.key, item.label)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "6px",
                        background: consents[item.key] ? "rgba(48,209,88,0.12)" : "rgba(255,69,58,0.12)",
                        color: consents[item.key] ? "#30D158" : "#FF453A",
                        border: consents[item.key] ? "1px solid rgba(48,209,88,0.3)" : "1px solid rgba(255,69,58,0.3)",
                        fontSize: "11px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        minWidth: "80px",
                      }}
                    >
                      {consents[item.key] ? "ACTIVE" : "REVOKED"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="section-divider" style={{ margin: 0 }} />

            {/* Privacy Policies & Terms */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", flexWrap: "wrap" }}>
              <div>
                <h4 style={{ fontSize: "13px", color: "var(--accent-light)", fontWeight: 700, marginBottom: "8px" }}>PRIVACY POLICY HIGHLIGHTS</h4>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                  All ingested metrics are purpose-bound solely for loan evaluations. Statements are encrypted under secure AES-256 protocols and stored on private, ISO-certified bank nodes. No credential scraping is allowed.
                </p>
              </div>
              <div>
                <h4 style={{ fontSize: "13px", color: "var(--accent-light)", fontWeight: 700, marginBottom: "8px" }}>LENDING TERMS &amp; CONDITIONS</h4>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                  Credit approvals are subject to underwriting validation of alternate indicators against bank ledgers. Scorecard outcomes represent automated recommendation profiles; the final decision remains with the IDBI credit committee.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION: NOTIFICATIONS ── */}
        {activeTab === "notifications" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>Notification Preferences</h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Control how and when you receive underwriting status updates.</p>
            </div>

            <div className="section-divider" style={{ margin: 0 }} />

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "13.5px", color: "var(--text-primary)", fontWeight: 600 }}>Email Notifications</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    Receive score summaries and approval notices at {user.email}
                  </div>
                </div>
                <button
                  onClick={() => setEmailNotif(!emailNotif)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    background: emailNotif ? "rgba(48,209,88,0.12)" : "rgba(255,255,255,0.05)",
                    color: emailNotif ? "#30D158" : "var(--text-muted)",
                    border: emailNotif ? "1px solid rgba(48,209,88,0.3)" : "1px solid rgba(255,255,255,0.1)",
                    fontSize: "12px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  {emailNotif ? "ON" : "OFF"}
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "13.5px", color: "var(--text-primary)", fontWeight: 600 }}>SMS Notifications</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    Receive transaction alerts and OTP verification on {user.mobileNumber}
                  </div>
                </div>
                <button
                  onClick={() => setSmsNotif(!smsNotif)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    background: smsNotif ? "rgba(48,209,88,0.12)" : "rgba(255,255,255,0.05)",
                    color: smsNotif ? "#30D158" : "var(--text-muted)",
                    border: smsNotif ? "1px solid rgba(48,209,88,0.3)" : "1px solid rgba(255,255,255,0.1)",
                    fontSize: "12px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  {smsNotif ? "ON" : "OFF"}
                </button>
              </div>

              <div className="section-divider" style={{ margin: 0 }} />

              <div className="auth-field">
                <label className="auth-label">Alert Delivery Frequency</label>
                <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                  {["instant", "daily", "weekly"].map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setAlertFreq(freq)}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: "8px",
                        background: alertFreq === freq ? "var(--accent)" : "rgba(255,255,255,0.03)",
                        border: alertFreq === freq ? "1px solid var(--accent)" : "1px solid rgba(255,255,255,0.08)",
                        color: alertFreq === freq ? "#fff" : "var(--text-secondary)",
                        fontSize: "12px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        textTransform: "capitalize",
                      }}
                    >
                      {freq} Alerts
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION: SECURITY & SESSIONS ── */}
        {activeTab === "security" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>Security &amp; Device Sessions</h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Monitor active login sessions, connection locations, and storage schemas.</p>
            </div>

            <div className="section-divider" style={{ margin: 0 }} />

            {/* Active Session Info */}
            <div>
              <h4 style={{ fontSize: "13px", color: "var(--accent-light)", fontWeight: 700, marginBottom: "10px" }}>ACTIVE LOGIN SESSION</h4>
              <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "14px", lineHeight: "1.6" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "12px" }}>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Session Reference:</span>
                    <strong style={{ display: "block", color: "var(--text-primary)" }}>session_IDBI_491823</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Secure IP Address:</span>
                    <strong style={{ display: "block", color: "var(--risk-low-color)" }}>192.168.1.48 (SSL Secure)</strong>
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <span style={{ color: "var(--text-muted)" }}>Device User Agent:</span>
                    <span style={{ display: "block", color: "var(--text-primary)", fontSize: "11.5px", fontFamily: "monospace" }}>
                      {navigator.userAgent}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="section-divider" style={{ margin: 0 }} />

            {/* Login History */}
            <div>
              <h4 style={{ fontSize: "13px", color: "var(--accent-light)", fontWeight: 700, marginBottom: "10px" }}>LOGIN HISTORY REGISTRY (RECENT 3)</h4>
              <table className="msme-table" style={{ marginTop: "8px" }}>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>IP Address</th>
                    <th>Device/Agent</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>2026-07-08 23:57:02</td>
                    <td>192.168.1.48</td>
                    <td>Windows 11 / Chrome</td>
                    <td><span style={{ color: "var(--risk-low-color)", fontWeight: "bold" }}>Active</span></td>
                  </tr>
                  <tr>
                    <td>2026-07-08 18:19:54</td>
                    <td>192.168.1.48</td>
                    <td>Windows 11 / Chrome</td>
                    <td><span style={{ color: "var(--text-muted)" }}>Completed</span></td>
                  </tr>
                  <tr>
                    <td>2026-07-07 14:02:11</td>
                    <td>192.168.1.51</td>
                    <td>Android 14 / Edge</td>
                    <td><span style={{ color: "var(--text-muted)" }}>Completed</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SECTION: HELP & SUPPORT ── */}
        {activeTab === "support" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>Help Center &amp; Support</h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>FAQs, complaint registry, support contacts, and live chat.</p>
            </div>

            <div className="section-divider" style={{ margin: 0 }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "24px", alignItems: "start", flexWrap: "wrap" }}>
              
              {/* FAQ Accordions & Contacts */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <h4 style={{ fontSize: "13px", color: "var(--accent-light)", fontWeight: 700, marginBottom: "10px" }}>FREQUENTLY ASKED QUESTIONS</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {[
                      { q: "How is the credit score computed?", a: "It is calculated deterministically from 5 alternate data dimensions (GST, bank statements, UPI flows, EPFO, utility filings) using a transparent weighted scoring logic, with no black-box ML engines." },
                      { q: "What happens if I revoke my consent?", a: "Under DPDP rules, revoking consent freezes any further data synchronization. The system keeps your historic ratings but prevents updates during bank audits." },
                      { q: "How does GST turnover cross-validation work?", a: "The system matches declared GST turnovers against bank inflows and UPI volumes. Discrepancies exceeding 40% flag an underwriting penalty." },
                    ].map((item, idx) => (
                      <div key={idx} style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", overflow: "hidden" }}>
                        <button
                          type="button"
                          onClick={() => setFaqActive(faqActive === idx ? null : idx)}
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            background: "rgba(255,255,255,0.02)",
                            border: "none",
                            textAlign: "left",
                            color: "var(--text-primary)",
                            fontSize: "12.5px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>{item.q}</span>
                          <span>{faqActive === idx ? "−" : "+"}</span>
                        </button>
                        {faqActive === idx && (
                          <div style={{ padding: "10px 14px", fontSize: "12px", color: "var(--text-secondary)", borderTop: "1px solid rgba(255,255,255,0.06)", lineHeight: "1.5" }}>
                            {item.a}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact Information block */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "14px" }}>
                  <h4 style={{ fontSize: "13px", color: "var(--accent-light)", fontWeight: 700, marginBottom: "8px" }}>CONTACT HELPLINES</h4>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.7" }}>
                    📞 **Customer Care**: +91-22-6800-4000
                    <br />
                    📞 **Toll-Free Helpline**: 1800-209-1910 / 1800-22-1910
                    <br />
                    📧 **Support Email**: msmesupport@idbi.co.in
                    <br />
                    🕒 **Banking Hours**: Mon - Sat: 10 AM - 4 PM (2nd/4th Saturdays closed)
                  </div>
                </div>
              </div>

              {/* Interactive Live Chat & Forms */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                
                {/* Mock Live Chat */}
                <div style={{ border: "1px solid var(--bg-border)", borderRadius: "12px", background: "rgba(255,255,255,0.01)", overflow: "hidden", display: "flex", flexDirection: "column", height: "300px" }}>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "8px", height: "8px", background: "var(--risk-low-color)", borderRadius: "50%" }} />
                    <span style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-primary)" }}>IDBI Live Assistant</span>
                  </div>
                  
                  {/* Chat message body */}
                  <div style={{ flex: 1, padding: "14px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {chatMessages.map((m, idx) => (
                      <div key={idx} style={{ alignSelf: m.sender === "user" ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                        <div
                          style={{
                            padding: "8px 12px",
                            borderRadius: "10px",
                            background: m.sender === "user" ? "var(--accent)" : "rgba(255,255,255,0.04)",
                            color: "#fff",
                            fontSize: "12px",
                            lineHeight: "1.4",
                          }}
                        >
                          {m.text}
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div style={{ alignSelf: "flex-start", fontSize: "11px", color: "var(--text-muted)" }}>
                        Assistant typing...
                      </div>
                    )}
                  </div>

                  {/* Chat input */}
                  <form onSubmit={handleSendChatMessage} style={{ display: "flex", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <input
                      className="auth-input"
                      style={{ border: "none", borderRadius: 0, background: "none", flex: 1, height: "38px", fontSize: "12px", padding: "0 12px" }}
                      placeholder="Type score, loan, revoke..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                    />
                    <button type="submit" style={{ background: "none", border: "none", color: "var(--accent)", padding: "0 14px", cursor: "pointer", fontSize: "12.5px", fontWeight: "bold" }}>
                      Send
                    </button>
                  </form>
                </div>

                {/* Complaint form */}
                <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", padding: "16px", borderRadius: "12px" }}>
                  <h4 style={{ fontSize: "12.5px", color: "var(--text-primary)", fontWeight: 700, marginBottom: "8px" }}>RAISE COMPLAINT REGISTRY</h4>
                  {complaintSuccess && <div className="auth-alert auth-alert--success" style={{ padding: "6px 10px", fontSize: "11.5px", marginBottom: "10px" }}>{complaintSuccess}</div>}
                  
                  <form onSubmit={handleRaiseComplaint} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <input className="auth-input" style={{ height: "32px", fontSize: "11.5px" }} placeholder="Subject summary" value={complaintSubject} onChange={(e) => setComplaintSubject(e.target.value)} required />
                      <select className="filter-select" style={{ height: "32px", fontSize: "11.5px" }} value={complaintCategory} onChange={(e) => setComplaintCategory(e.target.value)}>
                        <option value="Appraisal Error">Appraisal Error</option>
                        <option value="Consent Issue">Consent Issue</option>
                        <option value="Login Bug">Login Bug</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <textarea 
                      className="auth-input" 
                      style={{ height: "50px", fontSize: "11.5px", padding: "8px", resize: "none" }} 
                      placeholder="Detail complaint description..." 
                      value={complaintDesc} 
                      onChange={(e) => setComplaintDesc(e.target.value)} 
                      required 
                    />
                    <button className="auth-submit" style={{ minHeight: "30px", fontSize: "12px", width: "100%", padding: "6px" }} type="submit">
                      Raise Ticket
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="section-divider" style={{ margin: 0 }} />

            {/* Feedback & Star ratings */}
            <form onSubmit={handleFeedbackSubmit} style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", padding: "16px", borderRadius: "12px" }}>
              <h4 style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 700, marginBottom: "8px" }}>SUBMIT EXPERIENCE FEEDBACK</h4>
              {feedbackSuccess && <div className="auth-alert auth-alert--success" style={{ marginBottom: "10px" }}>{feedbackSuccess}</div>}
              
              <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackRating(star)}
                    style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: star <= feedbackRating ? "#FF9F0A" : "var(--text-muted)" }}
                  >
                    ★
                  </button>
                ))}
              </div>
              <input className="auth-input" style={{ height: "36px", fontSize: "12px", marginBottom: "8px" }} placeholder="What did you like or what could we improve?" value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} required />
              <button className="auth-submit" style={{ minHeight: "34px", width: "auto", padding: "6px 20px", fontSize: "12.5px" }} type="submit">
                Submit Feedback Report
              </button>
            </form>
          </div>
        )}

        {/* ── SECTION: ABOUT ── */}
        {activeTab === "about" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>About MSME Financial Health Card</h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Information on application compliance and system architecture.</p>
            </div>

            <div className="section-divider" style={{ margin: 0 }} />

            <div>
              <h4 style={{ fontSize: "13px", color: "var(--accent-light)", fontWeight: 700, marginBottom: "6px" }}>SYSTEM VERSION</h4>
              <span style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>v2.4.0-stable (Release Build: 2026.0708.98)</span>
            </div>

            <div>
              <h4 style={{ fontSize: "13px", color: "var(--accent-light)", fontWeight: 700, marginBottom: "6px" }}>CORE MISSION</h4>
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                Traditional lending metrics exclude millions of micro, small, and medium businesses lacking physical asset collateral. The **MSME Financial Health Card** addresses this credit asymmetry by scoring operational viability through digital compliance footprints.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: "13px", color: "var(--accent-light)", fontWeight: 700, marginBottom: "8px" }}>REGULATORY COMPLIANCE PROTOCOLS</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {[
                  { label: "RBI Digital Lending Directions 2022 compliant (all underwriting traceable)" },
                  { label: "DPDP Act 2023 Rules compliant (Phase 2 consent flows fully implemented)" },
                  { label: "Account Aggregator framework integration ready" },
                  { label: "Auditable deterministic scoring logic without black-box bias algorithms" }
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "12.5px", color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--risk-low-color)", fontWeight: "bold" }}>✓</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Logout Confirmation Dialog Overlay ── */}
      {showLogoutConfirm && (
        <div 
          className="auth-overlay auth-overlay--in" 
          style={{ zIndex: 1000 }}
          role="presentation"
        >
          <div 
            className="auth-card auth-card--in" 
            style={{ maxWidth: "380px", width: "90%", textAlign: "center", padding: "24px" }}
            role="dialog"
            aria-modal="true"
            aria-label="Confirm Log Out"
          >
            <span style={{ fontSize: "36px", display: "block", marginBottom: "12px" }}>⚠️</span>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
              Confirm Account Log Out
            </h3>
            <p style={{ fontSize: "12.5px", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "20px" }}>
              Are you sure you wish to log out from the MSME Financial Health Card portal? You will need to re-authenticate to view your credit scorecards.
            </p>

            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                className="landing-btn-secondary" 
                onClick={() => setShowLogoutConfirm(false)}
                style={{ flex: 1, padding: "10px", borderRadius: "8px", fontSize: "13px" }}
                type="button"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                style={{ 
                  flex: 1, 
                  padding: "10px", 
                  borderRadius: "8px", 
                  fontSize: "13px",
                  background: "rgba(255, 69, 58, 0.85)", 
                  borderColor: "rgba(255, 69, 58, 0.4)",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
                type="button"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ── 6. BANK EMPLOYEE SUB-COMPONENTS ──────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ── Employee Dashboard ──
function EmployeeDashboardView({ scoredMsmes, setView }) {
  const stats = portfolioAnalytics(scoredMsmes);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Underwriting Management Control</h1>
        <p className="page-subtitle">Bank employee console for alternate credit score reviews</p>
      </div>

      <DisclaimerBanner />

      {/* Summary KPI Cards */}
      <div className="stats-row" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-label">Pipeline Active Asking</div>
          <div className="stat-value" style={{ color: "var(--accent-blue-light)" }}>{fmtL(stats.totalLoanAsk)}</div>
          <div className="stat-sub">across {stats.total} total cases</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Manual Review Needed</div>
          <div className="stat-value" style={{ color: stats.fraudFlags > 0 ? "#f97316" : "var(--text-secondary)" }}>
            {stats.fraudFlags}
          </div>
          <div className="stat-sub">with cross-val alerts</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Credit Score</div>
          <div className="stat-value" style={{ color: scoreColor(stats.avgScore) }}>{stats.avgScore}</div>
          <div className="stat-sub">out of 1000</div>
        </div>
      </div>

      {/* Grid of actions and alerts */}
      <div className="grid-2" style={{ alignItems: "stretch" }}>
        {/* Risk Flags Panel */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="card-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
            <span className="card-title">Urgent Credit &amp; Validation Flags</span>
          </div>

          <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: "12px", marginTop: "14px" }}>
            {scoredMsmes.filter((m) => m.crossValidation.isFlagged || m.overallScore < 450).length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 10px", color: "var(--text-muted)", fontSize: "13px" }}>
                ✓ No urgent credit or validation flags.
              </div>
            ) : (
              scoredMsmes
                .filter((m) => m.crossValidation.isFlagged || m.overallScore < 450)
                .map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setView("list")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      background: "rgba(255,255,255,0.02)",
                      border: `1px solid ${m.crossValidation.isFlagged ? "rgba(249,115,22,0.22)" : "rgba(239,68,68,0.22)"}`,
                      borderRadius: "10px",
                      cursor: "pointer",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 650, fontSize: "13px", color: "var(--text-primary)" }}>{m.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                        {m.crossValidation.isFlagged
                          ? `Divergence: ${m.crossValidation.avgDivergence}%`
                          : `Low Score: ${m.overallScore}`}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "10px",
                        background: m.crossValidation.isFlagged ? "rgba(249,115,22,0.12)" : "rgba(239,68,68,0.12)",
                        color: m.crossValidation.isFlagged ? "#f97316" : "#ef4444",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontWeight: 700,
                      }}
                    >
                      {m.crossValidation.isFlagged ? "FLAGGED" : "HIGH RISK"}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Shortcuts Panel */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="card-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
            <span className="card-title">Quick Underwriter Actions</span>
          </div>

          <div style={{ flexGrow: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "14px" }}>
            <button
              onClick={() => setView("list")}
              className="landing-btn-secondary"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px 10px",
                borderRadius: "14px",
                gap: "10px",
              }}
              type="button"
            >
              <span style={{ fontSize: "28px" }}>📋</span>
              <span style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>Review Applications</span>
            </button>

            <button
              onClick={() => setView("portfolio")}
              className="landing-btn-secondary"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px 10px",
                borderRadius: "14px",
                gap: "10px",
              }}
              type="button"
            >
              <span style={{ fontSize: "28px" }}>📊</span>
              <span style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>Portfolio Analytics</span>
            </button>

            <button
              onClick={() => setView("reports")}
              className="landing-btn-secondary"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px 10px",
                borderRadius: "14px",
                gap: "10px",
              }}
              type="button"
            >
              <span style={{ fontSize: "28px" }}>📑</span>
              <span style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>Compliance Reports</span>
            </button>

            <button
              onClick={() => setView("settings")}
              className="landing-btn-secondary"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px 10px",
                borderRadius: "14px",
                gap: "10px",
              }}
              type="button"
            >
              <span style={{ fontSize: "28px" }}>🛠️</span>
              <span style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>Cut-off Parameters</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Active Credit Underwriting Rules Overview Card ── */}
      <div className="card" style={{ marginTop: "24px" }}>
        <div className="card-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
          <span className="card-title">Active Credit Underwriting Rules</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginTop: "16px" }}>
          <div>
            <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Score Ranges</span>
            <div style={{ fontSize: "13px", color: "var(--text-primary)", marginTop: "4px", lineHeight: "1.6" }}>
              🟢 Low Risk: <strong>700–1000</strong><br />
              🟡 Medium Risk: <strong>450–699</strong><br />
              🔴 High Risk: <strong>0–449</strong>
            </div>
          </div>
          <div>
            <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Approval Rules</span>
            <div style={{ fontSize: "13px", color: "var(--text-primary)", marginTop: "4px", lineHeight: "1.6" }}>
              ✓ Auto Approve: <strong>≥ 700</strong><br />
              ⌕ Manual Review: <strong>450–699</strong><br />
              ✗ Auto Decline: <strong>&lt; 450</strong>
            </div>
          </div>
          <div>
            <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Telemetry History</span>
            <div style={{ fontSize: "13px", color: "var(--text-primary)", marginTop: "4px", lineHeight: "1.6" }}>
              GST Invoices: <strong>≥ 6 Months</strong><br />
              UPI Inflow: <strong>≥ 6 Months</strong><br />
              EPFO Ingestion: <strong>≥ 6 Months</strong>
            </div>
          </div>
          <div>
            <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Cross-Validation Bounds</span>
            <div style={{ fontSize: "13px", color: "var(--text-primary)", marginTop: "4px", lineHeight: "1.6" }}>
              Divergence Limit: <strong>&gt; 40% Mismatch</strong><br />
              Missing Inflows: <strong>&gt; 20% Limit</strong>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

// ── Reports Tab ──
function ReportsView() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      alert("Analytical Excel report successfully prepared and downloaded!");
    }, 1500);
  };

  const reportsData = [
    { title: "Quarterly Credit Risk Allocation Report", type: "PDF Document", lastRun: "2026-07-01", size: "2.4 MB" },
    { title: "GST vs Bank Cashflow Discrepancy Registry", type: "Excel Spreadsheet", lastRun: "2026-07-08", size: "840 KB" },
    { title: "NTC Portfolio Performance Early Warning Signals", type: "PDF Document", lastRun: "2026-07-05", size: "1.8 MB" },
    { title: "Compliance Delays & Utility Disconnections Log", type: "Excel Spreadsheet", lastRun: "2026-07-08", size: "1.1 MB" },
  ];

  return (
    <div className="fade-in card">
      <div className="card-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span className="card-title">Compliance &amp; Portfolio Reports</span>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
            Underwriting decision audit reports ready for export.
          </p>
        </div>
        <button className="landing-btn-primary" onClick={handleDownload} disabled={downloading} style={{ padding: "8px 18px", fontSize: "12px", borderRadius: "10px", minHeight: "auto" }}>
          {downloading ? "Preparing..." : "Export Full Excel Report"}
        </button>
      </div>

      <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {reportsData.map((rep, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 18px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "12px",
            }}
          >
            <div>
              <div style={{ fontWeight: 650, fontSize: "14px", color: "var(--text-primary)" }}>{rep.title}</div>
              <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "3px" }}>
                Type: {rep.type} | Compiled: {rep.lastRun} | File Size: {rep.size}
              </div>
            </div>
            <button
              onClick={handleDownload}
              disabled={downloading}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--text-primary)",
                padding: "6px 12px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "12px",
              }}
              type="button"
            >
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Employee Settings (Risk Parameters configuration) ──
// ── Employee Settings (Risk Parameters configuration) ──
function EmployeeSettingsView({ resetPassword, user }) {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("account"); // "account" | "preferences" | "notifications" | "security" | "support" | "contact" | "compliance" | "about"
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Risk parameters
  const [lowCutoff, setLowCutoff] = useState(700);
  const [medCutoff, setMedCutoff] = useState(450);
  const [successMsg, setSuccessMsg] = useState("");

  // Detailed Cut-Off parameters
  const [autoApproveScore, setAutoApproveScore] = useState(700);
  const [manualReviewScore, setManualReviewScore] = useState(450);
  const [autoRejectScore, setAutoRejectScore] = useState(400);

  const [minGstMonths, setMinGstMonths] = useState(6);
  const [minUpiMonths, setMinUpiMonths] = useState(6);
  const [minBankMonths, setMinBankMonths] = useState(6);
  const [minEpfoMonths, setMinEpfoMonths] = useState(6);
  const [minUtilityMonths, setMinUtilityMonths] = useState(3);

  const [gstBankMismatch, setGstBankMismatch] = useState(40);
  const [gstUpiMismatch, setGstUpiMismatch] = useState(40);
  const [missingDataLimit, setMissingDataLimit] = useState(20);

  // Account details
  const [profileName, setProfileName] = useState(user.name || "");
  const [department, setDepartment] = useState("Risk Appraisal & Credit Operations");
  const [designation, setDesignation] = useState("Senior Credit Underwriter");
  const [branch, setBranch] = useState("IDBI Bank HQ, Mumbai");
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");

  // Change password
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passSuccessMsg, setPassSuccessMsg] = useState("");

  // Preferences
  const [prefDashboard, setPrefDashboard] = useState("employee_dashboard");
  const [prefDensity, setPrefDensity] = useState("comfortable");
  const [prefRecords, setPrefRecords] = useState(10);
  const [prefTheme, setPrefTheme] = useState("dark");
  const [prefLang, setPrefLang] = useState("English");
  const [prefSuccessMsg, setPrefSuccessMsg] = useState("");

  // Notification preferences
  const [loanAlerts, setLoanAlerts] = useState(true);
  const [highRiskAlerts, setHighRiskAlerts] = useState(true);
  const [portfolioUpdates, setPortfolioUpdates] = useState(false);
  const [emailChannels, setEmailChannels] = useState(true);
  const [inAppChannels, setInAppChannels] = useState(true);
  const [notifSuccessMsg, setNotifSuccessMsg] = useState("");

  // Support
  const [supportFaqActive, setSupportFaqActive] = useState(null);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState("API Ingestion Error");
  const [ticketSeverity, setTicketSeverity] = useState("Medium");
  const [ticketDesc, setTicketDesc] = useState("");
  const [ticketSuccess, setTicketSuccess] = useState("");

  const [issueType, setIssueType] = useState("UI Bug");
  const [issueDesc, setIssueDesc] = useState("");
  const [issueSuccess, setIssueSuccess] = useState("");

  // Support live chat
  const [supportMessages, setSupportMessages] = useState([
    { text: "Hello! Welcome to the IDBI Internal Technical Support Desk. How can I help you resolve portal issues today?", sender: "bot", time: "Just now" }
  ]);
  const [supportInput, setSupportInput] = useState("");
  const [supportTyping, setSupportTyping] = useState(false);

  const handleUpdateCutoffs = (e) => {
    e.preventDefault();
    setSuccessMsg("Risk policy threshold parameters updated globally!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    setProfileSuccessMsg("Profile details updated successfully!");
    setTimeout(() => setProfileSuccessMsg(""), 3000);
  };

  const handleResetPass = async (e) => {
    e.preventDefault();
    setPassSuccessMsg("");
    if (newPass !== confirmPass) {
      alert("Passwords do not match.");
      return;
    }
    try {
      await resetPassword(user.id, "employee", newPass);
      setPassSuccessMsg("Portal password changed successfully!");
      setNewPass("");
      setConfirmPass("");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSavePreferences = (e) => {
    e.preventDefault();
    setPrefSuccessMsg("Work preferences saved successfully!");
    setTimeout(() => setPrefSuccessMsg(""), 3000);
  };

  const handleSaveNotifications = (e) => {
    e.preventDefault();
    setNotifSuccessMsg("Notification parameters saved successfully!");
    setTimeout(() => setNotifSuccessMsg(""), 3000);
  };

  const handleRaiseTicket = (e) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDesc.trim()) return;
    const ticketId = `TIC-${Math.floor(10000 + Math.random() * 89999)}`;
    setTicketSuccess(`Support ticket raised successfully! Reference ID: ${ticketId}`);
    setTicketSubject("");
    setTicketDesc("");
    setTimeout(() => setTicketSuccess(""), 4000);
  };

  const handleReportIssue = (e) => {
    e.preventDefault();
    if (!issueDesc.trim()) return;
    const bugId = `BUG-${Math.floor(1000 + Math.random() * 8999)}`;
    setIssueSuccess(`Issue reported successfully! Reference ID: ${bugId}`);
    setIssueDesc("");
    setTimeout(() => setIssueSuccess(""), 4000);
  };

  const handleSendSupportMessage = (e) => {
    e.preventDefault();
    if (!supportInput.trim()) return;
    const userMsg = supportInput.trim();
    setSupportMessages(curr => [...curr, { text: userMsg, sender: "user", time: "Just now" }]);
    setSupportInput("");
    setSupportTyping(true);

    setTimeout(() => {
      let botText = "Thank you for reporting. This request has been logged. If this is critical, please contact the IT Helpdesk directly at extension 8899.";
      const clean = userMsg.toLowerCase();
      if (clean.includes("database") || clean.includes("db") || clean.includes("postgres")) {
        botText = "PostgreSQL connectivity status is monitored by the DBA team. If you are experiencing connection timeouts, please ensure your localhost database service is active and listening on port 5432.";
      } else if (clean.includes("login") || clean.includes("auth") || clean.includes("password")) {
        botText = "For security password resets, you can use the password update form under the 'Employee Account' tab, or contact the IT Helpdesk for manual credential override.";
      } else if (clean.includes("scoring") || clean.includes("calculation") || clean.includes("algorithm")) {
        botText = "The scoring engine logic is client-side in the prototype (scoringEngine.js) and DB-side in production. For score logic updates, contact the Credit Policy & Audit Committee.";
      }
      setSupportMessages(curr => [...curr, { text: botText, sender: "bot", time: "Just now" }]);
      setSupportTyping(false);
    }, 1000);
  };

  return (
    <div className="settings-container fade-in" style={{ display: "flex", gap: "24px", minHeight: "680px", flexWrap: "wrap" }}>
      
      {/* ── Left Sidebar Navigation ── */}
      <div 
        className="card" 
        style={{ 
          flex: "1 1 240px", 
          padding: "16px", 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "space-between",
          minWidth: "220px",
          background: "var(--bg-card)",
          border: "1px solid var(--bg-border)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", padding: "8px 10px", marginBottom: "10px" }}>
            Settings Menu
          </h2>
          
          {[
            { id: "account", label: "👤 Employee Account" },
            { id: "preferences", label: "⚙️ Work Preferences" },
            { id: "notifications", label: "🔔 Alert Notifications" },
            { id: "security", label: "🔒 Security Settings" },
            { id: "support", label: "💬 Help & Support" },
            { id: "contact", label: "📞 Contact Info" },
            { id: "compliance", label: "📜 Compliance & Law" },
            { id: "about", label: "ℹ️ About System" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "none",
                background: activeTab === tab.id ? "var(--accent)" : "none",
                color: activeTab === tab.id ? "#fff" : "var(--text-secondary)",
                textAlign: "left",
                cursor: "pointer",
                fontWeight: activeTab === tab.id ? 600 : 400,
                transition: "all 0.2s ease",
                fontSize: "13px",
              }}
              className="settings-nav-btn"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Prominent Logout Button */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          style={{
            marginTop: "30px",
            width: "100%",
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid rgba(255, 69, 58, 0.4)",
            background: "rgba(255, 69, 58, 0.12)",
            color: "#FF453A",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "all 0.2s ease",
            fontSize: "13px",
          }}
          className="settings-logout-btn"
          type="button"
        >
          🚪 Log Out Account
        </button>
      </div>

      {/* ── Right Content Details Panel ── */}
      <div className="card" style={{ flex: "3 1 500px", padding: "24px", minWidth: "300px" }}>
        
        {/* ── SECTION: EMPLOYEE ACCOUNT ── */}
        {activeTab === "account" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Employee Account</h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>View and edit your official banking underwriter credentials.</p>
            </div>
            
            {/* View Profile Card */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--bg-border)", padding: "16px", borderRadius: "12px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <div>
                <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Employee ID</span>
                <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>{user.id}</strong>
              </div>
              <div>
                <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Official Email</span>
                <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>{user.email}</strong>
              </div>
              <div>
                <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Current Department</span>
                <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>{department}</strong>
              </div>
              <div>
                <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Current Designation</span>
                <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>{designation}</strong>
              </div>
              <div>
                <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Branch Location</span>
                <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>{branch}</strong>
              </div>
            </div>

            {/* Edit Profile Form */}
            <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", borderBottom: "1px solid var(--bg-border)", paddingBottom: "8px", margin: "8px 0 0 0" }}>Edit Profile Details</h4>
              
              {profileSuccessMsg && (
                <div className="auth-alert auth-alert--success">
                  {profileSuccessMsg}
                </div>
              )}

              <div className="grid-2">
                <div className="auth-field">
                  <label className="auth-label">Full Name</label>
                  <input className="auth-input" type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} required />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Department</label>
                  <input className="auth-input" type="text" value={department} onChange={(e) => setDepartment(e.target.value)} required />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Designation</label>
                  <input className="auth-input" type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} required />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Branch Office</label>
                  <input className="auth-input" type="text" value={branch} onChange={(e) => setBranch(e.target.value)} required />
                </div>
              </div>
              <button className="auth-submit" style={{ width: "fit-content", padding: "10px 24px" }} type="submit">
                Save Profile Changes
              </button>
            </form>

            <div className="section-divider" style={{ margin: "16px 0" }} />

            {/* Change Portal Password Form */}
            <form onSubmit={handleResetPass} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", borderBottom: "1px solid var(--bg-border)", paddingBottom: "8px", margin: 0 }}>Change Portal Password</h4>
              
              {passSuccessMsg && (
                <div className="auth-alert auth-alert--success">
                  {passSuccessMsg}
                </div>
              )}

              <div className="grid-2">
                <div className="auth-field">
                  <label className="auth-label">New Password</label>
                  <input className="auth-input" type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} required />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Confirm Password</label>
                  <input className="auth-input" type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} required />
                </div>
              </div>
              <button className="auth-submit" style={{ width: "fit-content", padding: "10px 24px" }} type="submit">
                Update Portal Password
              </button>
            </form>
          </div>
        )}

        {/* ── SECTION: WORK PREFERENCES & POLICY PARAMETERS ── */}
        {activeTab === "preferences" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Cut-off Parameters & Policy</h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Manage automated underwriting thresholds, ingestion specifications, and risk weights.</p>
            </div>

            {/* Credit Parameters Panel */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--bg-border)", padding: "20px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", borderBottom: "1px solid var(--bg-border)", paddingBottom: "8px", margin: 0 }}>Lending Policy Configurator</h4>
              
              {successMsg && (
                <div className="auth-alert auth-alert--success">
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleUpdateCutoffs} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                
                {/* 1. Financial Health Score Thresholds */}
                <div>
                  <h5 style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--accent-light)", margin: "0 0 12px 0" }}>1. Financial Health Score Thresholds</h5>
                  <div className="grid-2">
                    <div className="auth-field">
                      <label className="auth-label">Low Risk Cut-off (Green Zone)</label>
                      <input className="auth-input" type="number" min={0} max={1000} value={lowCutoff} onChange={(e) => setLowCutoff(Number(e.target.value))} />
                      <span style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>Score range: {lowCutoff} to 1000</span>
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">Medium Risk Cut-off (Amber Zone)</label>
                      <input className="auth-input" type="number" min={0} max={1000} value={medCutoff} onChange={(e) => setMedCutoff(Number(e.target.value))} />
                      <span style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>Score range: {medCutoff} to {lowCutoff - 1}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Approval Rules */}
                <div>
                  <h5 style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--accent-light)", margin: "0 0 12px 0" }}>2. Approval Decision Boundaries</h5>
                  <div className="grid-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                    <div className="auth-field">
                      <label className="auth-label">Auto-Approve Score Limit</label>
                      <input className="auth-input" type="number" min={0} max={1000} value={autoApproveScore} onChange={(e) => setAutoApproveScore(Number(e.target.value))} />
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">Manual Review Score Limit</label>
                      <input className="auth-input" type="number" min={0} max={1000} value={manualReviewScore} onChange={(e) => setManualReviewScore(Number(e.target.value))} />
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">Auto-Decline Score Limit</label>
                      <input className="auth-input" type="number" min={0} max={1000} value={autoRejectScore} onChange={(e) => setAutoRejectScore(Number(e.target.value))} />
                    </div>
                  </div>
                </div>

                {/* 3. Alternate Data Requirements */}
                <div>
                  <h5 style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--accent-light)", margin: "0 0 12px 0" }}>3. Alternate Ingestion Feeds Requirements</h5>
                  <div className="grid-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                    <div className="auth-field">
                      <label className="auth-label">Minimum GST History</label>
                      <select className="auth-input" style={{ background: "var(--bg-input)", color: "var(--text-primary)" }} value={minGstMonths} onChange={(e) => setMinGstMonths(Number(e.target.value))}>
                        <option value={3}>3 Months</option>
                        <option value={6}>6 Months</option>
                        <option value={12}>12 Months</option>
                      </select>
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">Minimum UPI Inflow History</label>
                      <select className="auth-input" style={{ background: "var(--bg-input)", color: "var(--text-primary)" }} value={minUpiMonths} onChange={(e) => setMinUpiMonths(Number(e.target.value))}>
                        <option value={3}>3 Months</option>
                        <option value={6}>6 Months</option>
                        <option value={12}>12 Months</option>
                      </select>
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">Minimum Bank AA History</label>
                      <select className="auth-input" style={{ background: "var(--bg-input)", color: "var(--text-primary)" }} value={minBankMonths} onChange={(e) => setMinBankMonths(Number(e.target.value))}>
                        <option value={3}>3 Months</option>
                        <option value={6}>6 Months</option>
                        <option value={12}>12 Months</option>
                      </select>
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">Minimum EPFO History</label>
                      <select className="auth-input" style={{ background: "var(--bg-input)", color: "var(--text-primary)" }} value={minEpfoMonths} onChange={(e) => setMinEpfoMonths(Number(e.target.value))}>
                        <option value={3}>3 Months</option>
                        <option value={6}>6 Months</option>
                        <option value={12}>12 Months</option>
                      </select>
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">Minimum Utility Feeds</label>
                      <select className="auth-input" style={{ background: "var(--bg-input)", color: "var(--text-primary)" }} value={minUtilityMonths} onChange={(e) => setMinUtilityMonths(Number(e.target.value))}>
                        <option value={3}>3 Months</option>
                        <option value={6}>6 Months</option>
                        <option value={12}>12 Months</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 4. Cross Validation Rules */}
                <div>
                  <h5 style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--accent-light)", margin: "0 0 12px 0" }}>4. Cross-Validation Fraud Rules</h5>
                  <div className="grid-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                    <div className="auth-field">
                      <label className="auth-label">GST vs Bank Mismatch Limit</label>
                      <select className="auth-input" style={{ background: "var(--bg-input)", color: "var(--text-primary)" }} value={gstBankMismatch} onChange={(e) => setGstBankMismatch(Number(e.target.value))}>
                        <option value={20}>20% Divergence</option>
                        <option value={40}>40% Divergence (Policy)</option>
                        <option value={60}>60% Divergence</option>
                      </select>
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">GST vs UPI Collection Limit</label>
                      <select className="auth-input" style={{ background: "var(--bg-input)", color: "var(--text-primary)" }} value={gstUpiMismatch} onChange={(e) => setGstUpiMismatch(Number(e.target.value))}>
                        <option value={20}>20% Divergence</option>
                        <option value={40}>40% Divergence (Policy)</option>
                        <option value={60}>60% Divergence</option>
                      </select>
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">Missing Data Month Threshold</label>
                      <select className="auth-input" style={{ background: "var(--bg-input)", color: "var(--text-primary)" }} value={missingDataLimit} onChange={(e) => setMissingDataLimit(Number(e.target.value))}>
                        <option value={10}>10% Max Missing</option>
                        <option value={20}>20% Max Missing (Policy)</option>
                        <option value={40}>40% Max Missing</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 5. Risk Weightage (Read Only) */}
                <div>
                  <h5 style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--accent-light)", margin: "0 0 12px 0" }}>5. AI Credit Scoring Dimensions Weights (Read-Only)</h5>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px", background: "rgba(255,255,255,0.01)", border: "1px solid var(--bg-border)", padding: "12px", borderRadius: "8px" }}>
                    <div style={{ textAlign: "center" }}>
                      <span style={{ display: "block", fontSize: "10px", color: "var(--text-muted)" }}>Cash Flow</span>
                      <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>25% weight</strong>
                    </div>
                    <div style={{ textAlign: "center", borderLeft: "1px solid var(--bg-border)" }}>
                      <span style={{ display: "block", fontSize: "10px", color: "var(--text-muted)" }}>Revenue Consistency</span>
                      <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>20% weight</strong>
                    </div>
                    <div style={{ textAlign: "center", borderLeft: "1px solid var(--bg-border)" }}>
                      <span style={{ display: "block", fontSize: "10px", color: "var(--text-muted)" }}>Compliance</span>
                      <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>20% weight</strong>
                    </div>
                    <div style={{ textAlign: "center", borderLeft: "1px solid var(--bg-border)" }}>
                      <span style={{ display: "block", fontSize: "10px", color: "var(--text-muted)" }}>Operations</span>
                      <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>20% weight</strong>
                    </div>
                    <div style={{ textAlign: "center", borderLeft: "1px solid var(--bg-border)" }}>
                      <span style={{ display: "block", fontSize: "10px", color: "var(--text-muted)" }}>Resilience</span>
                      <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>15% weight</strong>
                    </div>
                  </div>
                </div>

                <button className="auth-submit" style={{ width: "fit-content", padding: "10px 24px" }} type="submit">
                  Save Underwriting Policy Rules
                </button>
              </form>
            </div>

            {/* Work Preference Defaults */}
            <form onSubmit={handleSavePreferences} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", borderBottom: "1px solid var(--bg-border)", paddingBottom: "8px", margin: "8px 0 0 0" }}>Portal Customization</h4>
              
              {prefSuccessMsg && (
                <div className="auth-alert auth-alert--success">
                  {prefSuccessMsg}
                </div>
              )}

              <div className="grid-2">
                <div className="auth-field">
                  <label className="auth-label">Default Dashboard View</label>
                  <select className="auth-input" style={{ background: "var(--bg-input)", color: "var(--text-primary)" }} value={prefDashboard} onChange={(e) => setPrefDashboard(e.target.value)}>
                    <option value="employee_dashboard">Employee Stats Dashboard</option>
                    <option value="list">MSME Applications List</option>
                    <option value="portfolio">Portfolio Analytics</option>
                  </select>
                </div>

                <div className="auth-field">
                  <label className="auth-label">Table Density</label>
                  <select className="auth-input" style={{ background: "var(--bg-input)", color: "var(--text-primary)" }} value={prefDensity} onChange={(e) => setPrefDensity(e.target.value)}>
                    <option value="comfortable">Comfortable (Standard)</option>
                    <option value="compact">Compact (Dense Data)</option>
                  </select>
                </div>

                <div className="auth-field">
                  <label className="auth-label">Records Per Page</label>
                  <select className="auth-input" style={{ background: "var(--bg-input)", color: "var(--text-primary)" }} value={prefRecords} onChange={(e) => setPrefRecords(Number(e.target.value))}>
                    <option value={5}>5 records</option>
                    <option value={10}>10 records</option>
                    <option value={20}>20 records</option>
                    <option value={50}>50 records</option>
                  </select>
                </div>

                <div className="auth-field">
                  <label className="auth-label">Theme Preference</label>
                  <select className="auth-input" style={{ background: "var(--bg-input)", color: "var(--text-primary)" }} value={prefTheme} onChange={(e) => setPrefTheme(e.target.value)}>
                    <option value="dark">IDBI Obsidian Dark (Default)</option>
                    <option value="light">IDBI Ice Light (Unsupported in Prototype)</option>
                    <option value="system">Follow System Settings</option>
                  </select>
                </div>

                <div className="auth-field">
                  <label className="auth-label">Language Selection (Prototype)</label>
                  <select className="auth-input" style={{ background: "var(--bg-input)", color: "var(--text-primary)" }} value={prefLang} onChange={(e) => setPrefLang(e.target.value)}>
                    <option value="English">English (IN)</option>
                    <option value="Hindi">हिन्दी (Hindi)</option>
                    <option value="Marathi">मराठी (Marathi)</option>
                    <option value="Tamil">தமிழ் (Tamil)</option>
                    <option value="Gujarati">ગુજરાતી (Gujarati)</option>
                  </select>
                </div>
              </div>

              <button className="auth-submit" style={{ width: "fit-content", padding: "10px 24px" }} type="submit">
                Save Preferences
              </button>
            </form>
          </div>
        )}

        {/* ── SECTION: NOTIFICATIONS ── */}
        {activeTab === "notifications" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Alert Notifications</h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Choose which underwriting signals and system alerts to receive.</p>
            </div>

            <form onSubmit={handleSaveNotifications} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {notifSuccessMsg && (
                <div className="auth-alert auth-alert--success">
                  {notifSuccessMsg}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", borderBottom: "1px solid var(--bg-border)", paddingBottom: "8px", margin: 0 }}>Appraisal Signal Types</h4>
                
                <div style={{ display: "flex", alignItems: "start", gap: "12px", background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid var(--bg-border)" }}>
                  <input type="checkbox" id="loanAlerts" checked={loanAlerts} onChange={(e) => setLoanAlerts(e.target.checked)} style={{ marginTop: "4px", width: "16px", height: "16px", cursor: "pointer" }} />
                  <div>
                    <label htmlFor="loanAlerts" style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "13.5px", cursor: "pointer" }}>Loan Application Alerts</label>
                    <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)" }}>Receive instant notifications when new MSMEs submit credit requests.</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "start", gap: "12px", background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid var(--bg-border)" }}>
                  <input type="checkbox" id="highRiskAlerts" checked={highRiskAlerts} onChange={(e) => setHighRiskAlerts(e.target.checked)} style={{ marginTop: "4px", width: "16px", height: "16px", cursor: "pointer" }} />
                  <div>
                    <label htmlFor="highRiskAlerts" style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "13.5px", cursor: "pointer" }}>High-Risk MSME Alerts</label>
                    <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)" }}>Flag applicants with high-risk band placement (overall score &lt; 450) or GSTIN divergence warnings immediately.</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "start", gap: "12px", background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid var(--bg-border)" }}>
                  <input type="checkbox" id="portfolioUpdates" checked={portfolioUpdates} onChange={(e) => setPortfolioUpdates(e.target.checked)} style={{ marginTop: "4px", width: "16px", height: "16px", cursor: "pointer" }} />
                  <div>
                    <label htmlFor="portfolioUpdates" style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "13.5px", cursor: "pointer" }}>Portfolio Update Notifications</label>
                    <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)" }}>Receive weekly aggregated summaries on overall branch delinquency ratios and approval volumes.</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", borderBottom: "1px solid var(--bg-border)", paddingBottom: "8px", margin: 0 }}>Delivery Channels</h4>

                <div style={{ display: "flex", gap: "32px", background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "8px", border: "1px solid var(--bg-border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input type="checkbox" id="emailChannels" checked={emailChannels} onChange={(e) => setEmailChannels(e.target.checked)} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
                    <label htmlFor="emailChannels" style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "13px", cursor: "pointer" }}>Official Email Channel</label>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input type="checkbox" id="inAppChannels" checked={inAppChannels} onChange={(e) => setInAppChannels(e.target.checked)} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
                    <label htmlFor="inAppChannels" style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "13px", cursor: "pointer" }}>In-Portal Notifications</label>
                  </div>
                </div>
              </div>

              <button className="auth-submit" style={{ width: "fit-content", padding: "10px 24px", marginTop: "10px" }} type="submit">
                Save Alert Rules
              </button>
            </form>
          </div>
        )}

        {/* ── SECTION: SECURITY ── */}
        {activeTab === "security" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Security Settings</h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Monitor active login sessions, connection status, and internal compliance bounds.</p>
            </div>

            {/* Active Session Info */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--bg-border)", padding: "16px", borderRadius: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h4 style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Active Login Session</h4>
                <span className="risk-badge LOW" style={{ fontSize: "9px" }}>Current Session</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", fontSize: "12px", color: "var(--text-secondary)" }}>
                <div>IP Address: <strong style={{ color: "var(--text-primary)" }}>192.168.1.144</strong></div>
                <div>User Agent: <strong style={{ color: "var(--text-primary)" }}>Chrome v124 (Windows 11)</strong></div>
                <div>Location: <strong style={{ color: "var(--text-primary)" }}>Mumbai, India</strong></div>
                <div>Session Timeout: <strong style={{ color: "var(--text-primary)" }}>60 Minutes (Inactivity)</strong></div>
              </div>
            </div>

            {/* Connected Devices */}
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", borderBottom: "1px solid var(--bg-border)", paddingBottom: "8px", margin: "0 0 12px 0" }}>Connected Devices (Prototype)</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { name: "Chrome on Windows 11", sub: "192.168.1.144 · Current Session", action: "Current", active: true },
                  { name: "Safari on iPad Pro", sub: "192.168.1.205 · Active 2 hours ago", action: "Revoke", active: false },
                ].map((dev, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.01)", border: "1px solid var(--bg-border)", padding: "10px 14px", borderRadius: "8px" }}>
                    <div>
                      <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>{dev.name}</strong>
                      <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)" }}>{dev.sub}</span>
                    </div>
                    {dev.active ? (
                      <span style={{ fontSize: "11px", color: "var(--risk-low-color)", fontWeight: 600 }}>Active Now</span>
                    ) : (
                      <button className="landing-btn-secondary" style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "4px" }} onClick={() => alert("Device session revoked successfully.")}>{dev.action}</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Login History */}
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", borderBottom: "1px solid var(--bg-border)", paddingBottom: "8px", margin: "0 0 12px 0" }}>Login History (Prototype)</h4>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--bg-border)" }}>
                    <th style={{ padding: "8px 4px", color: "var(--text-muted)" }}>Date & Time</th>
                    <th style={{ padding: "8px 4px", color: "var(--text-muted)" }}>Status</th>
                    <th style={{ padding: "8px 4px", color: "var(--text-muted)" }}>IP / Location</th>
                    <th style={{ padding: "8px 4px", color: "var(--text-muted)" }}>Device</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid var(--bg-border)", opacity: 0.95 }}>
                    <td style={{ padding: "8px 4px" }}>Jul 10, 2026 10:15 PM</td>
                    <td style={{ padding: "8px 4px", color: "var(--risk-low-color)" }}>Success</td>
                    <td style={{ padding: "8px 4px" }}>192.168.1.144 / Mumbai</td>
                    <td style={{ padding: "8px 4px" }}>Chrome / Windows</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--bg-border)", opacity: 0.85 }}>
                    <td style={{ padding: "8px 4px" }}>Jul 09, 2026 09:30 AM</td>
                    <td style={{ padding: "8px 4px", color: "var(--risk-low-color)" }}>Success</td>
                    <td style={{ padding: "8px 4px" }}>192.168.1.144 / Mumbai</td>
                    <td style={{ padding: "8px 4px" }}>Chrome / Windows</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--bg-border)", opacity: 0.75 }}>
                    <td style={{ padding: "8px 4px" }}>Jul 08, 2026 02:45 PM</td>
                    <td style={{ padding: "8px 4px", color: "var(--risk-low-color)" }}>Success</td>
                    <td style={{ padding: "8px 4px" }}>192.168.1.205 / Pune</td>
                    <td style={{ padding: "8px 4px" }}>Safari / iPad</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Privacy Guidelines */}
            <div style={{ background: "rgba(255, 69, 58, 0.05)", border: "1px solid rgba(255, 69, 58, 0.15)", padding: "16px", borderRadius: "10px", marginTop: "8px" }}>
              <h5 style={{ color: "#FF453A", fontWeight: 700, fontSize: "13px", margin: "0 0 6px 0" }}>⚠️ Internal Security Policy Guidelines</h5>
              <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                <li>Do not share your credit analyst login credentials or API keys.</li>
                <li>Lock your underwriting terminal (Win + L) when leaving your workspace.</li>
                <li>Passwords are subjected to a mandatory rotation every 90 days.</li>
                <li>Contact the IT Security Response team immediately if you suspect unauthorized access.</li>
              </ul>
            </div>
          </div>
        )}

        {/* ── SECTION: SUPPORT ── */}
        {activeTab === "support" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Help & Support</h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Access credit user manuals, search FAQs, or report portal technical bugs.</p>
            </div>

            {/* Help FAQs Accordion */}
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", borderBottom: "1px solid var(--bg-border)", paddingBottom: "8px", margin: "0 0 12px 0" }}>Frequently Asked Questions</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  {
                    q: "How do I override or adjust credit risk cutoff scores?",
                    a: "Go to the 'Work Preferences' tab. Enter the desired threshold values for Low and Medium Risk bands and click 'Save Policy Parameters'. Note that changes reflect dynamically for all loaded scorecards."
                  },
                  {
                    q: "What causes a Cross-Validation Flag?",
                    a: "The scoring engine compares declared GST turnover against bank statement credit entries and UPI collection volumes. If the divergence exceeds 40%, the system flags the MSME automatically for manual audit."
                  },
                  {
                    q: "How does the AI explainability summary generate?",
                    a: "The portal uses the Hugging Face Inference API to pass calculated scoring dimensions to a Mistral-7B-Instruct model, generating a plain-language credit report. If rate limits are met, a local backup explanation takes over."
                  }
                ].map((faq, idx) => (
                  <div key={idx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--bg-border)", borderRadius: "8px" }}>
                    <button
                      onClick={() => setSupportFaqActive(supportFaqActive === idx ? null : idx)}
                      style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", color: "var(--text-primary)", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}
                    >
                      <span>{faq.q}</span>
                      <span>{supportFaqActive === idx ? "−" : "+"}</span>
                    </button>
                    {supportFaqActive === idx && (
                      <div style={{ padding: "0 16px 12px 16px", fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* User Manual Download */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--bg-border)", padding: "16px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong style={{ display: "block", fontSize: "13.5px", color: "var(--text-primary)" }}>Underwriting Operations Manual</strong>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Download official guide on credit health evaluation workflows.</span>
              </div>
              <button className="landing-btn-secondary" style={{ padding: "8px 16px", fontSize: "12px", borderRadius: "6px" }} onClick={() => alert("Downloading manual prototype... (In production, this downloads the PDF operations handbook.)")}>Download PDF</button>
            </div>

            {/* Live Support Chat */}
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", borderBottom: "1px solid var(--bg-border)", paddingBottom: "8px", margin: "8px 0 12px 0" }}>IT Helpdesk Live Chat (Prototype)</h4>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--bg-border)", borderRadius: "10px", display: "flex", flexDirection: "column", height: "260px" }}>
                <div style={{ flex: 1, padding: "12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {supportMessages.map((msg, idx) => (
                    <div key={idx} style={{ alignSelf: msg.sender === "user" ? "flex-end" : "flex-start", background: msg.sender === "user" ? "var(--accent)" : "rgba(255,255,255,0.05)", color: "#fff", padding: "8px 12px", borderRadius: "8px", maxWidth: "80%", fontSize: "12px" }}>
                      <div>{msg.text}</div>
                      <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", textAlign: "right", marginTop: "4px" }}>{msg.time}</div>
                    </div>
                  ))}
                  {supportTyping && <div style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", marginLeft: "4px" }}>IT Assistant is typing...</div>}
                </div>
                <form onSubmit={handleSendSupportMessage} style={{ display: "flex", borderTop: "1px solid var(--bg-border)", padding: "8px" }}>
                  <input className="auth-input" style={{ flex: 1, borderRadius: "6px 0 0 6px", height: "36px", padding: "0 10px", borderRight: "none" }} placeholder="Type support query (e.g. database, password)..." value={supportInput} onChange={(e) => setSupportInput(e.target.value)} />
                  <button className="auth-submit" style={{ borderRadius: "0 6px 6px 0", height: "36px", width: "70px", padding: 0 }} type="submit">Send</button>
                </form>
              </div>
            </div>

            {/* Raise Support Ticket Form */}
            <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--bg-border)", padding: "16px", borderRadius: "10px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", borderBottom: "1px solid var(--bg-border)", paddingBottom: "8px", margin: "0 0 12px 0" }}>Raise Technical Support Ticket</h4>
              {ticketSuccess && (
                <div className="auth-alert auth-alert--success" style={{ marginBottom: "12px" }}>
                  {ticketSuccess}
                </div>
              )}
              <form onSubmit={handleRaiseTicket} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="grid-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
                  <div className="auth-field">
                    <label className="auth-label">Issue Category</label>
                    <select className="auth-input" style={{ background: "var(--bg-input)", color: "var(--text-primary)" }} value={ticketCategory} onChange={(e) => setTicketCategory(e.target.value)}>
                      <option value="API Ingestion Error">API Ingestion Error</option>
                      <option value="Authentication Issue">Authentication Issue</option>
                      <option value="Scoring Logic Discrepancy">Scoring Logic Discrepancy</option>
                      <option value="System Downtime">System Downtime</option>
                    </select>
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">Severity Level</label>
                    <select className="auth-input" style={{ background: "var(--bg-input)", color: "var(--text-primary)" }} value={ticketSeverity} onChange={(e) => setTicketSeverity(e.target.value)}>
                      <option value="Low">Low (Minor UI/UX)</option>
                      <option value="Medium">Medium (Functional Quirk)</option>
                      <option value="High">High (Underwriting Blocked)</option>
                      <option value="Critical">Critical (Portal Crash)</option>
                    </select>
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">Ticket Subject</label>
                    <input className="auth-input" type="text" placeholder="Short description..." value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)} required />
                  </div>
                </div>
                <div className="auth-field">
                  <label className="auth-label">Detailed Description</label>
                  <textarea className="auth-input" style={{ height: "70px", padding: "8px", resize: "none" }} placeholder="State replication steps or error codes..." value={ticketDesc} onChange={(e) => setTicketDesc(e.target.value)} required />
                </div>
                <button className="auth-submit" style={{ width: "fit-content", padding: "8px 20px" }} type="submit">Submit Ticket</button>
              </form>
            </div>

            {/* Report System Issue Form */}
            <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--bg-border)", padding: "16px", borderRadius: "10px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", borderBottom: "1px solid var(--bg-border)", paddingBottom: "8px", margin: "0 0 12px 0" }}>Report System Bug / Issue</h4>
              {issueSuccess && (
                <div className="auth-alert auth-alert--success" style={{ marginBottom: "12px" }}>
                  {issueSuccess}
                </div>
              )}
              <form onSubmit={handleReportIssue} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="auth-field">
                  <label className="auth-label">Bug Type</label>
                  <select className="auth-input" style={{ background: "var(--bg-input)", color: "var(--text-primary)" }} value={issueType} onChange={(e) => setIssueType(e.target.value)}>
                    <option value="UI Bug">UI Bug (Alignment/Overlaps)</option>
                    <option value="Chart Rendering Error">Chart Rendering Error</option>
                    <option value="Fast Refresh Glitch">Fast Refresh Glitch</option>
                    <option value="Typo/Text error">Typo / Label error</option>
                  </select>
                </div>
                <div className="auth-field">
                  <label className="auth-label">Issue Description</label>
                  <textarea className="auth-input" style={{ height: "60px", padding: "8px", resize: "none" }} placeholder="Describe the bug you observed..." value={issueDesc} onChange={(e) => setIssueDesc(e.target.value)} required />
                </div>
                <button className="auth-submit" style={{ width: "fit-content", padding: "8px 20px" }} type="submit">Submit Bug Report</button>
              </form>
            </div>
          </div>
        )}

        {/* ── SECTION: CONTACT INFO ── */}
        {activeTab === "contact" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Contact Information</h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Direct contact channels for banking operators and tech assistance.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--bg-border)", padding: "16px", borderRadius: "10px" }}>
                <span style={{ fontSize: "20px" }}>📞</span>
                <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: "8px 0 4px 0" }}>Internal IT Helpdesk</h4>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 10px 0" }}>Call for urgent technical failures, system lockouts, or network queries.</p>
                <strong style={{ fontSize: "15px", color: "var(--accent)" }}>+91 22 6655 4321</strong>
                <span style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>Extension: 8899</span>
              </div>

              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--bg-border)", padding: "16px", borderRadius: "10px" }}>
                <span style={{ fontSize: "20px" }}>✉️</span>
                <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: "8px 0 4px 0" }}>Technical Support Email</h4>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 10px 0" }}>Email bugs, ticket issues, or server logs to the core software ops team.</p>
                <strong style={{ fontSize: "15px", color: "var(--accent)" }}>it.support@idbi.co.in</strong>
              </div>

              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--bg-border)", padding: "16px", borderRadius: "10px" }}>
                <span style={{ fontSize: "20px" }}>🏦</span>
                <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: "8px 0 4px 0" }}>Banking Operations Support</h4>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 10px 0" }}>Email for credit policy questions, scoring weights, or audit guidelines.</p>
                <strong style={{ fontSize: "15px", color: "var(--accent)" }}>ops.support@idbi.co.in</strong>
              </div>

              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--bg-border)", padding: "16px", borderRadius: "10px" }}>
                <span style={{ fontSize: "20px" }}>🕒</span>
                <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: "8px 0 4px 0" }}>Support Operational Hours</h4>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 8px 0" }}>IT support is active during bank branch working schedules.</p>
                <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>Monday - Saturday: 9:30 AM - 6:30 PM</strong>
                <span style={{ display: "block", fontSize: "10.5px", color: "var(--text-muted)", marginTop: "4px" }}>2nd & 4th Saturdays Off</span>
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION: COMPLIANCE ── */}
        {activeTab === "compliance" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Compliance & Law</h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Read banking standards, compliance structures, and legal definitions.</p>
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--bg-border)", padding: "16px", borderRadius: "10px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px 0" }}>RBI Digital Lending Guidelines Compliance</h4>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                Regulated Entities (REs) must ensure credit decisions are audit-traceable and transparent. The Financial Health Card scoring engine operates on a purely deterministic formula (cash flow, consistency, compliance, operational continuity, resilience). The SHAP-style explainability layer details the precise telemetry triggers that lead to score adjustments, satisfying borrowing explainability guidelines. No black-box automated decisions are performed.
              </p>
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--bg-border)", padding: "16px", borderRadius: "10px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px 0" }}>DPDP Act 2023 Consent Framework</h4>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                Data ingestion is governed under standard Consent Manager interfaces. The customer provides purpose-bound, revocable digital permission for ingestion of GST, UPI, AA, and Utility telemetry. Underwriters must respect DPDP consent mandates: if a borrower revokes permission via settings, the system immediately ceases all recurring data synchronization, halting underwriting appraisal refreshes.
              </p>
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--bg-border)", padding: "16px", borderRadius: "10px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px 0" }}>Internal Security Policy & Access Boundaries</h4>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                System usage is restricted using strict Role-Based Access Control (RBAC). Employees are only authorized to read credit score summaries and write appraisal comments. All active underwriter inputs, password updates, and decision approvals (approved/declined) write audit logs to the immutable local log ledger. This maintains co-equal credit checks and blocks credential spoofing.
              </p>
            </div>
          </div>
        )}

        {/* ── SECTION: ABOUT ── */}
        {activeTab === "about" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>About System</h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>View technical metadata, software releases, and system uptime.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--bg-border)", padding: "16px", borderRadius: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", textTransform: "uppercase" }}>Version</span>
                <strong style={{ fontSize: "15px", color: "var(--text-primary)" }}>v3.0.0-beta (Clean Architecture)</strong>
              </div>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--bg-border)", padding: "16px", borderRadius: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", textTransform: "uppercase" }}>System Status</span>
                <strong style={{ fontSize: "15px", color: "var(--risk-low-color)" }}>🟢 Healthy / Operational</strong>
              </div>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--bg-border)", padding: "16px", borderRadius: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", textTransform: "uppercase" }}>Last Released</span>
                <strong style={{ fontSize: "15px", color: "var(--text-primary)" }}>July 2026</strong>
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--bg-border)", padding: "16px", borderRadius: "10px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", borderBottom: "1px solid var(--bg-border)", paddingBottom: "8px", margin: "0 0 10px 0" }}>System Release Notes</h4>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div>
                  <strong>v3.0.0-beta Release (Current)</strong>
                  <p style={{ margin: "4px 0 0 12px", fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.4 }}>
                    Aggregated alternate telemetry scoring. Integrated FastAPI endpoint routing with SQLAlchemy models and direct Bcrypt password validation. Configured Hugging Face Inference API for natural language credit analysis.
                  </p>
                </div>
                <div>
                  <strong>v2.1.0-alpha Release</strong>
                  <p style={{ margin: "4px 0 0 12px", fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.4 }}>
                    Designed sliding glassmorphism Auth toggles and applicant session gliders. Configured post-signup onboarding forms and consent managers.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", borderBottom: "1px solid var(--bg-border)", paddingBottom: "8px", margin: "0 0 10px 0" }}>About AI MSME Financial Health Card</h4>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                This prototype helps underwriters assess credit requests for thin-file MSMEs. By aggregating Consented Alternate Data feeds (GSTIN, UPI, EPFO, utility, bank statement cashflows), the engine calculates an auditable scorecard. In production, this system integrates with standardized Account Aggregators and OCEN APIs, enabling frictionless, compliant lending.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Logout Confirmation Dialog Overlay ── */}
      {showLogoutConfirm && (
        <div 
          className="auth-overlay auth-overlay--in" 
          style={{ zIndex: 1000 }}
          role="presentation"
        >
          <div 
            className="auth-card auth-card--in" 
            style={{ maxWidth: "380px", width: "90%", textAlign: "center", padding: "24px" }}
            role="dialog"
            aria-modal="true"
            aria-label="Confirm Log Out"
          >
            <span style={{ fontSize: "36px", display: "block", marginBottom: "12px" }}>⚠️</span>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
              Confirm Account Log Out
            </h3>
            <p style={{ fontSize: "12.5px", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "20px" }}>
              Are you sure you wish to log out from the MSME Financial Health Card portal? You will need to re-authenticate to view your credit scorecards.
            </p>

            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                className="landing-btn-secondary" 
                onClick={() => setShowLogoutConfirm(false)}
                style={{ flex: 1, padding: "10px", borderRadius: "8px", fontSize: "13px" }}
                type="button"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                style={{ 
                  flex: 1, 
                  padding: "10px", 
                  borderRadius: "8px", 
                  fontSize: "13px",
                  background: "rgba(255, 69, 58, 0.85)", 
                  borderColor: "rgba(255, 69, 58, 0.4)",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
                type="button"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 7. SUPER ADMIN SUB-COMPONENTS ─────────────────────────────────────────────
// ── Admin Dashboard ──
function AdminDashboardView({ applicants, employees, auditLogs, setView }) {
  const activeLogsCount = auditLogs.length;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Super Admin Portal</h1>
        <p className="page-subtitle">Security parameters, accounts registry, and system monitoring</p>
      </div>

      <DisclaimerBanner />

      {/* Monitoring KPIs */}
      <div className="stats-row" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-label">Ingested Applicants</div>
          <div className="stat-value" style={{ color: "var(--accent-blue-light)" }}>{applicants.length}</div>
          <div className="stat-sub">registered companies</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Employees</div>
          <div className="stat-value" style={{ color: "var(--risk-low-color)" }}>{employees.length}</div>
          <div className="stat-sub">underwriters authorized</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Audited Actions Logs</div>
          <div className="stat-value" style={{ color: "var(--risk-medium-color)" }}>{activeLogsCount}</div>
          <div className="stat-sub">actions tracked</div>
        </div>
      </div>

      {/* Grid of status diagnostics */}
      <div className="grid-2">
        {/* System Load Diagnostics */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
            <span className="card-title">Real-Time Server Health</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                <span>CPU In-use</span>
                <span>12%</span>
              </div>
              <div className="score-bar-track" style={{ height: "6px" }}>
                <div className="score-bar-fill" style={{ width: "12%", background: "var(--risk-low-color)", height: "100%" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                <span>Memory Allocation</span>
                <span>42% (2.1GB / 5GB)</span>
              </div>
              <div className="score-bar-track" style={{ height: "6px" }}>
                <div className="score-bar-fill" style={{ width: "42%", background: "var(--risk-low-color)", height: "100%" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                <span>Database Thread Connections</span>
                <span>8 / 100 max</span>
              </div>
              <div className="score-bar-track" style={{ height: "6px" }}>
                <div className="score-bar-fill" style={{ width: "8%", background: "var(--risk-low-color)", height: "100%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Audits Panel */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
            <span className="card-title">Recent Audits activity</span>
            <button
              onClick={() => setView("audit_logs")}
              style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
            >
              Audit Trail →
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
            {auditLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  borderBottom: "1px solid rgba(255,255,255,0.03)",
                  paddingBottom: "6px",
                }}
              >
                <div>
                  <strong style={{ color: "var(--text-primary)" }}>{log.name}</strong> ({log.role.toUpperCase()})
                  <div style={{ color: "var(--text-muted)", marginTop: "2px", fontSize: "11px" }}>{log.action}</div>
                </div>
                <span style={{ color: log.status === "Success" ? "var(--risk-low-color)" : "var(--risk-high-color)" }}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Employee Management ──
function EmployeeManagementView({ employees, addEmployee, toggleEmployeeStatus }) {
  const [name, setName] = useState("");
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await addEmployee(name, empId, password);
      setSuccess(`Employee ${empId.toUpperCase()} registered successfully!`);
      setName("");
      setEmpId("");
      setPassword("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="grid-2" style={{ alignItems: "start" }}>
        {/* Active Registry */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
            <span className="card-title">Underwriters Authorization Registry</span>
          </div>

          <table className="msme-table" style={{ marginTop: "12px" }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", color: "var(--text-muted)", padding: "16px" }}>
                  No bank employees registered yet.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id}>
                  <td style={{ fontWeight: "bold" }}>{emp.id}</td>
                  <td>{emp.name}</td>
                  <td>
                    <span
                      style={{
                        fontSize: "11px",
                        background: emp.status === "Active" ? "rgba(48,209,88,0.12)" : "rgba(255,69,58,0.12)",
                        color: emp.status === "Active" ? "#30D158" : "#FF453A",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontWeight: 700,
                      }}
                    >
                      {emp.status}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleEmployeeStatus(emp.id)}
                      style={{
                        background: emp.status === "Active" ? "rgba(255,69,58,0.12)" : "rgba(48,209,88,0.12)",
                        color: emp.status === "Active" ? "#FF453A" : "#30D158",
                        border: "none",
                        padding: "5px 10px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "11.5px",
                        fontWeight: "bold",
                      }}
                    >
                      {emp.status === "Active" ? "Suspend" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>

        {/* Add Employee Form */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
            <span className="card-title">Register Bank Employee Account</span>
          </div>

          {success && <div className="auth-alert auth-alert--success" style={{ marginTop: "12px" }}>{success}</div>}
          {error && <div className="auth-alert auth-alert--error" style={{ marginTop: "12px" }}>{error}</div>}

          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
            <div className="auth-field">
              <label className="auth-label">Full Name</label>
              <input className="auth-input" type="text" placeholder="Neha Verma" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="auth-field">
              <label className="auth-label">Employee ID</label>
              <input className="auth-input" type="text" placeholder="e.g. EMP-003" value={empId} onChange={(e) => setEmpId(e.target.value)} required />
            </div>

            <div className="auth-field">
              <label className="auth-label">Initial Password</label>
              <input className="auth-input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <button className="auth-submit" type="submit">
              Register Employee
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── User Management ──
function UserManagementView({ applicants, toggleApplicantStatus, verifyApplicantManually }) {
  return (
    <div className="fade-in card">
      <div className="card-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
        <span className="card-title">Registered Applicants Registry</span>
      </div>

      <table className="msme-table" style={{ marginTop: "16px" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Mobile</th>
            <th>KYC Ingestion</th>
            <th>GST Verification Status</th>
            <th>Account Access</th>
            <th>OTP Override Actions</th>
          </tr>
        </thead>
        <tbody>
          {applicants.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: "center", color: "var(--text-muted)", padding: "16px" }}>
                No applicant users registered yet.
              </td>
            </tr>
          ) : (
            applicants.map((app) => (
              <tr key={app.id}>
                <td>
                  <div style={{ fontWeight: "bold" }}>{app.name}</div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>ID: {app.id}</div>
                </td>
                <td style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{app.email}</td>
                <td style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{app.mobileNumber}</td>
                <td>
                  <span
                    style={{
                      fontSize: "11px",
                      background: app.kycCompleted ? "rgba(48,209,88,0.12)" : "rgba(255,69,58,0.12)",
                      color: app.kycCompleted ? "#30D158" : "#FF453A",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      fontWeight: 700,
                    }}
                  >
                    {app.kycCompleted ? "COMPLETED" : "PENDING"}
                  </span>
                </td>
                <td>
                  <span
                    style={{
                      fontSize: "11px",
                      background: app.verified ? "rgba(48,209,88,0.12)" : "rgba(255,159,10,0.12)",
                      color: app.verified ? "#30D158" : "#FF9F0A",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      fontWeight: 700,
                    }}
                  >
                    {app.verified ? "VERIFIED" : "PENDING OTP"}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => toggleApplicantStatus(app.email)}
                    style={{
                      background: app.status === "Active" ? "rgba(255,69,58,0.12)" : "rgba(48,209,88,0.12)",
                      color: app.status === "Active" ? "#FF453A" : "#30D158",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "11.5px",
                      fontWeight: "bold",
                    }}
                  >
                    {app.status === "Active" ? "Suspend" : "Activate"}
                  </button>
                </td>
                <td>
                  {!app.verified ? (
                    <button
                      onClick={() => verifyApplicantManually(app.email)}
                      style={{
                        background: "rgba(59,130,246,0.15)",
                        color: "var(--accent-blue-light)",
                        border: "none",
                        padding: "5px 10px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "11px",
                        fontWeight: "bold",
                      }}
                    >
                      Bypass OTP
                    </button>
                  ) : (
                    <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Verified</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── System Configuration ──
function SystemConfigurationView({ systemConfig, updateSystemConfig }) {
  const [cashFlow, setCashFlow] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [compliance, setCompliance] = useState(0);
  const [continuity, setContinuity] = useState(0);
  const [resilience, setResilience] = useState(0);

  const [timeout, setTimeoutVal] = useState(60);
  const [maxAttempts, setMaxAttempts] = useState(5);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (systemConfig && systemConfig.weights) {
      setCashFlow(systemConfig.weights.cashFlowStrength);
      setRevenue(systemConfig.weights.revenueConsistency);
      setCompliance(systemConfig.weights.complianceBehavior);
      setContinuity(systemConfig.weights.operationalContinuity);
      setResilience(systemConfig.weights.financialResilience);
      setTimeoutVal(systemConfig.sessionTimeoutMinutes);
      setMaxAttempts(systemConfig.maxLoginAttempts);
    }
  }, [systemConfig]);

  const handleUpdate = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const total = Number(cashFlow) + Number(revenue) + Number(compliance) + Number(continuity) + Number(resilience);
    if (Math.abs(total - 1.0) > 0.0001) {
      setError(`Config weights must sum up to exactly 1.0 (currently: ${total.toFixed(2)}). Please recalibrate.`);
      return;
    }

    updateSystemConfig(
      {
        cashFlowStrength: Number(cashFlow),
        revenueConsistency: Number(revenue),
        complianceBehavior: Number(compliance),
        operationalContinuity: Number(continuity),
        financialResilience: Number(resilience),
      },
      Number(timeout),
      Number(maxAttempts)
    );
    setSuccess("Scoring weights and system parameters updated globally!");
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <div className="fade-in card" style={{ maxWidth: 650, margin: "0 auto" }}>
      <div className="card-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
        <span className="card-title">Scorecard Weights &amp; Parameters Config</span>
      </div>

      {success && <div className="auth-alert auth-alert--success" style={{ marginTop: "12px" }}>{success}</div>}
      {error && <div className="auth-alert auth-alert--error" style={{ marginTop: "12px" }}>{error}</div>}

      <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "18px" }}>
        <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--accent-light)", textTransform: "uppercase", letterSpacing: "1px" }}>
          1. Dynamic Sub-score Weights
        </h4>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "rgba(255,255,255,0.01)", padding: "14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="auth-field">
            <label className="auth-label">Cash-Flow Strength (Current: {pct(cashFlow * 100)})</label>
            <input className="auth-input" type="number" step="0.05" min="0" max="1" value={cashFlow} onChange={(e) => setCashFlow(e.target.value)} />
          </div>
          <div className="auth-field">
            <label className="auth-label">Revenue Consistency (Current: {pct(revenue * 100)})</label>
            <input className="auth-input" type="number" step="0.05" min="0" max="1" value={revenue} onChange={(e) => setRevenue(e.target.value)} />
          </div>
          <div className="auth-field">
            <label className="auth-label">Compliance Behavior (Current: {pct(compliance * 100)})</label>
            <input className="auth-input" type="number" step="0.05" min="0" max="1" value={compliance} onChange={(e) => setCompliance(e.target.value)} />
          </div>
          <div className="auth-field">
            <label className="auth-label">Operational Continuity (Current: {pct(continuity * 100)})</label>
            <input className="auth-input" type="number" step="0.05" min="0" max="1" value={continuity} onChange={(e) => setContinuity(e.target.value)} />
          </div>
          <div className="auth-field">
            <label className="auth-label">Financial Resilience (Current: {pct(resilience * 100)})</label>
            <input className="auth-input" type="number" step="0.05" min="0" max="1" value={resilience} onChange={(e) => setResilience(e.target.value)} />
          </div>
        </div>

        <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--accent-light)", textTransform: "uppercase", letterSpacing: "1px", marginTop: "10px" }}>
          2. Access Session Parameters
        </h4>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div className="auth-field">
            <label className="auth-label">Session Idle Timeout (Minutes)</label>
            <input className="auth-input" type="number" value={timeout} onChange={(e) => setTimeoutVal(e.target.value)} />
          </div>
          <div className="auth-field">
            <label className="auth-label">Max Login Retries (Brute protection)</label>
            <input className="auth-input" type="number" value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} />
          </div>
        </div>

        <button className="auth-submit" type="submit" style={{ marginTop: "10px" }}>
          Commit Global Configuration
        </button>
      </form>
    </div>
  );
}

// ── Audit Logs ──
function AuditLogsView({ auditLogs }) {
  const [filterSearch, setFilterSearch] = useState("");

  const filtered = useMemo(() => {
    return auditLogs.filter(
      (log) =>
        log.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
        log.userId.toLowerCase().includes(filterSearch.toLowerCase()) ||
        log.action.toLowerCase().includes(filterSearch.toLowerCase()) ||
        log.role.toLowerCase().includes(filterSearch.toLowerCase())
    );
  }, [auditLogs, filterSearch]);

  return (
    <div className="fade-in card">
      <div className="card-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span className="card-title">Regulatory &amp; Operations Audit Logs</span>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
            Mandatory audit trial records of all portal actions.
          </p>
        </div>
        <input
          className="search-input"
          placeholder="Filter logs..."
          style={{ width: "220px", height: "34px", fontSize: "12px" }}
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
        />
      </div>

      <table className="msme-table" style={{ marginTop: "16px" }}>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>User ID</th>
            <th>Name</th>
            <th>Role</th>
            <th>Action Description</th>
            <th>IP Address</th>
            <th>Status</th>
          </tr>
        </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", color: "var(--text-muted)", padding: "16px" }}>
                  No audited logs found matching filters.
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                    {log.timestamp.replace("T", " ").substring(0, 19)}
                  </td>
                  <td style={{ fontWeight: "bold", fontSize: "12px" }}>{log.userId}</td>
                  <td style={{ fontSize: "12.5px" }}>{log.name}</td>
                  <td>
                    <span
                      style={{
                        fontSize: "9px",
                        background:
                          log.role === "admin"
                            ? "rgba(191,90,242,0.12)"
                            : log.role === "employee"
                            ? "rgba(48,209,88,0.12)"
                            : "rgba(79,157,255,0.12)",
                        color: log.role === "admin" ? "#BF5AF2" : log.role === "employee" ? "#30D158" : "var(--accent-light)",
                        padding: "2px 6px",
                        borderRadius: "6px",
                        fontWeight: 700,
                      }}
                    >
                      {log.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ fontSize: "12.5px", color: "var(--text-primary)" }}>{log.action}</td>
                  <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{log.ip}</td>
                  <td>
                    <span style={{ fontSize: "12px", fontWeight: "bold", color: log.status === "Success" ? "var(--risk-low-color)" : "var(--risk-high-color)" }}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
        </tbody>
      </table>
    </div>
  );
}

// ── Role Management ──
function RoleManagementView() {
  const roles = [
    {
      role: "MSME Applicant",
      desc: "Business owners seeking credit appraisal. Can only access their company's own records.",
      permissions: [
        "View own score & radar chart (My Health Card)",
        "Submit new credit applications",
        "Track active application status timeline",
        "Manage DPDP consent preferences (revoke consent)",
        "Modify own contact profile details",
      ],
    },
    {
      role: "Bank Employee",
      desc: "Lender underwriters or credit managers. Authorized to review aggregate and individual cases.",
      permissions: [
        "Access all MSME credit applications list",
        "Perform full underwriting review & explainability drivers audit",
        "Access aggregate portfolio analytics",
        "Compile compliance & risk reports",
        "Adjust global credit risk cutoff scores",
      ],
    },
    {
      role: "Super Admin",
      desc: "Platform operations & security auditor. Manages access parameters & logs registry.",
      permissions: [
        "Audit administrative logs trail (all user action histories)",
        "Register, modify, or suspend bank employees accounts",
        "Toggle applicant account access permissions",
        "Dynamically adjust sub-score calculation weights",
        "Monitor server loads & connection states",
      ],
    },
  ];

  return (
    <div className="fade-in card">
      <div className="card-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
        <span className="card-title">Role-Based Access Boundaries</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "20px" }}>
        {roles.map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: "16px",
              background: "rgba(255,255,255,0.01)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: "12px",
            }}
          >
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>{item.role}</h3>
            <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "4px", lineHeight: "1.5" }}>{item.desc}</p>
            <div style={{ marginTop: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-light)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
                Authorized Permissions
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {item.permissions.map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ color: "var(--risk-low-color)", fontSize: "12px" }}>✓</span>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Platform Monitoring ──
function PlatformMonitoringView() {
  const [latencyData, setLatencyData] = useState([]);

  useEffect(() => {
    const data = [];
    for (let i = 24; i >= 0; i--) {
      data.push({
        time: `${i}h ago`,
        API: Math.floor(100 + Math.random() * 40),
        DB: Math.floor(40 + Math.random() * 20),
      });
    }
    setLatencyData(data);
  }, []);

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="grid-2">
        {/* Connection status */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
            <span className="card-title">Network &amp; Subsystems Latency</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Account Aggregator API Node</span>
              <span style={{ fontSize: "12px", color: "var(--risk-low-color)", fontWeight: "bold" }}>● Online (140ms)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>GST returns verification server</span>
              <span style={{ fontSize: "12px", color: "var(--risk-low-color)", fontWeight: "bold" }}>● Online (110ms)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>EPFO authentication endpoint</span>
              <span style={{ fontSize: "12px", color: "var(--risk-low-color)", fontWeight: "bold" }}>● Online (90ms)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Electricity boards utility resolver</span>
              <span style={{ fontSize: "12px", color: "var(--risk-low-color)", fontWeight: "bold" }}>● Online (180ms)</span>
            </div>
          </div>
        </div>

        {/* Database parameters summary */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
            <span className="card-title">Database Storage &amp; Encryption</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Security Protocol</span>
              <span style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 600 }}>SHA-256 / AES-256 LocalStorage</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>DB Size</span>
              <span style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 600 }}>48 KB / 5.0 MB quota</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Active Token Expiry</span>
              <span style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 600 }}>24 Hours rolling</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Brute Protection State</span>
              <span style={{ fontSize: "13px", color: "var(--risk-low-color)", fontWeight: "bold" }}>Lockout Enabled (Active)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Latency History Graph */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Subsystem Response Latency Timeline (ms)</span>
        </div>
        <div className="chart-container" style={{ height: "260px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={latencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)", borderRadius: 8 }}
                itemStyle={{ color: "var(--text-primary)" }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="API" stroke="var(--accent-blue-light)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="DB" stroke="var(--risk-low-color)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ── 8. MAIN APP COMPONENT (ROUTING AND GUARDS) ────────────────────────────────
// ── Public Applicant View (default unauthenticated view) ────────────────────
function PublicApplicantView({ onLogin }) {
  const products = [
    {
      id: "prod_wc",
      title: "IDBI Working Capital Digital Finance",
      desc: "Calibrated short-term credit facilities to bridge operational cash-flow gaps, inventory purchases, or payroll disbursements. Evaluates real-time cash ledger velocities.",
      tenure: "12 to 24 Months",
      rates: "8.5% – 11.2% p.a.",
      amountRange: "₹5L – ₹50L",
      icon: "💼",
    },
    {
      id: "prod_asset",
      title: "IDBI Equipment & Machinery Finance",
      desc: "Collateral-free asset procurement options to finance operational equipment, server hardware, or logistics vehicles. Mapped directly to operational continuity signals.",
      tenure: "24 to 48 Months",
      rates: "9.0% – 12.0% p.a.",
      amountRange: "₹10L – ₹75L",
      icon: "⚙️",
    },
    {
      id: "prod_ntc",
      title: "IDBI NTC/NTB Enterprise Growth Line",
      desc: "Custom credit options optimised for New-to-Credit and New-to-Bank thin-file MSMEs. Scores creditworthiness based on compliance filings and utility consistencies.",
      tenure: "6 to 18 Months",
      rates: "9.5% – 13.0% p.a.",
      amountRange: "₹2L – ₹30L",
      icon: "🚀",
    },
  ];

  return (
    <div className="fade-in">
      {/* Hero */}
      <div className="page-header" style={{ textAlign: "center", paddingBottom: "0" }}>
        <h1 className="page-title" style={{ fontSize: "clamp(22px, 4vw, 34px)" }}>
          AI-Powered MSME Financial Health Card
        </h1>
        <p className="page-subtitle" style={{ maxWidth: "620px", margin: "10px auto 0" }}>
          Explainable alternate-data credit scoring for New-to-Credit &amp; New-to-Bank enterprises — GST, UPI, bank
          flows, EPFO &amp; utility signals with full auditability.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "22px", flexWrap: "wrap" }}>
          <button
            className="landing-btn-primary"
            onClick={onLogin}
            style={{ padding: "13px 32px", fontSize: "14px", borderRadius: "12px" }}
          >
            Get Started — Apply for Loan →
          </button>
          <button
            className="landing-btn-secondary"
            onClick={onLogin}
            style={{ padding: "13px 28px", fontSize: "14px", borderRadius: "12px" }}
          >
            Log In to Dashboard
          </button>
        </div>
      </div>

      <DisclaimerBanner />

      {/* Stats strip */}
      <div className="stats-row" style={{ marginBottom: "28px" }}>
        {[
          { label: "Loan Products", value: "3", sub: "available now" },
          { label: "Max Facility", value: "₹75L", sub: "per application" },
          { label: "Score Range", value: "0 – 1000", sub: "health score" },
          { label: "Data Sources", value: "5", sub: "alternate streams" },
          { label: "Decision Time", value: "< 48h", sub: "underwriter SLA" },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: "var(--accent-blue-light)" }}>{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Loan Products */}
      <div style={{ marginBottom: "12px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
          Available Loan Products
        </h2>
        <p style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
          Log in or register to apply. All products use AI-powered alternate data scoring.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
        {products.map((p) => (
          <div
            key={p.id}
            className="card"
            style={{ padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px", flexWrap: "wrap" }}
          >
            <div style={{ display: "flex", gap: "16px", flex: 1, alignItems: "flex-start", minWidth: "280px" }}>
              <span style={{ fontSize: "32px", flexShrink: 0, marginTop: "2px" }}>{p.icon}</span>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
                  {p.title}
                </h3>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5", marginBottom: "14px" }}>
                  {p.desc}
                </p>
                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                  <div>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Facility Size</span>
                    <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>{p.amountRange}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Tenure</span>
                    <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>{p.tenure}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Interest</span>
                    <strong style={{ fontSize: "13px", color: "var(--risk-low-color)" }}>{p.rates}</strong>
                  </div>
                </div>
              </div>
            </div>
            <button
              className="landing-btn-primary"
              onClick={onLogin}
              style={{ padding: "12px 24px", borderRadius: "10px", fontSize: "13px", minWidth: "140px", flexShrink: 0 }}
            >
              Apply Now →
            </button>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="card" style={{ padding: "28px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "18px" }}>
          How the AI Scoring Works
        </h3>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {[
            { icon: "📊", title: "Alternate Data Ingestion", desc: "GST filings, UPI volumes, bank statement credits, EPFO contributions & utility patterns" },
            { icon: "🔍", title: "Cross-Validation Engine", desc: "Automatic fraud detection by cross-validating GST declared turnover against bank inflows" },
            { icon: "⚖️", title: "5-Dimension Scoring", desc: "Cash-Flow, Revenue Consistency, Compliance, Operational Continuity & Financial Resilience" },
            { icon: "📋", title: "Explainable Output", desc: "Full underwriter narrative with positive drivers, risk factors, and recommended action" },
          ].map((item, i) => (
            <div key={i} style={{ flex: "1 1 200px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "22px", flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>{item.title}</div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust strip */}
      <div className="landing-trust" style={{ marginTop: "24px" }}>
        {[
          { icon: "🔒", text: "Secure by design" },
          { icon: "📑", text: "RBI compliant" },
          { icon: "🏛️", text: "DPDP Act 2023" },
          { icon: "🔗", text: "AA Framework" },
          { icon: "🧪", text: "Prototype · Demo data" },
        ].map((t, i) => (
          <div key={i} className="trust-item">
            <span>{t.icon}</span>
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ── 8. MAIN APP COMPONENT (ROUTING AND GUARDS) ────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
export default function App() {

  const {
    user,
    sessionLoading,
    openAuth,
    applicants,
    employees,
    loanApplications,
    systemConfig,
    auditLogs,
    addEmployee,
    toggleEmployeeStatus,
    toggleApplicantStatus,
    verifyApplicantManually,
    updateSystemConfig,
    completeKYC,
    updateApplicantProfile,
    resetPassword,
  } = useAuth();

  const [view, setView] = useState("public");
  const [selectedMSME, setSelectedMSME] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Ref to store a pending action when unauthenticated user clicks a protected feature
  const pendingActionRef = useRef(null);

  // Gatekeeper: if logged in, execute immediately; otherwise store & open auth modal
  const requireAuth = (action) => {
    if (user) {
      action();
    } else {
      pendingActionRef.current = action;
      openAuth("portal");
    }
  };

  // Recalculate credit scores dynamically on config, applicants, or loan applications change
  const scoredMsmes = useMemo(() => {
    return loanApplications.map((loan) => {
      const baseMsme = MSME_DATA.find((m) => m.id === loan.msmeId) || MSME_DATA.find((m) => m.id === "MSME-009") || MSME_DATA[0];
      const applicantUser = applicants.find((u) => u.linkedMsmeId === loan.msmeId);
      const msmeData = {
        ...baseMsme,
        id: loan.msmeId,
        name: applicantUser?.kycDetails?.businessName || baseMsme.name,
        owner: applicantUser?.name || baseMsme.owner,
        loanAmountRequested: loan.amount || baseMsme.loanAmountRequested,
        loanPurpose: loan.purpose || baseMsme.loanPurpose,
      };
      const scored = scoreMSME(msmeData);

      let action = scored.recommendedAction;
      if (loan.status === "Approved") action = "APPROVE";
      else if (loan.status === "Approved with Conditions") action = "APPROVE_CONDITIONS";
      else if (loan.status === "Declined") action = "DECLINE";
      else if (loan.status === "Under Review") action = "REQUEST_MORE_DATA";
      else if (loan.status === "Manual Review Required") action = "REVIEW_MANUALLY";

      const ACTIONS_MAP = {
        APPROVE: { label: "Approve", color: "#22c55e", icon: "check" },
        APPROVE_CONDITIONS: { label: "Approve with Conditions", color: "#3b82f6", icon: "info" },
        REVIEW_MANUALLY: { label: "Review Manually", color: "#f59e0b", icon: "eye" },
        REQUEST_MORE_DATA: { label: "Request More Data", color: "#8b5cf6", icon: "upload" },
        DECLINE: { label: "Decline", color: "#ef4444", icon: "x" },
      };

      return {
        ...scored,
        recommendedAction: action,
        actionConfig: ACTIONS_MAP[action] || ACTIONS_MAP.REVIEW_MANUALLY,
        loanId: loan.id,
        loanDate: loan.date,
        loanStatus: loan.status,
      };
    });
  }, [loanApplications, applicants]);

  // Dynamic applicant MSME lookup
  const myMsme = useMemo(() => {
    if (!user || user.role !== "applicant" || !user.kycCompleted) return null;
    let found = scoredMsmes.find((m) => m.id === user.linkedMsmeId);
    if (!found) {
      // Re-score dynamically if newly linked to MSME-009 or seed
      const targetSeedId = user.linkedMsmeId || "MSME-009";
      const baseSeed = MSME_DATA.find((m) => m.id === targetSeedId) || MSME_DATA[0];
      const applicantMsmeData = {
        ...baseSeed,
        id: targetSeedId,
        name: user.kycDetails?.businessName || "New Business",
        owner: user.name || "Owner",
      };
      const processed = scoreAllMSMEs([applicantMsmeData]);
      found = processed[0];
    }
    return found;
  }, [user, scoredMsmes]);

  // Dynamic applicant loan lookup
  const myLoans = useMemo(() => {
    if (!user || user.role !== "applicant") return [];
    return loanApplications.filter((l) => l.msmeId === user.linkedMsmeId);
  }, [user, loanApplications]);

  const activeLoan = useMemo(() => {
    if (myLoans.length === 0) return null;
    return myLoans[myLoans.length - 1];
  }, [myLoans]);

  // Navigate to corresponding dashboard on Login
  useEffect(() => {
    if (user && (view === "public" || view === "employee_dashboard") && !pendingActionRef.current) {
      if (user.role === "applicant") setView("applicant_dashboard");
      else if (user.role === "employee") setView("employee_dashboard");
      else if (user.role === "admin") setView("admin_dashboard");
    }
  }, [user, view]);

  // Execute pending action after login completes
  useEffect(() => {
    if (user && pendingActionRef.current) {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      action();
    }
  }, [user]);

  // Navigate to public applicant view on Logout
  useEffect(() => {
    if (!user) {
      setView("public");
      setSelectedMSME(null);
      setSelectedProduct(null);
    }
  }, [user]);

  // Namespace route protection guard
  useEffect(() => {
    if (!user) {
      // Public view is always shown for unauthenticated visitors regardless of view state
      return;
    }

    const applicantViews = [
      "applicant_dashboard",
      "profile",
      "loan_products",
      "my_applications",
      "notifications",
      "settings",
      "kyc_flow",
      "fhc",
    ];
    const employeeViews = ["employee_dashboard", "list", "detail", "portfolio", "methodology", "reports", "settings"];
    const adminViews = ["admin_dashboard", "employees", "users", "configuration", "audit_logs", "role_management", "platform_monitoring"];

    if (user.role === "applicant" && !applicantViews.includes(view)) {
      setView("applicant_dashboard");
    } else if (user.role === "employee" && !employeeViews.includes(view)) {
      setView("employee_dashboard");
    } else if (user.role === "admin" && !adminViews.includes(view)) {
      setView("admin_dashboard");
    }
  }, [user, view]);

  if (sessionLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "var(--bg-primary)",
        }}
      >
        <span className="auth-spinner" style={{ width: 32, height: 32, borderTopColor: "var(--accent)" }} />
      </div>
    );
  }

  // Master Route Renderer
  const renderContent = () => {
    // Public view: Applicant-facing loan products dashboard — actions are auth-gated
    if (!user) {
      return <PublicApplicantView onLogin={() => requireAuth(() => {})} />;
    }

    // ── APPLICANT ROUTER ──
    if (user.role === "applicant") {
      switch (view) {
        case "applicant_dashboard":
          return <ApplicantDashboardView user={user} myMsme={myMsme} activeLoan={activeLoan} setView={setView} />;
        case "loan_products":
          return (
            <LoanProductsView
              user={user}
              activeLoan={activeLoan}
              setView={setView}
              onSelectProduct={setSelectedProduct}
            />
          );
        case "kyc_flow":
          return (
            <KYCFormView
              user={user}
              completeKYC={completeKYC}
              selectedProduct={selectedProduct}
              setView={setView}
            />
          );
        case "my_applications":
          return selectedMSME ? (
            <MSMEDetailView
              msme={selectedMSME}
              rawDataList={MSME_DATA}
              onBack={() => {
                setSelectedMSME(null);
                setView("my_applications");
              }}
              backText="Back to Applications List"
            />
          ) : (
            <ApplicantLoanApplicationsView
              myMsme={myMsme}
              myLoans={myLoans}
              onSelectApplication={(m) => setSelectedMSME(m)}
            />
          );
        case "fhc":
          return myMsme ? (
            <MSMEDetailView
              msme={myMsme}
              rawDataList={MSME_DATA}
              onBack={() => setView("applicant_dashboard")}
              backText="Back to Dashboard"
            />
          ) : (
            <div>Syncing core transaction sheets...</div>
          );
        case "profile":
          return <ApplicantProfileView user={user} updateApplicantProfile={updateApplicantProfile} />;
        case "notifications":
          return <NotificationsView user={user} activeLoan={activeLoan} />;
        case "settings":
          return <ApplicantSettingsView />;
        default:
          return <ApplicantDashboardView user={user} myMsme={myMsme} activeLoan={activeLoan} setView={setView} />;
      }
    }

    // ── EMPLOYEE ROUTER ──
    if (user.role === "employee") {
      const handleSelect = (msme) => {
        setSelectedMSME(msme);
        setView("detail");
      };
      const handleBack = () => {
        setSelectedMSME(null);
        setView("list");
      };

      switch (view) {
        case "employee_dashboard":
          return <EmployeeDashboardView scoredMsmes={scoredMsmes} setView={setView} />;
        case "list":
          return <MSMEListView scoredMsmes={scoredMsmes} onSelect={handleSelect} />;
        case "detail":
          return selectedMSME ? (
            <MSMEDetailView msme={selectedMSME} rawDataList={MSME_DATA} onBack={handleBack} />
          ) : (
            <MSMEListView scoredMsmes={scoredMsmes} onSelect={handleSelect} />
          );
        case "portfolio":
          return <PortfolioView scoredMsmes={scoredMsmes} onSelect={handleSelect} />;
        case "methodology":
          return <MethodologyView />;
        case "reports":
          return <ReportsView />;
        case "settings":
          return <EmployeeSettingsView resetPassword={resetPassword} user={user} />;
        default:
          return <EmployeeDashboardView scoredMsmes={scoredMsmes} setView={setView} />;
      }
    }

    // ── ADMIN ROUTER ──
    if (user.role === "admin") {
      switch (view) {
        case "admin_dashboard":
          return (
            <AdminDashboardView
              applicants={applicants}
              employees={employees}
              auditLogs={auditLogs}
              setView={setView}
            />
          );
        case "employees":
          return (
            <EmployeeManagementView
              employees={employees}
              addEmployee={addEmployee}
              toggleEmployeeStatus={toggleEmployeeStatus}
            />
          );
        case "users":
          return (
            <UserManagementView
              applicants={applicants}
              toggleApplicantStatus={toggleApplicantStatus}
              verifyApplicantManually={verifyApplicantManually}
            />
          );
        case "configuration":
          return <SystemConfigurationView systemConfig={systemConfig} updateSystemConfig={updateSystemConfig} />;
        case "audit_logs":
          return <AuditLogsView auditLogs={auditLogs} />;
        case "role_management":
          return <RoleManagementView />;
        case "platform_monitoring":
          return <PlatformMonitoringView />;
        default:
          return (
            <AdminDashboardView
              applicants={applicants}
              employees={employees}
              auditLogs={auditLogs}
              setView={setView}
            />
          );
      }
    }

    return <AccessGate />;
  };

  return (
    <div className="app-shell">
      <AuthModal />
      <Topbar view={selectedMSME ? "detail" : view} setView={setView} />
      <main className="main-content">{renderContent()}</main>
    </div>
  );
}
