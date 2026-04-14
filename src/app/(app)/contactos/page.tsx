"use client";

import { useEffect, useState } from "react";
import { fetchJson, postJson } from "../../lib";
import { Card, IconButton, Input, PageTitle, Loading, Empty } from "../../components/shared/UI";

type Contact = {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  location: string;
  notes: string;
};

export default function ContactosPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", location: "", notes: "" });

  useEffect(() => {
    fetchJson<Contact[]>("/contacts")
      .then(setContacts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    if (!form.name && !form.phone) return;
    try {
      await postJson("/contacts", form);
      setForm({ name: "", phone: "", email: "", address: "", location: "", notes: "" });
      setShowForm(false);
      fetchJson<Contact[]>("/contacts").then(setContacts);
    } catch (e) { console.error(e); }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <PageTitle>👥 Contactos</PageTitle>
        <IconButton variant="primary" title="Nuevo contacto" onClick={() => setShowForm(!showForm)}>+</IconButton>
      </div>

      {showForm && (
        <Card style={{ marginBottom: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Input label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Input label="Teléfono" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Input label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Input label="Dirección" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
            <Input label="Localidad" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
            <Input label="Notas" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
          </div>
          <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
            <IconButton variant="primary" onClick={handleAdd}>✓</IconButton>
            <IconButton variant="secondary" onClick={() => setShowForm(false)}>✕</IconButton>
          </div>
        </Card>
      )}

      {loading ? <Loading /> : contacts.length === 0 ? (
        <Empty message="Sin contactos" />
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {contacts.map((c) => (
            <Card key={c.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "15px" }}>{c.name || "Sin nombre"}</div>
                  <div style={{ fontSize: "13px", color: "#666", marginTop: "2px" }}>
                    📞 {c.phone || "—"} · 📍 {c.location || "—"}
                  </div>
                  {c.email && <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>✉️ {c.email}</div>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
