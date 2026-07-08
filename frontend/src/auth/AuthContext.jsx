import { createContext, useContext, useState, useEffect, useCallback } from "react";

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

const SEED_EMPLOYEES = [
  { id: "EMP-001", name: "Amit Sharma", email: "amit.sharma@idbi.co.in", status: "Active" },
  { id: "EMP-002", name: "Neha Verma", email: "neha.verma@idbi.co.in", status: "Active" },
];

// Seed Databases in localStorage if empty
const seedDatabase = async () => {
  const hashedDefaultPw = await hashPassword("password123");

  // 1. Applicants (MSME Users)
  if (!localStorage.getItem("msme_users")) {
    const defaultUsers = SEED_MSMES.map((m, idx) => ({
      id: `user_${m.id}`,
      name: m.owner,
      email: m.email,
      mobileNumber: m.phone,
      password: hashedDefaultPw,
      verified: true,
      status: "Active",
      kycCompleted: true, // Seed profiles start with completed KYC
      linkedMsmeId: m.id,
      color: AVATAR_COLORS[idx % AVATAR_COLORS.length],
      initials: initials(m.owner),
      kycDetails: {
        businessName: m.name,
        businessType: "Pvt Ltd",
        address: `${m.location}, India`,
        gstin: m.gstin,
        pan: m.pan,
        aadhaar: m.aadhaar,
      },
    }));
    localStorage.setItem("msme_users", JSON.stringify(defaultUsers));
  }

  // 2. Bank Employees
  if (!localStorage.getItem("msme_employees")) {
    const defaultEmployees = SEED_EMPLOYEES.map((e, idx) => ({
      id: e.id,
      name: e.name,
      email: e.email,
      password: hashedDefaultPw,
      status: e.status,
      color: AVATAR_COLORS[(idx + 3) % AVATAR_COLORS.length],
      initials: initials(e.name),
    }));
    localStorage.setItem("msme_employees", JSON.stringify(defaultEmployees));
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
    const defaultLoans = [
      { id: "LN-001", msmeId: "MSME-001", amount: 2500000, purpose: "Working Capital", date: "2026-06-15", status: "Approved" },
      { id: "LN-002", msmeId: "MSME-002", amount: 1800000, purpose: "Equipment Purchase", date: "2026-06-20", status: "Approved" },
      { id: "LN-003", msmeId: "MSME-003", amount: 1200000, purpose: "Inventory Restocking", date: "2026-06-22", status: "Declined" },
      { id: "LN-004", msmeId: "MSME-004", amount: 800000, purpose: "Machinery Repair", date: "2026-06-25", status: "Declined" },
      { id: "LN-005", msmeId: "MSME-005", amount: 3000000, purpose: "Pre-Season Inventory", date: "2026-06-28", status: "Approved with Conditions" },
      { id: "LN-006", msmeId: "MSME-006", amount: 4000000, purpose: "Capacity Expansion", date: "2026-06-30", status: "Approved with Conditions" },
      { id: "LN-007", msmeId: "MSME-007", amount: 5000000, purpose: "Equipment Hire & Materials", date: "2026-07-02", status: "Under Review" },
      { id: "LN-008", msmeId: "MSME-008", amount: 8000000, purpose: "Expansion", date: "2026-07-03", status: "Manual Review Required" },
      { id: "LN-009", msmeId: "MSME-009", amount: 1500000, purpose: "Export Order Financing", date: "2026-07-05", status: "Approved" },
    ];
    localStorage.setItem("msme_loan_applications", JSON.stringify(defaultLoans));
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

  // Initialize DB and Restore session on mount
  useEffect(() => {
    const init = async () => {
      await seedDatabase();
      refreshLocalState();

      try {
        const storedToken = localStorage.getItem("msme_auth_token") || sessionStorage.getItem("msme_auth_token");
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
  }, [refreshLocalState]);

  const openAuth = useCallback((mode = "portal") => setAuthModal(mode), []);
  const closeAuth = useCallback(() => setAuthModal(null), []);

  const _persist = (userData, rememberMe) => {
    setUser(userData);
    const token = generateSessionToken(userData);
    if (rememberMe) {
      localStorage.setItem("msme_auth_token", token);
    } else {
      sessionStorage.setItem("msme_auth_token", token);
    }
  };

  // ── Login ──
  const login = async (idOrEmailOrPhone, password, role, rememberMe = false) => {
    await delay(1000);
    if (!idOrEmailOrPhone.trim() || !password) throw new Error("All fields are required.");

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

    const hashedPw = await hashPassword(password);
    const newUserId = `user_MSME-${100 + users.length + 1}`;

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

    // Create New Loan Application
    const loans = JSON.parse(localStorage.getItem("msme_loan_applications") || "[]");
    const newLoan = {
      id: `LN-${100 + loans.length + 1}`,
      msmeId: linkedId,
      amount: Number(loanAmount) || 1000000,
      purpose: loanPurpose || "Working Capital",
      date: new Date().toISOString().split("T")[0],
      status: linkedId === "MSME-008" ? "Manual Review Required" : "Under Review",
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
  };

  // ── Admin Employee Management ──
  const addEmployee = async (name, empId, password) => {
    if (!name.trim() || !empId.trim() || !password) throw new Error("All fields are required.");
    const emps = JSON.parse(localStorage.getItem("msme_employees") || "[]");
    if (emps.find((e) => e.id.toLowerCase() === empId.toLowerCase().trim())) {
      throw new Error("Employee ID already exists.");
    }
    const hashedPw = await hashPassword(password);
    const newEmp = {
      id: empId.trim().toUpperCase(),
      name: name.trim(),
      email: `${empId.trim().toLowerCase()}@idbi.co.in`,
      password: hashedPw,
      status: "Active",
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

  const updateApplicantProfile = (ownerName, phone) => {
    if (!user || user.role !== "applicant") return;
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
