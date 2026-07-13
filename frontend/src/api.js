export const API_BASE_URL = window.location.hostname === "localhost" 
  ? "http://localhost:8000" 
  : "https://idbi-backend-0am7.onrender.com";

const getJson = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export async function apiRequest(path, { method = "GET", body, token } = {}) {
  const headers = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await getJson(response);

  if (!response.ok) {
    const detail =
      data && typeof data === "object"
        ? data.detail || data.message || data.error
        : data;
    throw new Error(detail || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  registerApplicant: (payload) =>
    apiRequest("/auth/register", { method: "POST", body: payload }),
  login: (payload) =>
    apiRequest("/auth/login", { method: "POST", body: payload }),
  me: (token) => apiRequest("/auth/me", { token }),
  updateApplicantProfile: (token, payload) =>
    apiRequest("/applicant/profile", { method: "PUT", token, body: payload }),
  ingestFinancialData: (token, payload) =>
    apiRequest("/applicant/financial-data", { method: "POST", token, body: payload }),
  applyLoan: (token, payload) =>
    apiRequest("/applicant/apply-loan", { method: "POST", token, body: payload }),
  getApplicantScore: (token) => apiRequest("/applicant/score", { token }),
  createEmployee: (token, payload) =>
    apiRequest("/admin/create-employee", { method: "POST", token, body: payload }),
  getEmployeeApplications: (token) =>
    apiRequest("/employee/applications", { token }),
  approveApplication: (token, id, payload) =>
    apiRequest(`/employee/application/${id}/approve`, { method: "POST", token, body: payload }),
};
