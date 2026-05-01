import React, { useState, useEffect, useCallback } from "react";
import { getProducts, getSales } from "../api";
import { useLang } from "../lang";
import "./ProductsClient.css";

export default function ProductsClient() {
  const { t } = useLang();
  const [products,    setProducts]    = useState([]);
  const [sales,       setSales]       = useState([]);
  const [activeProd,  setActiveProd]  = useState(null);
  const [histModal,   setHistModal]   = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [histLoading, setHistLoading] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(async () => {
    setLoading(true);
    try { setProducts(await getProducts()); }
    catch(e){ console.error(e); }
    finally { setLoading(false); }
  },[]);

  useEffect(()=>{ load(); },[load]);

  const openHistory = async (prod) => {
    setActiveProd(prod); setHistModal(true);
    setHistLoading(true);
    try { setSales(await getSales(prod.id)); }
    catch(e){ console.error(e); }
    finally { setHistLoading(false); }
  };

  const fmt = (n) => Number(n||0).toLocaleString("fr-DZ",{minimumFractionDigits:2});

  const totalRevenue = products.reduce((a,p)=>a+Number(p.total_revenue||0),0);
  const totalSold    = products.reduce((a,p)=>a+Number(p.total_sold||0),0);
  const totalStock   = products.reduce((a,p)=>a+Number(p.stock||0),0);

  if(loading) return <div className="pc-loading"><div className="big-spin"/></div>;

  return (
    <div className="pc-root">

      {/* ── Summary ── */}
      {products.length > 0 && (
        <div className="pc-summary">
          <div className="pc-sum-card pc-sum-blue">
            <span className="pc-sum-icon">📦</span>
            <div>
              <div className="pc-sum-val">{products.length}</div>
              <div className="pc-sum-label">{t.totalProducts}</div>
            </div>
          </div>
          <div className="pc-sum-card pc-sum-green">
            <span className="pc-sum-icon">🛒</span>
            <div>
              <div className="pc-sum-val">{totalSold}</div>
              <div className="pc-sum-label">{t.unitsSold}</div>
            </div>
          </div>
          <div className="pc-sum-card pc-sum-dark">
            <span className="pc-sum-icon">📊</span>
            <div>
              <div className="pc-sum-val">{totalStock}</div>
              <div className="pc-sum-label">{t.inStock}</div>
            </div>
          </div>
          <div className="pc-sum-card pc-sum-revenue">
            <span className="pc-sum-icon">💵</span>
            <div>
              <div className="pc-sum-val">{fmt(totalRevenue)}</div>
              <div className="pc-sum-label">{t.totalRevenue} (DA)</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Products ── */}
      {products.length===0 ? (
        <div className="empty-state">
          <span className="empty-icon">📦</span>
          <p>{t.noProducts}</p>
        </div>
      ) : (
        <div className="pc-grid">
          {products.map(p=>(
            <div key={p.id} className="pc-card">
              <div className="pc-img-wrap">
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} className="pc-img"/>
                  : <div className="pc-img-ph">📦</div>
                }
              </div>
              <div className="pc-body">
                <h4 className="pc-name">{p.name}</h4>
                {p.description && <p className="pc-desc">{p.description}</p>}
                <div className="pc-stats">
                  <div className="pc-stat">
                    <span className="pc-stat-label">💰 {t.price}</span>
                    <span className="pc-stat-val">{fmt(p.price)} DA</span>
                  </div>
                  <div className="pc-stat">
                    <span className="pc-stat-label">📦 {t.stock}</span>
                    <span className={`pc-stat-val ${Number(p.stock)<=5?"pc-low-stock":""}`}>
                      {p.stock} {t.units}
                      {Number(p.stock)<=5 && <span className="pc-low-tag">⚠️ Low</span>}
                    </span>
                  </div>
                  <div className="pc-stat">
                    <span className="pc-stat-label">🛒 {t.sold}</span>
                    <span className="pc-stat-val">{p.total_sold} {t.units}</span>
                  </div>
                  <div className="pc-stat pc-stat-revenue">
                    <span className="pc-stat-label">💵 {t.revenue}</span>
                    <span className="pc-stat-val pc-revenue-val">{fmt(p.total_revenue)} DA</span>
                  </div>
                </div>
                <button className="btn btn-outline btn-sm pc-hist-btn" onClick={()=>openHistory(p)}>
                  📋 {t.viewHistory}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════ History Modal ════ */}
      {histModal && activeProd && (
        <div className="modal-overlay" onClick={()=>setHistModal(false)}>
          <div className="modal modal-lg" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">📋 {activeProd.name} — {t.history}</span>
              <button className="modal-close" onClick={()=>setHistModal(false)}>✕</button>
            </div>
            <div className="hist-summary">
              <div className="hist-sum-item">
                <span>🛒 {t.unitsSold}</span>
                <strong>{activeProd.total_sold} {t.units}</strong>
              </div>
              <div className="hist-sum-item">
                <span>💵 {t.revenue}</span>
                <strong>{fmt(activeProd.total_revenue)} DA</strong>
              </div>
              <div className="hist-sum-item">
                <span>📦 {t.currentStock}</span>
                <strong>{activeProd.stock} {t.units}</strong>
              </div>
            </div>
            {histLoading ? (
              <div style={{textAlign:"center",padding:32}}><div className="big-spin" style={{margin:"0 auto"}}/></div>
            ) : sales.length===0 ? (
              <div className="empty-state" style={{padding:"28px 0"}}>
                <span className="empty-icon">📋</span>
                <p>{t.noSales}</p>
              </div>
            ) : (
              <div className="hist-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t.date}</th><th>{t.time}</th>
                      <th>{t.qty}</th><th>{t.unitPrice}</th><th>{t.total}</th><th>{t.note}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map(s=>(
                      <tr key={s.id}>
                        <td><strong>{s.date}</strong></td>
                        <td className="cell-muted">{s.time}</td>
                        <td><span className="badge badge-blue">{s.qty_sold} {t.units}</span></td>
                        <td>{fmt(s.unit_price)} DA</td>
                        <td><strong style={{color:"var(--green-main)"}}>{fmt(s.total)} DA</strong></td>
                        <td className="cell-muted">{s.note||"—"}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="hist-total-row">
                      <td colSpan={2}><strong>{t.total}</strong></td>
                      <td><strong>{sales.reduce((a,s)=>a+Number(s.qty_sold),0)} {t.units}</strong></td>
                      <td>—</td>
                      <td colSpan={2}><strong style={{color:"var(--green-main)"}}>
                        {fmt(sales.reduce((a,s)=>a+Number(s.total),0))} DA
                      </strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}