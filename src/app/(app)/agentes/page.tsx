"use client";

import { useEffect, useState } from "react";
import { fetchJson, postJson, putJson, deleteJson } from "../../../lib";
import { Card, CardHeader, Button, Input, Select, PageTitle, Loading, Empty, Badge } from "../../../components/UI";

type Agent = {
  id: number;
  name: string;
  description: string;
  platform: string;
  is_active: boolean;
  working_hours: string;
  tone: string;
  industry_context: string;
  autonomy_level: string;
  instructions_permanent: string;
  instructions_transient: string;
};

export default function AgentesPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    platform: "web",
    tone: "casual",
    autonomy_level: "partial",
    working_hours: "09:00-18:00",
    industry_context: "",
    instructions_permanent: "",
    instructions_transient: "",
  });

  function loadAgents() {
    setLoading(true);
    fetchJson<Agent[]>("/agents")
      .then(setAgents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadAgents(); }, []);

  function openNew() {
    setEditingId(null);
    setForm({
      name: "",
      description: "",
      platform: "web",
      tone: "casual",
      autonomy_level: "partial",
      working_hours: "09:00-18:00",
      industry_context: "",
      instructions_permanent: "",
      instructions_transient: "",
    });
    setShowForm(true);
  }

  function openEdit(agent: Agent) {
    setEditingId(agent.id);
    setForm({
      name: agent.name,
      description: agent.description || "",
      platform: agent.platform,
      tone: agent.tone,
      autonomy_level: agent.autonomy_level,
      working_hours: agent.working_hours,
      industry_context: agent.industry_context || "",
      instructions_permanent: agent.instructions_permanent || "",
      instructions_transient: agent.instructions_transient || "",
    });
    setShowForm(true);
  }

  async function handleSave() {
    try {
      if (editingId) {
        await putJson(`/agents/${editingId}`, form);
      } else {
        await postJson("/agents", form);
      }
      setShowForm(false);
      loadAgents();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar este agente?")) return;
    try {
      await deleteJson(`/agents/${id}`);
      loadAgents();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <PageTitle>🤖 Mis Agentes</PageTitle>
        <Button onClick={openNew}>+ Nuevo Agente</Button>
      </div>

      {loading ? <Loading /> : agents.length === 0 ? (
        <Empty message="No hay agentes. Creá el primero." />
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {agents.map((agent) => (
            <Card key={agent.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <strong style={{ fontSize: "15px" }}>{agent.name}</strong>
                    <Badge color={agent.is_active ? "#27ae60" : "#e74c3c"}>
                      {agent.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                    <Badge>{agent.platform}</Badge>
                    <Badge>{agent.tone}</Badge>
                  </div>
                  {agent.description && (
                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#666" }}>{agent.description}</p>
                  )}
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#999" }}>
                    {agent.working_hours} · {agent.autonomy_level}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <Button variant="secondary" onClick={() => openEdit(agent)}>Editar</Button>
                  <Button variant="danger" onClick={() => handleDelete(agent.id)}>Eliminar</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "24px",
              width: "100%",
              maxWidth: "520px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>
              {editingId ? "Editar Agente" : "Nuevo Agente"}
            </h2>

            <Input label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Input label="Descripción" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Select
                label="Plataforma"
                value={form.platform}
                onChange={(v) => setForm({ ...form, platform: v })}
                options={[
                  { value: "web", label: "Web" },
                  { value: "whatsapp", label: "WhatsApp" },
                  { value: "telegram", label: "Telegram" },
                  { value: "instagram", label: "Instagram" },
                ]}
              />
              <Select
                label="Tono"
                value={form.tone}
                onChange={(v) => setForm({ ...form, tone: v })}
                options={[
                  { value: "formal", label: "Formal" },
                  { value: "casual", label: "Casual" },
                  { value: "picarro", label: "Pícaro" },
                ]}
              />
            </div>

            <Select
              label="Nivel de autonomía"
              value={form.autonomy_level}
              onChange={(v) => setForm({ ...form, autonomy_level: v })}
              options={[
                { value: "full", label: "Total — opera solo" },
                { value: "partial", label: "Parcial — consulta en casos dudosos" },
                { value: "supervised", label: "Supervisado — siempre approve" },
              ]}
            />

            <Input
              label="Horario de atención"
              value={form.working_hours}
              onChange={(v) => setForm({ ...form, working_hours: v })}
              placeholder="09:00-18:00"
            />

            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                Contexto del negocio
              </label>
              <textarea
                value={form.industry_context}
                onChange={(e) => setForm({ ...form, industry_context: e.target.value })}
                placeholder="Vendo piscinas y productos de limpieza..."
                rows={2}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                Instrucciones permanentes
              </label>
              <textarea
                value={form.instructions_permanent}
                onChange={(e) => setForm({ ...form, instructions_permanent: e.target.value })}
                placeholder="Siempre saludar con... Nunca hacer..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                Instrucciones transitorias (promos vigentes)
              </label>
              <textarea
                value={form.instructions_transient}
                onChange={(e) => setForm({ ...form, instructions_transient: e.target.value })}
                placeholder="Esta semana: promo de invierno 20% off..."
                rows={2}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Guardar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
