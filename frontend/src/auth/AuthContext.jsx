import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../api";

// ── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ── Utilities ────────────────────────────────────────────────────────────────
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// Asynchronous SHA-256 hashing using Web Crypto API
export const hashPassword = async (password) => {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
};

// Simulated JWT Token generation
const generateSessionToken = (userPayload) => {
  const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  const payload = { ...userPayload, expiry };
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
};

const validateSessionToken = (token) => {
  try {
    const payload = JSON.parse(decodeURIComponent(escape(atob(token))));
    if (payload.expiry && Date.now() < payload.expiry) {
      return payload;
    }
    return null;
  } catch {
    return null;
  }
};

const initials = (name) =>
  name
    ? name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "?";

const AVATAR_COLORS = [
  "#4F9DFF",
  "#30D158",
  "#6E6BF5",
  "#FF9F0A",
  "#5AC8FA",
  "#BF5AF2",
  "#FF6B6B",
  "#34C759",
];

const API_TOKEN_KEY = "msme_api_token";

const getStoredApiToken = () =>
  localStorage.getItem(API_TOKEN_KEY) || sessionStorage.getItem(API_TOKEN_KEY);

const persistApiToken = (token, rememberMe) => {
  if (!token) return;
  if (rememberMe) {
    localStorage.setItem(API_TOKEN_KEY, token);
    sessionStorage.removeItem(API_TOKEN_KEY);
  } else {
    sessionStorage.setItem(API_TOKEN_KEY, token);
    localStorage.removeItem(API_TOKEN_KEY);
  }
};

const clearApiToken = () => {
  localStorage.removeItem(API_TOKEN_KEY);
  sessionStorage.removeItem(API_TOKEN_KEY);
};

const normalizeStatus = (status) =>
  status ? `${status.charAt(0).toUpperCase()}${status.slice(1).toLowerCase()}` : "Active";

const mapApiUserToSession = (apiUser, fallback = {}) => {
  const profile = apiUser?.profile || {};
  const name = profile.name || fallback.name || apiUser?.email || "User";
  const role = apiUser?.role === "super_admin" ? "admin" : apiUser?.role || fallback.role || "applicant";
  const kycDetails =
    profile.business_name || profile.gstin || profile.pan || profile.aadhaar
      ? {
          aadhaar: profile.aadhaar || "",
          pan: profile.pan || "",
          gstin: profile.gstin || "",
          businessName: profile.business_name || "",
          businessType: profile.business_type || "",
          address: profile.address || "",
        }
      : fallback.kycDetails || null;

  return {
    id: apiUser?.id || fallback.id,
    name,
    email: apiUser?.email || fallback.email,
    mobileNumber: fallback.mobileNumber || "",
    role,
    kycCompleted: role === "applicant" ? !!kycDetails : true,
    linkedMsmeId: fallback.linkedMsmeId || null,
    kycDetails,
    color: fallback.color || AVATAR_COLORS[0],
    initials: initials(name),
  };
};

const mapApiUserToApplicant = (apiUser, fallback = {}) => {
  const session = mapApiUserToSession(apiUser, fallback);
  return {
    ...fallback,
    ...session,
    verified: true,
    status: normalizeStatus(apiUser?.status),
    password: fallback.password || "",
  };
};

const mapApiApplicationToLoan = (application, index = 0) => ({
  id: application.id,
  msmeId: application.user_id || `API-MSME-${index + 1}`,
  amount: Number(application.amount || 0),
  purpose: application.purpose || "Working Capital",
  date: application.submitted_at ? application.submitted_at.split("T")[0] : new Date().toISOString().split("T")[0],
  status: application.status
    ? application.status
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "Under Review",
  apiScore: application.score || null,
});

const buildFinancialPayload = (loanAmount) => {
  const amount = Number(loanAmount) || 1000000;
  const monthlyTurnover = Math.max(amount * 0.18, 250000);
  const bankInflow = Math.max(monthlyTurnover * 1.08, 300000);
  return {
    year_month: new Date().toISOString().slice(0, 7),
    gst_turnover: monthlyTurnover,
    upi_inflow: Math.max(monthlyTurnover * 0.65, 180000),
    bank_inflow: bankInflow,
    bank_outflow: Math.max(bankInflow * 0.78, 220000),
    bank_avg_balance: Math.max(amount * 0.08, 75000),
    bank_min_balance: Math.max(amount * 0.012, 12000),
    bank_bounce_incidents: 0,
    bank_low_balance_months: 0,
    bank_od_cc_utilized: 0.35,
    epfo_contributions: 15000,
    epfo_employee_count: 12,
    utility_monthly_units: 450,
    utility_payment_regularity: 1.0,
    utility_disconnection_events: 0,
  };
};

// Initial Seed Data mapping
const SEED_MSMES = [
  { id: "MSME-001", name: "Riya Fabrics Pvt. Ltd.", owner: "Riya Mehta", email: "riya@riyafabrics.com", phone: "9876543210", gstin: "24AAAAA1111A1Z1", pan: "AAAAA1111A", aadhaar: "123456789012" },
  { id: "MSME-002", name: "TechNova Solutions LLP", owner: "Arjun Patel", email: "arjun@technova.com", phone: "9876543211", gstin: "27BBBBB2222B2Z2", pan: "BBBBB2222B", aadhaar: "123456789013" },
  { id: "MSME-003", name: "Kumar Auto Parts", owner: "Suresh Kumar", email: "suresh@kumarauto.com", phone: "9876543212", gstin: "09CCCCC3333C3Z3", pan: "CCCCC3333C", aadhaar: "123456789014" },
  { id: "MSME-004", name: "Madhya Foods Processing", owner: "Geeta Sharma", email: "geeta@madhyafoods.com", phone: "9876543213", gstin: "23DDDDD4444D4Z4", pan: "DDDDD4444D", aadhaar: "123456789015" },
  { id: "MSME-005", name: "GreenField Agri Inputs", owner: "Pratap Desai", email: "pratap@greenfieldagri.com", phone: "9876543214", gstin: "27EEEEE5555E5Z5", pan: "EEEEE5555E", aadhaar: "123456789016" },
  { id: "MSME-006", name: "PrintPro Packaging", owner: "Nilesh Shah", email: "nilesh@printpro.com", phone: "9876543215", gstin: "24FFFFF6666F6Z6", pan: "FFFFF6666F", aadhaar: "123456789017" },
  { id: "MSME-007", name: "Srinivas Infra Works", owner: "V. Srinivas", email: "srinivas@srinivasinfra.com", phone: "9876543216", gstin: "36GGGGG7777G7Z7", pan: "GGGGG7777G", aadhaar: "123456789018" },
  { id: "MSME-008", name: "MediQuick Distributors", owner: "Rakesh Gupta", email: "rakesh@mediquick.com", phone: "9876543217", gstin: "07HHHHH8888H8Z8", pan: "HHHHH8888H", aadhaar: "123456789019" },
  { id: "MSME-009", name: "Jaipur Craft Collective", owner: "Meera Agarwal", email: "meera@jaipurcrafts.com", phone: "9876543218", gstin: "08IIIII9999I9Z9", pan: "IIIII9999I", aadhaar: "123456789020" },
];

const _SEED_EMPLOYEES = [
  { id: "EMP-001", name: "Amit Sharma", email: "amit.sharma@idbi.co.in", status: "Active" },
  { id: "EMP-002", name: "Neha Verma", email: "neha.verma@idbi.co.in", status: "Active" },
];

// Seed Databases in localStorage if empty
const seedDatabase = async () => {
  const hashedDefaultPw = await hashPassword("password123");

  // 1. Applicants (MSME Users)
  if (!localStorage.getItem("msme_users")) {
    localStorage.setItem("msme_users", JSON.stringify([]));
  }

  // 2. Bank Employees
  if (!localStorage.getItem("msme_employees")) {
    localStorage.setItem("msme_employees", JSON.stringify([]));
  }

  // 3. Super Admins
  if (!localStorage.getItem("msme_admins")) {
    const defaultAdmins = [
      {
        id: "ADMIN-001",
        name: "Super Admin",
        email: "admin@idbi.co.in",
        password: hashedDefaultPw,
        color: "#E2E2E2",
        initials: "SA",
      },
    ];
    localStorage.setItem("msme_admins", JSON.stringify(defaultAdmins));
  }

  // 4. Loan Applications
  if (!localStorage.getItem("msme_loan_applications")) {
    localStorage.setItem("msme_loan_applications", JSON.stringify([]));
  }

  // 5. System Config
  if (!localStorage.getItem("msme_system_config")) {
    const defaultConfig = {
      weights: {
        cashFlowStrength: 0.25,
        revenueConsistency: 0.20,
        complianceBehavior: 0.20,
        operationalContinuity: 0.20,
        financialResilience: 0.15,
      },
      sessionTimeoutMinutes: 60,
      maxLoginAttempts: 5,
      systemStatus: "Healthy",
    };
    localStorage.setItem("msme_system_config", JSON.stringify(defaultConfig));
  }
};

// Helper to log user activities
export const writeAuditLog = (userId, name, role, action, status = "Success") => {
  try {
    const logs = JSON.parse(localStorage.getItem("msme_audit_logs") || "[]");
    const newLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      userId,
      name,
      role,
      action,
      status,
      ip: "192.168.1." + Math.floor(Math.random() * 254 + 1),
    };
    localStorage.setItem("msme_audit_logs", JSON.stringify([newLog, ...logs].slice(0, 500)));
  } catch (e) {
    console.error("Failed to write audit log", e);
  }
};

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authModal, setAuthModal] = useState(null); // null | "portal" | "login_applicant" | ...
  const [sessionLoading, setSessionLoading] = useState(true);

  // States mirroring DB tables
  const [applicants, setApplicants] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loanApplications, setLoanApplications] = useState([]);
  const [systemConfig, setSystemConfig] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  // Fetch updated tables from localStorage
  const refreshLocalState = useCallback(() => {
    try {
      setApplicants(JSON.parse(localStorage.getItem("msme_users") || "[]"));
      setEmployees(JSON.parse(localStorage.getItem("msme_employees") || "[]"));
      setLoanApplications(JSON.parse(localStorage.getItem("msme_loan_applications") || "[]"));
      setSystemConfig(JSON.parse(localStorage.getItem("msme_system_config") || "{}"));
      setAuditLogs(JSON.parse(localStorage.getItem("msme_audit_logs") || "[]"));
    } catch {}
  }, []);

  const syncBackendTables = useCallback(async (sessionUser, token) => {
    if (!token || !sessionUser) return;
    try {
      if (sessionUser.role === "employee") {
        const applications = await api.getEmployeeApplications(token);
        localStorage.setItem(
          "msme_loan_applications",
          JSON.stringify((applications || []).map(mapApiApplicationToLoan))
        );
        refreshLocalState();
      }
    } catch (err) {
      console.warn("Backend table sync failed", err);
    }
  }, [refreshLocalState]);

  // Initialize DB and Restore session on mount
  useEffect(() => {
    const init = async () => {
      await seedDatabase();
      refreshLocalState();

      try {
        const storedToken = localStorage.getItem("msme_auth_token") || sessionStorage.getItem("msme_auth_token");
        const apiToken = getStoredApiToken();
        if (apiToken) {
          try {
            const apiUser = await api.me(apiToken);
            const restored = mapApiUserToSession(apiUser);
            setUser(restored);
            await syncBackendTables(restored, apiToken);
            writeAuditLog(restored.id, restored.name, restored.role, "Session restored");
            setSessionLoading(false);
            return;
          } catch (apiErr) {
            console.warn("Stored backend session could not be restored", apiErr);
            clearApiToken();
          }
        }
        if (storedToken) {
          const validated = validateSessionToken(storedToken);
          if (validated) {
            setUser(validated);
            writeAuditLog(validated.id, validated.name, validated.role, "Session restored");
          } else {
            localStorage.removeItem("msme_auth_token");
            sessionStorage.removeItem("msme_auth_token");
          }
        }
      } catch {}
      setSessionLoading(false);
    };
    init();
  }, [refreshLocalState, syncBackendTables]);

  const openAuth = useCallback((mode = "portal") => setAuthModal(mode), []);
  const closeAuth = useCallback(() => setAuthModal(null), []);

  const _persist = (userData, rememberMe, apiToken = null) => {
    setUser(userData);
    const token = generateSessionToken(userData);
    if (rememberMe) {
      localStorage.setItem("msme_auth_token", token);
      sessionStorage.removeItem("msme_auth_token");
    } else {
      sessionStorage.setItem("msme_auth_token", token);
      localStorage.removeItem("msme_auth_token");
    }
    if (apiToken) {
      persistApiToken(apiToken, rememberMe);
    } else {
      clearApiToken();
    }
  };

  // ── Login ──
  const login = async (idOrEmailOrPhone, password, role, rememberMe = false) => {
    await delay(1000);
    if (!idOrEmailOrPhone.trim() || !password) throw new Error("All fields are required.");

    const normalizedLogin = idOrEmailOrPhone.toLowerCase().trim();
    const apiEmail =
      role === "employee" && !normalizedLogin.includes("@")
        ? `${normalizedLogin}@idbi.co.in`
        : role === "admin" && !normalizedLogin.includes("@")
          ? "admin@idbi.co.in"
          : normalizedLogin;

    try {
      const auth = await api.login({ email: apiEmail, password });
      const apiToken = auth?.access_token;
      const apiUser = await api.me(apiToken);
      const localApplicants = JSON.parse(localStorage.getItem("msme_users") || "[]");
      const localEmployees = JSON.parse(localStorage.getItem("msme_employees") || "[]");
      const localAdmins = JSON.parse(localStorage.getItem("msme_admins") || "[]");
      const localFallback =
        localApplicants.find((u) => u.email?.toLowerCase() === apiUser.email?.toLowerCase()) ||
        localEmployees.find((u) => u.email?.toLowerCase() === apiUser.email?.toLowerCase()) ||
        localAdmins.find((u) => u.email?.toLowerCase() === apiUser.email?.toLowerCase()) ||
        {};
      const userData = mapApiUserToSession(apiUser, localFallback);

      if (role !== userData.role && !(role === "admin" && apiUser.role === "super_admin")) {
        throw new Error(`This account is registered as ${userData.role}, not ${role}.`);
      }

      if (userData.role === "applicant") {
        const updatedApplicant = mapApiUserToApplicant(apiUser, localFallback);
        const withoutDuplicate = localApplicants.filter(
          (u) => u.email?.toLowerCase() !== updatedApplicant.email?.toLowerCase()
        );
        localStorage.setItem("msme_users", JSON.stringify([...withoutDuplicate, updatedApplicant]));
      }

      _persist(userData, rememberMe, apiToken);
      await syncBackendTables(userData, apiToken);
      writeAuditLog(userData.id, userData.name, userData.role, "Logged in successfully via backend API");
      refreshLocalState();
      return userData;
    } catch (apiErr) {
      console.warn("Backend login failed, falling back to local demo auth", apiErr);
    }

    const hashedInputPw = await hashPassword(password);

    if (role === "applicant") {
      const users = JSON.parse(localStorage.getItem("msme_users") || "[]");
      const found = users.find(
        (u) =>
          u.email.toLowerCase() === idOrEmailOrPhone.toLowerCase().trim() ||
          u.mobileNumber === idOrEmailOrPhone.trim()
      );
      if (!found) throw new Error("No account found with this email or mobile number.");
      if (found.status === "Suspended") throw new Error("Account has been suspended. Please contact support.");
      if (found.password !== hashedInputPw) {
        writeAuditLog(found.id, found.name, "applicant", "Login failed (Incorrect password)", "Failure");
        throw new Error("Incorrect password. Please try again.");
      }
      if (!found.verified) {
        setAuthModal(`verify_applicant:${found.email}`);
        throw new Error("Email verification is pending. Please verify your email.");
      }

      const userData = {
        id: found.id,
        name: found.name,
        email: found.email,
        mobileNumber: found.mobileNumber,
        role: "applicant",
        kycCompleted: found.kycCompleted || false,
        linkedMsmeId: found.linkedMsmeId || null,
        kycDetails: found.kycDetails || null,
        color: found.color,
        initials: found.initials,
      };
      _persist(userData, rememberMe);
      writeAuditLog(found.id, found.name, "applicant", "Logged in successfully");
      return userData;
    } 
    
    if (role === "employee") {
      const emps = JSON.parse(localStorage.getItem("msme_employees") || "[]");
      const found = emps.find((e) => e.id.toLowerCase() === idOrEmailOrPhone.toLowerCase().trim());
      if (!found) throw new Error("Employee ID not found.");
      if (found.status === "Suspended") throw new Error("Employee account is suspended.");
      if (found.password !== hashedInputPw) {
        writeAuditLog(found.id, found.name, "employee", "Login failed (Incorrect password)", "Failure");
        throw new Error("Incorrect password. Please try again.");
      }

      const userData = {
        id: found.id,
        name: found.name,
        email: found.email,
        role: "employee",
        color: found.color,
        initials: found.initials,
      };
      _persist(userData, rememberMe);
      writeAuditLog(found.id, found.name, "employee", "Logged in successfully");
      return userData;
    } 
    
    if (role === "admin") {
      const admins = JSON.parse(localStorage.getItem("msme_admins") || "[]");
      const found = admins.find((a) => a.id.toLowerCase() === idOrEmailOrPhone.toLowerCase().trim());
      if (!found) throw new Error("Admin ID not found.");
      if (found.password !== hashedInputPw) {
        writeAuditLog(found.id, found.name, "admin", "Login failed (Incorrect password)", "Failure");
        throw new Error("Incorrect password. Please try again.");
      }

      const userData = {
        id: found.id,
        name: found.name,
        email: found.email,
        role: "admin",
        color: found.color,
        initials: found.initials,
      };
      _persist(userData, rememberMe);
      writeAuditLog(found.id, found.name, "admin", "Logged in successfully");
      return userData;
    }

    throw new Error("Invalid access role.");
  };

  // ── Applicant Sign Up (Name, Email, Mobile, Password) ──
  const signupApplicant = async (formData) => {
    await delay(1200);
    const { name, email, mobileNumber, password, confirmPassword } = formData;

    if (!name.trim() || !email.trim() || !mobileNumber.trim() || !password) {
      throw new Error("All fields are required.");
    }
    if (!isEmail(email)) throw new Error("Please enter a valid email address.");
    if (password.length < 6) throw new Error("Password must be at least 6 characters.");
    if (password !== confirmPassword) throw new Error("Passwords do not match.");

    const users = JSON.parse(localStorage.getItem("msme_users") || "[]");
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim())) {
      throw new Error("An account with this email already exists.");
    }

    const apiUser = await api.registerApplicant({
      email: email.toLowerCase().trim(),
      password,
      name: name.trim(),
    });

    const hashedPw = await hashPassword(password);
    const newUserId = apiUser?.id || `user_MSME-${100 + users.length + 1}`;

    const newUser = {
      id: newUserId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      mobileNumber: mobileNumber.trim(),
      password: hashedPw,
      verified: false, // Default is false, needs OTP code
      status: "Active",
      kycCompleted: false, // Starts as false!
      kycDetails: null,
      linkedMsmeId: null,
      color: AVATAR_COLORS[users.length % AVATAR_COLORS.length],
      initials: initials(name.trim()),
    };

    localStorage.setItem("msme_users", JSON.stringify([...users, newUser]));
    refreshLocalState();

    writeAuditLog(newUser.id, newUser.name, "applicant", "Registered account, OTP sent", "Pending Verification");

    // Automatically transition auth modal to OTP verification mode
    setAuthModal(`verify_applicant:${newUser.email}`);
    return newUser;
  };

  // ── OTP Verification ──
  const verifyApplicantOTP = async (email, otpCode) => {
    await delay(800);
    if (otpCode !== "123456") {
      throw new Error("Invalid verification code. Please try again (use 123456 for demo).");
    }

    const users = JSON.parse(localStorage.getItem("msme_users") || "[]");
    const updatedUsers = users.map((u) => {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        return { ...u, verified: true };
      }
      return u;
    });

    localStorage.setItem("msme_users", JSON.stringify(updatedUsers));
    refreshLocalState();

    const verifiedUser = updatedUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    writeAuditLog(verifiedUser.id, verifiedUser.name, "applicant", "Verified email successfully");
    
    // Redirect to applicant login
    setAuthModal("login_applicant");
    return verifiedUser;
  };

  // ── Complete KYC and Auto-Map in background ──
  const completeKYC = async (kycDetails, loanAmount, loanPurpose) => {
    await delay(1500);
    if (!user || user.role !== "applicant") throw new Error("Unauthorized.");

    const { aadhaar, pan, businessName, businessType, address, gstin } = kycDetails;
    if (!aadhaar || !pan || !businessName || !address || !gstin) {
      throw new Error("All KYC fields are required.");
    }
    if (aadhaar.replace(/\s/g, "").length !== 12) throw new Error("Aadhaar Number must be exactly 12 digits.");
    if (pan.length !== 10) throw new Error("PAN Number must be exactly 10 characters.");
    if (gstin.length !== 15) throw new Error("GSTIN must be exactly 15 characters.");

    const users = JSON.parse(localStorage.getItem("msme_users") || "[]");
    const userIdx = users.findIndex((u) => u.id === user.id);
    if (userIdx === -1) throw new Error("User account not found.");

    // Background Auto-Mapping: Match GSTIN, PAN or Business Name in background.
    // If no match found, default to MSME-009 (NTC Strong profile).
    const matchedSeed = SEED_MSMES.find(
      (m) =>
        m.gstin.toLowerCase() === gstin.toLowerCase().trim() ||
        m.pan.toLowerCase() === pan.toLowerCase().trim() ||
        m.name.toLowerCase().includes(businessName.toLowerCase().trim())
    );

    const linkedId = matchedSeed ? matchedSeed.id : "MSME-009";

    const apiToken = getStoredApiToken();
    let apiLoan = null;
    let apiScore = null;
    if (apiToken) {
      const profilePayload = {
        name: user.name,
        business_name: businessName,
        business_type: businessType,
        address,
        gstin: gstin.toUpperCase(),
        pan: pan.toUpperCase(),
        aadhaar: aadhaar.replace(/\s/g, ""),
        vintage: "1 Year",
        employees_count: 12,
      };
      await api.updateApplicantProfile(apiToken, profilePayload);
      await api.ingestFinancialData(apiToken, buildFinancialPayload(loanAmount));
      apiLoan = await api.applyLoan(apiToken, {
        amount: Number(loanAmount) || 1000000,
        purpose: loanPurpose || "Working Capital",
      });
      try {
        apiScore = await api.getApplicantScore(apiToken);
      } catch (scoreErr) {
        console.warn("Backend score is not ready yet", scoreErr);
      }
    }

    // Create New Loan Application
    const loans = JSON.parse(localStorage.getItem("msme_loan_applications") || "[]");
    const newLoan = {
      id: apiLoan?.id || `LN-${100 + loans.length + 1}`,
      msmeId: linkedId,
      amount: Number(apiLoan?.amount || loanAmount) || 1000000,
      purpose: apiLoan?.purpose || loanPurpose || "Working Capital",
      date: apiLoan?.submitted_at ? apiLoan.submitted_at.split("T")[0] : new Date().toISOString().split("T")[0],
      status: apiLoan?.status
        ? apiLoan.status
            .split("_")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ")
        : linkedId === "MSME-008" ? "Manual Review Required" : "Under Review",
      apiScore,
    };

    // Update applicant record in localStorage
    const updatedKYCDetails = {
      aadhaar,
      pan: pan.toUpperCase(),
      gstin: gstin.toUpperCase(),
      businessName,
      businessType,
      address,
    };

    users[userIdx].kycCompleted = true;
    users[userIdx].kycDetails = updatedKYCDetails;
    users[userIdx].linkedMsmeId = linkedId;

    localStorage.setItem("msme_users", JSON.stringify(users));
    localStorage.setItem("msme_loan_applications", JSON.stringify([...loans, newLoan]));

    // Update active user state
    const updatedUserSession = {
      ...user,
      kycCompleted: true,
      kycDetails: updatedKYCDetails,
      linkedMsmeId: linkedId,
    };
    setUser(updatedUserSession);

    // Update persistent session
    const isLocal = !!localStorage.getItem("msme_auth_token");
    const token = generateSessionToken(updatedUserSession);
    if (isLocal) {
      localStorage.setItem("msme_auth_token", token);
    } else {
      sessionStorage.setItem("msme_auth_token", token);
    }

    writeAuditLog(
      user.id,
      user.name,
      "applicant",
      `Completed KYC & submitted loan application ${newLoan.id} for ₹${newLoan.amount} (Background mapped to ${linkedId})`
    );
    refreshLocalState();
    return newLoan;
  };

  // ── Forgot Password / Reset ──
  const resetPassword = async (idOrEmail, role, newPassword) => {
    await delay(1000);
    if (!newPassword || newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }
    const hashedPw = await hashPassword(newPassword);

    if (role === "applicant") {
      const users = JSON.parse(localStorage.getItem("msme_users") || "[]");
      const idx = users.findIndex(
        (u) =>
          u.email.toLowerCase() === idOrEmail.toLowerCase().trim() ||
          u.mobileNumber === idOrEmail.trim()
      );
      if (idx === -1) throw new Error("Email address or mobile number not found.");
      users[idx].password = hashedPw;
      localStorage.setItem("msme_users", JSON.stringify(users));
      writeAuditLog(users[idx].id, users[idx].name, "applicant", "Reset password via OTP");
    } else if (role === "employee") {
      const emps = JSON.parse(localStorage.getItem("msme_employees") || "[]");
      const idx = emps.findIndex((e) => e.id.toLowerCase() === idOrEmail.toLowerCase().trim());
      if (idx === -1) throw new Error("Employee ID not found.");
      emps[idx].password = hashedPw;
      localStorage.setItem("msme_employees", JSON.stringify(emps));
      writeAuditLog(emps[idx].id, emps[idx].name, "employee", "Reset password via Official Email");
    } else {
      throw new Error("Cannot reset administrator passwords directly. Contact IT helpdesk.");
    }

    refreshLocalState();
  };

  // ── Logout ──
  const logout = () => {
    if (user) {
      writeAuditLog(user.id, user.name, user.role, "Logged out");
    }
    setUser(null);
    localStorage.removeItem("msme_auth_token");
    sessionStorage.removeItem("msme_auth_token");
    clearApiToken();
  };

  // ── Admin Employee Management ──
  const addEmployee = async (name, empId, password) => {
    if (!name.trim() || !empId.trim() || !password) throw new Error("All fields are required.");
    const emps = JSON.parse(localStorage.getItem("msme_employees") || "[]");
    if (emps.find((e) => e.id.toLowerCase() === empId.toLowerCase().trim())) {
      throw new Error("Employee ID already exists.");
    }
    const apiToken = getStoredApiToken();
    const apiEmployee = apiToken
      ? await api.createEmployee(apiToken, {
          email: `${empId.trim().toLowerCase()}@idbi.co.in`,
          password,
          name: name.trim(),
          employee_id_code: empId.trim().toUpperCase(),
        })
      : null;
    const hashedPw = await hashPassword(password);
    const newEmp = {
      id: apiEmployee?.profile?.employee_id_code || empId.trim().toUpperCase(),
      name: apiEmployee?.profile?.name || name.trim(),
      email: apiEmployee?.email || `${empId.trim().toLowerCase()}@idbi.co.in`,
      password: hashedPw,
      status: normalizeStatus(apiEmployee?.status),
      color: AVATAR_COLORS[emps.length % AVATAR_COLORS.length],
      initials: initials(name.trim()),
    };
    localStorage.setItem("msme_employees", JSON.stringify([...emps, newEmp]));
    refreshLocalState();
    if (user) {
      writeAuditLog(user.id, user.name, user.role, `Added bank employee account: ${newEmp.id}`);
    }
  };

  const toggleEmployeeStatus = (empId) => {
    const emps = JSON.parse(localStorage.getItem("msme_employees") || "[]");
    const updated = emps.map((e) => {
      if (e.id === empId) {
        const nextStatus = e.status === "Active" ? "Suspended" : "Active";
        if (user) {
          writeAuditLog(user.id, user.name, user.role, `${nextStatus} employee account: ${empId}`);
        }
        return { ...e, status: nextStatus };
      }
      return e;
    });
    localStorage.setItem("msme_employees", JSON.stringify(updated));
    refreshLocalState();
  };

  // ── Admin User Management ──
  const toggleApplicantStatus = (email) => {
    const users = JSON.parse(localStorage.getItem("msme_users") || "[]");
    const updated = users.map((u) => {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        const nextStatus = u.status === "Active" ? "Suspended" : "Active";
        if (user) {
          writeAuditLog(user.id, user.name, user.role, `${nextStatus} applicant account: ${u.email}`);
        }
        return { ...u, status: nextStatus };
      }
      return u;
    });
    localStorage.setItem("msme_users", JSON.stringify(updated));
    refreshLocalState();
  };

  const verifyApplicantManually = (email) => {
    const users = JSON.parse(localStorage.getItem("msme_users") || "[]");
    const updated = users.map((u) => {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        if (user) {
          writeAuditLog(user.id, user.name, user.role, `Manually verified applicant account: ${u.email}`);
        }
        return { ...u, verified: true };
      }
      return u;
    });
    localStorage.setItem("msme_users", JSON.stringify(updated));
    refreshLocalState();
  };

  // ── Admin Config Update ──
  const updateSystemConfig = (newWeights, sessionTimeout, maxAttempts) => {
    const current = JSON.parse(localStorage.getItem("msme_system_config") || "{}");
    const updated = {
      ...current,
      weights: newWeights || current.weights,
      sessionTimeoutMinutes: sessionTimeout || current.sessionTimeoutMinutes,
      maxLoginAttempts: maxAttempts || current.maxLoginAttempts,
    };
    localStorage.setItem("msme_system_config", JSON.stringify(updated));
    refreshLocalState();
    if (user) {
      writeAuditLog(user.id, user.name, user.role, "Updated system configuration parameters");
    }
  };

  const updateApplicantProfile = async (ownerName, phone) => {
    if (!user || user.role !== "applicant") return;
    const apiToken = getStoredApiToken();
    if (apiToken && user.kycDetails) {
      await api.updateApplicantProfile(apiToken, {
        name: ownerName || user.name,
        business_name: user.kycDetails.businessName || "",
        business_type: user.kycDetails.businessType || "",
        address: user.kycDetails.address || "",
        gstin: user.kycDetails.gstin || "",
        pan: user.kycDetails.pan || "",
        aadhaar: user.kycDetails.aadhaar || "",
        vintage: "1 Year",
        employees_count: 12,
      });
    }
    const users = JSON.parse(localStorage.getItem("msme_users") || "[]");
    const updated = users.map((u) => {
      if (u.id === user.id) {
        return {
          ...u,
          name: ownerName || u.name,
          mobileNumber: phone || u.mobileNumber,
        };
      }
      return u;
    });
    localStorage.setItem("msme_users", JSON.stringify(updated));
    refreshLocalState();
    setUser((curr) => ({
      ...curr,
      name: ownerName || curr.name,
      mobileNumber: phone || curr.mobileNumber,
    }));
    writeAuditLog(user.id, user.name, user.role, "Updated contact profile details");
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
        signupApplicant,
        verifyApplicantOTP,
        completeKYC,
        resetPassword,
        logout,
        // Tables
        applicants,
        employees,
        loanApplications,
        systemConfig,
        auditLogs,
        // Actions
        addEmployee,
        toggleEmployeeStatus,
        toggleApplicantStatus,
        verifyApplicantManually,
        updateSystemConfig,
        updateApplicantProfile,
        refreshLocalState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
