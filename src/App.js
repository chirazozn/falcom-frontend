/* eslint-disable no-unused-vars */
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { getToken, clearToken } from "./api";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import AdminDashboard from "./pages/AdminDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import { LangProvider } from "./lang";
import "./App.css";

// ─── Auth Context ─────────────────────────────────────────────────────────────
export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.exp * 1000 > Date.now()) {
          setCurrentUser(payload);
        } else {
          clearToken();
        }
      } catch {
        clearToken();
      }
    }
    setLoading(false);
  }, []);

  const loginSuccess = (user) => setCurrentUser(user);
  const logout = () => { clearToken(); setCurrentUser(null); };

  return (
    <AuthContext.Provider value={{ currentUser, loginSuccess, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Route Guards ─────────────────────────────────────────────────────────────
function RequireAuth({ role, children }) {
  const { currentUser, loading } = useAuth();
  if (loading) return <AppLoader />;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (role && currentUser.role !== role) {
    return <Navigate to={currentUser.role === "admin" ? "/admin" : "/dashboard"} replace />;
  }
  return children;
}

function RedirectIfLoggedIn({ children }) {
  const { currentUser, loading } = useAuth();
  if (loading) return <AppLoader />;
  if (currentUser) {
    return <Navigate to={currentUser.role === "admin" ? "/admin" : "/dashboard"} replace />;
  }
  return children;
}

function AppLoader() {
  return (
    <div className="app-loading">
      <div className="app-loading-logo">
        <img src="/LOGOFALCOM.png" alt="Falcom" />
        <span>FALCOM</span>
      </div>
      <div className="app-loading-spinner" />
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<RedirectIfLoggedIn><Login /></RedirectIfLoggedIn>} />
      <Route path="/forgot-password" element={<RedirectIfLoggedIn><ForgotPassword /></RedirectIfLoggedIn>} />
      <Route path="/admin" element={<RequireAuth role="admin"><AdminDashboard /></RequireAuth>} />
      <Route path="/dashboard" element={<RequireAuth role="projectowner"><ClientDashboard /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <Router>
          <div className="app-root">
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
    </LangProvider>
  );
}