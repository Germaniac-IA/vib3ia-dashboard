"use client";

import { useEffect, useState } from "react";
import { fetchJson, postJson, deleteJson } from "../../lib";
import { Card, PageTitle, Loading, Empty } from "../../components/shared/UI";

type CashMovement = { id: number; type: string; reason: string; amount: number; account_name: string; client_name: string; order_number: string; notes: string; created_at: string; };
type PaymentMethod = { id: number; name: string; requires_arqueo: boolean };
type Stats = { total_in: number; total_out: number; move_count: number; nv_count: number; net: number; };
type Period = "today" | "week" | "month";

export default function CobrosPage() {
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [period, setPeriod] = useState<Period>("today");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMovForm, setShowMovForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [movForm, setMovForm] = useState({ financial_account_id: "", reason: "nv_payment", order_id: "", client_id: "", amount: "", notes: "" });

  function load() {
    setLoading(true);
    Promise.all([
      fetchJson<CashMovement[]>("/cash-movements?type=in&period=" + period),
      fetchJson<Stats>("/cash/stats?period=" + period),
      fetchJson<PaymentMethod[]>("/payment-methods"),
    ]).then(([mov, st, pm]) => {
      setMovements(mov);
      setStats(st);
      setPaymentMethods(pm);
    }).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [refreshKey, period]);

  function setMov(field: string, value: string) {
    setMovForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleRegisterMovement() {
    if (!movForm.amount || !movForm.financial_account_id) { alert("Completá cuenta y monto"); return; }
    try {
      await postJson("/cash-movements", {
        financial_account_id: Number(movForm.financial_account_id),
        type: "in",
        reason: movForm.reason || "other_in",
        order_id: movForm.order_id ? Number(movForm.order_id) : undefined,
        client_id: movForm.client_id ? Number(movForm.client_id) : undefined,
        amount: Number(movForm.amount),
        notes: movForm.notes || undefined,
      });
      setShowMovForm(false);
      setMovForm({ financial_account_id: "", reason: "nv_payment", order_id: "", client_id: "", amount: "", notes: "" });
      setRefreshKey(k => k + 1);
    } catch (e: any) { alert(e?.response?.data?.error || "Error"); }
  }

  async function handleDeleteMovement(id: number) {
    if (!confirm("Anular este cobro?")) return;
    try { await deleteJson("/cash-movements/" + id); setRefreshKey(k => k + 1); }
    catch (e: any) { alert(e?.response?.data?.error || "Error"); }
  }

  return (
    <div>
      <PageTitle>💰 Cobros</PageTitle>
      <p style={{ fontSize: "13px", color: "#888", margin: "2px 0 16px" }}>Registrá los cobros de ventas. Usá la barra de arriba para abrir/cerrar caja.</p>

      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px", marginBottom: "16px" }}>
          <div style={{ background: "#27ae60", borderRadius: "12px", padding: "14px", color: "#fff" }}>
            <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "4px" }}>Total cobrado (ingresos)</div>
            <div style={{ fontSize: "22px", fontWeight: 800 }}>${stats.total_in.toLocaleString("es-AR")}</div>
          </div>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "14px", border: "1px solid #eee" }}>
            <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>Neto del periodo</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: stats.net >= 0 ? "#27ae60" : "#e74c3c" }}>${stats.net.toLocaleString("es-AR")}</div>
          </div>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "14px", border: "1px solid #eee" }}>
            <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>Movimientos</div>
            <div style={{ fontSize: "22px", fontWeight: 800 }}>{stats.move_count}</div>
            <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>{stats.nv_count} NV cobradas</div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "4px", background: "#f0f0f0", padding: "3px", borderRadius: "8px", marginBottom: "12px", width: "fit-content" }}>
        {(["today", "week", "month"] as Period[]).map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{ padding: "5px 12px", borderRadius: "6px", border: "none", background: period === p ? "#1a1a2e" : "transparent", color: period === p ? "#fff" : "#666", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>
            {p === "today" ? "Hoy" : p === "week" ? "Semana" : "Mes"}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
        <button onClick={() => setShowMovForm(true)} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#27ae60", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 700 }}>💰 Registrar Cobro</button>
      </div>

      {loading ? <Loading /> : movements.length === 0 ? <Empty message="Sin cobros registrados" /> : (
        <div style={{ display: "grid", gap: "6px" }}>
          {movements.map(m => (
            <Card key={m.id}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "20px" }}>📥</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: 700, fontSize: "14px", color: "#27ae60" }}>+${Number(m.amount).toLocaleString("es-AR")}</span>
                    <span style={{ fontSize: "12px", color: "#888" }}>{m.account_name}</span>
                    <span style={{ fontSize: "11px", background: "#f0f0f0", padding: "2px 6px", borderRadius: "4px", color: "#666" }}>
                      {m.reason === "nv_payment" ? "NV " + (m.order_number || "") : m.reason === "advance" ? "Anticipo" : m.reason === "other_in" ? "Ingreso" : "Otro"}
                    </span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#aaa" }}>{new Date(m.created_at).toLocaleString("es-AR")}{m.notes && " · " + m.notes}</div>
                </div>
                <button onClick={() => handleDeleteMovement(m.id)} style={{ background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontSize: "14px" }} title="Anular">🗑️</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showMovForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={e => e.target === e.currentTarget && setShowMovForm(false)}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "420px" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: "18px", fontWeight: 800 }}>💰 Registrar Cobro</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>Cuenta *</label>
                <select value={movForm.financial_account_id} onChange={e => setMov("financial_account_id", e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }}>
                  <option value="">Seleccionar cuenta</option>
                  {paymentMethods.map(pm => <option key={pm.id} value={pm.id}>{pm.name}{pm.requires_arqueo ? " (arqueo)" : ""}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>Motivo</label>
                <select value={movForm.reason} onChange={e => setMov("reason", e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }}>
                  <option value="nv_payment">Cobro de NV</option>
                  <option value="advance">Anticipo de cliente</option>
                  <option value="other_in">Otro ingreso</option>
                </select>
              </div>
              {movForm.reason === "nv_payment" && (
                <input type="number" value={movForm.order_id} onChange={e => setMov("order_id", e.target.value)} placeholder="ID de NV cobrada" style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }} />
              )}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>Monto *</label>
                <input type="number" value={movForm.amount} onChange={e => setMov("amount", e.target.value)} placeholder="0.00" style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>Notas</label>
                <textarea value={movForm.notes} onChange={e => setMov("notes", e.target.value)} placeholder="Observaciones..." style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px", minHeight: "60px", resize: "vertical" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button onClick={() => setShowMovForm(false)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>Cancelar</button>
              <button onClick={handleRegisterMovement} style={{ flex: 2, padding: "10px", borderRadius: "8px", border: "none", background: "#27ae60", color: "#fff", cursor: "pointer", fontWeight: 700 }}>💰 Registrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
