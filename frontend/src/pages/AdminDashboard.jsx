import React, { useEffect, useState } from "react";
import { getEnrollRequests } from "../api";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview"); // 'overview' | 'requests' | 'students' | 'settings'
  const nav = useNavigate();

  useEffect(() => {
    if (tab === "requests" || tab === "overview") {
      load();
    }
  }, [tab]);

  async function load() {
    setLoading(true);
    try {
      const res = await getEnrollRequests();
      setRequests(res.data || []);
    } catch (err) {
      console.error(err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.clear();
    nav("/");
  }

  /* ---------- Render main content ---------- */
  const renderOverview = () => (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <h5 className="card-title mb-3">
          <i className="bi bi-speedometer2 me-2"></i> Overview
        </h5>
        <p className="text-muted">Welcome, Admin! Here’s a quick overview of the system.</p>

        {loading ? (
          <div className="d-flex align-items-center">
            <div className="spinner-border spinner-border-sm text-primary me-2"></div>
            Loading summary...
          </div>
        ) : requests.length > 0 ? (
          <ul className="list-group">
            {requests.slice(0, 5).map((r) => (
              <li
                key={r.id}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <div>
                  <strong>{r.first_name} {r.last_name}</strong>
                  <div className="text-muted small">
                    {r.program} — Year {r.year_level}
                  </div>
                </div>
                <span className="badge bg-warning text-dark">Pending</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">No recent enrollment requests.</p>
        )}
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <h5 className="card-title mb-3">
          <i className="bi bi-list-task me-2"></i> Enrollment Requests
        </h5>

        {loading ? (
          <div className="d-flex align-items-center">
            <div className="spinner-border spinner-border-sm text-primary me-2"></div>
            Loading requests...
          </div>
        ) : requests.length === 0 ? (
          <p className="text-muted">No enrollment requests found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Program</th>
                  <th>Year</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i + 1}</td>
                    <td>{r.first_name} {r.last_name}</td>
                    <td>{r.email}</td>
                    <td>{r.program}</td>
                    <td>{r.year_level}</td>
                    <td>
                      <span className="badge bg-warning text-dark">
                        {r.status ?? "pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderStudents = () => (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <h5 className="card-title">
          <i className="bi bi-people-fill me-2"></i> Students (coming soon)
        </h5>
        <p className="text-muted">This section will show registered students.</p>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <h5 className="card-title">
          <i className="bi bi-gear-fill me-2"></i> Settings
        </h5>
        <p className="text-muted">Future admin settings can be added here.</p>
      </div>
    </div>
  );

  /* ---------- Layout ---------- */
  // (Inside your StudentDashboard component — replace return(...) with below)
return (
  <div className="container-fluid py-4">
    <div className="row">
      {/* Sidebar */}
      <aside className="col-md-3 col-lg-2 mb-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="d-flex align-items-center mb-3">
              <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
                   style={{ width:64, height:64, fontSize:24 }}>
                {initials(`${user.first_name ?? ""} ${user.last_name ?? ""}`, user.username)}
              </div>
              <div>
                <div className="fw-semibold">{user.first_name ?? user.username ?? "User"}</div>
                <small className="text-muted">{user.email}</small>
              </div>
            </div>

            <nav className="nav flex-column nav-pills">
              <button className={`nav-link ${tab==='profile' ? 'active' : ''}`} onClick={()=>setTab('profile')}>
                <i className="bi bi-person-fill me-2"></i> My Profile
              </button>
              <button className={`nav-link ${tab==='courses' ? 'active' : ''}`} onClick={()=>setTab('courses')}>
                <i className="bi bi-book me-2"></i> My Courses
              </button>
              <button className={`nav-link ${tab==='grades' ? 'active' : ''}`} onClick={()=>setTab('grades')}>
                <i className="bi bi-bar-chart-line me-2"></i> Grades
              </button>
            </nav>

            <hr />
            <div className="d-grid gap-2">
              <button className="btn btn-outline-secondary btn-sm" onClick={loadProfile}>
                <i className="bi bi-arrow-repeat me-1"></i> Refresh Profile
              </button>
              <button className="btn btn-outline-primary btn-sm" onClick={()=>nav('/change-password')}>
                <i className="bi bi-key me-1"></i> Change Password
              </button>
              <button className="btn btn-danger btn-sm" onClick={logout}>
                <i className="bi bi-box-arrow-right me-1"></i> Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="col-md-9 col-lg-10">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h3 className="fw-bold mb-0">Student Dashboard</h3>
            <small className="text-muted">Welcome to your student portal</small>
          </div>
          <div className="btn-group">
            <button className="btn btn-outline-secondary btn-sm">Export JSON</button>
            <button className="btn btn-primary btn-sm">Print PDF</button>
          </div>
        </div>

        {/* Render content per tab */}
        {tab === 'profile' && (
          <div className="card shadow-sm mb-4 p-3">
            {/* Profile details (left/right) */}
            {/* ...use your previous ProfileCard content here... */}
          </div>
        )}

        {tab === 'courses' && (
          <div className="card shadow-sm mb-4 p-3">
            <h5 className="mb-3">Current Courses</h5>
            {/* table or list of courses */}
          </div>
        )}

        {tab === 'grades' && (
          <div className="card shadow-sm mb-4 p-3">
            <h5 className="mb-3">Grades</h5>
            {/* term selector + table */}
          </div>
        )}

        {/* Optional debug during development */}
        <div className="card shadow-sm mt-3">
          <div className="card-body">
            <h6 className="fw-semibold">Debug Data</h6>
            <pre className="bg-light p-2 small">{JSON.stringify(me, null, 2)}</pre>
          </div>
        </div>
      </main>
    </div>
  </div>
);

}
