import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./AuthContext";

// ── Google Icon SVG ──────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

// ── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ size = 18, light = true }) {
  return (
    <span
      className="auth-spinner"
      style={{ width: size, height: size, borderTopColor: light ? "#fff" : "#333",
               borderColor: light ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.12)" }}
    />
  );
}

// ── Auth Modal ────────────────────────────────────────────────────────────────
export default function AuthModal() {
  const { authModal, closeAuth, login, signup, googleSignIn } = useAuth();

  const [mode,         setMode]        = useState("login");
  const [name,         setName]        = useState("");
  const [email,        setEmail]       = useState("");
  const [password,     setPassword]    = useState("");
  const [showPass,     setShowPass]    = useState(false);
  const [loading,      setLoading]     = useState(false);
  const [gLoading,     setGLoading]    = useState(false);
  const [error,        setError]       = useState("");
  const [success,      setSuccess]     = useState("");
  const [visible,      setVisible]     = useState(false);

  const overlayRef = useRef(null);
  const emailRef   = useRef(null);

  // Sync with authModal prop
  useEffect(() => {
    if (authModal) {
      setMode(authModal);
      resetForm();
      // Small delay to trigger CSS animation
      setTimeout(() => setVisible(true), 10);
    } else {
      setVisible(false);
    }
  }, [authModal]);

  // Trap keyboard: Escape to close
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape" && authModal) handleClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [authModal]);

  // Focus email on open
  useEffect(() => {
    if (visible && emailRef.current) {
      setTimeout(() => emailRef.current?.focus(), 120);
    }
  }, [visible, mode]);

  if (!authModal) return null;

  const resetForm = () => {
    setName(""); setEmail(""); setPassword(""); setShowPass(false);
    setError(""); setSuccess(""); setLoading(false); setGLoading(false);
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(closeAuth, 260);
  };

  const switchMode = (m) => {
    setMode(m);
    setError(""); setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || success) return;
    setError(""); setSuccess("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
        setSuccess("Welcome back! Redirecting…");
      } else {
        await signup(name, email, password);
        setSuccess("Account created — welcome aboard! 🎉");
      }
      setTimeout(handleClose, 900);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (gLoading || loading || success) return;
    setError(""); setSuccess("");
    setGLoading(true);
    try {
      await googleSignIn();
      setSuccess("Signed in with Google!");
      setTimeout(handleClose, 800);
    } catch (err) {
      setError(err.message);
    } finally {
      setGLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) handleClose();
  };

  const busy = loading || gLoading || !!success;

  return (
    <div
      className={`auth-overlay ${visible ? "auth-overlay--in" : ""}`}
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        className={`auth-card ${visible ? "auth-card--in" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={mode === "login" ? "Log in" : "Sign up"}
      >
        {/* ── Close ── */}
        <button className="auth-close" onClick={handleClose} aria-label="Close dialog" type="button">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>

        {/* ── Logo ── */}
        <div className="auth-logo">
          <div className="auth-logo-icon">🏦</div>
          <span className="auth-logo-text">MSME Health Card</span>
        </div>

        {/* ── Mode Toggle (sliding glider) ── */}
        <div
          className={`auth-toggle ${mode === "signup" ? "auth-toggle--signup" : ""}`}
          role="tablist"
          aria-label="Authentication mode"
        >
          {/* Sliding indicator pill — moves via CSS class, not inline style */}
          <div className="auth-toggle-glider" aria-hidden="true" />

          <button
            className={`auth-toggle-option ${mode === "login" ? "auth-toggle-option--active" : ""}`}
            onClick={() => switchMode("login")}
            type="button"
            role="tab"
            aria-selected={mode === "login"}
          >
            Log In
          </button>
          <button
            className={`auth-toggle-option ${mode === "signup" ? "auth-toggle-option--active" : ""}`}
            onClick={() => switchMode("signup")}
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
          >
            Sign Up
          </button>
        </div>

        {/* ── Subtitle — re-keyed so it re-animates on every mode switch ── */}
        <p className="auth-subtitle" key={mode}>
          {mode === "login"
            ? "Sign in to access your dashboard."
            : "Create an account to get started."}
        </p>

        {/* ── Alerts ── */}
        {error   && <div className="auth-alert auth-alert--error"   role="alert">{error}</div>}
        {success && <div className="auth-alert auth-alert--success" role="status">{success}</div>}

        {/* ── Form ── */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Name field — always in DOM, slides in/out with CSS */}
          <div className={`auth-name-wrap ${mode === "signup" ? "auth-name-wrap--open" : ""}`}>
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-name">Full Name</label>
              <input
                id="auth-name"
                className="auth-input"
                type="text"
                placeholder="Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                disabled={busy || mode === "login"}
                tabIndex={mode === "signup" ? 0 : -1}
                spellCheck={false}
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              ref={emailRef}
              className="auth-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={busy}
              spellCheck={false}
            />
          </div>

          <div className="auth-field">
            <div className="auth-label-row">
              <label className="auth-label" htmlFor="auth-password">Password</label>
              {mode === "login" && (
                <button type="button" className="auth-forgot" tabIndex={-1}>
                  Forgot password?
                </button>
              )}
            </div>
            <div className="auth-input-wrap">
              <input
                id="auth-password"
                className="auth-input"
                type={showPass ? "text" : "password"}
                placeholder={mode === "signup" ? "Minimum 6 characters" : "••••••••"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                disabled={busy}
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowPass((v) => !v)}
                tabIndex={-1}
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button className="auth-submit" type="submit" disabled={busy}>
            {loading ? <Spinner /> : (mode === "login" ? "Log In" : "Create Account")}
          </button>
        </form>

        {/* ── Divider ── */}
        <div className="auth-divider"><span>or continue with</span></div>

        {/* ── Google ── */}
        <button
          className="auth-google"
          onClick={handleGoogle}
          disabled={busy}
          type="button"
        >
          {gLoading ? <Spinner light={false} /> : <><GoogleIcon /> Continue with Google</>}
        </button>

        {/* ── Footer ── */}
        <p className="auth-footer">
          {mode === "login" ? (
            <>New here?{" "}
              <button type="button" className="auth-switch" onClick={() => switchMode("signup")}>Create an account →</button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button type="button" className="auth-switch" onClick={() => switchMode("login")}>Log In →</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
