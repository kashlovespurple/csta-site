import React from "react";
import AppNavbar from "./AppNavbar";
import AppSidebar from "./AppSidebar";

export default function Layout({ children, showSidebar = false }) {
  return (
    <div className="d-flex flex-column vh-100">
      {/* Top Navbar */}
      <AppNavbar />

      <div className="container-fluid flex-grow-1">
        <div className="row h-100">
          {/* Sidebar (optional) */}
          {showSidebar && (
            <div className="col-md-3 col-lg-2 bg-light border-end p-0">
              <AppSidebar />
            </div>
          )}

          {/* Main content area */}
          <main
            className={`${
              showSidebar ? "col-md-9 col-lg-10" : "col-12"
            } py-4 px-4`}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
