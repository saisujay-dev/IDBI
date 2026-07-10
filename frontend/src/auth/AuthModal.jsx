import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./AuthContext";

// ── Icons & Spinner ──────────────────────────────────────────────────────────
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

// ── Auth Modal ────────────────────────────────────────────────────────────────
export default function AuthModal() {
  const {
    authModal,
    closeAuth,
    login,
    signupApplicant,
    verifyApplicantOTP,
    resetPassword,
  } = useAuth();

  // Selected role & state inside portal
  const [activePortal, setActivePortal] = useState("portal"); // "portal" | "applicant" | "employee" | "admin"
  const [subMode, setSubMode] = useState("login"); // "login" | "signup" | "forgot" | "verify"

  // Form states
  const [email, setEmail] = useState("");
  const [idInput, setIdInput] = useState(""); // Employee ID or Admin ID
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Applicant Registration specific fields
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  // OTP/Verify specific fields
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");

  // Status fields
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [visible, setVisible] = useState(false);

  const overlayRef = useRef(null);
  const initialInputRef = useRef(null);

  // Sync state with parent context modal state
  useEffect(() => {
    if (authModal) {
      setError("");
      setSuccess("");
      setLoading(false);
      setOtpSent(false);

      if (authModal === "portal") {
        setActivePortal("portal");
        setSubMode("login");
      } else if (authModal.startsWith("verify_applicant")) {
        const targetEmail = authModal.split(":")[1] || "";
        setOtpEmail(targetEmail);
        setActivePortal("applicant");
        setSubMode("verify");
      } else {
        // e.g. login_applicant, login_employee, login_admin
        const parts = authModal.split("_");
        setActivePortal(parts[1] || "portal");
        setSubMode(parts[0] || "login");
      }

      // Small delay to trigger CSS entry animation
      setTimeout(() => setVisible(true), 10);
    } else {
      setVisible(false);
    }
  }, [authModal]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(closeAuth, 260);
  }, [closeAuth]);

  // Trap Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && authModal) handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [authModal, handleClose]);

  // Focus helper
  useEffect(() => {
    if (visible && initialInputRef.current) {
      setTimeout(() => initialInputRef.current?.focus(), 150);
    }
  }, [visible, activePortal, subMode]);

  if (!authModal) return null;

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) handleClose();
  };

  const handlePortalSelect = (portal) => {
    setError("");
    setSuccess("");
    setActivePortal(portal);
    setSubMode("login");
    // Clear forms
    setEmail("");
    setIdInput("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setMobileNumber("");
    setOtpCode("");
  };

  const handleBackToPortal = () => {
    setError("");
    setSuccess("");
    setActivePortal("portal");
    setSubMode("login");
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (loading || success) return;
    setError("");
    setSuccess("");

    setLoading(true);
    try {
      if (subMode === "login") {
        const username = activePortal === "applicant" ? email : idInput;
        await login(username, password, activePortal, rememberMe);
        setSuccess("Authentication successful! Loading dashboard...");
        setTimeout(handleClose, 900);
      } else if (subMode === "signup") {
        await signupApplicant({
          name,
          email,
          mobileNumber,
          password,
          confirmPassword,
        });
        setSuccess("Verification OTP dispatched to registered email!");
        // Sign-up process automatically redirects us to 'verify' mode from Context
      } else if (subMode === "verify") {
        await verifyApplicantOTP(otpEmail || email, otpCode);
        setSuccess("Email verified successfully! Please log in.");
        // OTP verification in Context automatically redirects us to 'login_applicant'
      } else if (subMode === "forgot") {
        if (!otpSent) {
          // Trigger OTP dispatch simulation
          if (activePortal === "applicant" && !email.trim()) {
            throw new Error("Registered email or mobile number is required.");
          }
          if (activePortal === "employee" && !idInput.trim()) {
            throw new Error("Employee ID is required.");
          }
          setOtpSent(true);
          setSuccess("A verification code has been dispatched!");
        } else {
          // Handle Password Reset
          const targetUser = activePortal === "applicant" ? email : idInput;
          if (otpCode !== "123456") {
            throw new Error("Invalid reset code. Use 123456 for demo.");
          }
          await resetPassword(targetUser, activePortal, password);
          setSuccess("Password updated successfully! You can log in now.");
          setTimeout(() => {
            setSubMode("login");
            setOtpSent(false);
            setPassword("");
            setConfirmPassword("");
            setSuccess("");
          }, 1500);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = () => {
    setError("");
    setSuccess("A fresh verification code has been dispatched!");
  };

  const isFormBusy = loading || !!success;

  return (
    <div
      className={`auth-overlay ${visible ? "auth-overlay--in" : ""}`}
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        className={`auth-card ${visible ? "auth-card--in" : ""}`}
        style={{
          maxWidth: "420px",
          width: "95%",
          transition: "all 0.32s var(--ease-spring)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Access Portal"
      >
        {/* ── Close Button ── */}
        <button className="auth-close" onClick={handleClose} aria-label="Close dialog" type="button">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        {/* ── Logo ── */}
        <div className="auth-logo">
          <div className="auth-logo-icon">🏦</div>
          <span className="auth-logo-text">MSME Financial Health Card</span>
        </div>

        {/* ── ALERTS ── */}
        {error && <div className="auth-alert auth-alert--error" role="alert">{error}</div>}
        {success && <div className="auth-alert auth-alert--success" role="status">{success}</div>}

        {/* ── 1. PORTAL SELECTION VIEW ── */}
        {activePortal === "portal" && (
          <div className="fade-in" style={{ textAlign: "center" }}>
            <h2 className="card-title" style={{ fontSize: "17px", marginBottom: "8px", fontWeight: 700 }}>
              Access Portal
            </h2>
            <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginBottom: "24px" }}>
              Select your role level below to authenticate and enter your dashboard.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                className="landing-btn-secondary"
                style={{
                  padding: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  borderRadius: "14px",
                  gap: "14px",
                  textAlign: "left",
                  width: "100%",
                }}
                onClick={() => handlePortalSelect("applicant")}
                type="button"
              >
                <span style={{ fontSize: "22px" }}>💼</span>
                <div>
                  <div style={{ fontWeight: 650, fontSize: "14px", color: "var(--text-primary)" }}>
                    MSME Applicant Portal
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    Register, view your Credit Health Card, or request loan finance.
                  </div>
                </div>
              </button>

              <button
                className="landing-btn-secondary"
                style={{
                  padding: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  borderRadius: "14px",
                  gap: "14px",
                  textAlign: "left",
                  width: "100%",
                }}
                onClick={() => handlePortalSelect("employee")}
                type="button"
              >
                <span style={{ fontSize: "22px" }}>👔</span>
                <div>
                  <div style={{ fontWeight: 650, fontSize: "14px", color: "var(--text-primary)" }}>
                    Bank Employee Portal
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    Review credit portfolios, perform underwriting and risk scores audit.
                  </div>
                </div>
              </button>

              <button
                className="landing-btn-secondary"
                style={{
                  padding: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  borderRadius: "14px",
                  gap: "14px",
                  textAlign: "left",
                  width: "100%",
                }}
                onClick={() => handlePortalSelect("admin")}
                type="button"
              >
                <span style={{ fontSize: "22px" }}>🔑</span>
                <div>
                  <div style={{ fontWeight: 650, fontSize: "14px", color: "var(--text-primary)" }}>
                    Super Admin Portal
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    System audits, modify metrics variables, monitor system load, manage users.
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── 2. MSME APPLICANT AUTH FORMS ── */}
        {activePortal === "applicant" && (
          <div className="fade-in">
            {/* Nav Header */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
              <button
                onClick={handleBackToPortal}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                type="button"
              >
                ← Access Portal
              </button>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: "11px",
                  background: "rgba(79,157,255,0.12)",
                  color: "var(--accent-light)",
                  padding: "4px 8px",
                  borderRadius: "8px",
                  fontWeight: 700,
                }}
              >
                APPLICANT
              </span>
            </div>

            {subMode !== "verify" && (
              <div
                className={`auth-toggle ${subMode === "signup" ? "auth-toggle--signup" : ""}`}
                role="tablist"
              >
                <div className="auth-toggle-glider" />
                <button
                  className={`auth-toggle-option ${subMode === "login" ? "auth-toggle-option--active" : ""}`}
                  onClick={() => {
                    setSubMode("login");
                    setError("");
                    setSuccess("");
                  }}
                  type="button"
                  role="tab"
                  disabled={isFormBusy}
                >
                  Log In
                </button>
                <button
                  className={`auth-toggle-option ${subMode === "signup" ? "auth-toggle-option--active" : ""}`}
                  onClick={() => {
                    setSubMode("signup");
                    setError("");
                    setSuccess("");
                  }}
                  type="button"
                  role="tab"
                  disabled={isFormBusy}
                >
                  Sign Up
                </button>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="auth-form" noValidate>
              {/* ── A: Applicant Login ── */}
              {subMode === "login" && (
                <>
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="app-email">Email Address or Mobile Number</label>
                    <input
                      id="app-email"
                      ref={initialInputRef}
                      className="auth-input"
                      type="text"
                      placeholder="owner@business.com or 9876543210"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isFormBusy}
                      required
                    />
                  </div>

                  <div className="auth-field">
                    <div className="auth-label-row">
                      <label className="auth-label" htmlFor="app-pass">Password</label>
                      <button
                        type="button"
                        className="auth-forgot"
                        onClick={() => {
                          setSubMode("forgot");
                          setError("");
                          setSuccess("");
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <input
                      id="app-pass"
                      className="auth-input"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isFormBusy}
                      required
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                    <input
                      type="checkbox"
                      id="app-remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={isFormBusy}
                      style={{ cursor: "pointer" }}
                    />
                    <label htmlFor="app-remember" style={{ fontSize: "12px", color: "var(--text-secondary)", cursor: "pointer", userSelect: "none" }}>
                      Remember Me
                    </label>
                  </div>

                  <button className="auth-submit" type="submit" disabled={isFormBusy}>
                    {loading ? <Spinner /> : "Log In to Dashboard"}
                  </button>
                </>
              )}

              {/* ── B: Applicant Sign Up (Name, Email, Mobile, Passwords) ── */}
              {subMode === "signup" && (
                <>
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="reg-name">Full Name</label>
                    <input
                      id="reg-name"
                      ref={initialInputRef}
                      className="auth-input"
                      type="text"
                      placeholder="Riya Mehta"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isFormBusy}
                      required
                    />
                  </div>

                  <div className="auth-field">
                    <label className="auth-label" htmlFor="reg-email">Email Address</label>
                    <input
                      id="reg-email"
                      className="auth-input"
                      type="email"
                      placeholder="riya@riyafabrics.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isFormBusy}
                      required
                    />
                  </div>

                  <div className="auth-field">
                    <label className="auth-label" htmlFor="reg-phone">Mobile Number</label>
                    <input
                      id="reg-phone"
                      className="auth-input"
                      type="tel"
                      placeholder="9876543210"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      disabled={isFormBusy}
                      required
                    />
                  </div>

                  <div className="auth-field">
                    <label className="auth-label" htmlFor="reg-pass">Create Password</label>
                    <input
                      id="reg-pass"
                      className="auth-input"
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isFormBusy}
                      required
                    />
                  </div>

                  <div className="auth-field">
                    <label className="auth-label" htmlFor="reg-confirm">Confirm Password</label>
                    <input
                      id="reg-confirm"
                      className="auth-input"
                      type="password"
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isFormBusy}
                      required
                    />
                  </div>

                  <button className="auth-submit" type="submit" disabled={isFormBusy} style={{ marginTop: "8px" }}>
                    {loading ? <Spinner /> : "Register & Send Verification Code"}
                  </button>
                </>
              )}

              {/* ── C: Applicant OTP Verification ── */}
              {subMode === "verify" && (
                <>
                  <div style={{ textAlign: "center", padding: "10px 0" }}>
                    <span style={{ fontSize: "40px" }}>✉️</span>
                    <h3 style={{ fontSize: "15px", fontWeight: 650, marginTop: "12px", color: "var(--text-primary)" }}>
                      Email Verification Required
                    </h3>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px", lineHeight: 1.5 }}>
                      We have dispatched a 6-digit confirmation code to:
                      <br />
                      <strong style={{ color: "var(--accent-light)" }}>{otpEmail || email}</strong>
                    </p>
                  </div>

                  <div className="auth-field" style={{ marginTop: "10px" }}>
                    <label className="auth-label" htmlFor="ver-otp" style={{ textAlign: "center", display: "block" }}>
                      Verification Code (OTP)
                    </label>
                    <input
                      id="ver-otp"
                      ref={initialInputRef}
                      className="auth-input"
                      type="text"
                      maxLength={6}
                      placeholder="Use code 123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      disabled={isFormBusy}
                      style={{ textAlign: "center", fontSize: "20px", letterSpacing: "8px", padding: "10px" }}
                      required
                    />
                  </div>

                  <button className="auth-submit" type="submit" disabled={isFormBusy} style={{ marginTop: "10px" }}>
                    {loading ? <Spinner /> : "Confirm Verification"}
                  </button>

                  <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-secondary)", marginTop: "12px" }}>
                    Didn't receive the email?{" "}
                    <button
                      type="button"
                      onClick={resendOTP}
                      className="auth-forgot"
                      disabled={isFormBusy}
                      style={{ fontSize: "12px" }}
                    >
                      Resend Code
                    </button>
                  </p>
                </>
              )}

              {/* ── D: Applicant Forgot Password ── */}
              {subMode === "forgot" && (
                <>
                  <div style={{ textAlign: "center" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: 650, color: "var(--text-primary)" }}>
                      Reset Password
                    </h3>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                      {otpSent ? "Verify OTP code and key in your new password." : "Verify credentials with a 6-digit email OTP."}
                    </p>
                  </div>

                  {!otpSent ? (
                    <div className="auth-field" style={{ marginTop: "12px" }}>
                      <label className="auth-label" htmlFor="forgot-email">Registered Email or Mobile Number</label>
                      <input
                        id="forgot-email"
                        ref={initialInputRef}
                        className="auth-input"
                        type="text"
                        placeholder="owner@business.com or 9876543210"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isFormBusy}
                        required
                      />
                    </div>
                  ) : (
                    <>
                      <div className="auth-field" style={{ marginTop: "12px" }}>
                        <label className="auth-label" htmlFor="forgot-otp">OTP Code</label>
                        <input
                          id="forgot-otp"
                          ref={initialInputRef}
                          className="auth-input"
                          type="text"
                          maxLength={6}
                          placeholder="Use code 123456"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          disabled={isFormBusy}
                          style={{ textAlign: "center", fontSize: "16px", letterSpacing: "4px" }}
                          required
                        />
                      </div>

                      <div className="auth-field">
                        <label className="auth-label" htmlFor="forgot-pass">New Password</label>
                        <input
                          id="forgot-pass"
                          className="auth-input"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isFormBusy}
                          required
                        />
                      </div>
                    </>
                  )}

                  <button className="auth-submit" type="submit" disabled={isFormBusy} style={{ marginTop: "10px" }}>
                    {loading ? <Spinner /> : !otpSent ? "Dispatch Reset Code" : "Update Secure Password"}
                  </button>

                  <p style={{ textAlign: "center", marginTop: "14px" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSubMode("login");
                        setOtpSent(false);
                        setError("");
                      }}
                      className="auth-forgot"
                    >
                      Back to Login
                    </button>
                  </p>
                </>
              )}
            </form>
          </div>
        )}

        {/* ── 3. BANK EMPLOYEE AUTH FORM ── */}
        {activePortal === "employee" && (
          <div className="fade-in">
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
              <button
                onClick={handleBackToPortal}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                type="button"
              >
                ← Access Portal
              </button>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: "11px",
                  background: "rgba(48,209,88,0.12)",
                  color: "#30D158",
                  padding: "4px 8px",
                  borderRadius: "8px",
                  fontWeight: 700,
                }}
              >
                EMPLOYEE
              </span>
            </div>

            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
              {subMode === "login" ? "Official Employee Login" : "Reset Password"}
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "20px" }}>
              {subMode === "login"
                ? "Access MSME portfolios & review financial health scorecards."
                : "Reset your secure portal password using registered Employee ID."}
            </p>

            <form onSubmit={handleFormSubmit} className="auth-form" noValidate>
              {subMode === "login" && (
                <>
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="emp-id">Employee ID</label>
                    <input
                      id="emp-id"
                      ref={initialInputRef}
                      className="auth-input"
                      type="text"
                      placeholder="e.g. EMP-001"
                      value={idInput}
                      onChange={(e) => setIdInput(e.target.value)}
                      disabled={isFormBusy}
                      required
                    />
                  </div>

                  <div className="auth-field">
                    <div className="auth-label-row">
                      <label className="auth-label" htmlFor="emp-pass">Password</label>
                      <button
                        type="button"
                        className="auth-forgot"
                        onClick={() => {
                          setSubMode("forgot");
                          setError("");
                          setSuccess("");
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <input
                      id="emp-pass"
                      className="auth-input"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isFormBusy}
                      required
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="checkbox"
                      id="emp-remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={isFormBusy}
                      style={{ cursor: "pointer" }}
                    />
                    <label htmlFor="emp-remember" style={{ fontSize: "12px", color: "var(--text-secondary)", cursor: "pointer", userSelect: "none" }}>
                      Remember Me
                    </label>
                  </div>

                  <button
                    className="auth-submit"
                    type="submit"
                    disabled={isFormBusy}
                    style={{
                      background: "linear-gradient(135deg, rgba(48,209,88,0.85), rgba(52,199,89,0.8))",
                      borderColor: "rgba(48,209,88,0.3)",
                      boxShadow: "0 4px 20px rgba(48,209,88,0.2)",
                    }}
                  >
                    {loading ? <Spinner /> : "Authenticate Employee"}
                  </button>
                </>
              )}

              {subMode === "forgot" && (
                <>
                  {!otpSent ? (
                    <div className="auth-field">
                      <label className="auth-label" htmlFor="emp-forgot-id">Employee ID</label>
                      <input
                        id="emp-forgot-id"
                        ref={initialInputRef}
                        className="auth-input"
                        type="text"
                        placeholder="EMP-001"
                        value={idInput}
                        onChange={(e) => setIdInput(e.target.value)}
                        disabled={isFormBusy}
                        required
                      />
                    </div>
                  ) : (
                    <>
                      <div className="auth-field">
                        <label className="auth-label" htmlFor="emp-forgot-otp">Official Reset Code (OTP)</label>
                        <input
                          id="emp-forgot-otp"
                          ref={initialInputRef}
                          className="auth-input"
                          type="text"
                          maxLength={6}
                          placeholder="Use code 123456"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          disabled={isFormBusy}
                          style={{ textAlign: "center", letterSpacing: "4px" }}
                          required
                        />
                      </div>

                      <div className="auth-field">
                        <label className="auth-label" htmlFor="emp-forgot-pass">New Password</label>
                        <input
                          id="emp-forgot-pass"
                          className="auth-input"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isFormBusy}
                          required
                        />
                      </div>
                    </>
                  )}

                  <button className="auth-submit" type="submit" disabled={isFormBusy} style={{ marginTop: "10px" }}>
                    {loading ? <Spinner /> : !otpSent ? "Request Reset Link" : "Update Password"}
                  </button>

                  <p style={{ textAlign: "center", marginTop: "14px" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSubMode("login");
                        setOtpSent(false);
                        setError("");
                      }}
                      className="auth-forgot"
                    >
                      Back to Login
                    </button>
                  </p>
                </>
              )}
            </form>
          </div>
        )}

        {/* ── 4. SUPER ADMIN AUTH FORM ── */}
        {activePortal === "admin" && (
          <div className="fade-in">
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
              <button
                onClick={handleBackToPortal}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                type="button"
              >
                ← Access Portal
              </button>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: "11px",
                  background: "rgba(191,90,242,0.12)",
                  color: "#BF5AF2",
                  padding: "4px 8px",
                  borderRadius: "8px",
                  fontWeight: 700,
                }}
              >
                SYSTEM ADMIN
              </span>
            </div>

            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
              {subMode === "login" ? "Super Admin Portal" : "Administrative Recovery"}
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "20px" }}>
              {subMode === "login"
                ? "Full administrative control of systems, parameters, and roles."
                : "Recover system administrator authentication parameters."}
            </p>

            <form onSubmit={handleFormSubmit} className="auth-form" noValidate>
              {subMode === "login" && (
                <>
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="admin-id">Admin ID</label>
                    <input
                      id="admin-id"
                      ref={initialInputRef}
                      className="auth-input"
                      type="text"
                      placeholder="e.g. ADMIN-001"
                      value={idInput}
                      onChange={(e) => setIdInput(e.target.value)}
                      disabled={isFormBusy}
                      required
                    />
                  </div>

                  <div className="auth-field">
                    <div className="auth-label-row">
                      <label className="auth-label" htmlFor="admin-pass">Password</label>
                      <button
                        type="button"
                        className="auth-forgot"
                        onClick={() => {
                          setSubMode("forgot");
                          setError("");
                          setSuccess("");
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <input
                      id="admin-pass"
                      className="auth-input"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isFormBusy}
                      required
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="checkbox"
                      id="admin-remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={isFormBusy}
                      style={{ cursor: "pointer" }}
                    />
                    <label htmlFor="admin-remember" style={{ fontSize: "12px", color: "var(--text-secondary)", cursor: "pointer", userSelect: "none" }}>
                      Remember Me
                    </label>
                  </div>

                  <button
                    className="auth-submit"
                    type="submit"
                    disabled={isFormBusy}
                    style={{
                      background: "linear-gradient(135deg, rgba(191,90,242,0.85), rgba(175,82,222,0.8))",
                      borderColor: "rgba(191,90,242,0.3)",
                      boxShadow: "0 4px 20px rgba(191,90,242,0.2)",
                    }}
                  >
                    {loading ? <Spinner /> : "Authenticate Administrator"}
                  </button>
                </>
              )}

              {subMode === "forgot" && (
                <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", lineHeight: "1.6" }}>
                  <p style={{ fontSize: "12.5px", color: "var(--text-primary)", fontWeight: 600, marginBottom: "8px" }}>
                    ⚠️ Security Compliance Directive
                  </p>
                  <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginBottom: "12px" }}>
                    For security audits and regulatory compliance, administrator credential overrides cannot be requested online.
                  </p>
                  <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginBottom: "14px" }}>
                    Please contact the **IT Security Operations Center (SOC)** or run internal recovery scripts.
                  </p>
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "10px", fontSize: "11px", color: "var(--text-muted)" }}>
                    📧 itsec@idbi.co.in | 📞 +91-22-6800 (Ext. 401)
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSubMode("login");
                      setError("");
                    }}
                    className="auth-submit"
                    style={{
                      marginTop: "16px",
                      minHeight: "40px",
                      fontSize: "13px",
                      padding: "8px 16px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    Back to Login
                  </button>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
