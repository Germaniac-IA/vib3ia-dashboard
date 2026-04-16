"use client";

import { useEffect, useState } from "react";
import { fetchJson, postJson } from "../../lib";

type Delivery = {
  id: number; order_id: number; address: string; scheduled_date: string;
  delivered_date: string; status: string; notes: string; created_at: string;
  order_number: string; order_total: number;
  contact_name: string; contact_phone: string; contact_addr: string;
  status_name: string; status_color: string; delivery_fee: number;
};

type Stats = { pending_count: number; in_transit_count: number; delivered_count: number; cancelled_count: number; total_count: number };

const STATUS_COLORS: Record<string, string> = {
  'Pendiente': '#f39c12', 'En camino': '#3498db', 'Entregado': '#27ae60', 'Cancelado': '#e74c3c'
};

function statusBadge(status: string) {
  const color = STATUS_COLORS[status] || '#888';
  return (
    <span style={{ background: color, color: '#fff', borderRadius: '12px', padding: '3px 10px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
}

function delayBadge(scheduled_date: string, status: string) {
  if (status !== 'Pendiente' && status !== 'En camino') return null;
  const today = new Date();
  const scheduled = new Date(scheduled_date);
  const diffDays = Math.floor((today.getTime() - scheduled.getTime()) / 86400000);
  if (diffDays <= 0) return null;
  const color = diffDays >= 3 ? '#e74c3c' : diffDays >= 1 ? '#f39c12' : '#27ae60';
  return (
    <span style={{ background: color, color: '#fff', borderRadius: '8px', padding: '2px 6px', fontSize: '10px', fontWeight: 700 }}>
      +{diffDays}d
    </span>
  );
}

export default function EntregasPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [stats, setStats] = useState<Stats>({ pending_count: 0, in_transit_count: 0, delivered_count: 0, cancelled_count: 0, total_count: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ order_id: "", address: "", scheduled_date: "", notes: "", delivery_fee: "" });
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [d, s] = await Promise.all([
        fetchJson<Delivery[]>("/deliveries"),
        fetchJson<Stats>("/deliveries/stats")
      ]);
      setDeliveries(d);
      setStats(s);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await postJson("/deliveries", {
        order_id: Number(newForm.order_id),
        address: newForm.address,
        scheduled_date: newForm.scheduled_date || null,
        notes: newForm.notes,
        delivery_fee: Number(newForm.delivery_fee) || 0
      });
      setShowNew(false);
      setNewForm({ order_id: "", address: "", scheduled_date: "", notes: "", delivery_fee: "" });
      load();
    } catch (e) { alert("Error al crear entrega"); }
    finally { setCreating(false); }
  }

  async function handleConfirm(id: number) {
    if (!confirm("¿Confirmar entrega?")) return;
    try {
      await postJson(`/deliveries/${id}/confirm`, {});
      load();
    } catch (e) { alert("Error al confirmar"); }
  }

  async function handleCancel(id: number) {
    if (!confirm("¿Cancelar entrega? Esto revertirá el stock de los productos.")) return;
    try {
      await postJson(`/deliveries/${id}/cancel`, {});
      load();
    } catch (e) { alert("Error al cancelar: " + e); }
  }

  async function handleStatusChange(id: number, newStatus: string) {
    try {
      await postJson(`/deliveries/${id}`, { status: newStatus });
      load();
    } catch (e) { alert("Error al actualizar estado"); }
  }

  const filtered = filter ? deliveries.filter(d => d.status === filter) : deliveries;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 900 }}>🚚 Entregas</h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#888" }}>
            {stats.total_count} total · {stats.pending_count} pendientes · {stats.delivered_count} entregadas
          </p>
        </div>
        <button onClick={() => setShowNew(true)} style={{ background: "#27ae60", border: "none", borderRadius: "10px", padding: "10px 20px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>
          ➕ Nueva Entrega
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {["", "Pendiente", "En camino", "Entregado", "Cancelado"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "6px 14px", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600,
              background: filter === f ? "#1a1a2e" : "#e0e0e0", color: filter === f ? "#fff" : "#333" }}>
            {f || "Todas"} {f === "Pendiente" && `(${stats.pending_count})`} {f === "En camino" && `(${stats.in_transit_count})`} {f === "Entregado" && `(${stats.delivered_count})`} {f === "Cancelado" && `(${stats.cancelled_count})`}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? <p style={{ color: "#888" }}>Cargando...</p> : filtered.length === 0 ? (
        <p style={{ color: "#888", textAlign: "center", padding: "40px" }}>No hay entregas{f ? ` con estado "${filter}"` : ""}</p>
      ) : (
        <div style={{ background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f5f5f5" }}>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#555", fontSize: "11px" }}>ESTADO</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#555", fontSize: "11px" }}>PEDIDO</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#555", fontSize: "11px" }}>CLIENTE</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#555", fontSize: "11px" }}>DIRECCIÓN</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#555", fontSize: "11px" }}>FECHA</th>
                <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#555", fontSize: "11px" }}>TOTAL</th>
                <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#555", fontSize: "11px" }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {statusBadge(d.status)}
                      {delayBadge(d.scheduled_date, d.status)}
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ fontWeight: 700, color: "#1a1a2e" }}>{d.order_number}</div>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ fontWeight: 600 }}>{d.contact_name || "—"}</div>
                    {d.contact_phone && <div style={{ fontSize: "11px", color: "#888" }}>{d.contact_phone}</div>}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ fontSize: "12px" }}>{d.address || "—"}</div>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ fontSize: "12px" }}>{d.scheduled_date ? new Date(d.scheduled_date).toLocaleDateString("es-AR") : "—"}</div>
                    {d.delivered_date && <div style={{ fontSize: "11px", color: "#27ae60" }}>✓ {new Date(d.delivered_date).toLocaleDateString("es-AR")}</div>}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>
                    <div style={{ fontWeight: 700 }}>${Number(d.order_total || 0).toLocaleString("es-AR")}</div>
                    {d.delivery_fee > 0 && <div style={{ fontSize: "10px", color: "#888" }}>+${Number(d.delivery_fee).toLocaleString("es-AR")} env.</div>}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {d.status === "Pendiente" && (
                      <>
                        <button onClick={() => handleStatusChange(d.id, "En camino")} title="Marcar En camino" style={{ background: "#3498db", border: "none", borderRadius: "6px", padding: "4px 8px", color: "#fff", cursor: "pointer", fontSize: "11px", marginRight: "4px" }}>🚚</button>
                        <button onClick={() => handleConfirm(d.id)} title="Confirmar entrega" style={{ background: "#27ae60", border: "none", borderRadius: "6px", padding: "4px 8px", color: "#fff", cursor: "pointer", fontSize: "11px", marginRight: "4px" }}>✓</button>
                        <button onClick={() => handleCancel(d.id)} title="Cancelar" style={{ background: "#e74c3c", border: "none", borderRadius: "6px", padding: "4px 8px", color: "#fff", cursor: "pointer", fontSize: "11px" }}>✕</button>
                      </>
                    )}
                    {d.status === "En camino" && (
                      <>
                        <button onClick={() => handleConfirm(d.id)} title="Confirmar entrega" style={{ background: "#27ae60", border: "none", borderRadius: "6px", padding: "4px 8px", color: "#fff", cursor: "pointer", fontSize: "11px", marginRight: "4px" }}>✓</button>
                        <button onClick={() => handleCancel(d.id)} title="Cancelar" style={{ background: "#e74c3c", border: "none", borderRadius: "6px", padding: "4px 8px", color: "#fff", cursor: "pointer", fontSize: "11px" }}>✕</button>
                      </>
                    )}
                    {d.status === "Entregado" && <span style={{ color: "#27ae60", fontSize: "18px" }}>✓</span>}
                    {d.status === "Cancelado" && <span style={{ color: "#e74c3c", fontSize: "18px" }}>✕</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Delivery Modal */}
      {showNew && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={e => e.target === e.currentTarget && setShowNew(false)}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "440px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "18px", fontWeight: 800 }}>🚚 Nueva Entrega</h3>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>ID del Pedido *</label>
                <input type="number" required value={newForm.order_id} onChange={e => setNewForm(f => ({ ...f, order_id: e.target.value }))} placeholder="1" style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>Dirección de entrega</label>
                <input type="text" value={newForm.address} onChange={e => setNewForm(f => ({ ...f, address: e.target.value }))} placeholder="Av. Libertador 1234, Piso 3, Depto B" style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>Fecha pactada</label>
                <input type="date" value={newForm.scheduled_date} onChange={e => setNewForm(f => ({ ...f, scheduled_date: e.target.value }))} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>Costo de envío</label>
                <input type="number" value={newForm.delivery_fee} onChange={e => setNewForm(f => ({ ...f, delivery_fee: e.target.value }))} placeholder="0.00" style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>Notas</label>
                <textarea value={newForm.notes} onChange={e => setNewForm(f => ({ ...f, notes: e.target.value }))} placeholder="Portero: код 1234, timbre 4B..." style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px", minHeight: "60px", resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button type="button" onClick={() => setShowNew(false)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>Cancelar</button>
                <button type="submit" disabled={creating} style={{ flex: 2, padding: "10px", borderRadius: "8px", border: "none", background: "#27ae60", color: "#fff", cursor: "pointer", fontWeight: 700, opacity: creating ? 0.7 : 1 }}>{creating ? "Creando..." : "🚚 Crear Entrega"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}