"use client";

import { useEffect, useState } from "react";
import { fetchJson, postJson, deleteJson } from "../../lib";
import { Card, Badge, PageTitle, Loading, Empty } from "../../components/shared/UI";

type PO = { id: number; order_number: string; supplier_name: string; subtotal: number; discount_value: number; delivery_fee: number; total: number; status_name: string; status_color: string; payment_status_name: string; payment_status_color: string; notes: string; created_at: string; };
type PS = { id: number; name: string; color: string; };
type Pst = { id: number; name: string; color: string; };
type Product = { id: number; name: string; price: number; };
type Contact = { id: number; name: string; };
type Stat = { total_count: number; total_amount: number; };

export default function ComprasPage() {
  const [orders, setOrders] = useState<PO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [period, setPeriod] = useState<"today"|"week"|"month">("month");
  const [stats, setStats] = useState<Stat|null>(null);
  const [ps, setPS] = useState<PS[]>([]);
  const [pst, setPst] = useState<Pst[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [detailId, setDetailId] = useState<number|null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function load() {
    setLoading(true);
    Promise.all([
      fetchJson<PO[]>("/purchase-orders"),
      fetchJson<PS[]>("/purchase-statuses"),
      fetchJson<Pst[]>("/payment-statuses"),
      fetchJson<Product[]>("/products"),
      fetchJson<Contact[]>("/contacts"),
      fetchJson<Stat>("/purchase-orders/stats?period=" + period),
    ]).then(([o, p, pt, pr, co, st]) => {
      setOrders(o); setPS(p); setPst(pt); setProducts(pr); setContacts(co); setStats(st);
    }).catch(console.error).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [refreshKey, period]);

  const filtered = orders.filter(o => {
    if (search && !o.supplier_name?.toLowerCase().includes(search.toLowerCase()) && !o.order_number?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && o.status_name !== filterStatus) return false;
    return true;
  });

  async function handleReceive(orderId: number) {
    if (!confirm("Recibir NP e incrementar stock?")) return;
    try { await postJson("/purchase-orders/" + orderId + "/receive", {}); setRefreshKey(k => k + 1); }
    catch(e) { alert("Error al recibir NP"); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Eliminar NP?")) return;
    await deleteJson("/purchase-orders/" + id);
    setRefreshKey(k => k + 1);
  }

  return (
    <div>
      <PageTitle>📥 Compras</PageTitle>
      <p style={{fontSize:"13px",color:"#888",margin:"2px 0 16px"}}>Notas de Pedido a proveedores. Stock aumenta al recibir.</p>

      {stats && <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"10px",marginBottom:"16px"}}>
        <div style={{background:"#1a1a2e",borderRadius:"12px",padding:"14px",color:"#fff"}}>
          <div style={{fontSize:"11px",color:"#aaa",marginBottom:"4px"}}>NPs del periodo</div>
          <div style={{fontSize:"24px",fontWeight:800}}>{stats.total_count}</div>
        </div>
        <div style={{background:"#fff",borderRadius:"12px",padding:"14px",border:"1px solid #eee"}}>
          <div style={{fontSize:"11px",color:"#888",marginBottom:"4px"}}>Total comprado</div>
          <div style={{fontSize:"22px",fontWeight:800,color:"#e74c3c"}}>${stats.total_amount.toLocaleString("es-AR")}</div>
        </div>
      </div>}

      <div style={{display:"flex",gap:"4px",background:"#f0f0f0",padding:"3px",borderRadius:"8px",marginBottom:"12px",width:"fit-content"}}>
        {(["today","week","month"] as ("today"|"week"|"month")[]).map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{padding:"5px 12px",borderRadius:"6px",border:"none",background:period===p?"#1a1a2e":"transparent",color:period===p?"#fff":"#666",cursor:"pointer",fontSize:"12px",fontWeight:700}}>
            {p==="today"?"Hoy":p==="week"?"Semana":"Mes"}
          </button>
        ))}
      </div>

      <div style={{display:"flex",gap:"8px",marginBottom:"12px",flexWrap:"wrap"}}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar NP o proveedor..." style={{flex:1,minWidth:"160px",padding:"8px 12px",borderRadius:"8px",border:"1px solid #ddd",fontSize:"13px"}} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{padding:"8px 10px",borderRadius:"8px",border:"1px solid #ddd",fontSize:"13px"}}>
          <option value="">Estado: Todos</option>
          {ps.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
        <button onClick={() => setShowNew(true)} style={{padding:"8px 16px",borderRadius:"8px",border:"none",background:"#27ae60",color:"#fff",cursor:"pointer",fontSize:"13px",fontWeight:700}}>➕ NP</button>
      </div>

      {loading ? <Loading /> : filtered.length === 0 ? <Empty message="Sin notas de pedido" /> : (
        <div style={{display:"grid",gap:"10px"}}>
          {filtered.map(o => (
            <Card key={o.id} onClick={() => setDetailId(o.id)} style={{cursor:"pointer"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"4px"}}>
                    <span style={{fontWeight:800,fontSize:"14px"}}>{o.order_number}</span>
                    {o.supplier_name && <span style={{fontSize:"12px",color:"#888"}}>{o.supplier_name}</span>}
                  </div>
                  <div style={{fontSize:"12px",color:"#888"}}>{new Date(o.created_at).toLocaleDateString("es-AR")}</div>
                  <div style={{fontSize:"17px",fontWeight:800,color:"#1a1a2e",marginTop:"4px"}}>${Number(o.total).toLocaleString("es-AR")}</div>
                  <div style={{display:"flex",gap:"6px",marginTop:"6px",flexWrap:"wrap"}}>
                    {o.status_name && <Badge color={o.status_color||"#888"}>{o.status_name}</Badge>}
                    {o.payment_status_name && <Badge color={o.payment_status_color||"#888"}>{o.payment_status_name}</Badge>}
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
                  {o.status_name !== "Recibido" && (
                    <button onClick={e => { e.stopPropagation(); handleReceive(o.id); }} style={{padding:"5px 8px",borderRadius:"6px",border:"1px solid #27ae60",background:"#fff",color:"#27ae60",cursor:"pointer",fontSize:"12px",fontWeight:700}}>✅ Recibir</button>
                  )}
                  <button onClick={e => { e.stopPropagation(); handleDelete(o.id); }} style={{padding:"5px 8px",borderRadius:"6px",border:"1px solid #ddd",background:"#fff",cursor:"pointer",fontSize:"12px",color:"#e74c3c"}}>🗑️</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showNew && <NewNPModal contacts={contacts} products={products} onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); setRefreshKey(k => k + 1); }} />}
      {detailId && <NPDetailModal orderId={detailId} onClose={() => setDetailId(null)} onUpdated={() => setRefreshKey(k => k + 1)} />}
    </div>
  );
}

function NewNPModal({ contacts, products, onClose, onCreated }: any) {
  const [form, setForm] = useState({ supplier_id: "", notes: "", delivery_fee: "0", discount_type: "", discount_value: "" });
  const [items, setItems] = useState<any[]>([]);
  const [pSearch, setPSearch] = useState("");
  const [sSearch, setSSearch] = useState("");
  const [saving, setSaving] = useState(false);

  function setF(field: string, value: string) { setForm(prev => ({ ...prev, [field]: value })); }
  function addProduct(p: any) { if (items.find(i => i.product_id === p.id)) return; setItems([...items, { product_id: p.id, product_name: p.name, quantity: 1, unit_price: Number(p.price) }]); }
  function remItem(idx: number) { setItems(items.filter((_, i) => i !== idx)); }
  function updateItem(idx: number, qty: number) { const v = [...items]; v[idx].quantity = qty; setItems(v); }

  const fp = products.filter((p: any) => !pSearch || p.name.toLowerCase().includes(pSearch.toLowerCase()));
  const fc = contacts.filter((c: any) => !sSearch || c.name.toLowerCase().includes(sSearch.toLowerCase()));
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  let disc = 0;
  if (form.discount_type === "percent" && Number(form.discount_value)) disc = subtotal * (Number(form.discount_value) / 100);
  else if (form.discount_type === "fixed") disc = Number(form.discount_value);
  const total = Math.max(0, subtotal - disc + Number(form.delivery_fee || 0));

  async function save() {
    if (items.length === 0) { alert("Agregá al menos un insumo"); return; }
    setSaving(true);
    try {
      await postJson("/purchase-orders", {
        supplier_id: form.supplier_id ? Number(form.supplier_id) : undefined,
        notes: form.notes || undefined,
        delivery_fee: Number(form.delivery_fee) || 0,
        discount_type: form.discount_type || undefined,
        discount_value: form.discount_value ? Number(form.discount_value) : undefined,
        items: items.map((i: any) => ({ product_id: i.product_id, product_name: i.product_name, quantity: i.quantity, unit_price: i.unit_price })),
      });
      onCreated();
    } catch (e: any) { alert("Error: " + (e?.message || "No se pudo crear")); }
    finally { setSaving(false); }
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{background:"#fff",borderRadius:"16px",padding:"24px",width:"100%",maxWidth:"560px",maxHeight:"90vh",overflowY:"auto"}}>
        <h2 style={{margin:"0 0 16px",fontSize:"18px",fontWeight:800}}>📥 Nueva Nota de Pedido</h2>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
          <div style={{gridColumn:"1/-1"}}>
            <label style={{fontSize:"12px",fontWeight:700,color:"#666"}}>Proveedor</label>
            <input value={sSearch} onChange={e => setSSearch(e.target.value)} placeholder="Buscar..." style={{width:"100%",padding:"8px 12px",borderRadius:"8px",border:"1px solid #ddd",fontSize:"13px"}} />
            {sSearch && fc.slice(0, 5).map((c: any) => (
              <div key={c.id} onClick={() => { setF("supplier_id", String(c.id)); setSSearch(c.name); }} style={{padding:"8px 12px",borderBottom:"1px solid #f0",cursor:"pointer",fontSize:"13px"}}>{c.name}</div>
            ))}
          </div>
          <div style={{gridColumn:"1/-1"}}>
            <label style={{fontSize:"12px",fontWeight:700,color:"#666"}}>Insumos</label>
            <input value={pSearch} onChange={e => setPSearch(e.target.value)} placeholder="Buscar insumo..." style={{width:"100%",padding:"8px 12px",borderRadius:"8px",border:"1px solid #ddd",fontSize:"13px"}} />
            {pSearch && fp.slice(0, 8).map((p: any) => (
              <div key={p.id} onClick={() => { addProduct(p); setPSearch(""); }} style={{padding:"8px 12px",borderBottom:"1px solid #f0",cursor:"pointer",display:"flex",justifyContent:"space-between",fontSize:"13px"}}>
                <span>{p.name}</span><span style={{fontWeight:700,color:"#888"}}>${Number(p.price).toLocaleString("es-AR")}</span>
              </div>
            ))}
            {items.map((item, idx) => (
              <div key={idx} style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 0",borderBottom:"1px solid #f0",fontSize:"13px"}}>
                <span style={{flex:1}}>{item.product_name}</span>
                <input type="number" value={item.quantity} min={1} onChange={e => updateItem(idx, Number(e.target.value))} style={{width:"50px",padding:"4px",borderRadius:"6px",border:"1px solid #ddd",fontSize:"12px",textAlign:"center"}}/>
                <span>${(item.quantity * item.unit_price).toLocaleString("es-AR")}</span>
                <button onClick={() => remItem(idx)} style={{background:"none",border:"none",color:"#e74c3c",cursor:"pointer",fontSize:"14px"}}>✕</button>
              </div>
            ))}
          </div>
          <div>
            <label style={{fontSize:"12px",fontWeight:700,color:"#666"}}>Tipo Descuento</label>
            <select value={form.discount_type} onChange={e => setF("discount_type", e.target.value)} style={{width:"100%",padding:"8px 12px",borderRadius:"8px",border:"1px solid #ddd",fontSize:"13px"}}>
              <option value="">Sin descuento</option><option value="percent">%</option><option value="fixed">$</option>
            </select>
          </div>
          {form.discount_type && <div>
            <label style={{fontSize:"12px",fontWeight:700,color:"#666"}}>Monto</label>
            <input type="number" value={form.discount_value} onChange={e => setF("discount_value", e.target.value)} style={{width:"100%",padding:"8px 12px",borderRadius:"8px",border:"1px solid #ddd",fontSize:"13px"}}/>
          </div>}
          <div>
            <label style={{fontSize:"12px",fontWeight:700,color:"#666"}}>Costo envio</label>
            <input type="number" value={form.delivery_fee} onChange={e => setF("delivery_fee", e.target.value)} style={{width:"100%",padding:"8px 12px",borderRadius:"8px",border:"1px solid #ddd",fontSize:"13px"}}/>
          </div>
          <div style={{gridColumn:"1/-1"}}>
            <label style={{fontSize:"12px",fontWeight:700,color:"#666"}}>Notas</label>
            <textarea value={form.notes} onChange={e => setF("notes", e.target.value)} style={{width:"100%",padding:"8px 12px",borderRadius:"8px",border:"1px solid #ddd",fontSize:"13px",minHeight:"60px",resize:"vertical"}}/>
          </div>
        </div>
        <div style={{marginTop:"16px",borderTop:"2px solid #1a1a2e",paddingTop:"12px"}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:"18px",fontWeight:800,color:"#1a1a2e"}}><span>Total:</span><span>${total.toLocaleString("es-AR")}</span></div>
          <div style={{display:"flex",gap:"8px",marginTop:"12px"}}>
            <button onClick={onClose} style={{flex:1,padding:"10px",borderRadius:"8px",border:"1px solid #ddd",background:"#fff",cursor:"pointer"}}>Cancelar</button>
            <button onClick={save} disabled={saving} style={{flex:2,padding:"10px",borderRadius:"8px",border:"none",background:"#27ae60",color:"#fff",cursor:saving?"not-allowed":"pointer",fontWeight:700}}>{saving?"Guardando...":"✅ Crear NP"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NPDetailModal({ orderId, onClose, onUpdated }: any) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJson("/purchase-orders/" + orderId).then(setOrder).catch(console.error).finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div style={{background:"#fff",borderRadius:"16px",padding:"40px",textAlign:"center"}}><Loading/></div>
    </div>
  );
  if (!order) return null;

  async function handleReceive() {
    if (!confirm("Marcar como Recibida e incrementar stock?")) return;
    try { await postJson("/purchase-orders/" + orderId + "/receive", {}); onUpdated(); }
    catch(e) { alert("Error"); }
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{background:"#fff",borderRadius:"16px",padding:"24px",width:"100%",maxWidth:"560px",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
          <div>
            <h2 style={{margin:0,fontSize:"20px",fontWeight:800}}>{order.order_number}</h2>
            <div style={{fontSize:"12px",color:"#888"}}>{order.supplier_name || "Sin proveedor"} · {new Date(order.created_at).toLocaleDateString("es-AR")}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:"20px",cursor:"pointer"}}>✕</button>
        </div>
        <div style={{display:"flex",gap:"8px",marginBottom:"12px",flexWrap:"wrap"}}>
          {order.status_name && <Badge color={order.status_color}>{order.status_name}</Badge>}
          {order.payment_status_name && <Badge color={order.payment_status_color}>{order.payment_status_name}</Badge>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"12px"}}>
          <div style={{background:"#f8f8f8",borderRadius:"8px",padding:"10px",textAlign:"center"}}><div style={{fontSize:"11px",color:"#888"}}>Subtotal</div><div style={{fontWeight:800}}>${Number(order.subtotal).toLocaleString("es-AR")}</div></div>
          {Number(order.discount_value) > 0 && <div style={{background:"#fde8e8",borderRadius:"8px",padding:"10px",textAlign:"center"}}><div style={{fontSize:"11px",color:"#888"}}>Descuento</div><div style={{fontWeight:800,color:"#e74c3c"}}>-${Number(order.discount_value).toLocaleString("es-AR")}</div></div>}
          <div style={{background:"#1a1a2e",borderRadius:"8px",padding:"10px",textAlign:"center",color:"#fff"}}><div style={{fontSize:"11px",color:"#aaa"}}>Total</div><div style={{fontWeight:800}}>${Number(order.total).toLocaleString("es-AR")}</div></div>
        </div>
        <div style={{fontWeight:700,fontSize:"13px",marginBottom:"6px"}}>Insumos</div>
        {order.items?.map((item: any, idx: number) => (
          <div key={idx} style={{display:"flex",justifyContent:"space-between",padding:"8px",borderBottom:"1px solid #f0",fontSize:"13px"}}>
            <span>{item.quantity} × {item.product_name}</span>
            <span style={{fontWeight:700}}>${Number(item.subtotal).toLocaleString("es-AR")}</span>
          </div>
        ))}
        {order.notes && <div style={{fontSize:"12px",color:"#888",fontStyle:"italic",marginTop:"8px"}}>{order.notes}</div>}
        {order.status_name !== "Recibido" && (
          <button onClick={handleReceive} style={{marginTop:"12px",width:"100%",padding:"10px",borderRadius:"8px",border:"none",background:"#27ae60",color:"#fff",cursor:"pointer",fontWeight:700}}>✅ Marcar como Recibida (+stock)</button>
        )}
      </div>
    </div>
  );
}
