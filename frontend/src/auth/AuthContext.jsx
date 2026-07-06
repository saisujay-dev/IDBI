import { createContext, useContext, useState, useEffect, useCallback } from "react";

// ── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ── Utilities ────────────────────────────────────────────────────────────────
const delay    = (ms) => new Promise((r) => setTimeout(r, ms));
const isEmail  = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const encode   = (s) => btoa(unescape(encodeURIComponent(s))); // simple obfuscation, NOT real crypto
const getUsers = () => { try { return JSON.parse(localStorage.getItem("msme_users") || "[]"); } catch { return []; } };
const saveUsers = (arr) => localStorage.setItem("msme_users", JSON.stringify(arr));
const pick     = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj[k]]));
const initials = (name) => name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const AVATAR_COLORS = [
  "#4F9DFF", "#30D158", "#6E6BF5", "#FF9F0A",
  "#5AC8FA", "#BF5AF2", "#FF6B6B", "#34C759",
];

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,           setUser]          = useState(null);
  const [authModal,      setAuthModal]     = useState(null); // null | "login" | "signup"
  const [sessionLoading, setSessionLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("msme_auth_user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    setSessionLoading(false);
  }, []);

  const openAuth  = useCallback((mode = "login") => setAuthModal(mode), []);
  const closeAuth = useCallback(() => setAuthModal(null), []);

  const _persist = (userData) => {
    setUser(userData);
    localStorage.setItem("msme_auth_user", JSON.stringify(userData));
  };

  // ── Login ──
  const login = async (email, password) => {
    await delay(1100);
    if (!email.trim() || !password) throw new Error("Email and password are required.");
    if (!isEmail(email))            throw new Error("Please enter a valid email address.");

    const users = getUsers();
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!found)                      throw new Error("No account found with this email. Please sign up first.");
    if (found.password !== encode(password)) throw new Error("Incorrect password. Please try again.");

    const userData = pick(found, ["id", "name", "email", "initials", "color"]);
    _persist(userData);
    return userData;
  };

  // ── Sign Up ──
  const signup = async (name, email, password) => {
    await delay(1300);
    if (!name.trim() || !email.trim() || !password) throw new Error("All fields are required.");
    if (name.trim().length < 2)  throw new Error("Name must be at least 2 characters.");
    if (!isEmail(email))         throw new Error("Please enter a valid email address.");
    if (password.length < 6)     throw new Error("Password must be at least 6 characters.");

    const users = getUsers();
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim())) {
      throw new Error("An account with this email already exists. Please log in.");
    }

    const newUser = {
      id:       `user_${Date.now()}`,
      name:     name.trim(),
      email:    email.toLowerCase().trim(),
      password: encode(password),
      initials: initials(name.trim()),
      color:    AVATAR_COLORS[users.length % AVATAR_COLORS.length],
    };
    saveUsers([...users, newUser]);

    const userData = pick(newUser, ["id", "name", "email", "initials", "color"]);
    _persist(userData);
    return userData;
  };

  // ── Google Sign-In (simulated — no real OAuth in this demo) ──
  const googleSignIn = async () => {
    await delay(900);
    const demoUser = {
      id:       "google_demo_user",
      name:     "Alex Johnson",
      email:    "alex.johnson@gmail.com",
      initials: "AJ",
      color:    AVATAR_COLORS[2],
    };
    _persist(demoUser);
    return demoUser;
  };

  // ── Logout ──
  const logout = () => {
    setUser(null);
    localStorage.removeItem("msme_auth_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authModal,
        sessionLoading,
        openAuth,
        closeAuth,
        login,
        signup,
        googleSignIn,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
