import React from "react";
import { Link } from "react-router-dom";

export default function AppSidebar() {
  return (
    <div className="d-flex flex-column vh-100 p-3 border-end bg-white">
      <h5 className="fw-semibold mb-3 text-primary">
        <i className="bi bi-person-circle me-2"></i> Menu
      </h5>

      <ul className="nav nav-pills flex-column mb-auto">
        <li className="nav-item">
          <Link to="/student/dashboard" className="nav-link text-dark">
            <i className="bi bi-person-fill me-2"></i> My Profile
          </Link>
        </li>
        <li>
          <Link to="/student/courses" className="nav-link text-dark">
            <i className="bi bi-book me-2"></i> Courses
          </Link>
        </li>
        <li>
          <Link to="/student/grades" className="nav-link text-dark">
            <i className="bi bi-bar-chart-fill me-2"></i> Grades
          </Link>
        </li>
        <li>
          <Link to="/change-password" className="nav-link text-dark">
            <i className="bi bi-key-fill me-2"></i> Change Password
          </Link>
        </li>
      </ul>
    </div>
  );
}
