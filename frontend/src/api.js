// api.js
import axios from "axios";

const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE,
  timeout: 10000,
});

// Attach token automatically if present
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("access_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Simple helpers
export async function login(username, password) {
  const body = new URLSearchParams();
  body.append("username", username);
  body.append("password", password);
  return api.post("/api/auth/login", body);
}

export async function changePassword(currentPassword, newPassword) {
  return api.post("/api/auth/change_password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
}

export async function submitEnroll(form) {
  return api.post("/api/enroll", form);
}

export async function getEnrollRequests() {
  return api.get("/api/admin/enroll_requests?status=pending");
}

export async function acceptRequest(id) {
  return api.post(`/api/admin/enroll_requests/${id}/accept`);
}

export async function rejectRequest(id) {
  return api.post(`/api/admin/enroll_requests/${id}/reject`);
}

export async function getStudentMe() {
  return api.get("/api/student/me");
}

export default api;
