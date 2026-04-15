"use client";

import type { CSSProperties } from "react";
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
  first_message_at: string | null;
  last_message: string | null;
  last_message_at: string | null;
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

type UserOption = { id: number; name?: string; username?: string };
type AgentOption = { id: number; name: string };
type LeadSourceOption = { id: number; name: string; sort_order?: number };

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
  source_channel: "manual",
  source_handle: "",
  address: "",
  location: "",
  instagram: "",
  facebook: "",
  notes: "",
  status: "new",
  assigned_to: "",
  rejection_reason: "",
};

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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
    status: lead.status,
    assigned_to: lead.assigned_to || "",
    rejection_reason: lead.rejection_reason || "",
  };
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean).map((value) => String(value).trim()).filter(Boolean)));
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSourceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [form, setForm] = useState<LeadForm>(emptyForm);
  const [interactions, setInteractions] = useState<LeadInteraction[]>([]);
  const [interactionDraft, setInteractionDraft] = useState("");
  const [interactionChannel, setInteractionChannel] = useState("manual");
  const [interactionHandle, setInteractionHandle] = useState("");
  const [error, setError] = useState("");

  async function loadLeads() {
    const data = await fetchJson<Lead[]>("/leads");
    setLeads(data);
    return data;
  }

  async function loadOptions() {
    const [usersData, agentsData, sourcesData] = await Promise.all([
      fetchJson<UserOption[]>("/users"),
      fetchJson<AgentOption[]>("/agents"),
      fetchJson<LeadSourceOption[]>("/lead-sources"),
    ]);
    setUsers(usersData);
    setAgents(agentsData);
    setLeadSources(sourcesData);
  }

  useEffect(() => {
    Promise.all([loadLeads(), loadOptions()])
      .catch((err) => setError(err instanceof Error ? err.message : "No pude cargar leads"))
      .finally(() => setLoading(false));
  }, []);

  async function loadInteractions(leadId: number) {
    const data = await fetchJson<LeadInteraction[]>(`/leads/${leadId}/interactions`);
    setInteractions(data);
    return data;
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setInteractions([]);
    setInteractionDraft("");
    setInteractionChannel("manual");
    setInteractionHandle("");
    setError("");
  }

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setInteractions([]);
    setInteractionDraft("");
    setInteractionChannel("manual");
    setInteractionHandle("");
    setError("");
    setModalOpen(true);
  }

  async function openEdit(lead: Lead) {
    setEditing(lead);
    setForm(toForm(lead));
    setInteractionDraft("");
    setInteractionChannel(lead.source_channel || "manual");
    setInteractionHandle(lead.source_handle || "");
    setError("");
    setModalOpen(true);
    try {
      await loadInteractions(lead.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pude cargar interacciones");
    }
  }

  async function refreshAfterSave(leadId?: number) {
    const updated = await loadLeads();
    await loadOptions();
    if (leadId) {
      const fresh = updated.find((item) => item.id === leadId);
      if (fresh) {
        setEditing(fresh);
        setForm(toForm(fresh));
        setInteractionChannel(fresh.source_channel || interactionChannel || "manual");
        setInteractionHandle(fresh.source_handle || interactionHandle || "");
      }
    }
    return updated;
  }

  async function handleSave() {
    if (!form.name && !form.phone && !form.whatsapp && !form.email) {
      setError("Necesitás al menos un dato de contacto");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = editing
        ? {
            name: form.name,
            phone: form.phone,
            whatsapp: form.whatsapp,
            email: form.email,
            source: form.source,
            address: form.address,
            location: form.location,
            instagram: form.instagram,
            facebook: form.facebook,
            notes: form.notes,
            status: form.status,
            assigned_to: form.assigned_to,
            rejection_reason: form.status === "rejected" ? form.rejection_reason : "",
          }
        : form;

      if (editing) {
        await putJson(`/leads/${editing.id}`, payload);
        await refreshAfterSave(editing.id);
      } else {
        await postJson("/leads", payload);
        await loadLeads();
        closeModal();
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
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pude eliminar el lead");
    }
  }

  async function handleStatusChange(lead: Lead, status: LeadStatus) {
    if (status === "converted") return handleConvert(lead);
    try {
      await putJson(`/leads/${lead.id}`, { status });
      await refreshAfterSave(editing?.id === lead.id ? lead.id : undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pude actualizar el estado");
    }
  }

  async function handleConvert(lead: Lead) {
    if (!confirm(`Convertir a ${lead.name || "este lead"} en contacto?`)) return;
    try {
      await putJson(`/leads/${lead.id}/convert`, {});
      await refreshAfterSave(lead.id);
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
        sender_handle: interactionHandle || editing.source_handle,
      });
      setInteractionDraft("");
      const [updated] = await Promise.all([refreshAfterSave(editing.id), loadInteractions(editing.id)]);
      const fresh = updated.find((item) => item.id === editing.id);
      if (fresh) {
        setInteractionChannel(fresh.source_channel || interactionChannel);
        setInteractionHandle(fresh.source_handle || interactionHandle);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pude guardar la interacción");
    }
  }

  const assignmentOptions = useMemo(
    () => [
      ...users.map((user) => ({ value: user.name || user.username || `Usuario ${user.id}`, kind: "Usuario" })),
      ...agents.map((agent) => ({ value: agent.name, kind: "Agente" })),
    ],
    [users, agents]
  );

  const suggestions = useMemo(() => ({
    names: unique(leads.map((lead) => lead.name)),
    phones: unique(leads.flatMap((lead) => [lead.phone, lead.whatsapp])),
    emails: unique(leads.map((lead) => lead.email)),
    locations: unique(leads.map((lead) => lead.location)),
    addresses: unique(leads.map((lead) => lead.address)),
    handles: unique(leads.map((lead) => lead.source_handle)),
  }), [leads]);

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
                      {lead.source_handle && <span>👤 {lead.source_handle}</span>}
                      {lead.location && <span>📍 {lead.location}</span>}
                    </div>
                    {(lead.last_message || lead.notes) && (
                      <div style={{ marginTop: "8px", fontSize: "13px", color: "#555" }}>
                        {lead.last_message || lead.notes}
                      </div>
                    )}
                    <div style={{ marginTop: "8px", display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "12px", color: "#888" }}>
                      <span>Creado: {formatDateTime(lead.created_at)}</span>
                      <span>Último mensaje: {formatDateTime(lead.last_message_at || lead.last_interaction_at || lead.updated_at)}</span>
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

      {modalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            zIndex: 1000,
          }}
        >
          <div style={{ width: "min(1100px, 100%)", maxHeight: "92vh", overflow: "auto", background: "#fff", borderRadius: "18px", padding: "22px", boxShadow: "0 24px 70px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>{editing ? "Ficha del lead" : "Nuevo lead"}</h3>
                <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                  {editing ? `Creado ${formatDateTime(editing.created_at)}` : "Carga manual"}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {editing ? <Button variant="secondary" onClick={() => handleConvert(editing)} disabled={editing.status === "converted"}>Convertir</Button> : null}
                {editing ? <Button variant="danger" onClick={() => handleDelete(editing.id)}>Eliminar</Button> : null}
                <Button variant="secondary" onClick={closeModal}>Cerrar</Button>
              </div>
            </div>

            <datalist id="lead-name-suggestions">{suggestions.names.map((value) => <option key={value} value={value} />)}</datalist>
            <datalist id="lead-phone-suggestions">{suggestions.phones.map((value) => <option key={value} value={value} />)}</datalist>
            <datalist id="lead-email-suggestions">{suggestions.emails.map((value) => <option key={value} value={value} />)}</datalist>
            <datalist id="lead-location-suggestions">{suggestions.locations.map((value) => <option key={value} value={value} />)}</datalist>
            <datalist id="lead-address-suggestions">{suggestions.addresses.map((value) => <option key={value} value={value} />)}</datalist>
            <datalist id="lead-handle-suggestions">{suggestions.handles.map((value) => <option key={value} value={value} />)}</datalist>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "18px" }}>
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "4px", color: "#555" }}>Nombre</label>
                    <input list="lead-name-suggestions" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "4px", color: "#555" }}>Asignado a</label>
                    <select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} style={inputStyle}>
                      <option value="">Sin asignar</option>
                      {assignmentOptions.map((option) => (
                        <option key={`${option.kind}-${option.value}`} value={option.value}>{option.value} ({option.kind})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "4px", color: "#555" }}>Teléfono</label>
                    <input list="lead-phone-suggestions" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "4px", color: "#555" }}>WhatsApp</label>
                    <input list="lead-phone-suggestions" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "4px", color: "#555" }}>Email</label>
                    <input list="lead-email-suggestions" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "4px", color: "#555" }}>Estado</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as LeadStatus })} style={inputStyle}>
                      {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "4px", color: "#555" }}>Origen</label>
                    <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} style={inputStyle}>
                      <option value="">Sin origen</option>
                      {leadSources.map((option) => <option key={option.id} value={option.name}>{option.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "4px", color: "#555" }}>Canal</label>
                    {editing ? (
                      <input value={form.source_channel} readOnly style={{ ...inputStyle, background: "#f7f7f7" }} />
                    ) : (
                      <select value={form.source_channel} onChange={(e) => setForm({ ...form, source_channel: e.target.value })} style={inputStyle}>
                        {CHANNEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "4px", color: "#555" }}>Handle / usuario</label>
                    {editing ? (
                      <input value={form.source_handle} readOnly style={{ ...inputStyle, background: "#f7f7f7" }} />
                    ) : (
                      <input list="lead-handle-suggestions" value={form.source_handle} onChange={(e) => setForm({ ...form, source_handle: e.target.value })} style={inputStyle} />
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "4px", color: "#555" }}>Localidad</label>
                    <input list="lead-location-suggestions" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "4px", color: "#555" }}>Dirección</label>
                    <input list="lead-address-suggestions" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "4px", color: "#555" }}>Instagram</label>
                    <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "4px", color: "#555" }}>Facebook</label>
                    <input value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} style={inputStyle} />
                  </div>
                </div>

                <div style={{ marginTop: "14px" }}>
                  <Input label="Notas" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
                  {form.status === "rejected" && <Input label="Motivo de rechazo" value={form.rejection_reason} onChange={(v) => setForm({ ...form, rejection_reason: v })} />}
                </div>

                <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
                  <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear lead"}</Button>
                </div>
              </div>

              <div>
                <Card style={{ marginBottom: "12px", padding: "16px" }}>
                  <div style={{ fontWeight: 700, marginBottom: "10px" }}>Mensajes</div>
                  <div style={{ display: "grid", gap: "10px" }}>
                    <div style={messageBoxStyle}>
                      <div style={messageLabelStyle}>Primer mensaje</div>
                      <div style={{ fontSize: "13px", color: "#333" }}>{editing?.first_message || "-"}</div>
                      <div style={messageDateStyle}>{formatDateTime(editing?.first_message_at)}</div>
                    </div>
                    <div style={messageBoxStyle}>
                      <div style={messageLabelStyle}>Último mensaje</div>
                      <div style={{ fontSize: "13px", color: "#333" }}>{editing?.last_message || "-"}</div>
                      <div style={messageDateStyle}>{formatDateTime(editing?.last_message_at)}</div>
                    </div>
                  </div>
                </Card>

                {editing ? (
                  <Card style={{ padding: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <div style={{ fontWeight: 700 }}>Interacciones</div>
                      <span style={{ fontSize: "12px", color: "#888" }}>{interactions.length} registradas</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                      <select value={interactionChannel} onChange={(e) => setInteractionChannel(e.target.value)} style={inputStyle}>
                        {CHANNEL_OPTIONS.filter((option) => option.value).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                      <input list="lead-handle-suggestions" value={interactionHandle} onChange={(e) => setInteractionHandle(e.target.value)} placeholder="Handle / usuario" style={inputStyle} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px", marginBottom: "12px" }}>
                      <input value={interactionDraft} onChange={(e) => setInteractionDraft(e.target.value)} placeholder="Registrar interacción" style={inputStyle} />
                      <Button onClick={handleAddInteraction}>Agregar</Button>
                    </div>
                    <div style={{ display: "grid", gap: "8px", maxHeight: "320px", overflow: "auto" }}>
                      {interactions.length === 0 ? <Empty message="Sin interacciones registradas" /> : interactions.map((interaction) => (
                        <div key={interaction.id} style={{ border: "1px solid #eee", borderRadius: "10px", padding: "10px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <Badge color="#6c63ff">{interaction.channel || "manual"}</Badge>
                            <span style={{ fontSize: "12px", color: "#888" }}>{formatDateTime(interaction.created_at)}</span>
                          </div>
                          <div style={{ fontSize: "13px", color: "#333" }}>{interaction.content}</div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ) : (
                  <Card style={{ padding: "16px" }}>
                    <div style={{ fontSize: "13px", color: "#666" }}>
                      Cuando el lead nazca de una interacción, el canal y el handle se llenan desde ese primer contacto.
                    </div>
                  </Card>
                )}
              </div>
            </div>

            {error && <div style={{ marginTop: "14px", color: "#e74c3c", fontSize: "13px" }}>{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  fontSize: "14px",
  boxSizing: "border-box",
};

const messageBoxStyle: CSSProperties = {
  border: "1px solid #eee",
  borderRadius: "10px",
  padding: "12px",
  background: "#fcfcfc",
};

const messageLabelStyle: CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#666",
  marginBottom: "6px",
};

const messageDateStyle: CSSProperties = {
  marginTop: "8px",
  fontSize: "12px",
  color: "#888",
};
