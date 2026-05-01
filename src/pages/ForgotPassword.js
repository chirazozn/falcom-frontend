import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword, verifyCode, resetPassword } from "../api";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep]                   = useState(1);
  const [email, setEmail]                 = useState("");
  const [code, setCode]                   = useState("");
  const [newPass, setNewPass]             = useState("");
  const [confirmPass, setConfirmPass]     = useState("");
  const [error, setError]                 = useState("");
  const [loading, setLoading]             = useState(false);

  const run = async (fn) => {
    setError(""); setLoading(true);
    try { await fn(); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const STEPS = ["Email","Verify","New Password"];

  return (
    <div className="fp-root">
      <div className="fp-card">
        {/* Logo */}
        <div className="fp-logo">
          <img src="/LOGOFALCOM.png" alt="Falcom" />
        </div>

        {/* Step indicator */}
        <div className="fp-steps">
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <div className={`fp-dot ${step >= i+1 ? "fp-dot-active" : ""} ${step > i+1 ? "fp-dot-done" : ""}`}>
                {step > i+1 ? "✓" : i+1}
              </div>
              {i < STEPS.length-1 && <div className={`fp-line ${step > i+1 ? "fp-line-done" : ""}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1 — Email */}
        {step === 1 && (
          <div className="fp-body">
            <h2>Forgot Password?</h2>
            <p>Enter your account email and we'll send you a 6-digit verification code.</p>
            <form className="fp-form" onSubmit={e => { e.preventDefault(); run(async () => { await forgotPassword(email); setStep(2); }); }}>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" className="form-input" placeholder="you@falcom.dz"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? <span className="spinner"/> : "Send Code →"}
              </button>
              <button type="button" className="fp-back" onClick={() => navigate("/login")}>← Back to Login</button>
            </form>
          </div>
        )}

        {/* Step 2 — Code */}
        {step === 2 && (
          <div className="fp-body">
            <h2>Check Your Email</h2>
            <p>We sent a 6-digit code to <strong>{email}</strong>. It's valid for 15 minutes.</p>
            <form className="fp-form" onSubmit={e => { e.preventDefault(); run(async () => { await verifyCode(email, code); setStep(3); }); }}>
              <div className="form-group">
                <label>Verification Code</label>
                <input type="text" className="form-input fp-code-input" placeholder="000000"
                  maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g,""))} required />
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? <span className="spinner"/> : "Verify Code →"}
              </button>
              <button type="button" className="fp-back" onClick={() => { setStep(1); setError(""); setCode(""); }}>
                ← Request New Code
              </button>
            </form>
          </div>
        )}

        {/* Step 3 — New password */}
        {step === 3 && (
          <div className="fp-body">
            <h2>Create New Password</h2>
            <p>Identity verified! Set a new secure password for your account.</p>
            <form className="fp-form" onSubmit={e => {
              e.preventDefault();
              run(async () => {
                if (newPass.length < 6) throw new Error("Password must be at least 6 characters.");
                if (newPass !== confirmPass) throw new Error("Passwords do not match.");
                await resetPassword(email, code, newPass);
                setStep(4);
              });
            }}>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" className="form-input" placeholder="Min. 6 characters"
                  value={newPass} onChange={e => setNewPass(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input type="password" className="form-input" placeholder="Repeat new password"
                  value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required />
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <button type="submit" className="btn btn-green btn-full" disabled={loading}>
                {loading ? <span className="spinner"/> : "Update Password ✓"}
              </button>
            </form>
          </div>
        )}

        {/* Step 4 — Success */}
        {step === 4 && (
          <div className="fp-body fp-success">
            <div className="fp-success-icon">✓</div>
            <h2>Password Updated!</h2>
            <p>Your password has been changed successfully. Sign in with your new credentials.</p>
            <button className="btn btn-primary btn-full" onClick={() => navigate("/login")}>
              Go to Login →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}