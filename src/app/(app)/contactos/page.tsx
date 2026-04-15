"use client";

import { useEffect, useState } from "react";
import { fetchJson, postJson, putJson, deleteJson } from "../../lib";
import { Card, IconButton, Input, Select, PageTitle, Loading, Empty } from "../../components/shared/UI";

type CondicionIva = { value: string; label: string };

type Contact = {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  location: string;
  notes: string;
  whatsapp: string;
  instagram: string;
  tiktok: string;
  condicion_iva: string;
  cuit: string;
  condicion_iibb: string;
  calificacion: number;
  deleted_at: string | null;
};

export default function ContactosPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [condicionesIva, setCondicionesIva] = useState<CondicionIva[]>([]);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", address: "", location: "", notes: "",
    whatsapp: "", instagram: "", tiktok: "",
    condicion_iva: "", cuit: "", condicion_iibb: "", calificacion: 5,
  });

  useEffect(() => {
    Promise.all([
      fetchJson<Contact[]>("/contacts"),
      fetchJson<CondicionIva[]>("/condiciones-iva"),
    ]).then(([c, iva]) => {
      setContacts(c);
      setCondicionesIva(iva);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function openNew() {
    setEditing(null);
    setForm({ name: "", phone: "", email: "", address: "", location: "", notes: "", whatsapp: "", instagram: "", tiktok: "", condicion_iva: "", cuit: "", condicion_iibb: "", calificacion: 5 });
    setShowForm(true);
  }

  function openEdit(c: Contact) {
    setEditing(c);
    setForm({
      name: c.name || "", phone: c.phone || "", email: c.email || "", address: c.address || "", location: c.location || "",
      notes: c.notes || "", whatsapp: c.whatsapp || "", instagram: c.instagram || "", tiktok: c.tiktok || "",
      condicion_iva: c.condicion_iva || "", cuit: c.cuit || "", condicion_iibb: c.condicion_iibb || "", calificacion: c.calificacion || 5,
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name && !form.phone) return;
    try {
      if (editing) {
        await putJson(`/contacts/${editing.id}`, form);
      } else {
        await postJson("/contacts", form);
      }
      setShowForm(false);
      fetchJson<Contact[]>("/contacts").then(setContacts);
    } catch (e) { console.error(e); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Eliminar contacto?")) return;
    try { await deleteJson(`/contacts/${id}`); fetchJson<Contact[]>("/contacts").then(setContacts); } catch (e) { console.error(e); }
  }

  const isConsumidorFinal = form.condicion_iva === "consumidor_final";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <PageTitle>👥 Contactos</PageTitle>
        <div style={{ display: "flex", gap: "8px" }}>
          <IconButton variant="primary" onClick={openNew}>+</IconButton>
        </div>
      </div>

      {showForm && (
        <Card style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700 }}>{editing ? "Editar contacto" : "Nuevo contacto"}</h3>
            {editing && (
              <button onClick={() => { handleDelete(editing.id); setShowForm(false); }}
                style={{ background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontSize: "13px" }}>
                Eliminar
              </button>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Input label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Input label="Teléfono" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Input label="WhatsApp" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} />
            <Input label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Input label="Instagram" value={form.instagram} onChange={(v) => setForm({ ...form, instagram: v })} />
            <Input label="TikTok" value={form.tiktok} onChange={(v) => setForm({ ...form, tiktok: v })} />
            <Input label="Dirección" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
            <Input label="Localidad" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
          </div>

          <div style={{ marginTop: "16px", padding: "12px", background: "#f8f8f8", borderRadius: "10px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "4px", color: "#555" }}>Condición IVA</label>
                <select value={form.condicion_iva} onChange={(e) => setForm({ ...form, condicion_iva: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "13px" }}>
                  <option value="">Sin asignar</option>
                  {condicionesIva.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <Input label="CUIL/CUIT" value={form.cuit} onChange={(v) => setForm({ ...form, cuit: v })} />
              <Input label="Condición IIBB" value={form.condicion_iibb} onChange={(v) => setForm({ ...form, condicion_iibb: v })} />
              {!isConsumidorFinal && (
                <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", padding: "8px", background: "#fff3cd", borderRadius: "8px", border: "1px solid #ffc107" }}>
                  <span style={{ fontSize: "12px" }}>⚠️ Estos campos son obligatorios para responsable inscripto</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: "12px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "4px", color: "#555" }}>
              Calificación: {form.calificacion}/10
            </label>
            <input type="range" min="1" max="10" value={form.calificacion}
              onChange={(e) => setForm({ ...form, calificacion: parseInt(e.target.value) })}
              style={{ width: "100%", accentColor: "#6c63ff" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#888", marginTop: "2px" }}>
              <span>1 - Bajo</span>
              <span>10 - Alto</span>
            </div>
          </div>

          <div style={{ marginTop: "12px" }}>
            <Input label="Notas" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
          </div>

          <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
            <IconButton variant="primary" onClick={handleSave}>✓</IconButton>
            <IconButton variant="secondary" onClick={() => setShowForm(false)}>✕</IconButton>
          </div>
        </Card>
      )}

      {loading ? <Loading /> : contacts.length === 0 ? (
        <Empty message="Sin contactos" />
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {contacts.map((c) => (
            <Card key={c.id} onClick={() => openEdit(c)} style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 700, fontSize: "15px" }}>{c.name || "Sin nombre"}</span>
                    {c.calificacion > 0 && (
                      <span style={{ fontSize: "11px", background: c.calificacion >= 7 ? "#27ae6022" : c.calificacion >= 4 ? "#f39c1215" : "#e74c3c22", color: c.calificacion >= 7 ? "#27ae60" : c.calificacion >= 4 ? "#f39c12" : "#e74c3c", padding: "2px 6px", borderRadius: "8px" }}>
                        ★ {c.calificacion}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "13px", color: "#666" }}>
                    {c.phone && <span>📞 {c.phone}</span>}
                    {c.whatsapp && <span>💬 {c.whatsapp}</span>}
                    {c.email && <span>✉️ {c.email}</span>}
                    {c.location && <span>📍 {c.location}</span>}
                  </div>
                  <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "#888", marginTop: "4px" }}>
                    {c.instagram && <span>📷 @{c.instagram.replace('@','')}</span>}
                    {c.tiktok && <span>🎵 @{c.tiktok.replace('@','')}</span>}
                    {c.condicion_iva && <span>🏛️ {condicionesIva.find(x => x.value === c.condicion_iva)?.label || c.condicion_iva}</span>}
                    {c.cuit && <span>🔢 {c.cuit}</span>}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
