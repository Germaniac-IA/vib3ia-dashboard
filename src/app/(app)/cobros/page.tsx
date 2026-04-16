"use client";

import { useEffect, useState } from "react";
import { fetchJson, postJson, deleteJson } from "../../lib";
import { Card, PageTitle, Loading, Empty } from "../../components/shared/UI";

type CashSession = { id: number; user_name: string; opened_at: string; status: string; initial_amount: number; total_in: number; total_out: number; move_count: number; total_cash: number; total_digital: number; };
type CashMovement = { id: number; type: string; reason: string; amount: number; account_name: string; contact_name: string; order_number: string; notes: string; created_at: string; };
type PaymentMethod = { id: number; name: string; requires_arqueo: boolean };
type Stats = { total_in: number; total_out: number; move_count: number; nv_count: number; net: number; };
type Period = "today" | "week" | "month";

export default function CobrosPage() {
  const [currentSession, setCurrentSession] = useState<any | null>(null);
  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [period, setPeriod] = useState<Period>("today");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMovForm, setShowMovForm] = useState(false);
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [movForm, setMovForm] = useState({ financial_account_id: "", direction: "in", reason: "", order_id: "", contact_id: "", amount: "", notes: "" });
  const [closeForm, setCloseForm] = useState({ final_amount: "", total_cash: "", total_digital: "", total_other: "", notes: "" });

  function load() {
    setLoading(true);
    Promise.all([
      fetchJson<any>("/cash-sessions/current"),
      fetchJson<CashSession[]>("/cash-sessions?status=closed"),
      fetchJson<Stats>("/cash/stats?period=" + period),
      fetchJson<PaymentMethod[]>("/payment-methods"),
    ]).then(([sess, sessList, st, pm]) => {
      setCurrentSession(sess);
      setSessions(sessList);
      setStats(st);
      setPaymentMethods(pm);
    }).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [refreshKey, period]);

  async function handleOpenSession() {
    try { await postJson("/cash-sessions", { initial_amount: 0 }); setRefreshKey(k => k + 1); }
    catch (e: any) { alert(e?.response?.data?.error || "Error"); }
  }

  function setMov(field: string, value: string) {
    setMovForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleRegisterMovement() {
    if (!movForm.amount || !movForm.financial_account_id) { alert("Completá cuenta y monto"); return; }
    try {
      await postJson("/cash-movements", {
        financial_account_id: Number(movForm.financial_account_id),
        type: movForm.direction,
        reason: movForm.reason || "other_in",
        order_id: movForm.order_id ? Number(movForm.order_id) : undefined,
        contact_id: movForm.contact_id ? Number(movForm.contact_id) : undefined,
        amount: Number(movForm.amount),
        notes: movForm.notes || undefined,
      });
      setShowMovForm(false);
      setMovForm({ financial_account_id: "", direction: "in", reason: "", order_id: "", contact_id: "", amount: "", notes: "" });
      setRefreshKey(k => k + 1);
    } catch (e: any) { alert(e?.response?.data?.error || "Error"); }
  }

  function setClose(field: string, value: string) {
    setCloseForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleCloseSession() {
    if (!currentSession) return;
    try {
      await postJson("/cash-sessions/" + currentSession.id + "/close", {
        final_amount: Number(closeForm.final_amount) || 0,
        total_cash: Number(closeForm.total_cash) || 0,
        total_digital: Number(closeForm.total_digital) || 0,
        total_other: Number(closeForm.total_other) || 0,
        notes: closeForm.notes || "",
      });
      setShowCloseForm(false);
      setCloseForm({ final_amount: "", total_cash: "", total_digital: "", total_other: "", notes: "" });
      setRefreshKey(k => k + 1);
    } catch (e: any) { alert(e?.response?.data?.error || "Error"); }
  }

  async function handleDeleteMovement(id: number) {
    if (!confirm("Anular este movimiento?")) return;
    try { await deleteJson("/cash-movements/" + id); setRefreshKey(k => k + 1); }
    catch (e: any) { alert(e?.response?.data?.error || "Error"); }
  }

  return (
    <div>
      <PageTitle>💰 Cobros</PageTitle>
      <p style={{ fontSize: "13px", color: "#888", margin: "2px 0 16px" }}>Gestioná la caja del día.</p>

      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px", marginBottom: "16px" }}>
          <div style={{ background: "#27ae60", borderRadius: "12px", padding: "14px", color: "#fff" }}>
            <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "4px" }}>Cobrado</div>
            <div style={{ fontSize: "22px", fontWeight: 800 }}>${stats.total_in.toLocaleString("es-AR")}</div>
          </div>
          <div style={{ background: "#e74c3c", borderRadius: "12px", padding: "14px", color: "#fff" }}>
            <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "4px" }}>Pagado</div>
            <div style={{ fontSize: "22px", fontWeight: 800 }}>${stats.total_out.toLocaleString("es-AR")}</div>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "14px", color: "#fff" }}>
            <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "4px" }}>Neto</div>
            <div style={{ fontSize: "22px", fontWeight: 800 }}>${stats.net.toLocaleString("es-AR")}</div>
          </div>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "14px", border: "1px solid #eee" }}>
            <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>Movimientos</div>
            <div style={{ fontSize: "22px", fontWeight: 800 }}>{stats.move_count}</div>
            <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>{stats.nv_count} NVs cobradas</div>
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

      {loading ? <Loading /> : (
        <>
          {currentSession ? (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ background: "#f0fff4", border: "1px solid #27ae60", borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "16px" }}>Caja abierta</div>
                    <div style={{ fontSize: "12px", color: "#888" }}>{currentSession.user_name} · Abierta {new Date(currentSession.opened_at).toLocaleString("es-AR")}</div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => setShowMovForm(true)} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#27ae60", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}>➕ Movimiento</button>
                    <button onClick={() => setShowCloseForm(true)} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#1a1a2e", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}>🔒 Cerrar Caja</button>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "16px", fontSize: "14px" }}>
                  <span>Cobrado: <b style={{ color: "#27ae60" }}>${Number(currentSession.total_in || 0).toLocaleString("es-AR")}</b></span>
                  {Number(currentSession.total_cash) > 0 && <span>Efectivo: <b>${Number(currentSession.total_cash).toLocaleString("es-AR")}</b></span>}
                </div>
              </div>

              {currentSession.movements?.length > 0 ? (
                <div style={{ display: "grid", gap: "6px" }}>
                  {currentSession.movements.map((m: CashMovement) => (
                    <Card key={m.id}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "20px" }}>{m.type === "in" ? "📥" : "📤"}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontWeight: 700, fontSize: "14px", color: m.type === "in" ? "#27ae60" : "#e74c3c" }}>
                              {m.type === "in" ? "+" : "-"}${Number(m.amount).toLocaleString("es-AR")}
                            </span>
                            <span style={{ fontSize: "12px", color: "#888" }}>{m.account_name}</span>
                            <span style={{ fontSize: "11px", background: "#f0f0f0", padding: "2px 6px", borderRadius: "4px", color: "#666" }}>
                              {m.reason === "nv_payment" ? "NV " + m.order_number : m.reason === "advance" ? "Anticipo" : "Otro"}
                            </span>
                          </div>
                          <div style={{ fontSize: "11px", color: "#aaa" }}>{new Date(m.created_at).toLocaleString("es-AR")} · {m.notes && m.notes}</div>
                        </div>
                        <button onClick={() => handleDeleteMovement(m.id)} style={{ background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontSize: "14px" }} title="Anular">🗑️</button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : <Empty message="Sin movimientos aun" />}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px", background: "#f9f9f9", borderRadius: "12px", marginBottom: "16px" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>💰</div>
              <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "8px" }}>No hay caja abierta</div>
              <div style={{ fontSize: "13px", color: "#888", marginBottom: "16px" }}>Abrila para registrar cobros y movimientos</div>
              <button onClick={handleOpenSession} style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: "#27ae60", color: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: 700 }}>➕ Abrir Caja</button>
            </div>
          )}

          {sessions.length > 0 && (
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "8px", color: "#666" }}>Cajas Cerradas</div>
              <div style={{ display: "grid", gap: "6px" }}>
                {sessions.map(s => (
                  <Card key={s.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "13px" }}>{s.user_name}</div>
                        <div style={{ fontSize: "11px", color: "#888" }}>{new Date(s.opened_at).toLocaleDateString("es-AR")} · {s.move_count} movimientos</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 800, color: "#27ae60" }}>${Number(s.total_in || 0).toLocaleString("es-AR")}</div>
                        <div style={{ fontSize: "11px", color: "#888" }}>Neto</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showMovForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={e => e.target === e.currentTarget && setShowMovForm(false)}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "420px" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: "18px", fontWeight: 800 }}>Registrar Movimiento</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>Tipo</label>
                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  <button onClick={() => setMov("direction", "in")} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "2px solid", borderColor: movForm.direction === "in" ? "#27ae60" : "#ddd", background: movForm.direction === "in" ? "#f0fff4" : "#fff", color: movForm.direction === "in" ? "#27ae60" : "#666", cursor: "pointer", fontWeight: 700 }}>📥 Cobro</button>
                  <button onClick={() => setMov("direction", "out")} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "2px solid", borderColor: movForm.direction === "out" ? "#e74c3c" : "#ddd", background: movForm.direction === "out" ? "#fde8e8" : "#fff", color: movForm.direction === "out" ? "#e74c3c" : "#666", cursor: "pointer", fontWeight: 700 }}>📤 Egreso</button>
                </div>
              </div>
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
                  <option value="advance">Anticipo cliente</option>
                  <option value="other_in">Otro ingreso</option>
                  <option value="other_out">Otro egreso</option>
                </select>
              </div>
              {movForm.reason === "nv_payment" && (
                <input type="number" value={movForm.order_id} onChange={e => setMov("order_id", e.target.value)} placeholder="ID de la NV" style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }} />
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
              <button onClick={handleRegisterMovement} style={{ flex: 2, padding: "10px", borderRadius: "8px", border: "none", background: "#27ae60", color: "#fff", cursor: "pointer", fontWeight: 700 }}>💾 Registrar</button>
            </div>
          </div>
        </div>
      )}

      {showCloseForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={e => e.target === e.currentTarget && setShowCloseForm(false)}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "420px" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: "18px", fontWeight: 800 }}>🔒 Cerrar Caja</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div><label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>Total cobrado efectivo</label><input type="number" value={closeForm.total_cash} onChange={e => setClose("total_cash", e.target.value)} placeholder="0.00" style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }} /></div>
              <div><label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>Total cobrado digital</label><input type="number" value={closeForm.total_digital} onChange={e => setClose("total_digital", e.target.value)} placeholder="0.00" style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }} /></div>
              <div><label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>Total otros</label><input type="number" value={closeForm.total_other} onChange={e => setClose("total_other", e.target.value)} placeholder="0.00" style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }} /></div>
              <div><label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>Monto real en caja</label><input type="number" value={closeForm.final_amount} onChange={e => setClose("final_amount", e.target.value)} placeholder="0.00" style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }} /></div>
              <div><label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>Notas</label><textarea value={closeForm.notes} onChange={e => setClose("notes", e.target.value)} placeholder="Observaciones..." style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px", minHeight: "60px", resize: "vertical" }} /></div>
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button onClick={() => setShowCloseForm(false)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>Cancelar</button>
              <button onClick={handleCloseSession} style={{ flex: 2, padding: "10px", borderRadius: "8px", border: "none", background: "#1a1a2e", color: "#fff", cursor: "pointer", fontWeight: 700 }}>🔒 Cerrar Caja</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
