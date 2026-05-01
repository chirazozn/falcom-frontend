import React, { useState, useEffect, useCallback } from "react";
import { getUsers, getProducts, createProduct, updateProduct, deleteProduct, getSales, addSale, deleteSale } from "../api";
import "./ProductsAdmin.css";

function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3200); };
  return { toast, show };
}

const EMPTY_PROD = { owner_id:"", name:"", description:"", image_url:"", price:"", stock:"" };
const EMPTY_SALE = { qty_sold:"", unit_price:"", note:"", sold_at:"" };

export default function ProductsAdmin() {
  const { toast, show: showToast } = useToast();

  const [owners,       setOwners]       = useState([]);
  const [products,     setProducts]     = useState([]);
  const [sales,        setSales]        = useState([]);
  const [filterOwner,  setFilterOwner]  = useState("");
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);

  // Modals
  const [prodModal,    setProdModal]    = useState(false);
  const [saleModal,    setSaleModal]    = useState(false);
  const [histModal,    setHistModal]    = useState(false);
  const [delProdConf,  setDelProdConf]  = useState(null);
  const [delSaleConf,  setDelSaleConf]  = useState(null);
  const [activeProd,   setActiveProd]   = useState(null);
  const [editProdId,   setEditProdId]   = useState(null);
  const [pForm,        setPForm]        = useState(EMPTY_PROD);
  const [sForm,        setSForm]        = useState(EMPTY_SALE);
  const [histLoading,  setHistLoading]  = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, p] = await Promise.all([getUsers(), getProducts()]);
      setOwners(u.filter(u=>u.role==="projectowner"));
      setProducts(p);
    } catch(e){ showToast(e.message,"error"); }
    finally { setLoading(false); }
  },[]);

  useEffect(()=>{ load(); },[load]);

  const filtered = filterOwner
    ? products.filter(p=>String(p.owner_id)===String(filterOwner))
    : products;

  // ── Product CRUD ──────────────────────────────────────────────────────────
  const openAddProd = () => {
    setPForm({...EMPTY_PROD, owner_id: filterOwner||""});
    setEditProdId(null); setProdModal(true);
  };
  const openEditProd = (p) => {
    setPForm({ owner_id:p.owner_id, name:p.name, description:p.description||"",
               image_url:p.image_url||"", price:p.price, stock:p.stock });
    setEditProdId(p.id); setProdModal(true);
  };

  const saveProd = async () => {
    if(!pForm.owner_id||!pForm.name){ showToast("Owner and name required.","error"); return; }
    setSaving(true);
    try {
      if(editProdId){
        const updated = await updateProduct(editProdId, pForm);
        setProducts(prev=>prev.map(p=>p.id===editProdId?updated:p));
        showToast("Product updated.");
      } else {
        const newP = await createProduct(pForm);
        setProducts(prev=>[newP,...prev]);
        showToast("Product created.");
      }
      setProdModal(false);
    } catch(e){ showToast(e.message,"error"); }
    finally { setSaving(false); }
  };

  const confirmDeleteProd = async () => {
    if(!delProdConf) return;
    try {
      await deleteProduct(delProdConf.id);
      setProducts(prev=>prev.filter(p=>p.id!==delProdConf.id));
      setDelProdConf(null);
      showToast("Product deleted.","error");
    } catch(e){ showToast(e.message,"error"); }
  };

  // ── Sales ─────────────────────────────────────────────────────────────────
  const openAddSale = (prod) => {
    setActiveProd(prod);
    setSForm({...EMPTY_SALE, unit_price: prod.price, sold_at: new Date().toISOString().slice(0,16)});
    setSaleModal(true);
  };

  const saveSale = async () => {
    if(!sForm.qty_sold||!sForm.unit_price){ showToast("Quantity and price required.","error"); return; }
    setSaving(true);
    try {
      const newS = await addSale(activeProd.id, sForm);
      // Update product totals locally
      setProducts(prev=>prev.map(p=>p.id===activeProd.id
        ? {...p,
           stock:      Math.max(0, p.stock - Number(sForm.qty_sold)),
           total_sold:    Number(p.total_sold)    + Number(sForm.qty_sold),
           total_revenue: Number(p.total_revenue) + Number(newS.total),
          }
        : p
      ));
      setSaleModal(false);
      showToast("Sale recorded!");
    } catch(e){ showToast(e.message,"error"); }
    finally { setSaving(false); }
  };

  const openHistory = async (prod) => {
    setActiveProd(prod); setHistModal(true);
    setHistLoading(true);
    try { setSales(await getSales(prod.id)); }
    catch(e){ showToast(e.message,"error"); }
    finally { setHistLoading(false); }
  };

  const confirmDeleteSale = async () => {
    if(!delSaleConf) return;
    try {
      await deleteSale(activeProd.id, delSaleConf.id);
      setSales(prev=>prev.filter(s=>s.id!==delSaleConf.id));
      // Restore stock locally
      setProducts(prev=>prev.map(p=>p.id===activeProd.id
        ? {...p,
           stock:         Number(p.stock) + Number(delSaleConf.qty_sold),
           total_sold:    Math.max(0, Number(p.total_sold)    - Number(delSaleConf.qty_sold)),
           total_revenue: Math.max(0, Number(p.total_revenue) - Number(delSaleConf.total)),
          }
        : p
      ));
      setDelSaleConf(null);
      showToast("Sale removed.","error");
    } catch(e){ showToast(e.message,"error"); }
  };

  const fmt = (n) => Number(n||0).toLocaleString("fr-DZ", { minimumFractionDigits:2 });

  if(loading) return <div className="prod-loading"><div className="big-spin"/></div>;

  return (
    <div className="prod-root">
      {/* ── Header ── */}
      <div className="prod-header">
        <div>
          <h2>Products & Sales</h2>
          <p>Manage products and record sales for each project owner</p>
        </div>
        <button className="btn btn-primary" onClick={openAddProd}>+ Add Product</button>
      </div>

      {/* ── Filter by owner ── */}
      <div className="prod-filter">
        <label>Filter by owner:</label>
        <select className="form-input" value={filterOwner} onChange={e=>setFilterOwner(e.target.value)}
          style={{maxWidth:240}}>
          <option value="">All Owners</option>
          {owners.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <span className="prod-count">{filtered.length} product{filtered.length!==1?"s":""}</span>
      </div>

      {/* ── Products grid ── */}
      {filtered.length===0 ? (
        <div className="empty-state">
          <span className="empty-icon">📦</span>
          <p>{filterOwner ? "No products for this owner yet." : "No products yet."}</p>
          <button className="btn btn-primary" style={{marginTop:8}} onClick={openAddProd}>Add First Product</button>
        </div>
      ) : (
        <div className="prod-grid">
          {filtered.map(p=>(
            <div key={p.id} className="prod-card">
              {/* Image */}
              <div className="prod-img-wrap">
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} className="prod-img"/>
                  : <div className="prod-img-placeholder">📦</div>
                }
                <span className="prod-owner-badge">{p.owner_name}</span>
              </div>

              {/* Info */}
              <div className="prod-info">
                <h4 className="prod-name">{p.name}</h4>
                {p.description && <p className="prod-desc">{p.description}</p>}

                <div className="prod-stats">
                  <div className="prod-stat-item">
                    <span className="psi-label">💰 Price</span>
                    <span className="psi-value">{fmt(p.price)} DA</span>
                  </div>
                  <div className="prod-stat-item">
                    <span className="psi-label">📦 Stock</span>
                    <span className={`psi-value ${Number(p.stock)<=5?"psi-warn":""}`}>{p.stock} units</span>
                  </div>
                  <div className="prod-stat-item">
                    <span className="psi-label">🛒 Sold</span>
                    <span className="psi-value">{p.total_sold} units</span>
                  </div>
                  <div className="prod-stat-item psi-revenue">
                    <span className="psi-label">💵 Revenue</span>
                    <span className="psi-value psi-green">{fmt(p.total_revenue)} DA</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="prod-actions">
                <button className="btn btn-green btn-sm" onClick={()=>openAddSale(p)}>+ Record Sale</button>
                <button className="btn btn-outline btn-sm" onClick={()=>openHistory(p)}>📋 History</button>
                <button className="btn btn-outline btn-sm" onClick={()=>openEditProd(p)}>✏️ Edit</button>
                <button className="btn btn-danger btn-sm" onClick={()=>setDelProdConf(p)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════ Modal: Add/Edit Product ════ */}
      {prodModal && (
        <div className="modal-overlay" onClick={()=>setProdModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editProdId?"Edit Product":"Add Product"}</span>
              <button className="modal-close" onClick={()=>setProdModal(false)}>✕</button>
            </div>
            <div className="modal-form">
              <div className="form-group">
                <label>Project Owner *</label>
                <select className="form-input" value={pForm.owner_id}
                  onChange={e=>setPForm({...pForm,owner_id:e.target.value})} disabled={!!editProdId}>
                  <option value="">-- Select Owner --</option>
                  {owners.map(o=><option key={o.id} value={o.id}>{o.name} — {o.project_name||"No project"}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Product Name *</label>
                <input className="form-input" value={pForm.name}
                  onChange={e=>setPForm({...pForm,name:e.target.value})} placeholder="e.g. Black Hoodie"/>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-input" rows={3} value={pForm.description}
                  onChange={e=>setPForm({...pForm,description:e.target.value})}
                  placeholder="Short product description..."/>
              </div>
              <div className="form-group">
                <label>Image URL (paste a direct image link)</label>
                <input className="form-input" value={pForm.image_url}
                  onChange={e=>setPForm({...pForm,image_url:e.target.value})}
                  placeholder="https://example.com/product.jpg"/>
                {pForm.image_url && (
                  <img src={pForm.image_url} alt="preview" className="img-preview"
                    onError={e=>e.target.style.display="none"}/>
                )}
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Sale Price (DA) *</label>
                  <input className="form-input" type="number" min="0" step="0.01"
                    value={pForm.price} onChange={e=>setPForm({...pForm,price:e.target.value})}
                    placeholder="0.00"/>
                </div>
                <div className="form-group">
                  <label>Stock (units) *</label>
                  <input className="form-input" type="number" min="0"
                    value={pForm.stock} onChange={e=>setPForm({...pForm,stock:e.target.value})}
                    placeholder="0"/>
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={()=>setProdModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={saveProd} disabled={saving}>
                  {saving?<span className="spinner"/>:editProdId?"Save Changes":"Add Product"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ Modal: Record Sale ════ */}
      {saleModal && activeProd && (
        <div className="modal-overlay" onClick={()=>setSaleModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Record Sale — {activeProd.name}</span>
              <button className="modal-close" onClick={()=>setSaleModal(false)}>✕</button>
            </div>
            <div className="modal-form">
              <div className="sale-product-info">
                <span>📦 Stock remaining: <strong>{activeProd.stock} units</strong></span>
                <span>💰 Price: <strong>{fmt(activeProd.price)} DA</strong></span>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Quantity Sold *</label>
                  <input className="form-input" type="number" min="1"
                    value={sForm.qty_sold} onChange={e=>setSForm({...sForm,qty_sold:e.target.value})}
                    placeholder="1"/>
                </div>
                <div className="form-group">
                  <label>Unit Price (DA) *</label>
                  <input className="form-input" type="number" min="0" step="0.01"
                    value={sForm.unit_price} onChange={e=>setSForm({...sForm,unit_price:e.target.value})}/>
                </div>
              </div>
              {sForm.qty_sold && sForm.unit_price && (
                <div className="sale-total-preview">
                  Total: <strong>{fmt(Number(sForm.qty_sold)*Number(sForm.unit_price))} DA</strong>
                </div>
              )}
              <div className="form-group">
                <label>Date & Time</label>
                <input className="form-input" type="datetime-local"
                  value={sForm.sold_at} onChange={e=>setSForm({...sForm,sold_at:e.target.value})}/>
              </div>
              <div className="form-group">
                <label>Note (optional)</label>
                <input className="form-input" value={sForm.note}
                  onChange={e=>setSForm({...sForm,note:e.target.value})}
                  placeholder="e.g. Sold at market, online order #123"/>
              </div>
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={()=>setSaleModal(false)}>Cancel</button>
                <button className="btn btn-green" onClick={saveSale} disabled={saving}>
                  {saving?<span className="spinner"/>:"Record Sale ✓"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ Modal: Sales History ════ */}
      {histModal && activeProd && (
        <div className="modal-overlay" onClick={()=>setHistModal(false)}>
          <div className="modal modal-lg" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">📋 Sales History — {activeProd.name}</span>
              <button className="modal-close" onClick={()=>setHistModal(false)}>✕</button>
            </div>

            {/* Summary */}
            <div className="hist-summary">
              <div className="hist-sum-item">
                <span>🛒 Total Sold</span>
                <strong>{activeProd.total_sold} units</strong>
              </div>
              <div className="hist-sum-item">
                <span>💵 Total Revenue</span>
                <strong>{fmt(activeProd.total_revenue)} DA</strong>
              </div>
              <div className="hist-sum-item">
                <span>📦 Current Stock</span>
                <strong>{activeProd.stock} units</strong>
              </div>
            </div>

            {histLoading ? (
              <div style={{textAlign:"center",padding:32}}><div className="big-spin" style={{margin:"0 auto"}}/></div>
            ) : sales.length===0 ? (
              <div className="empty-state" style={{padding:"32px 0"}}>
                <span className="empty-icon">📋</span>
                <p>No sales recorded yet.</p>
              </div>
            ) : (
              <div className="hist-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th><th>Time</th><th>Qty</th>
                      <th>Unit Price</th><th>Total</th><th>Note</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map(s=>(
                      <tr key={s.id}>
                        <td>{s.date}</td>
                        <td className="cell-muted">{s.time}</td>
                        <td><span className="badge badge-blue">{s.qty_sold} units</span></td>
                        <td>{fmt(s.unit_price)} DA</td>
                        <td><strong className="text-green">{fmt(s.total)} DA</strong></td>
                        <td className="cell-muted">{s.note||"—"}</td>
                        <td>
                          <button className="btn btn-danger btn-sm"
                            onClick={()=>setDelSaleConf(s)}>🗑</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="hist-total-row">
                      <td colSpan={2}><strong>TOTAL</strong></td>
                      <td><strong>{sales.reduce((a,s)=>a+Number(s.qty_sold),0)} units</strong></td>
                      <td>—</td>
                      <td colSpan={3}><strong className="text-green">{fmt(sales.reduce((a,s)=>a+Number(s.total),0))} DA</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════ Confirm delete product ════ */}
      {delProdConf && (
        <div className="modal-overlay" onClick={()=>setDelProdConf(null)}>
          <div className="modal modal-sm" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Delete Product</span>
              <button className="modal-close" onClick={()=>setDelProdConf(null)}>✕</button>
            </div>
            <p className="confirm-text">Delete <strong>{delProdConf.name}</strong>? All sales history will also be deleted. This cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={()=>setDelProdConf(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDeleteProd}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ════ Confirm delete sale ════ */}
      {delSaleConf && (
        <div className="modal-overlay" onClick={()=>setDelSaleConf(null)}>
          <div className="modal modal-sm" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Remove Sale</span>
              <button className="modal-close" onClick={()=>setDelSaleConf(null)}>✕</button>
            </div>
            <p className="confirm-text">Remove this sale of <strong>{delSaleConf.qty_sold} units</strong> on {delSaleConf.date}? Stock will be restored.</p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={()=>setDelSaleConf(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDeleteSale}>Remove</button>
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