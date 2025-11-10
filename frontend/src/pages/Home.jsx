import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitEnroll } from "../api";

export default function Home() {
  const [mode, setMode] = useState("hub"); // "hub" | "enroll"
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    program: "",
    year_level: "",
    contact: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await submitEnroll(form);
      alert(`Submitted — request id: ${res.data.id}`);
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        program: "",
        year_level: "",
        contact: "",
        address: "",
      });
      setMode("hub");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.detail || "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  // ---------- HUB (welcome page) ----------
  if (mode === "hub") {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
        <div className="card shadow-sm p-4 text-center" style={{ maxWidth: "420px" }}>
          <h1 className="fw-bold mb-2">CSTA Portal</h1>
          <p className="text-muted mb-4">Welcome — choose an action to continue</p>

          <div className="d-grid gap-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate("/login")}
            >
              <i className="bi bi-box-arrow-in-right me-2"></i>
              Login
            </button>

            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => setMode("enroll")}
            >
              <i className="bi bi-pencil-square me-2"></i>
              Enroll Student
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- ENROLLMENT FORM ----------
  return (
    <div className="container py-5">
      <div className="card shadow-sm mx-auto" style={{ maxWidth: "720px" }}>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h2 className="h4 fw-bold mb-0">CSTA Enrollment</h2>
              <p className="text-muted mb-0">Fill out the form below to apply</p>
            </div>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setMode("hub")}>
              <i className="bi bi-arrow-left me-1"></i> Back
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">First name</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Last name</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Program</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.program}
                  onChange={(e) => setForm({ ...form, program: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Year Level</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.year_level}
                  onChange={(e) => setForm({ ...form, year_level: e.target.value })}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Contact</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
            </div>

            <div className="text-end mt-4">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Submitting…" : "Submit Enrollment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
