"use client";

import { useEffect, useState } from "react";
import { fetchJson, postJson } from "../../lib";

type Session = { id: number; user_name: string; opened_at: string; status: string; total_in: number; total_out: number; } | null;
type OpenSession = { id: number; user_name: string; user_id: number; opened_at: string; total_in: number; total_out: number; session_type: string; };

export default function CashStatusBar() {
  const [session, setSession] = useState<Session>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    fetchJson<Session>("/cash-sessions/current")
      .then(setSession)
      .catch(() => setSession(null))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  if (loading) return null;
  if (!session) return null; // No bar when closed - button is in header

  const net = Number(session.total_in || 0) - Number(session.total_out || 0);
  const netColor = net >= 0 ? "#27ae60" : "#e74c3c";

  return (
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
    </div>
  );
}

// Export a separate hook and action for use in AppShell header
export function useCashSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [openSessions, setOpenSessions] = useState<OpenSession[]>([]);
  const [showOpen, setShowOpen] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [closeForm, setCloseForm] = useState({ total_cash: "", total_digital: "", total_other: "", final_amount: "", notes: "" });
  const [closing, setClosing] = useState(false);

  function load() {
    fetchJson<Session>("/cash-sessions/current")
      .then(setSession)
      .catch(() => setSession(null));
  }

  useEffect(() => { load(); }, []);

  async function handleOpen() {
    try {
      const others = await fetchJson<OpenSession[]>("/cash-sessions/open");
      setOpenSessions(others);
      setShowOpen(true);
    } catch {
      try { await postJson("/cash-sessions", { initial_amount: 0 }); load(); } catch (e) { alert("Error al abrir caja"); }
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

  return { session, openSessions, showOpen, setShowOpen, showClose, setShowClose, closeForm, setCloseForm, closing, handleOpen, handleJoin, handleOpenOwn, handleClose };
}
