// PrivateRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children, requiredRole = null }) {
  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" replace />;

  if (requiredRole && role !== requiredRole) {
    // Role mismatch — redirect to their dashboard if possible
    if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (role === "student") return <Navigate to="/student/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}
