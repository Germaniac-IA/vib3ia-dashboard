"use client";

import { useEffect, useState } from "react";
import { fetchJson, postJson, deleteJson } from "../../lib";
import { Card, PageTitle, Loading, Empty } from "../../components/shared/UI";

type CashMovement = { id: number; type: string; reason: string; amount: number; account_name: string; supplier_name: string; order_number: string; notes: string; created_at: string; };
type PaymentMethod = { id: number; name: string; requires_arqueo: boolean };
type Supplier = { id: number; name: string; phone: string; whatsapp: string; };
type UnpaidNP = { id: number; order_number: string; provider_name: string; total: number; payment_paid: number; payment_pending: number; };
type Stats = { total_in: number; total_out: number; move_count: number; nv_count: number; net: number; };
type Period = "today" | "week" | "month";

export default function PagosPage() {
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [period, setPeriod] = useState<Period>("today");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMovForm, setShowMovForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [movForm, setMovForm] = useState({ financial_account_id: "", reason: "", purchase_order_id: "", supplier_id: "", amount: "", notes: "" });
  const [saving, setSaving] = useState(false);

  // NP selector state
  const [unpaidNPs, setUnpaidNPs] = useState<UnpaidNP[]>([]);
  const [npSearch, setNpSearch] = useState("");
  const [showNpDropdown, setShowNpDropdown] = useState(false);
  const [selectedNp, setSelectedNp] = useState<UnpaidNP | null>(null);

  // Supplier selector state (for Anticipo)
  const [supSearch, setSupSearch] = useState("");
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  function load() {
    setLoading(true);
    Promise.all([
      fetchJson<CashMovement[]>("/cash-movements?type=out&period=" + period),
      fetchJson<Stats>("/cash/stats?period=" + period),
      fetchJson<PaymentMethod[]>("/payment-methods"),
      fetchJson<Supplier[]>("/providers"),
    ]).then(([mov, st, pm, ss]) => {
      setMovements(mov);
      setStats(st);
      setPaymentMethods(pm);
      setSuppliers(ss);
    }).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [refreshKey, period]);

  function setMov(field: string, value: string) {
    setMovForm(prev => ({ ...prev, [field]: value }));
  }

  function selectNp(np: UnpaidNP) {
    setSelectedNp(np);
    setMovForm(prev => ({ ...prev, purchase_order_id: String(np.id), amount: String(np.payment_pending) }));
    setNpSearch("");
    setShowNpDropdown(false);
  }

  function selectSupplier(supplier: Supplier) {
    setSelectedSupplier(supplier);
    setMovForm(prev => ({ ...prev, supplier_id: String(supplier.id) }));
    setSupSearch("");
    setShowSupplierDropdown(false);
  }

  const filteredNPs = unpaidNPs.filter(np =>
    !npSearch || np.order_number?.toLowerCase().includes(npSearch.toLowerCase()) ||
    (np.provider_name || "").toLowerCase().includes(npSearch.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(s =>
    !supSearch || s.name?.toLowerCase().includes(supSearch.toLowerCase()) ||
    (s.phone || "").includes(supSearch)
  );

  async function handleRegisterMovement() {
    if (!movForm.financial_account_id || !movForm.amount) { alert("Completá cuenta y monto"); return; }
    setSaving(true);
    try {
      await postJson("/cash-movements", {
        session_id: null,
        financial_account_id: Number(movForm.financial_account_id),
        type: "out",
        reason: movForm.reason || "other_out",
        purchase_order_id: movForm.purchase_order_id ? Number(movForm.purchase_order_id) : undefined,
        supplier_id: movForm.supplier_id ? Number(movForm.supplier_id) : undefined,
        amount: Number(movForm.amount),
        notes: movForm.notes || undefined,
      });
      setShowMovForm(false);
      setMovForm({ financial_account_id: "", reason: "", purchase_order_id: "", supplier_id: "", amount: "", notes: "" });
      setSelectedNp(null);
      setSelectedSupplier(null);
      setNpSearch("");
      setSupSearch("");
      setRefreshKey(k => k + 1);
    } catch (e: any) { alert(e?.message || e?.response?.data?.error || "Error"); }
    finally { setSaving(false); }
  }

  function openMovForm() {
    setSelectedNp(null);
    setSelectedSupplier(null);
    setNpSearch("");
    setSupSearch("");
    setMovForm({ financial_account_id: "", reason: "", purchase_order_id: "", supplier_id: "", amount: "", notes: "" });
    setUnpaidNPs([]);
    setShowMovForm(true);
    // Load unpaid NPs on first open
    fetchJson<UnpaidNP[]>("/purchase-orders").then(orders => {
      const unpaid = orders.filter((o: any) => {
        const paid = parseFloat(o.payment_paid || "0");
        const total = parseFloat(o.total || "0");
        return paid < total;
      });
      setUnpaidNPs(unpaid);
    }).catch(console.error);
  }

  async function handleDeleteMovement(id: number) {
    if (!confirm("Anular este pago?")) return;
    try { await deleteJson("/cash-movements/" + id); setRefreshKey(k => k + 1); }
    catch (e: any) { alert(e?.response?.data?.error || "Error"); }
  }

  return (
    <div>
      <PageTitle>💸 Pagos</PageTitle>
      <p style={{ fontSize: "13px", color: "#888", margin: "2px 0 16px" }}>Registrá los pagos a proveedores. Usá la barra de arriba para abrir/cerrar caja.</p>

      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px", marginBottom: "16px" }}>
          <div style={{ background: "#e74c3c", borderRadius: "12px", padding: "14px", color: "#fff" }}>
            <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "4px" }}>Total pagado (egresos)</div>
            <div style={{ fontSize: "22px", fontWeight: 800 }}>${stats.total_out.toLocaleString("es-AR")}</div>
          </div>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "14px", border: "1px solid #eee" }}>
            <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>Neto del periodo</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: stats.net >= 0 ? "#27ae60" : "#e74c3c" }}>${stats.net.toLocaleString("es-AR")}</div>
          </div>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "14px", border: "1px solid #eee" }}>
            <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>Movimientos</div>
            <div style={{ fontSize: "22px", fontWeight: 800 }}>{stats.move_count}</div>
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
        <button onClick={openMovForm} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#e74c3c", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 700 }}>💸 Registrar Pago</button>
      </div>

      {loading ? <Loading /> : movements.length === 0 ? <Empty message="Sin pagos registrados" /> : (
        <div style={{ display: "grid", gap: "6px" }}>
          {movements.map(m => (
            <Card key={m.id}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "20px" }}>📤</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: 700, fontSize: "14px", color: "#e74c3c" }}>-${Number(m.amount).toLocaleString("es-AR")}</span>
                    <span style={{ fontSize: "12px", color: "#888" }}>{m.account_name}</span>
                    <span style={{ fontSize: "11px", background: "#f0f0f0", padding: "2px 6px", borderRadius: "4px", color: "#666" }}>
                      {m.reason === "np_payment" ? "NP " + (m.order_number || "") : m.reason === "advance" ? "Anticipo" : m.reason === "other_out" ? "Egreso" : "Otro"}
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
          <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "460px" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: "18px", fontWeight: 800 }}>💸 Registrar Pago</h2>
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
                <select value={movForm.reason} onChange={e => { setMov("reason", e.target.value); setSelectedNp(null); setSelectedSupplier(null); setMovForm(prev => ({ ...prev, purchase_order_id: "", supplier_id: "", amount: "" })); }} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }}>
                  <option value="">Seleccionar motivo...</option>
                  <option value="np_payment">Pago de NP</option>
                  <option value="advance">Anticipo a proveedor</option>
                  <option value="other_out">Otro egreso</option>
                </select>
              </div>

              {/* Pago de NP */}
              {movForm.reason === "np_payment" && (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>NP a pagar</label>
                  {selectedNp ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "#fef9f9", borderRadius: "8px", border: "1px solid #e74c3c" }}>
                      <span style={{ flex: 1, fontSize: "14px", fontWeight: 700 }}>
                        {selectedNp.order_number} · {selectedNp.provider_name || "Sin proveedor"} · <span style={{ color: "#e74c3c" }}>${selectedNp.payment_pending.toLocaleString("es-AR")} pend.</span>
                      </span>
                      <button onClick={() => { setSelectedNp(null); setMovForm(prev => ({ ...prev, purchase_order_id: "", amount: "" })); }} style={{ background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontSize: "13px" }}>✕</button>
                    </div>
                  ) : (
                    <div style={{ position: "relative" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <input value={npSearch} onChange={e => { setNpSearch(e.target.value); setShowNpDropdown(true); }} onFocus={() => setShowNpDropdown(true)} placeholder="Buscar NP por número o proveedor..." style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }} />
                      </div>
                      {showNpDropdown && (
                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, border: "1px solid #ddd", borderRadius: "8px", marginTop: "4px", maxHeight: "220px", overflowY: "auto", background: "#fff", zIndex: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                          {filteredNPs.length === 0 ? (
                            <div style={{ padding: "12px", fontSize: "12px", color: "#999", textAlign: "center" }}>Sin NP pendientes</div>
                          ) : filteredNPs.slice(0, 15).map(np => (
                            <div key={np.id} onClick={() => selectNp(np)}
                              style={{ padding: "10px 14px", cursor: "pointer", fontSize: "13px", borderBottom: "1px solid #f0", display: "flex", justifyContent: "space-between" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f5")}
                              onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                              <span><b>{np.order_number}</b> · {np.provider_name || "Sin proveedor"}</span>
                              <span style={{ color: "#e74c3c", fontWeight: 700 }}>${np.payment_pending.toLocaleString("es-AR")} pend.</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Anticipo a Proveedor */}
              {movForm.reason === "advance" && (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>Proveedor *</label>
                  {selectedSupplier ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "#fef9f9", borderRadius: "8px", border: "1px solid #e74c3c" }}>
                      <span style={{ flex: 1, fontSize: "14px", fontWeight: 700 }}>{selectedSupplier.name}</span>
                      {selectedSupplier.phone && <span style={{ fontSize: "12px", color: "#666" }}>{selectedSupplier.phone}</span>}
                      <button onClick={() => { setSelectedSupplier(null); setMovForm(prev => ({ ...prev, supplier_id: "" })); }} style={{ background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontSize: "13px" }}>✕</button>
                    </div>
                  ) : (
                    <div style={{ position: "relative" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <input value={supSearch} onChange={e => { setSupSearch(e.target.value); setShowSupplierDropdown(true); }} onFocus={() => setShowSupplierDropdown(true)} placeholder="Buscar proveedor..." style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }} />
                        <button onClick={() => setShowSupplierDropdown(!showSupplierDropdown)} style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: "14px" }}>🔍</button>
                      </div>
                      {showSupplierDropdown && (
                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, border: "1px solid #ddd", borderRadius: "8px", marginTop: "4px", maxHeight: "200px", overflowY: "auto", background: "#fff", zIndex: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                          {filteredSuppliers.length === 0 ? (
                            <div style={{ padding: "12px", fontSize: "12px", color: "#999", textAlign: "center" }}>Sin resultados</div>
                          ) : filteredSuppliers.slice(0, 15).map(s => (
                            <div key={s.id} onClick={() => selectSupplier(s)}
                              style={{ padding: "10px 14px", cursor: "pointer", fontSize: "13px", borderBottom: "1px solid #f0", display: "flex", justifyContent: "space-between" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f5")}
                              onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                              <span><b>{s.name}</b></span>
                              <span style={{ color: "#888" }}>{s.phone}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
              <button onClick={handleRegisterMovement} disabled={saving} style={{ flex: 2, padding: "10px", borderRadius: "8px", border: "none", background: "#e74c3c", color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, opacity: saving ? 0.7 : 1, fontSize: "14px" }}>{saving ? "Registrando..." : "💸 Registrar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}