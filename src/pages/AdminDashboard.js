import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import {
  getUsers, createUser, updateUser, toggleUserStatus, deleteUser,
  getSuggestions, createSuggestion, deleteSuggestion,
} from "../api";
import "./AdminDashboard.css";
import ProductsAdmin from "./ProductsAdmin";
import StatsAdmin from "./Statsadmin";

const NAV = [
  { id:"overview",    icon:"🏠", label:"Overview"       },
  { id:"stats",       icon:"📈", label:"Statistics"      },
  { id:"products",    icon:"📦", label:"Products & Sales" },
  { id:"users",       icon:"👥", label:"Project Owners" },
  { id:"suggestions", icon:"💡", label:"Suggestions"    },
];

function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3200); };
  return { toast, show };
}

const EMPTY_FORM = {
  name:"", email:"", password:"", project_name:"", status:"active",
  orders_link:"", website_link:"",
  credit_email:"", credit_password:"",
};

export default function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { toast, show: showToast } = useToast();

  const [tab,          setTab]         = useState("overview");
  const [sidebarOpen,  setSidebarOpen] = useState(false);
  const [users,        setUsers]       = useState([]);
  const [suggestions,  setSuggestions] = useState([]);
  const [loadingData,  setLoadingData] = useState(true);
  const [saving,       setSaving]      = useState(false);
  const [showCreditPass, setShowCreditPass] = useState(false);

  const [userModal,    setUserModal]    = useState(false);
  const [sugModal,     setSugModal]     = useState(false);
  const [delUserModal, setDelUserModal] = useState(null);

  const [uForm,  setUForm]  = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [sForm,  setSForm]  = useState({ title:"", body:"", target_type:"all", target_user:"" });

  const loadAll = useCallback(async () => {
    setLoadingData(true);
    try {
      const [u,s] = await Promise.all([getUsers(), getSuggestions()]);
      setUsers(u); setSuggestions(s);
    } catch(e){ showToast(e.message,"error"); }
    finally { setLoadingData(false); }
  },[]);

  useEffect(()=>{ loadAll(); },[loadAll]);

  const owners = users.filter(u=>u.role==="projectowner");
  const active = owners.filter(u=>u.status==="active").length;

  const handleLogout = () => { logout(); navigate("/login"); };

  const openAdd  = () => { setUForm(EMPTY_FORM); setEditId(null); setShowCreditPass(false); setUserModal(true); };
  const openEdit = (u) => {
    setUForm({
      ...u, password:"",
      orders_link:    u.orders_link    || "",
      website_link:   u.website_link   || "",
      credit_email:   u.credit_email   || "",
      credit_password: u.credit_password || "",
    });
    setEditId(u.id); setShowCreditPass(false); setUserModal(true);
  };

  const saveUser = async () => {
    if(!uForm.name||!uForm.email){ showToast("Name and email required.","error"); return; }
    if(!editId && !uForm.password){ showToast("Password is required.","error"); return; }
    setSaving(true);
    try {
      if(editId){
        const updated = await updateUser(editId, uForm);
        setUsers(prev=>prev.map(u=>u.id===editId?updated:u));
        showToast("Project Owner updated.");
      } else {
        const newU = await createUser(uForm);
        setUsers(prev=>[newU,...prev]);
        showToast("Project Owner created.");
      }
      setUserModal(false);
    } catch(e){ showToast(e.message,"error"); }
    finally { setSaving(false); }
  };

  const handleToggle = async (id) => {
    try {
      const r = await toggleUserStatus(id);
      setUsers(prev=>prev.map(u=>u.id===id?{...u,status:r.status}:u));
      showToast("Status updated.");
    } catch(e){ showToast(e.message,"error"); }
  };

  const handleDelete = async () => {
    if(!delUserModal) return;
    try {
      await deleteUser(delUserModal.id);
      setUsers(prev=>prev.filter(u=>u.id!==delUserModal.id));
      setDelUserModal(null);
      showToast("Project Owner removed.","error");
    } catch(e){ showToast(e.message,"error"); }
  };

  const saveSug = async () => {
    if(!sForm.title||!sForm.body){ showToast("Title and message required.","error"); return; }
    setSaving(true);
    try {
      const s = await createSuggestion({
        ...sForm,
        target_user: sForm.target_type==="user" ? Number(sForm.target_user) : undefined,
      });
      setSuggestions(prev=>[s,...prev]);
      setSForm({title:"",body:"",target_type:"all",target_user:""});
      setSugModal(false);
      showToast("Suggestion posted!");
    } catch(e){ showToast(e.message,"error"); }
    finally { setSaving(false); }
  };

  const deleteSug = async (id) => {
    try {
      await deleteSuggestion(id);
      setSuggestions(prev=>prev.filter(s=>s.id!==id));
      showToast("Suggestion deleted.","error");
    } catch(e){ showToast(e.message,"error"); }
  };

  const f = (key, val) => setUForm(p=>({...p,[key]:val}));

  return (
    <div className="dash-root">
      <aside className={`dash-sidebar ${sidebarOpen?"open":""}`}>
        <div className="sidebar-logo">
          <img src="/LOGOFALCOM.png" alt="Falcom"/>
          <span>FALCOM</span>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(n=>(
            <button key={n.id} className={`nav-item ${tab===n.id?"active active-admin":""}`}
              onClick={()=>{setTab(n.id);setSidebarOpen(false);}}>
              <span className="nav-icon">{n.icon}</span><span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar avatar-blue">{currentUser?.avatar||"A"}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{currentUser?.name}</span>
              <span className="sidebar-user-role">Administrator</span>
            </div>
          </div>
          <button className="btn btn-outline btn-sm btn-full logout-btn" onClick={handleLogout}>⏏ Logout</button>
        </div>
      </aside>

      {sidebarOpen && <div className="sidebar-overlay" onClick={()=>setSidebarOpen(false)}/>}

      <main className="dash-main">
        <header className="dash-topbar">
          <button className="menu-toggle" onClick={()=>setSidebarOpen(true)}>☰</button>
          <span className="topbar-title">{NAV.find(n=>n.id===tab)?.label}</span>
          <div className="topbar-right">
            <span className="topbar-date">{new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}</span>
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
                  <div className="sec-header" style={{marginBottom:22}}>
                    <div><h2>Dashboard Overview</h2><p>Welcome back, {currentUser?.name}</p></div>
                  </div>
                  <div className="stats-grid">
                    <div className="stat-card c-blue"><div className="stat-icon">👥</div><div className="stat-value">{owners.length}</div><div className="stat-label">Project Owners</div></div>
                    <div className="stat-card c-green"><div className="stat-icon">✅</div><div className="stat-value">{active}</div><div className="stat-label">Active</div></div>
                    <div className="stat-card c-warn"><div className="stat-icon">⛔</div><div className="stat-value">{owners.length-active}</div><div className="stat-label">Suspended</div></div>
                    <div className="stat-card c-dark"><div className="stat-icon">💡</div><div className="stat-value">{suggestions.length}</div><div className="stat-label">Suggestions</div></div>
                  </div>
                  <p className="sec-title">Recent Project Owners</p>
                  <div className="recent-list">
                    {owners.slice(0,5).map(u=>(
                      <div key={u.id} className="recent-row">
                        <div className={`avatar ${u.status==="active"?"avatar-blue":"avatar-grey"}`}>{u.avatar}</div>
                        <div className="recent-row-info">
                          <span className="recent-row-name">{u.name}</span>
                          <span className="recent-row-email">{u.email}</span>
                        </div>
                        <span className={`badge ${u.status==="active"?"badge-green":"badge-red"}`}>{u.status}</span>
                      </div>
                    ))}
                    {owners.length===0 && <div className="empty-state"><span className="empty-icon">👥</span><p>No project owners yet.</p></div>}
                  </div>
                </>
              )}

              {/* ═══ USERS ═══ */}
              {tab==="users" && (
                <>
                  <div className="sec-header">
                    <h2>Project Owners</h2>
                    <button className="btn btn-primary" onClick={openAdd}>+ Add Owner</button>
                  </div>
                  {owners.length===0 ? (
                    <div className="empty-state"><span className="empty-icon">👥</span><p>No project owners yet.</p><button className="btn btn-primary" style={{marginTop:8}} onClick={openAdd}>Add First Owner</button></div>
                  ) : (
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead><tr>
                          <th>Owner</th><th>Email</th><th>Project</th>
                          <th>Orders</th><th>Website</th><th>Just Credit</th>
                          <th>Status</th><th>Actions</th>
                        </tr></thead>
                        <tbody>
                          {owners.map(u=>(
                            <tr key={u.id}>
                              <td><div className="cell-user"><div className={`avatar avatar-sm ${u.status==="active"?"avatar-blue":"avatar-grey"}`}>{u.avatar}</div>{u.name}</div></td>
                              <td className="cell-muted">{u.email}</td>
                              <td>{u.project_name||"—"}</td>
                              <td>{u.orders_link ? <a href={u.orders_link} target="_blank" rel="noreferrer" className="link-pill">🔗 View</a> : <span className="cell-muted">—</span>}</td>
                              <td>{u.website_link ? <a href={u.website_link} target="_blank" rel="noreferrer" className="link-pill">🌐 View</a> : <span className="cell-muted">—</span>}</td>
                              <td>{u.credit_email ? <span className="badge badge-green">✓ Set</span> : <span className="cell-muted">—</span>}</td>
                              <td><span className={`badge ${u.status==="active"?"badge-green":"badge-red"}`}>{u.status}</span></td>
                              <td>
                                <div className="action-btns">
                                  <button className="btn btn-outline btn-sm" onClick={()=>openEdit(u)}>Edit</button>
                                  <button className={`btn btn-sm ${u.status==="active"?"btn-warn":"btn-green"}`} onClick={()=>handleToggle(u.id)}>
                                    {u.status==="active"?"Suspend":"Activate"}
                                  </button>
                                  <button className="btn btn-danger btn-sm" onClick={()=>setDelUserModal(u)}>Delete</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* ═══ SUGGESTIONS ═══ */}
              {tab==="suggestions" && (
                <>
                  <div className="sec-header">
                    <h2>Product Suggestions</h2>
                    <button className="btn btn-green" onClick={()=>setSugModal(true)}>+ Post Suggestion</button>
                  </div>
                  {suggestions.length===0 ? (
                    <div className="empty-state"><span className="empty-icon">💡</span><p>No suggestions posted yet.</p><button className="btn btn-green" style={{marginTop:8}} onClick={()=>setSugModal(true)}>Post First Suggestion</button></div>
                  ) : (
                    <div className="cards-grid">
                      {suggestions.map(s=>(
                        <div key={s.id} className="card">
                          <div className="sug-card-head">
                            <div className="sug-icon">💡</div>
                            <div className="sug-meta">
                              <span className="badge badge-blue">{s.target_type==="all"?"All Owners":s.target_user_name||`Owner #${s.target_user}`}</span>
                              <span className="sug-date">{s.date}</span>
                            </div>
                          </div>
                          <h4 className="sug-title">{s.title}</h4>
                          <p className="sug-body-text">{s.body}</p>
                          <div className="sug-foot">
                            <span className="sug-likes">❤️ {s.likes}</span>
                            <button className="btn btn-danger btn-sm" onClick={()=>deleteSug(s.id)}>Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {tab==="stats" && (
                <div className="tab-panel">
                  <div className="sec-header" style={{marginBottom:22}}><div><h2>Statistics</h2><p>Platform overview with charts</p></div></div>
                  <StatsAdmin />
                </div>
              )}

              {tab==="products" && (
                <div style={{width:"100%"}}>
                  <ProductsAdmin />
                </div>
              )}

              

            </div>
          )}
        </div>
      </main>

      {/* ══ Modal: Add / Edit User ══ */}
      {userModal && (
        <div className="modal-overlay" onClick={()=>setUserModal(false)}>
          <div className="modal modal-wide" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editId?"Edit Project Owner":"Add Project Owner"}</span>
              <button className="modal-close" onClick={()=>setUserModal(false)}>✕</button>
            </div>
            <div className="modal-form">

              {/* ── Account info ── */}
              <div className="modal-section-label">👤 Account Info</div>
              <div className="form-grid">
                <div className="form-group"><label>Full Name</label><input className="form-input" value={uForm.name} onChange={e=>f("name",e.target.value)} placeholder="John Doe"/></div>
                <div className="form-group"><label>Email</label><input className="form-input" type="email" value={uForm.email} onChange={e=>f("email",e.target.value)} placeholder="john@falcom.dz"/></div>
                <div className="form-group"><label>{editId?"New Password (blank = keep)":"Password *"}</label><input className="form-input" type="password" value={uForm.password} onChange={e=>f("password",e.target.value)} placeholder="Min. 6 chars"/></div>
                <div className="form-group"><label>Project Name</label><input className="form-input" value={uForm.project_name} onChange={e=>f("project_name",e.target.value)} placeholder="E.g. E-Commerce App"/></div>
                <div className="form-group"><label>Status</label>
                  <select className="form-input" value={uForm.status} onChange={e=>f("status",e.target.value)}>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* ── Links ── */}
              <div className="modal-section-label">🔗 Client Links</div>
              <div className="form-grid">
                <div className="form-group span-2"><label>📦 Orders Link</label><input className="form-input" value={uForm.orders_link} onChange={e=>f("orders_link",e.target.value)} placeholder="https://orders.example.com"/></div>
                <div className="form-group span-2"><label>🌐 Website Link</label><input className="form-input" value={uForm.website_link} onChange={e=>f("website_link",e.target.value)} placeholder="https://www.clientwebsite.com"/></div>
              </div>

              {/* ── Just Credit ── */}
              <div className="modal-section-label">💳 Just Credit Credentials</div>
              <div className="credit-section">
                <div className="form-grid">
                  <div className="form-group span-2">
                    <label>Just Credit Email</label>
                    <input className="form-input" type="email" value={uForm.credit_email} onChange={e=>f("credit_email",e.target.value)} placeholder="client@justcredit.com"/>
                  </div>
                  <div className="form-group span-2">
                    <label>Just Credit Password</label>
                    <div style={{position:"relative",display:"flex",alignItems:"center"}}>
                      <input
                        className="form-input"
                        type={showCreditPass?"text":"password"}
                        value={uForm.credit_password}
                        onChange={e=>f("credit_password",e.target.value)}
                        placeholder="Just Credit password"
                        style={{paddingRight:44}}
                      />
                      <button type="button" onClick={()=>setShowCreditPass(p=>!p)}
                        style={{position:"absolute",right:12,background:"none",border:"none",cursor:"pointer",fontSize:"0.9rem"}}>
                        {showCreditPass?"🙈":"👁"}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="credit-note">
                  <span>ℹ️</span>
                  <span>These credentials are stored securely and shown only to this client on their dashboard to auto-fill the Just Credit login.</span>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn btn-outline" onClick={()=>setUserModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={saveUser} disabled={saving}>{saving?<span className="spinner"/>:editId?"Save Changes":"Create Account"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ Suggestion modal ══ */}
      {sugModal && (
        <div className="modal-overlay" onClick={()=>setSugModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Post Suggestion</span>
              <button className="modal-close" onClick={()=>setSugModal(false)}>✕</button>
            </div>
            <div className="modal-form">
              <div className="form-group"><label>Title</label><input className="form-input" value={sForm.title} onChange={e=>setSForm({...sForm,title:e.target.value})} placeholder="Suggestion title..."/></div>
              <div className="form-group"><label>Message</label><textarea className="form-input" rows={4} value={sForm.body} onChange={e=>setSForm({...sForm,body:e.target.value})} placeholder="Describe the suggestion..."/></div>
              <div className="form-group"><label>Send To</label>
                <select className="form-input" value={sForm.target_type} onChange={e=>setSForm({...sForm,target_type:e.target.value,target_user:""})}>
                  <option value="all">All Project Owners</option>
                  <option value="user">Specific Owner</option>
                </select>
              </div>
              {sForm.target_type==="user" && (
                <div className="form-group"><label>Select Owner</label>
                  <select className="form-input" value={sForm.target_user} onChange={e=>setSForm({...sForm,target_user:e.target.value})}>
                    <option value="">-- Choose --</option>
                    {owners.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              )}
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={()=>setSugModal(false)}>Cancel</button>
                <button className="btn btn-green" onClick={saveSug} disabled={saving}>{saving?<span className="spinner"/>:"Post Suggestion"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ Confirm Delete ══ */}
      {delUserModal && (
        <div className="modal-overlay" onClick={()=>setDelUserModal(null)}>
          <div className="modal modal-sm" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Confirm Delete</span>
              <button className="modal-close" onClick={()=>setDelUserModal(null)}>✕</button>
            </div>
            <p className="confirm-text">Are you sure you want to delete <strong>{delUserModal.name}</strong>? This cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={()=>setDelUserModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type==="error"?"toast-error":"toast-success"}`}>
          {toast.type==="error"?"⚠️":"✅"} {toast.msg}
        </div>
      )}
    </div>
  );
}