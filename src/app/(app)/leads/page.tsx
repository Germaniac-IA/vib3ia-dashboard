"use client";

import { useEffect, useState } from "react";
import { fetchJson, postJson, putJson } from "../../lib";
import { Card, Button, Input, Select, PageTitle, Loading, Empty, Badge } from "../../components/shared/UI";

type Lead = {
  id: number;
  name: string;
  phone: string;
  email: string;
  source: string;
  notes: string;
  status: string;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  new: "#3498db",
  contacted: "#f39c12",
  qualified: "#9b59b6",
  converted: "#27ae60",
  discarded: "#95a5a6",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", source: "", notes: "" });

  function load() {
    setLoading(true);
    fetchJson<Lead[]>("/leads")
      .then(setLeads)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleAdd() {
    try {
      await postJson("/leads", form);
      setForm({ name: "", phone: "", email: "", source: "", notes: "" });
      setShowForm(false);
      load();
    } catch (e) { console.error(e); }
  }

  async function updateStatus(id: number, status: string) {
    try {
      await putJson(`/leads/${id}`, { status });
      load();
    } catch (e) { console.error(e); }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <PageTitle>📍 Leads</PageTitle>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? "Cerrar" : "+ Nuevo Lead"}</Button>
      </div>

      {showForm && (
        <Card style={{ marginBottom: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Input label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Input label="Teléfono" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Input label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Input label="Fuente" value={form.source} onChange={(v) => setForm({ ...form, source: v })} placeholder="Instagram, Google, referred..." />
            <Input label="Notas" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
          </div>
          <div style={{ marginTop: "12px" }}>
            <Button onClick={handleAdd}>Agregar Lead</Button>
          </div>
        </Card>
      )}

      {loading ? <Loading /> : leads.length === 0 ? (
        <Empty message="No hay leads" />
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {leads.map((l) => (
            <Card key={l.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "15px" }}>{l.name || "Sin nombre"}</div>
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                    📞 {l.phone} · {new Date(l.created_at).toLocaleDateString("es-AR")}
                  </div>
                  {l.source && <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>Fuente: {l.source}</div>}
                  {l.notes && <div style={{ fontSize: "12px", color: "#aaa", marginTop: "4px" }}>{l.notes}</div>}
                </div>
                <select
                  value={l.status}
                  onChange={(e) => updateStatus(l.id, e.target.value)}
                  style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }}
                >
                  <option value="new">Nuevo</option>
                  <option value="contacted">Contactado</option>
                  <option value="qualified">Calificado</option>
                  <option value="converted">Convertido</option>
                  <option value="discarded">Descartado</option>
                </select>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
