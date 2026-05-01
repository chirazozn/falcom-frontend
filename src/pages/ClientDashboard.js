import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { useLang } from "../lang";
import { getSuggestions, likeSuggestion, getMe, changePassword } from "../api";
import ProductsClient from "./ProductsClient";
import StatsClient from "./Statsclient";
import "./ClientDashboard.css";

function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };
  return { toast, show };
}

// ── Simple link page ─────────────────────────────────────────────────────────
function LinkPage({ icon, title, description, link, buttonLabel, notSetMsg }) {
  return (
    <div className="link-page-wrap">
      <div className="link-page-card">
        <div className="link-page-icon">{icon}</div>
        <h2 className="link-page-title">{title}</h2>
        <p className="link-page-desc">{description}</p>
        {link ? (
          <a href={link} target="_blank" rel="noreferrer" className="btn btn-primary link-page-btn">
            {buttonLabel} →
          </a>
        ) : (
          <div className="link-page-empty">
            <span>⏳</span>
            <p>{notSetMsg}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Just Credit page ─────────────────────────────────────────────────────────
function JustCreditPage({ user, t }) {
  const [showPass, setShowPass] = useState(false);
  const [step,     setStep]     = useState(0);
  const [copiedMsg,setCopiedMsg]= useState("");

  const hasCredentials = user?.credit_email && user?.credit_password;

  const copyText = (text, msg) => {
    navigator.clipboard.writeText(text);
    setCopiedMsg(msg); setTimeout(()=>setCopiedMsg(""),2500);
  };

  const handleStep1 = () => { navigator.clipboard.writeText(user.credit_email); setStep(1); };
  const handleStep2 = () => { navigator.clipboard.writeText(user.credit_password); setStep(2); };
  const handleOpen  = () => { setStep(3); window.open("https://app.just.credit/login","_blank"); };

  return (
    <div className="link-page-wrap">
      <div className="link-page-card credit-card">
        <div className="link-page-icon">💳</div>
        <h2 className="link-page-title">Just Credit</h2>
        <p className="link-page-desc">{t.justCreditDesc}</p>

        {hasCredentials ? (
          <>
            <div className="jc-steps">
              <div className={`jc-step ${step>=1?"jc-done":""} ${step===0?"jc-active":""}`}>
                <div className="jc-step-num">{step>=1?"✓":"1"}</div>
                <div className="jc-step-body">
                  <span className="jc-step-title">{t.step1}</span>
                  <span className="jc-step-sub">{user.credit_email}</span>
                </div>
                <button className="jc-btn" onClick={handleStep1}>{step>=1?"✓ "+t.copyEmail:t.copyEmail}</button>
              </div>

              <div className={`jc-step ${step>=2?"jc-done":""} ${step===1?"jc-active":""}`}>
                <div className="jc-step-num">{step>=2?"✓":"2"}</div>
                <div className="jc-step-body">
                  <span className="jc-step-title">{t.step2}</span>
                  <span className="jc-step-sub">
                    {showPass ? user.credit_password : "••••••••••"}
                    <button className="cred-eye" onClick={()=>setShowPass(p=>!p)} style={{marginLeft:6}}>
                      {showPass?"🙈":"👁"}
                    </button>
                  </span>
                </div>
                <button className="jc-btn" onClick={handleStep2} disabled={step<1}>
                  {step>=2?"✓ "+t.copyPassword:t.copyPassword}
                </button>
              </div>

              <div className={`jc-step ${step>=3?"jc-done":""} ${step===2?"jc-active":""}`}>
                <div className="jc-step-num">{step>=3?"✓":"3"}</div>
                <div className="jc-step-body">
                  <span className="jc-step-title">{t.step3}</span>
                  <span className="jc-step-sub">{t.step3sub}</span>
                </div>
                <button className={`jc-btn ${step>=2?"jc-btn-green":""}`} onClick={handleOpen} disabled={step<2}>
                  {step>=3?"✓ "+t.openSite:t.openSite}
                </button>
              </div>
            </div>

            {step>0 && <button className="jc-reset" onClick={()=>setStep(0)}>{t.startOver}</button>}

            <div className="jc-quick">
              <span>{t.quickCopy}</span>
              <button className="cred-copy" onClick={()=>copyText(user.credit_email,"Email copied!")}>📧 Email</button>
              <button className="cred-copy" onClick={()=>copyText(user.credit_password,"Password copied!")}>🔒 Password</button>
              {copiedMsg && <span className="jc-copied-msg">✓ {copiedMsg}</span>}
            </div>
          </>
        ) : (
          <div className="link-page-empty">
            <span>⏳</span>
            <p>{t.notConfigured}</p>
          </div>
        )}
      </div>
    </div>
  );
}


// ── Profile Tab with Change Password ─────────────────────────────────────────
function ProfileTab({ user, t, showToast }) {
  const [showForm,     setShowForm]     = useState(false);
  const [currentPass,  setCurrentPass]  = useState("");
  const [newPass,      setNewPass]      = useState("");
  const [confirmPass,  setConfirmPass]  = useState("");
  const [showCurrent,  setShowCurrent]  = useState(false);
  const [showNew,      setShowNew]      = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState(false);

  // Password strength
  const getStrength = (p) => {
    if (!p) return { pct: 0, color: "", label: "" };
    let score = 0;
    if (p.length >= 6)  score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { pct: 20,  color: "var(--danger)",    label: "Weak" };
    if (score <= 2) return { pct: 45,  color: "var(--warn)",      label: "Fair" };
    if (score <= 3) return { pct: 70,  color: "var(--blue-main)", label: "Good" };
    return              { pct: 100, color: "var(--green-main)",  label: "Strong" };
  };

  const strength = getStrength(newPass);

  const handleSubmit = async () => {
    setError("");
    if (!currentPass || !newPass || !confirmPass) { setError("All fields are required."); return; }
    if (newPass !== confirmPass) { setError("New passwords do not match."); return; }
    if (newPass.length < 6) { setError("Password must be at least 6 characters."); return; }
    setSaving(true);
    try {
      await changePassword(currentPass, newPass);
      setSuccess(true);
      setCurrentPass(""); setNewPass(""); setConfirmPass("");
      showToast("Password changed successfully!");
      setTimeout(() => { setSuccess(false); setShowForm(false); }, 2500);
    } catch(e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false); setError("");
    setCurrentPass(""); setNewPass(""); setConfirmPass("");
    setSuccess(false);
  };

  return (
    <>
      <div className="sec-header"><h2>{t.myProfile}</h2></div>
      <div className="profile-card">
        <div className="profile-head">
          <div className="profile-av">{user?.avatar||"U"}</div>
          <div className="profile-meta">
            <h3>{user?.name}</h3>
            <p className="profile-email">{user?.email}</p>
            <span className="badge badge-green">{t.projectOwner}</span>
          </div>
        </div>
        <div className="profile-rows">
          {[
            [t.fullName,    user?.name],
            [t.email,       user?.email],
            [t.project,     user?.project_name||t.notAssigned],
            [t.memberSince, user?.joinDate?.slice(0,10)||"—"],
            [t.status,      <span className="badge badge-green">{t.active}</span>],
          ].map(([label,val])=>(
            <div key={label} className="profile-row">
              <span className="pr-label">{label}</span>
              <span className="pr-val">{val}</span>
            </div>
          ))}
        </div>

        {/* Change Password Button */}
        <div style={{padding:"0 28px 16px"}}>
          <button
            className="btn btn-outline change-pass-btn"
            onClick={()=>{ setShowForm(f=>!f); setError(""); setSuccess(false); }}
          >
            {showForm ? "✕ Cancel" : "🔒 Change Password"}
          </button>
        </div>

        {/* Change Password Form */}
        {showForm && (
          <div className="change-pass-box">
            <div className="change-pass-header">🔒 Change Your Password</div>
            <div className="change-pass-form">

              {success ? (
                <div className="alert alert-success" style={{textAlign:"center"}}>
                  ✅ Password changed successfully!
                </div>
              ) : (
                <>
                  {/* Current password */}
                  <div className="form-group">
                    <label>Current Password</label>
                    <div className="pass-input-wrap">
                      <input
                        type={showCurrent?"text":"password"}
                        className="form-input"
                        placeholder="Enter current password"
                        value={currentPass}
                        onChange={e=>setCurrentPass(e.target.value)}
                      />
                      <button type="button" className="pass-input-toggle"
                        onClick={()=>setShowCurrent(p=>!p)}>
                        {showCurrent?"🙈":"👁"}
                      </button>
                    </div>
                  </div>

                  {/* New password */}
                  <div className="form-group">
                    <label>New Password</label>
                    <div className="pass-input-wrap">
                      <input
                        type={showNew?"text":"password"}
                        className="form-input"
                        placeholder="Min. 6 characters"
                        value={newPass}
                        onChange={e=>setNewPass(e.target.value)}
                      />
                      <button type="button" className="pass-input-toggle"
                        onClick={()=>setShowNew(p=>!p)}>
                        {showNew?"🙈":"👁"}
                      </button>
                    </div>
                    {newPass && (
                      <>
                        <div className="pass-strength">
                          <div className="pass-strength-bar"
                            style={{width:`${strength.pct}%`, background:strength.color}}/>
                        </div>
                        <span className="pass-strength-text" style={{color:strength.color}}>
                          {strength.label}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <div className="pass-input-wrap">
                      <input
                        type={showConfirm?"text":"password"}
                        className="form-input"
                        placeholder="Repeat new password"
                        value={confirmPass}
                        onChange={e=>setConfirmPass(e.target.value)}
                        style={{borderColor: confirmPass && confirmPass!==newPass ? "var(--danger)" : ""}}
                      />
                      <button type="button" className="pass-input-toggle"
                        onClick={()=>setShowConfirm(p=>!p)}>
                        {showConfirm?"🙈":"👁"}
                      </button>
                    </div>
                    {confirmPass && confirmPass!==newPass && (
                      <span style={{fontSize:".75rem",color:"var(--danger)",fontWeight:600}}>
                        Passwords do not match
                      </span>
                    )}
                  </div>

                  {error && <div className="alert alert-error">{error}</div>}

                  <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                    <button className="btn btn-outline btn-sm" onClick={handleCancel}>Cancel</button>
                    <button className="btn btn-green btn-sm" onClick={handleSubmit} disabled={saving}>
                      {saving ? <span className="spinner"/> : "Update Password ✓"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="profile-note">
          <span>ℹ️</span>
          <span>{t.profileNote}</span>
        </div>
      </div>
    </>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function ClientDashboard() {
  const { currentUser, logout } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const navigate = useNavigate();
  const { toast, show: showToast } = useToast();

  const [tab,         setTab]        = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [userData,    setUserData]    = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  const NAV = [
    { id:"overview",    icon:"🏠", label: t.overview      },
    
    { id:"products",    icon:"📦", label: t.products      },
    { id:"orders",      icon:"📦", label: t.orders        },
    { id:"website",     icon:"🌐", label: t.website       },
    { id:"justcredit",  icon:"💳", label: t.justcredit    },
    { id:"suggestions", icon:"💡", label: t.suggestions   },
    { id:"stats",       icon:"📊", label: lang==="fr" ? "Statistiques" : "Statistics" },
    { id:"profile",     icon:"👤", label: t.profile       },
  ];

  const handleLogout = () => { logout(); navigate("/login"); };

  const loadData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [sugs, me] = await Promise.all([getSuggestions(), getMe()]);
      setSuggestions(sugs); setUserData(me);
    } catch(e){ showToast(e.message,"error"); }
    finally { setLoadingData(false); }
  },[]);

  useEffect(()=>{ loadData(); },[loadData]);

  const handleLike = async (id) => {
    try {
      const r = await likeSuggestion(id);
      setSuggestions(prev=>prev.map(s=>s.id===id?{...s,likes:r.likes,liked_by_me:r.liked?1:0}:s));
    } catch(e){ showToast(e.message,"error"); }
  };

  const user = userData || currentUser;

  return (
    <div className="dash-root">
      <aside className={`dash-sidebar ${sidebarOpen?"open":""}`}>
        <div className="sidebar-logo">
          <img src="/LOGOFALCOM.png" alt="Falcom"/>
          <span>FALCOM</span>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(n=>(
            <button key={n.id} className={`nav-item ${tab===n.id?"active active-client":""}`}
              onClick={()=>{setTab(n.id);setSidebarOpen(false);}}>
              <span className="nav-icon">{n.icon}</span><span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar avatar-green">{user?.avatar||"U"}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name}</span>
              <span className="sidebar-user-role">{t.projectOwner}</span>
            </div>
          </div>
          <button className="btn btn-outline btn-sm btn-full logout-btn" onClick={handleLogout}>⏏ {t.logout}</button>
        </div>
      </aside>

      {sidebarOpen && <div className="sidebar-overlay" onClick={()=>setSidebarOpen(false)}/>}

      <main className="dash-main">
        <header className="dash-topbar">
          <button className="menu-toggle" onClick={()=>setSidebarOpen(true)}>☰</button>
          <span className="topbar-title">{NAV.find(n=>n.id===tab)?.label}</span>
          <div className="topbar-right">
            {/* Language toggle */}
            <button className="lang-toggle" onClick={toggleLang}>
              {lang==="en" ? "🇫🇷 FR" : "🇬🇧 EN"}
            </button>
            <div className="avatar avatar-green avatar-sm">{user?.avatar||"U"}</div>
            <span className="topbar-name">{user?.name}</span>
          </div>
        </header>

        <div className="dash-content">
          {loadingData ? (
            <div className="page-spinner"><div className="big-spin"/></div>
          ) : (
            <div className="tab-panel">

              {/* ═══ OVERVIEW ═══ */}
              {tab==="overview" && (
                <>
                  <div className="welcome-banner">
                    <div className="welcome-left">
                      <div className="welcome-av">{user?.avatar||"U"}</div>
                      <div className="welcome-text">
                        <h2>{t.welcomeBack}, {user?.name?.split(" ")[0]} 👋</h2>
                        <p>{t.workspaceSummary}</p>
                      </div>
                    </div>
                    <span className="badge badge-green">● {t.active}</span>
                  </div>

                  <div className="client-stats">
                    <div className="client-stat">
                      <div className="cs-ico cs-ico-blue">📋</div>
                      <div><div className="cs-val">{user?.project_name||t.myProducts}</div><div className="cs-label">{t.currentProject}</div></div>
                    </div>
                    <div className="client-stat">
                      <div className="cs-ico cs-ico-green">💡</div>
                      <div><div className="cs-val">{suggestions.length}</div><div className="cs-label">{t.suggestions}</div></div>
                    </div>
                    <div className="client-stat">
                      <div className="cs-ico cs-ico-blue">📅</div>
                      <div><div className="cs-val">{user?.joinDate?.slice(0,10)||"—"}</div><div className="cs-label">{t.memberSince}</div></div>
                    </div>
                  </div>

                  <p className="sec-title" style={{fontWeight:700,fontSize:"1.05rem",marginBottom:16}}>{t.quickAccess}</p>
                  <div className="quick-access-grid">
                    {[
                      { id:"products",   icon:"📦", label:t.products,   sub: t.myProducts },
                      { id:"orders",     icon:"📦", label:t.orders,     sub: user?.orders_link    ? t.goToOrders   : t.notSetYet.slice(0,30)+"..." },
                      { id:"website",    icon:"🌐", label:t.website,    sub: user?.website_link   ? t.visitWebsite : t.notSetYet.slice(0,30)+"..." },
                      { id:"justcredit", icon:"💳", label:t.justcredit, sub: user?.credit_email   ? t.justCreditDesc.slice(0,30)+"..." : t.notConfigured.slice(0,30)+"..." },
                    ].map(q=>(
                      <div key={q.id} className="quick-card" onClick={()=>setTab(q.id)}>
                        <div className="quick-icon">{q.icon}</div>
                        <div className="quick-info">
                          <span className="quick-title">{q.label}</span>
                          <span className="quick-sub">{q.sub}</span>
                        </div>
                        <span className="quick-arrow">→</span>
                      </div>
                    ))}
                  </div>

                  {suggestions.length > 0 && (
                    <>
                      <p className="sec-title" style={{fontWeight:700,fontSize:"1.05rem",margin:"24px 0 14px"}}>{t.latestSuggestions}</p>
                      <div className="sug-feed">
                        {suggestions.slice(0,3).map(s=>(
                          <div key={s.id} className="sug-feed-row">
                            <span className="sug-feed-ico">💡</span>
                            <div className="sug-feed-info">
                              <span className="sug-feed-title">{s.title}</span>
                              <span className="sug-feed-date">{s.date}</span>
                            </div>
                            <span className={`badge ${s.target_type==="all"?"badge-blue":"badge-green"}`}>
                              {s.target_type==="all"?t.general:t.personal}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}

              {tab==="stats"      && <StatsClient />}
              {tab==="products"    && <ProductsClient />}

              {tab==="orders"      && <LinkPage icon="📦" title={t.myOrders}  description={t.ordersDesc}  link={user?.orders_link}  buttonLabel={t.goToOrders}   notSetMsg={t.notSetYet}/>}
              {tab==="website"     && <LinkPage icon="🌐" title={t.myWebsite} description={t.websiteDesc} link={user?.website_link} buttonLabel={t.visitWebsite} notSetMsg={t.notSetYet}/>}
              {tab==="justcredit"  && <JustCreditPage user={user} t={t}/>}

              {/* ═══ SUGGESTIONS ═══ */}
              {tab==="suggestions" && (
                <>
                  <div className="sec-header">
                    <h2>{t.suggestionsFrom}</h2>
                    <span className="badge badge-blue">{suggestions.length} total</span>
                  </div>
                  {suggestions.length===0 ? (
                    <div className="empty-state"><span className="empty-icon">💡</span><p>{t.noSuggestions}</p></div>
                  ) : (
                    <div className="cards-grid">
                      {suggestions.map(s=>(
                        <div key={s.id} className="sug-card-client">
                          <div className="sug-card-top">
                            <span className={`badge ${s.target_type==="all"?"badge-blue":"badge-green"}`}>
                              {s.target_type==="all"?`📢 ${t.general}`:`🎯 ${t.personal}`}
                            </span>
                            <span className="sug-card-date">{s.date}</span>
                          </div>
                          <h4 className="sug-card-title">{s.title}</h4>
                          <p className="sug-card-body">{s.body}</p>
                          <div className="sug-card-foot">
                            <button className={`like-btn ${s.liked_by_me?"liked":""}`} onClick={()=>handleLike(s.id)}>
                              {s.liked_by_me?"❤️":"🤍"} <span>{s.likes}</span>
                            </button>
                            <span className="sug-from">— FALCOM Admin</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ═══ PROFILE ═══ */}
              {tab==="profile" && (
                <ProfileTab user={user} t={t} showToast={showToast} />
              )}

            </div>
          )}
        </div>
      </main>

      {toast && (
        <div className={`toast ${toast.type==="error"?"toast-error":"toast-success"}`}>
          {toast.type==="error"?"⚠️":"✅"} {toast.msg}
        </div>
      )}
    </div>
  );
}