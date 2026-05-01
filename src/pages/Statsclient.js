import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { getProducts, getSales } from "../api";
import { useLang } from "../lang";
import "./Statsclient.css";

const COLORS = ["#1a5cad","#1ab87a","#f59e0b","#dc3545","#2a78d8","#12875a","#4a9ae8"];
const fmt = (n) => Number(n||0).toLocaleString("fr-DZ",{minimumFractionDigits:2});

export default function StatsClient() {
  const { lang } = useLang();
  const [products,   setProducts]   = useState([]);
  const [allSales,   setAllSales]   = useState([]);
  const [loading,    setLoading]    = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const prods = await getProducts();
      setProducts(prods);
      // Load sales for all products
      const salesArrays = await Promise.all(prods.map(p=>getSales(p.id).catch(()=>[])));
      const flat = salesArrays.flat();
      setAllSales(flat);
    } catch(e){ console.error(e); }
    finally { setLoading(false); }
  },[]);

  useEffect(()=>{ load(); },[load]);

  if(loading) return <div className="sc-loading"><div className="big-spin"/></div>;

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalRevenue = products.reduce((a,p)=>a+Number(p.total_revenue||0),0);
  const totalSold    = products.reduce((a,p)=>a+Number(p.total_sold||0),0);
  const totalStock   = products.reduce((a,p)=>a+Number(p.stock||0),0);
  const avgPrice     = products.length ? products.reduce((a,p)=>a+Number(p.price||0),0)/products.length : 0;

  // ── Revenue by product (bar) ───────────────────────────────────────────────
  const revenueByProduct = products.map((p,i)=>({
    name:     p.name.length>12 ? p.name.slice(0,12)+"…" : p.name,
    fullName: p.name,
    revenue:  Number(p.total_revenue||0),
    sold:     Number(p.total_sold||0),
    stock:    Number(p.stock||0),
    color:    COLORS[i%COLORS.length],
  })).sort((a,b)=>b.revenue-a.revenue);

  // ── Revenue over time (line) ───────────────────────────────────────────────
  const salesByDate = {};
  allSales.forEach(s => {
    const d = s.date || s.sold_at?.slice(0,10);
    if(!d) return;
    salesByDate[d] = (salesByDate[d]||0) + Number(s.total||0);
  });
  const revenueOverTime = Object.entries(salesByDate)
    .sort(([a],[b])=>a.localeCompare(b))
    .map(([date,revenue])=>({ date, revenue }));

  // ── Pie: revenue share per product ────────────────────────────────────────
  const pieData = products
    .filter(p=>Number(p.total_revenue)>0)
    .map((p,i)=>({ name:p.name, value:Number(p.total_revenue||0), color:COLORS[i%COLORS.length] }));

  // ── Stock vs Sold comparison ───────────────────────────────────────────────
  const stockSoldData = products.map((p,i)=>({
    name:     p.name.length>12 ? p.name.slice(0,12)+"…" : p.name,
    fullName: p.name,
    stock:    Number(p.stock||0),
    sold:     Number(p.total_sold||0),
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if(!active||!payload?.length) return null;
    return (
      <div className="chart-tooltip">
        <p className="ct-label">{payload[0]?.payload?.fullName||label}</p>
        {payload.map((p,i)=>(
          <p key={i} style={{color:p.color||"white"}}>
            {p.name}: <strong>
              {p.name==="revenue"||p.name==="Revenue" ? fmt(p.value)+" DA" : p.value}
            </strong>
          </p>
        ))}
      </div>
    );
  };

  const labels = {
    en: {
      kpi1:"Products", kpi2:"Units Sold", kpi3:"In Stock", kpi4:"Total Revenue", kpi5:"Avg. Price",
      chart1:"Revenue per Product", chart2:"Revenue Over Time", chart3:"Revenue Distribution",
      chart4:"Stock vs Sold", noData:"No data yet. Your admin will add products and sales soon.",
      revenue:"Revenue", sold:"Sold", stock:"Stock", date:"Date",
    },
    fr: {
      kpi1:"Produits", kpi2:"Unités vendues", kpi3:"En stock", kpi4:"Chiffre d'affaires", kpi5:"Prix moyen",
      chart1:"Revenus par produit", chart2:"Revenus dans le temps", chart3:"Répartition des revenus",
      chart4:"Stock vs Vendus", noData:"Aucune donnée. Votre admin ajoutera des produits et ventes bientôt.",
      revenue:"Revenus", sold:"Vendus", stock:"Stock", date:"Date",
    }
  };
  const L = labels[lang]||labels.en;

  if(products.length===0) return (
    <div className="empty-state">
      <span className="empty-icon">📊</span>
      <p>{L.noData}</p>
    </div>
  );

  return (
    <div className="sc-root">

      {/* ── KPIs ── */}
      <div className="sc-kpi-grid">
        <div className="sc-kpi sc-blue"><span>📦</span><strong>{products.length}</strong><span>{L.kpi1}</span></div>
        <div className="sc-kpi sc-green"><span>🛒</span><strong>{totalSold}</strong><span>{L.kpi2}</span></div>
        <div className="sc-kpi sc-warn"><span>📊</span><strong>{totalStock}</strong><span>{L.kpi3}</span></div>
        <div className="sc-kpi sc-revenue"><span>💵</span><strong>{fmt(totalRevenue)}</strong><span>{L.kpi4} (DA)</span></div>
        <div className="sc-kpi sc-blue"><span>💰</span><strong>{fmt(avgPrice)}</strong><span>{L.kpi5} (DA)</span></div>
      </div>

      <div className="sc-charts-grid">

        {/* Revenue per product */}
        <div className="chart-card chart-wide">
          <h3 className="chart-title">💰 {L.chart1}</h3>
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={revenueByProduct} margin={{top:10,right:20,left:20,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eef6"/>
              <XAxis dataKey="name" tick={{fontSize:12,fill:"#7a94b8"}}/>
              <YAxis tick={{fontSize:11,fill:"#7a94b8"}} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="revenue" name="Revenue" radius={[6,6,0,0]}>
                {revenueByProduct.map((d,i)=><Cell key={i} fill={d.color}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue over time */}
        {revenueOverTime.length > 1 && (
          <div className="chart-card chart-wide">
            <h3 className="chart-title">📈 {L.chart2}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueOverTime} margin={{top:10,right:20,left:20,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eef6"/>
                <XAxis dataKey="date" tick={{fontSize:11,fill:"#7a94b8"}}/>
                <YAxis tick={{fontSize:11,fill:"#7a94b8"}} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Line type="monotone" dataKey="revenue" name="Revenue"
                  stroke="#1a5cad" strokeWidth={2.5} dot={{fill:"#1a5cad",r:4}}
                  activeDot={{r:6}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Revenue pie */}
        {pieData.length > 0 && (
          <div className="chart-card">
            <h3 className="chart-title">🥧 {L.chart3}</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={95}
                  dataKey="value" label={({name,percent})=>`${name.slice(0,8)} ${(percent*100).toFixed(0)}%`}
                  labelLine={false}>
                  {pieData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                </Pie>
                <Tooltip formatter={(v)=>fmt(v)+" DA"}/>
                <Legend/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Stock vs Sold */}
        <div className="chart-card">
          <h3 className="chart-title">📦 {L.chart4}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stockSoldData} margin={{top:10,right:10,left:0,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eef6"/>
              <XAxis dataKey="name" tick={{fontSize:11,fill:"#7a94b8"}}/>
              <YAxis tick={{fontSize:11,fill:"#7a94b8"}}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend/>
              <Bar dataKey="stock" name={L.stock} fill="#1a5cad" radius={[4,4,0,0]}/>
              <Bar dataKey="sold"  name={L.sold}  fill="#1ab87a" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}