"use client";

import { useEffect, useState } from "react";
import { fetchJson, postJson } from "../../lib";

type Session = { id: number; user_name: string; opened_at: string; status: string; total_in: number; total_out: number; } | null;
type OpenSession = { id: number; user_name: string; user_id: number; opened_at: string; total_in: number; total_out: number; session_type: string; };

export default function CashStatusBar() {
  const [session, setSession] = useState<Session>(null);
  const [loading, setLoading] = useState(true);
  const [showClose, setShowClose] = useState(false);
  const [showOpen, setShowOpen] = useState(false);
  const [openSessions, setOpenSessions] = useState<OpenSession[]>([]);
  const [closeForm, setCloseForm] = useState({ total_cash: "", total_digital: "", total_other: "", final_amount: "", notes: "" });
  const [closing, setClosing] = useState(false);

  function load() {
    fetchJson<Session>("/cash-sessions/current")
      .then(setSession)
      .catch(() => setSession(null))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleOpen() {
    // Check for other open sessions
    try {
      const others = await fetchJson<OpenSession[]>("/cash-sessions/open");
      setOpenSessions(others);
      setShowOpen(true);
    } catch {
      // No other sessions, just open
      try {
        await postJson("/cash-sessions", { initial_amount: 0 });
        load();
      } catch (e) { alert("Error al abrir caja"); }
    }
  }

  async function handleJoin(sessionId: number) {
    try {
      await postJson("/cash-sessions/" + sessionId + "/join", {});
      setShowOpen(false);
      load();
    } catch (e) { alert("Error al sumarse a la caja"); }
  }

  async function handleOpenOwn() {
    try {
      await postJson("/cash-sessions", { initial_amount: 0 });
      setShowOpen(false);
      load();
    } catch (e) { alert("Error al abrir caja"); }
  }

  async function handleClose() {
    if (!session) return;
    setClosing(true);
    try {
      await postJson("/cash-sessions/" + session.id + "/close", {
        final_amount: Number(closeForm.final_amount) || 0,
        total_cash: Number(closeForm.total_cash) || 0,
        total_digital: Number(closeForm.total_digital) || 0,
        total_other: Number(closeForm.total_other) || 0,
        notes: closeForm.notes || "",
      });
      setShowClose(false);
      setCloseForm({ total_cash: "", total_digital: "", total_other: "", final_amount: "", notes: "" });
      load();
    } catch (e) { alert("Error al cerrar caja"); }
    finally { setClosing(false); }
  }

  if (loading) return null;

  if (!session) {
    return (
      <div style={{ background: "#f5f5f5", borderBottom: "1px solid #e0e0e0", padding: "6px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "12px", color: "#888" }}>💰 Caja cerrada</span>
        <button onClick={handleOpen} style={{ padding: "4px 12px", borderRadius: "6px", border: "none", background: "#27ae60", color: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>
          ➕ Abrir Caja
        </button>

        {showOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={e => e.target === e.currentTarget && setShowOpen(false)}>
            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "420px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "18px", fontWeight: 800 }}>💰 Abrir Caja</h3>

              {openSessions.length > 0 && (
                <>
                  <p style={{ fontSize: "13px", color: "#666", margin: "0 0 12px" }}>
                    Hay cajas abiertas de otros usuarios:
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                    {openSessions.map(s => {
                      const net = Number(s.total_in || 0) - Number(s.total_out || 0);
                      return (
                        <div key={s.id} onClick={() => handleJoin(s.id)}
                          style={{ padding: "12px", borderRadius: "10px", border: "2px solid #27ae60", background: "#f0fff4", cursor: "pointer" }}>
                          <div style={{ fontWeight: 700, fontSize: "14px", color: "#1a1a2e" }}>@{s.user_name}</div>
                          <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
                            Abierta desde {new Date(s.opened_at).toLocaleString("es-AR")}
                            {" · "}IN: ${Number(s.total_in || 0).toLocaleString("es-AR")}
                            {" · "}OUT: ${Number(s.total_out || 0).toLocaleString("es-AR")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ borderTop: "1px solid #eee", paddingTop: "12px" }}>
                    <p style={{ fontSize: "13px", color: "#888", margin: "0 0 8px" }}>¿O preferís abrir tu propia caja?</p>
                    <button onClick={handleOpenOwn} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "none", background: "#27ae60", color: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: 700 }}>
                      ➕ Abrir mi propia caja
                    </button>
                  </div>
                </>
              )}

              {openSessions.length === 0 && (
                <>
                  <p style={{ fontSize: "13px", color: "#666", margin: "0 0 16px" }}>No hay cajas abiertas. ¿Abrís la tuya?</p>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => setShowOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>Cancelar</button>
                    <button onClick={handleOpenOwn} style={{ flex: 2, padding: "10px", borderRadius: "8px", border: "none", background: "#27ae60", color: "#fff", cursor: "pointer", fontWeight: 700 }}>➕ Abrir caja</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  const net = Number(session.total_in || 0) - Number(session.total_out || 0);
  const netColor = net >= 0 ? "#27ae60" : "#e74c3c";

  return (
    <>
      <div style={{ background: "#1a1a2e", borderBottom: "1px solid #e0e0e0", padding: "6px 16px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "14px" }}>💰</span>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#27ae60" }}>CAJA ABIERTA</span>
        </div>
        <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#ccc" }}>
          <span>📥 ${Number(session.total_in || 0).toLocaleString("es-AR")}</span>
          <span>📤 ${Number(session.total_out || 0).toLocaleString("es-AR")}</span>
          <span style={{ color: netColor, fontWeight: 700 }}>Neto: {net >= 0 ? "+" : ""}${net.toLocaleString("es-AR")}</span>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowClose(true)} style={{ padding: "4px 12px", borderRadius: "6px", border: "1px solid #e74c3c", background: "transparent", color: "#e74c3c", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>
          🔒 Cerrar Caja
        </button>
      </div>

      {showClose && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={e => e.target === e.currentTarget && setShowClose(false)}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "400px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "18px", fontWeight: 800 }}>🔒 Cerrar Caja</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div><label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>Total efectivo</label>
                <input type="number" value={closeForm.total_cash} onChange={e => setCloseForm(f => ({ ...f, total_cash: e.target.value }))} placeholder="0.00" style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }} /></div>
              <div><label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>Total digital</label>
                <input type="number" value={closeForm.total_digital} onChange={e => setCloseForm(f => ({ ...f, total_digital: e.target.value }))} placeholder="0.00" style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }} /></div>
              <div><label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>Total otros</label>
                <input type="number" value={closeForm.total_other} onChange={e => setCloseForm(f => ({ ...f, total_other: e.target.value }))} placeholder="0.00" style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }} /></div>
              <div><label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>Notas de cierre</label>
                <textarea value={closeForm.notes} onChange={e => setCloseForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observaciones..." style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px", minHeight: "60px", resize: "vertical" }} /></div>
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button onClick={() => setShowClose(false)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>Cancelar</button>
              <button onClick={handleClose} disabled={closing} style={{ flex: 2, padding: "10px", borderRadius: "8px", border: "none", background: "#e74c3c", color: "#fff", cursor: "pointer", fontWeight: 700, opacity: closing ? 0.7 : 1 }}>{closing ? "Cerrando..." : "🔒 Cerrar Caja"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
