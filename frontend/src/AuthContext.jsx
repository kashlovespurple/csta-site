// frontend/src/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import client, { setAuthHeader } from "./api"; // default export is axios client and setAuthHeader exported

const AuthContext = createContext({
  token: null,
  user: null,
  setToken: () => {},
  setUser: () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [token, setTokenState] = useState(() => localStorage.getItem("token"));
  const [user, setUserState] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // sync axios header immediately so child components have header at first render
  if (token) setAuthHeader(token);

  // keep axios header in sync if token changes (login/logout)
  useEffect(() => {
    setAuthHeader(token);
  }, [token]);

  // persist token & user
  function setToken(newToken) {
    if (newToken) {
      localStorage.setItem("token", newToken);
      setTokenState(newToken);
    } else {
      localStorage.removeItem("token");
      setTokenState(null);
    }
  }

  function setUser(userObj) {
    if (userObj) {
      localStorage.setItem("user", JSON.stringify(userObj));
      setUserState(userObj);
    } else {
      localStorage.removeItem("user");
      setUserState(null);
    }
  }

  function logout(redirect = "/login") {
    setToken(null);
    setUser(null);
    setAuthHeader(null);
    toast.success("Logged out");
    navigate(redirect);
  }

  const value = {
    token,
    user,
    setToken,
    setUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
