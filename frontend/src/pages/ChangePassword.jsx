import React, { useState } from "react";
import { changePassword } from "../api";
import { useNavigate } from "react-router-dom";

export default function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    if (newPw.length < 16) {
      alert("New password must be at least 16 characters.");
      return;
    }
    setLoading(true);
    try {
      await changePassword(current, newPw);
      alert("Password changed. Please login again.");
      localStorage.removeItem("access_token");
      nav("/login");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.detail || "Change password failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <div className="card shadow-sm p-4" style={{ width: "100%", maxWidth: "420px" }}>
        <h2 className="fw-bold mb-3 text-center">Change Password</h2>
        <form onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label">Current password (if not temp)</label>
            <input
              type="password"
              className="form-control"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">New password (min 16 chars)</label>
            <input
              type="password"
              className="form-control"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
            />
          </div>
          <div className="text-end">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Saving…
                </>
              ) : (
                <>
                  <i className="bi bi-key me-2"></i> Change Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
