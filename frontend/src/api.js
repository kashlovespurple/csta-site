// frontend/src/api.js
const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function enroll(data) {
  const res = await fetch(`${API}/api/enroll/online`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error (${res.status}): ${text}`);
  }
  return res.json(); // { status, id, created_at }
}

export async function health() {
  const res = await fetch(`${API}/api/health`);
  return res.json();
}
