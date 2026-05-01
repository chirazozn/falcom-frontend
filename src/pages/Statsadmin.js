/* eslint-disable */
import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { getUsers, getProducts, getSuggestions } from "../api";
import "./Statsadmin.css";

const COLORS = ["#1a5cad","#1ab87a","#f59e0b","#dc3545","#2a78d8","#12875a","#4a9ae8","#e04040"];

const fmt = (n) => Number(n||0).toLocaleString("fr-DZ",{minimumFractionDigits:2});

export default function StatsAdmin() {
  const [owners,      setOwners]      = useState([]);
  const [products,    setProducts]    = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, p, s] = await Promise.all([getUsers(), getProducts(), getSuggestions()]);
      setOwners(u.filter(x=>x.role==="projectowner"));
      setProducts(p);
      setSuggestions(s);
    } catch(e){ console.error(e); }
    finally { setLoading(false); }
  },[]);

  useEffect(()=>{ load(); },[load]);

  if(loading) return <div className="stats-loading"><div className="big-spin"/></div>;

  // ── Data prep ──────────────────────────────────────────────────────────────

  // Revenue & sales per owner
  const ownerRevenueData = owners.map(o => {
    const ownerProds = products.filter(p=>String(p.owner_id)===String(o.id));
    return {
      name: o.name.split(" ")[0],
      fullName: o.name,
      revenue: ownerProds.reduce((a,p)=>a+Number(p.total_revenue||0),0),
      sold:    ownerProds.reduce((a,p)=>a+Number(p.total_sold||0),0),
      products: ownerProds.length,
      stock:   ownerProds.reduce((a,p)=>a+Number(p.stock||0),0),
    };
  }).sort((a,b)=>b.revenue-a.revenue);

  // Active vs Suspended
  const statusData = [
    { name:"Active",    value: owners.filter(o=>o.status==="active").length,    color:"#1ab87a" },
    { name:"Suspended", value: owners.filter(o=>o.status==="suspended").length, color:"#dc3545" },
  ].filter(d=>d.value>0);

  // Top products by revenue
  const topProducts = [...products]
    .sort((a,b)=>Number(b.total_revenue||0)-Number(a.total_revenue||0))
    .slice(0,8)
    .map(p=>({
      name: p.name.length>14 ? p.name.slice(0,14)+"…" : p.name,
      fullName: p.name,
      revenue: Number(p.total_revenue||0),
      sold:    Number(p.total_sold||0),
      stock:   Number(p.stock||0),
    }));

  // Suggestions target breakdown
  const sugData = [
    { name:"All Owners", value: suggestions.filter(s=>s.target_type==="all").length,  color:"#1a5cad" },
    { name:"Personal",   value: suggestions.filter(s=>s.target_type==="user").length, color:"#1ab87a" },
  ].filter(d=>d.value>0);

  // KPIs
  const totalRevenue = products.reduce((a,p)=>a+Number(p.total_revenue||0),0);
  const totalSold    = products.reduce((a,p)=>a+Number(p.total_sold||0),0);
  const totalStock   = products.reduce((a,p)=>a+Number(p.stock||0),0);

  const CustomTooltip = ({ active, payload, label }) => {
    if(!active||!payload?.length) return null;
    return (
      <div className="chart-tooltip">
        <p className="ct-label">{payload[0]?.payload?.fullName||label}</p>
        {payload.map((p,i)=>(
          <p key={i} style={{color:p.color}}>
            {p.name}: <strong>{p.name==="revenue"?fmt(p.value)+" DA":p.value}</strong>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="stats-root">

      {/* ── KPI Cards ── */}
      <div className="stats-kpi-grid">
        <div className="kpi-card kpi-blue">
          <div className="kpi-icon">👥</div>
          <div className="kpi-val">{owners.length}</div>
          <div className="kpi-label">Project Owners</div>
        </div>
        <div className="kpi-card kpi-green">
          <div className="kpi-icon">📦</div>
          <div className="kpi-val">{products.length}</div>
          <div className="kpi-label">Total Products</div>
        </div>
        <div className="kpi-card kpi-dark">
          <div className="kpi-icon">🛒</div>
          <div className="kpi-val">{totalSold}</div>
          <div className="kpi-label">Units Sold</div>
        </div>
        <div className="kpi-card kpi-revenue">
          <div className="kpi-icon">💵</div>
          <div className="kpi-val">{fmt(totalRevenue)}</div>
          <div className="kpi-label">Total Revenue (DA)</div>
        </div>
        <div className="kpi-card kpi-warn">
          <div className="kpi-icon">📊</div>
          <div className="kpi-val">{totalStock}</div>
          <div className="kpi-label">Total Stock</div>
        </div>
        <div className="kpi-card kpi-blue">
          <div className="kpi-icon">💡</div>
          <div className="kpi-val">{suggestions.length}</div>
          <div className="kpi-label">Suggestions Posted</div>
        </div>
      </div>

      <div className="charts-grid">

        {/* Revenue per Owner */}
        {ownerRevenueData.length > 0 && (
          <div className="chart-card chart-wide">
            <h3 className="chart-title">💰 Revenue per Project Owner</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ownerRevenueData} margin={{top:10,right:20,left:20,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eef6"/>
                <XAxis dataKey="name" tick={{fontSize:12,fill:"#7a94b8"}}/>
                <YAxis tick={{fontSize:11,fill:"#7a94b8"}} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="revenue" name="revenue" fill="#1a5cad" radius={[6,6,0,0]}>
                  {ownerRevenueData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Units Sold per Owner */}
        {ownerRevenueData.length > 0 && (
          <div className="chart-card">
            <h3 className="chart-title">🛒 Units Sold per Owner</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ownerRevenueData} margin={{top:10,right:10,left:0,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eef6"/>
                <XAxis dataKey="name" tick={{fontSize:12,fill:"#7a94b8"}}/>
                <YAxis tick={{fontSize:11,fill:"#7a94b8"}}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="sold" name="sold" radius={[6,6,0,0]}>
                  {ownerRevenueData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Owner Status Pie */}
        {statusData.length > 0 && (
          <div className="chart-card">
            <h3 className="chart-title">👥 Owner Status</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={90}
                  dataKey="value" label={({name,value})=>`${name}: ${value}`}
                  labelLine={false}>
                  {statusData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                </Pie>
                <Tooltip/>
                <Legend/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Products Revenue */}
        {topProducts.length > 0 && (
          <div className="chart-card chart-wide">
            <h3 className="chart-title">📦 Top Products by Revenue</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topProducts} layout="vertical" margin={{top:5,right:30,left:10,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eef6" horizontal={false}/>
                <XAxis type="number" tick={{fontSize:11,fill:"#7a94b8"}}
                  tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
                <YAxis type="category" dataKey="name" tick={{fontSize:11,fill:"#7a94b8"}} width={90}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="revenue" name="revenue" radius={[0,6,6,0]}>
                  {topProducts.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Stock per Owner */}
        {ownerRevenueData.length > 0 && (
          <div className="chart-card">
            <h3 className="chart-title">📊 Stock per Owner</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ownerRevenueData} margin={{top:10,right:10,left:0,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eef6"/>
                <XAxis dataKey="name" tick={{fontSize:12,fill:"#7a94b8"}}/>
                <YAxis tick={{fontSize:11,fill:"#7a94b8"}}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="stock" name="stock" fill="#f59e0b" radius={[6,6,0,0]}>
                  {ownerRevenueData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Suggestions Breakdown */}
        {sugData.length > 0 && (
          <div className="chart-card">
            <h3 className="chart-title">💡 Suggestions Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={sugData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                  dataKey="value" label={({name,value})=>`${name}: ${value}`}>
                  {sugData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                </Pie>
                <Tooltip/>
                <Legend/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>

      {/* No data */}
      {products.length===0 && owners.length===0 && (
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          <p>No data yet. Add project owners and products to see statistics.</p>
        </div>
      )}
    </div>
  );
}