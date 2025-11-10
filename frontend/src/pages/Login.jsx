import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const nav = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login(username.trim(), password);
      const data = res.data;

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("username", username.trim());

      if (data.temp_password) nav("/change-password");
      else if (data.role === "admin") nav("/admin/dashboard");
      else if (data.role === "student") nav("/student/dashboard");
      else nav("/");
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.detail || "Login failed — check your credentials";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <div className="card shadow-sm p-4" style={{ width: "100%", maxWidth: "420px" }}>
        <div className="text-center mb-3">
          <i className="bi bi-lock-fill text-primary" style={{ fontSize: "2rem" }}></i>
          <h2 className="fw-semibold mt-2">Sign in</h2>
          <p className="text-muted small">Admin & Student login</p>
        </div>

        {error && (
          <div className="alert alert-danger py-2 small" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3 small">
            <Link to="/" className="text-decoration-none">
              <i className="bi bi-house-door me-1"></i> Back to Home
            </Link>
            <Link to="/" onClick={(e) => { e.preventDefault(); nav("/"); }} className="text-decoration-none">
              <i className="bi bi-pencil-square me-1"></i> Enroll Student
            </Link>
          </div>

          <div className="d-grid">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Signing in…
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-2"></i> Sign in
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
