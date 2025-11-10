import React, { useEffect, useState } from "react";
import { getStudentMe } from "../api";
import { useNavigate } from "react-router-dom";

/* ---------- Helper: initials (safe) ---------- */
function initials(name, fallback) {
  const s = ((name ?? fallback) || "").toString().trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  const first = parts[0].charAt(0) || "";
  const last = parts[parts.length - 1].charAt(0) || "";
  return (first + last).toUpperCase();
}

export default function StudentDashboard() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("profile"); // 'profile' | 'courses' | 'grades'
  const nav = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      const res = await getStudentMe();
      setMe(res.data ?? null);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.detail || "Failed to load profile");
      setMe(null);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.clear();
    nav("/");
  }

  const user = me?.user ?? {};
  const student = me?.student ?? {};
  const sampleCourses = student.courses ?? [];
  const sampleGrades = student.grades ?? [];

  /* ---------- Render sections ---------- */
  const renderProfile = () => (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <div className="d-flex align-items-center mb-3">
          <div
            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
            style={{ width: "64px", height: "64px", fontSize: "1.5rem" }}
          >
            {initials(`${user.first_name ?? ""} ${user.last_name ?? ""}`, user.username)}
          </div>
          <div>
            <h5 className="mb-0">
              {user.first_name ? `${user.first_name} ${user.last_name ?? ""}` : user.username ?? "User"}
            </h5>
            <small className="text-muted">{user.email ?? "-"}</small>
          </div>
        </div>

        <div className="row g-3 small">
          <div className="col-md-6">
            <strong>Username:</strong> {user.username ?? "-"}
          </div>
          <div className="col-md-6">
            <strong>Student #:</strong> {student.student_number ?? (student.id ? `#${student.id}` : "-")}
          </div>
          <div className="col-md-6">
            <strong>Program:</strong> {student.program_name ?? student.program_id ?? "-"}
          </div>
          <div className="col-md-6">
            <strong>Year Level:</strong> {student.year_level ?? "-"}
          </div>
          <div className="col-md-6">
            <strong>Contact:</strong> {student.contact ?? "-"}
          </div>
          <div className="col-md-6">
            <strong>Status:</strong>{" "}
            <span className="badge bg-success">{student.status ?? "active"}</span>
          </div>
        </div>

        <div className="mt-3 d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={loadProfile}>
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
          <button className="btn btn-outline-primary btn-sm" onClick={() => nav("/change-password")}>
            <i className="bi bi-key me-1"></i> Change Password
          </button>
        </div>
      </div>
    </div>
  );

  const renderCourses = () => (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <h5 className="card-title mb-3">My Courses / Enrollments</h5>
        {sampleCourses.length === 0 ? (
          <p className="text-muted">No courses/enrollments found.</p>
        ) : (
          <ul className="list-group">
            {sampleCourses.map((c) => (
              <li key={c.id} className="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-semibold">
                    {c.code} — {c.title}
                  </div>
                  <small className="text-muted">Units: {c.units ?? "-"}</small>
                </div>
                <span
                  className={`badge ${
                    c.status === "enrolled" ? "bg-success" : "bg-secondary"
                  }`}
                >
                  {c.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  const renderGrades = () => (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <h5 className="card-title mb-3">Grades</h5>
        {sampleGrades.length === 0 ? (
          <p className="text-muted">No grades available yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Term</th>
                  <th>Course</th>
                  <th>Grade</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sampleGrades.map((g, i) => (
                  <tr key={i}>
                    <td>{g.term}</td>
                    <td>{g.course}</td>
                    <td>{g.grade}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary">
                        <i className="bi bi-printer me-1"></i> Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-3 d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-file-earmark-spreadsheet me-1"></i> Export CSV
          </button>
          <button className="btn btn-primary btn-sm">
            <i className="bi bi-file-earmark-pdf me-1"></i> Print PDF
          </button>
        </div>
      </div>
    </div>
  );

  /* ---------- Layout ---------- */
  return (
    <div className="container-fluid py-4">
      <div className="row">
        {/* Sidebar */}
        <aside className="col-md-3 col-lg-2 mb-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="text-primary mb-3">
                <i className="bi bi-person-circle me-2"></i>
                Student Menu
              </h6>

              <div className="nav flex-column nav-pills gap-1">
                <button
                  className={`nav-link text-start ${tab === "profile" ? "active" : ""}`}
                  onClick={() => setTab("profile")}
                >
                  <i className="bi bi-person-fill me-2"></i> My Profile
                </button>
                <button
                  className={`nav-link text-start ${tab === "courses" ? "active" : ""}`}
                  onClick={() => setTab("courses")}
                >
                  <i className="bi bi-journal-bookmark me-2"></i> My Courses
                </button>
                <button
                  className={`nav-link text-start ${tab === "grades" ? "active" : ""}`}
                  onClick={() => setTab("grades")}
                >
                  <i className="bi bi-bar-chart-line me-2"></i> Grades
                </button>
              </div>

              <hr />

              <button
                onClick={loadProfile}
                className="btn btn-outline-secondary w-100 mb-2"
              >
                <i className="bi bi-arrow-repeat me-1"></i> Refresh Profile
              </button>
              <button
                onClick={logout}
                className="btn btn-danger w-100"
              >
                <i className="bi bi-box-arrow-right me-1"></i> Logout
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="col-md-9 col-lg-10">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h3 className="fw-bold mb-0">Student Dashboard</h3>
              <small className="text-muted">Welcome to your student portal</small>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger py-2" role="alert">
              {error}
            </div>
          )}

          {loading ? (
            <div className="d-flex align-items-center">
              <div
                className="spinner-border text-primary me-2"
                role="status"
              ></div>
              Loading profile...
            </div>
          ) : (
            <>
              {tab === "profile" && renderProfile()}
              {tab === "courses" && renderCourses()}
              {tab === "grades" && renderGrades()}

              {/* Debug JSON */}
              <div className="card shadow-sm mt-3">
                <div className="card-body">
                  <h6 className="fw-semibold mb-2">Debug Data</h6>
                  <pre className="bg-light p-2 small border rounded">
                    {JSON.stringify(me, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
