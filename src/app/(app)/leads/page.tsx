"use client";

import { useEffect, useMemo, useState } from "react";
import { deleteJson, fetchJson, postJson, putJson } from "../../lib";
import { Badge, Button, Card, IconButton, Input, Loading, PageTitle, Empty } from "../../components/shared/UI";

type LeadStatus = "new" | "contacted" | "waiting" | "qualified" | "converted" | "rejected";

type Lead = {
  id: number;
  name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  location: string | null;
  instagram: string | null;
  facebook: string | null;
  source: string | null;
  source_channel: string | null;
  source_handle: string | null;
  external_contact_id: string | null;
  external_conversation_id: string | null;
  notes: string | null;
  first_message: string | null;
  last_message: string | null;
  status: LeadStatus;
  assigned_to: string | null;
  rejection_reason: string | null;
  interaction_count: number;
  converted_contact_id: number | null;
  converted_contact_name?: string | null;
  created_at: string;
  updated_at: string;
  last_interaction_at: string | null;
  converted_at: string | null;
};

type LeadInteraction = {
  id: number;
  channel: string | null;
  direction: string;
  message_type: string;
  content: string;
  sender_name: string | null;
  sender_handle: string | null;
  created_at: string;
};

type LeadForm = {
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  source: string;
  source_channel: string;
  source_handle: string;
  address: string;
  location: string;
  instagram: string;
  facebook: string;
  notes: string;
  first_message: string;
  last_message: string;
  status: LeadStatus;
  assigned_to: string;
  rejection_reason: string;
};

const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: "new", label: "Nuevo", color: "#6c63ff" },
  { value: "contacted", label: "Contactado", color: "#3498db" },
  { value: "waiting", label: "En espera", color: "#f39c12" },
  { value: "qualified", label: "Calificado", color: "#27ae60" },
  { value: "converted", label: "Convertido", color: "#16a085" },
  { value: "rejected", label: "Rechazado", color: "#e74c3c" },
];

const CHANNEL_OPTIONS = [
  { value: "", label: "Canal" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram_dm", label: "Instagram DM" },
  { value: "facebook_msg", label: "Facebook Message" },
  { value: "telegram", label: "Telegram" },
  { value: "web", label: "Web" },
  { value: "llamada", label: "Llamada" },
  { value: "referido", label: "Referido" },
  { value: "manual", label: "Manual" },
];

const emptyForm: LeadForm = {
  name: "",
  phone: "",
  whatsapp: "",
  email: "",
  source: "",
  source_channel: "",
  source_handle: "",
  address: "",
  location: "",
  instagram: "",
  facebook: "",
  notes: "",
  first_message: "",
  last_message: "",
  status: "new",
  assigned_to: "",
  rejection_reason: "",
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toForm(lead: Lead): LeadForm {
  return {
    name: lead.name || "",
    phone: lead.phone || "",
    whatsapp: lead.whatsapp || "",
    email: lead.email || "",
    source: lead.source || "",
    source_channel: lead.source_channel || "",
    source_handle: lead.source_handle || "",
    address: lead.address || "",
    location: lead.location || "",
    instagram: lead.instagram || "",
    facebook: lead.facebook || "",
    notes: lead.notes || "",
    first_message: lead.first_message || "",
    last_message: lead.last_message || "",
    status: lead.status,
    assigned_to: lead.assigned_to || "",
    rejection_reason: lead.rejection_reason || "",
  };
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [form, setForm] = useState<LeadForm>(emptyForm);
  const [interactions, setInteractions] = useState<LeadInteraction[]>([]);
  const [interactionDraft, setInteractionDraft] = useState("");
  const [interactionChannel, setInteractionChannel] = useState("manual");
  const [error, setError] = useState("");

  async function loadLeads() {
    const data = await fetchJson<Lead[]>("/leads");
    setLeads(data);
    return data;
  }

  useEffect(() => {
    loadLeads()
      .catch((err) => setError(err instanceof Error ? err.message : "No pude cargar leads"))
      .finally(() => setLoading(false));
  }, []);

  async function loadInteractions(leadId: number) {
    try {
      const data = await fetchJson<LeadInteraction[]>(`/leads/${leadId}/interactions`);
      setInteractions(data);
    } catch (err) {
      setInteractions([]);
      setError(err instanceof Error ? err.message : "No pude cargar interacciones");
    }
  }

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setInteractions([]);
    setInteractionDraft("");
    setInteractionChannel("manual");
    setError("");
    setShowForm(true);
  }

  function openEdit(lead: Lead) {
    setEditing(lead);
    setForm(toForm(lead));
    setInteractionDraft("");
    setInteractionChannel(lead.source_channel || lead.source || "manual");
    setError("");
    setShowForm(true);
    loadInteractions(lead.id);
  }

  async function handleSave() {
    if (!form.name && !form.phone && !form.whatsapp && !form.email) {
      setError("Necesitás al menos un dato de contacto");
      return;
    }

    setSaving(true);
    setError("");
    try {
      if (editing) {
        await putJson(`/leads/${editing.id}`, form);
      } else {
        await postJson("/leads", form);
      }
      const updated = await loadLeads();
      if (editing) {
        const fresh = updated.find((lead) => lead.id === editing.id);
        if (fresh) openEdit(fresh);
      } else {
        setShowForm(false);
        setForm(emptyForm);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pude guardar el lead");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Eliminar lead?")) return;
    try {
      await deleteJson(`/leads/${id}`);
      await loadLeads();
      if (editing?.id === id) {
        setEditing(null);
        setShowForm(false);
        setInteractions([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pude eliminar el lead");
    }
  }

  async function handleStatusChange(lead: Lead, status: LeadStatus) {
    if (status === "converted") {
      await handleConvert(lead);
      return;
    }
    try {
      await putJson(`/leads/${lead.id}`, {
        status,
        rejection_reason: status === "rejected" ? lead.rejection_reason || "" : "",
      });
      const updated = await loadLeads();
      if (editing?.id === lead.id) {
        const fresh = updated.find((item) => item.id === lead.id);
        if (fresh) openEdit(fresh);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pude actualizar el estado");
    }
  }

  async function handleConvert(lead: Lead) {
    if (!confirm(`Convertir a ${lead.name || "este lead"} en contacto?`)) return;
    try {
      await putJson(`/leads/${lead.id}/convert`, {});
      const updated = await loadLeads();
      if (editing?.id === lead.id) {
        const fresh = updated.find((item) => item.id === lead.id);
        if (fresh) openEdit(fresh);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pude convertir el lead");
    }
  }

  async function handleAddInteraction() {
    if (!editing || !interactionDraft.trim()) return;
    try {
      await postJson(`/leads/${editing.id}/interactions`, {
        channel: interactionChannel,
        content: interactionDraft,
        direction: "inbound",
        message_type: "text",
        sender_name: editing.name,
        sender_handle: editing.source_handle,
      });
      setInteractionDraft("");
      await Promise.all([loadLeads(), loadInteractions(editing.id)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pude guardar la interacción");
    }
  }

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (statusFilter && lead.status !== statusFilter) return false;
      if (!q) return true;
      return [
        lead.name,
        lead.phone,
        lead.whatsapp,
        lead.email,
        lead.location,
        lead.address,
        lead.source,
        lead.source_channel,
        lead.source_handle,
        lead.notes,
        lead.last_message,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [leads, search, statusFilter]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <PageTitle title="📍 Leads" />
        <IconButton variant="primary" title="Nuevo lead" onClick={openNew}>+</IconButton>
      </div>

      <Card style={{ marginBottom: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
          <Input label="Buscar" value={search} onChange={setSearch} placeholder="Nombre, canal, teléfono, mensaje..." />
          <div>
            <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "4px", color: "#555" }}>Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px", background: "#fff" }}
            >
              <option value="">Todos</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {showForm && (
        <Card style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>{editing ? "Editar lead" : "Nuevo lead"}</h3>
            {editing ? (
              <div style={{ display: "flex", gap: "8px" }}>
                <Button variant="secondary" onClick={() => handleConvert(editing)} disabled={editing.status === "converted"}>
                  Convertir a contacto
                </Button>
                <Button variant="danger" onClick={() => handleDelete(editing.id)}>Eliminar</Button>
              </div>
            ) : null}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Input label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Input label="Asignado a" value={form.assigned_to} onChange={(v) => setForm({ ...form, assigned_to: v })} placeholder="Operador o agente" />
            <Input label="Teléfono" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Input label="WhatsApp" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} />
            <Input label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Input label="Localidad" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
            <Input label="Dirección" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
            <Input label="Origen" value={form.source} onChange={(v) => setForm({ ...form, source: v })} placeholder="Campaña, referido, ads..." />
            <div>
              <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "4px", color: "#555" }}>Canal</label>
              <select
                value={form.source_channel}
                onChange={(e) => setForm({ ...form, source_channel: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px", background: "#fff" }}
              >
                {CHANNEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <Input label="Handle / usuario" value={form.source_handle} onChange={(v) => setForm({ ...form, source_handle: v })} placeholder="@usuario o alias" />
            <Input label="Instagram" value={form.instagram} onChange={(v) => setForm({ ...form, instagram: v })} />
            <Input label="Facebook" value={form.facebook} onChange={(v) => setForm({ ...form, facebook: v })} />
            <div>
              <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "4px", color: "#555" }}>Estado</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as LeadStatus })}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px", background: "#fff" }}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: "12px" }}>
            <Input label="Primer mensaje" value={form.first_message} onChange={(v) => setForm({ ...form, first_message: v })} />
            <Input label="Último mensaje" value={form.last_message} onChange={(v) => setForm({ ...form, last_message: v })} />
            <Input label="Notas" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
            {form.status === "rejected" && (
              <Input label="Motivo de rechazo" value={form.rejection_reason} onChange={(v) => setForm({ ...form, rejection_reason: v })} />
            )}
          </div>

          {error && <div style={{ marginTop: "8px", color: "#e74c3c", fontSize: "13px" }}>{error}</div>}

          <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear lead"}</Button>
            <Button variant="secondary" onClick={() => { setShowForm(false); setEditing(null); setError(""); }}>Cerrar</Button>
          </div>

          {editing && (
            <div style={{ marginTop: "24px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h4 style={{ margin: 0, fontSize: "15px" }}>Interacciones</h4>
                <span style={{ fontSize: "12px", color: "#888" }}>{interactions.length} registradas</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "180px 1fr auto", gap: "8px", marginBottom: "12px" }}>
                <select
                  value={interactionChannel}
                  onChange={(e) => setInteractionChannel(e.target.value)}
                  style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px", background: "#fff" }}
                >
                  {CHANNEL_OPTIONS.filter((option) => option.value).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <input
                  value={interactionDraft}
                  onChange={(e) => setInteractionDraft(e.target.value)}
                  placeholder="Registrar nueva interacción"
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }}
                />
                <Button onClick={handleAddInteraction}>Agregar</Button>
              </div>

              {interactions.length === 0 ? (
                <Empty message="Sin interacciones registradas" />
              ) : (
                <div style={{ display: "grid", gap: "10px" }}>
                  {interactions.map((interaction) => (
                    <div key={interaction.id} style={{ border: "1px solid #eee", borderRadius: "10px", padding: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <Badge color="#6c63ff">{interaction.channel || "manual"}</Badge>
                        <span style={{ fontSize: "12px", color: "#888" }}>{formatDate(interaction.created_at)}</span>
                      </div>
                      <div style={{ fontSize: "14px", color: "#333" }}>{interaction.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {loading ? <Loading /> : filteredLeads.length === 0 ? (
        <Empty message="Sin leads registrados" />
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {filteredLeads.map((lead) => {
            const statusMeta = STATUS_OPTIONS.find((option) => option.value === lead.status) || STATUS_OPTIONS[0];
            return (
              <Card key={lead.id} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
                  <div style={{ flex: 1 }} onClick={() => openEdit(lead)}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                      <span style={{ fontWeight: 700, fontSize: "15px" }}>{lead.name || "Sin nombre"}</span>
                      <Badge color={statusMeta.color}>{statusMeta.label}</Badge>
                      {lead.converted_contact_name ? <Badge color="#16a085">Contacto: {lead.converted_contact_name}</Badge> : null}
                    </div>
                    <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", fontSize: "13px", color: "#666" }}>
                      {lead.phone && <span>📞 {lead.phone}</span>}
                      {lead.whatsapp && <span>💬 {lead.whatsapp}</span>}
                      {lead.email && <span>✉️ {lead.email}</span>}
                      {(lead.source_channel || lead.source) && <span>📡 {lead.source_channel || lead.source}</span>}
                      {lead.location && <span>📍 {lead.location}</span>}
                    </div>
                    {(lead.last_message || lead.notes) && (
                      <div style={{ marginTop: "8px", fontSize: "13px", color: "#555" }}>
                        {lead.last_message || lead.notes}
                      </div>
                    )}
                    <div style={{ marginTop: "8px", display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "12px", color: "#888" }}>
                      <span>Creado: {formatDate(lead.created_at)}</span>
                      <span>Última interacción: {formatDate(lead.last_interaction_at || lead.updated_at)}</span>
                      <span>Interacciones: {lead.interaction_count || 0}</span>
                      {lead.assigned_to && <span>Asignado: {lead.assigned_to}</span>}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "180px" }}>
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead, e.target.value as LeadStatus)}
                      style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px", background: "#fff" }}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <Button variant="secondary" onClick={() => openEdit(lead)}>Abrir ficha</Button>
                    <Button onClick={() => handleConvert(lead)} disabled={lead.status === "converted"}>Convertir</Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
