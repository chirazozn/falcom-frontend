import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { login as apiLogin, setToken } from "../api";
import "./Login.css";

export default function Login() {
  const { loginSuccess } = useAuth();
  const navigate = useNavigate();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      const data = await apiLogin(email.trim().toLowerCase(), password);
      setToken(data.token);
      loginSuccess(data.user);
      navigate(data.user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      {/* ── Left brand panel ── */}
      <div className="login-brand">
        <div className="brand-orb o1" /><div className="brand-orb o2" /><div className="brand-orb o3" />
        <div className="brand-inner">
          <div className="brand-logo-box">
            <img src="/LOGOFALCOM.png" alt="Falcom" />
          </div>
          <p className="brand-tagline">Project Management Platform</p>
          <div className="brand-divider" />
          <div className="brand-features">
            {["Manage your projects efficiently","Track progress in real time","Stay connected with your team"].map((f,i)=>(
              <div className="brand-feat" key={i}><span className="feat-dot"/>{f}</div>
            ))}
          </div>
        </div>
        <div className="brand-wave" />
      </div>

      {/* ── Right form panel ── */}
      <div className="login-panel">
        <div className="login-card">
          <div className="mobile-logo">
            <img src="/LOGOFALCOM.png" alt="Falcom" />
          </div>

          <h2 className="login-heading">Welcome back</h2>
          <p className="login-sub">Sign in to your workspace</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrap">
                <span className="input-ico">✉</span>
                <input
                  type="email" className="form-input"
                  placeholder="you@falcom.dz"
                  value={email} onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-wrap">
                <span className="input-ico">🔒</span>
                <input
                  type={showPass ? "text" : "password"} className="form-input"
                  placeholder="Enter your password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button type="button" className="pass-eye" onClick={() => setShowPass(p => !p)}>
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button type="submit" className="btn btn-primary btn-full login-btn" disabled={loading}>
              {loading
                ? <span className="spinner" />
                : <><span>Sign In</span><span className="btn-arrow"> →</span></>
              }
            </button>
          </form>

          <div className="login-foot">
            <button className="forgot-link" onClick={() => navigate("/forgot-password")}>
              Forgot your password?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}