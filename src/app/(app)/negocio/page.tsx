"use client";

import { useEffect, useState } from "react";
import { fetchJson, postJson, putJson, deleteJson } from "../../lib";
import { Card, CardHeader, Button, IconButton, Input, PageTitle, Loading } from "../../components/shared/UI";

type Client = {
  id: number;
  name: string;
  subdomain: string;
  logo_url: string;
  slogan: string;
};

type User = {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  rol: string;
  is_active: boolean;
};

export default function NegocioPage() {
  const [client, setClient] = useState<Client | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBiz, setEditingBiz] = useState(false);
  const [savingBiz, setSavingBiz] = useState(false);
  const [bizSaved, setBizSaved] = useState(false);
  const [formBiz, setFormBiz] = useState({ slogan: "", logo_url: "" });

  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formUser, setFormUser] = useState({ username: "", password: "", name: "", email: "", phone: "", rol: "operator" });

  function loadData() {
    setLoading(true);
    Promise.all([
      fetchJson<Client>("/clients/1"),
      fetchJson<User[]>("/users"),
    ])
      .then(([c, u]) => {
        setClient(c);
        setUsers(u);
        setFormBiz({ slogan: c.slogan || "", logo_url: c.logo_url || "" });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  async function handleSaveBiz() {
    setSavingBiz(true);
    try {
      const updated = await putJson<Client>("/clients/1", formBiz);
      setClient(updated);
      setEditingBiz(false);
      setBizSaved(true);
      setTimeout(() => setBizSaved(false), 2000);
    } catch (e) { console.error(e); }
    finally { setSavingBiz(false); }
  }

  function openNewUser() {
    setEditingUser(null);
    setFormUser({ username: "", password: "", name: "", email: "", phone: "", rol: "operator" });
    setShowUserForm(true);
  }

  function openEditUser(u: User) {
    setEditingUser(u);
    setFormUser({ username: u.username, password: "", name: u.name || "", email: u.email || "", phone: u.phone || "", rol: u.rol });
    setShowUserForm(true);
  }

  async function handleSaveUser() {
    try {
      if (editingUser) {
        await putJson(`/users/${editingUser.id}`, formUser);
      } else {
        if (!formUser.username || !formUser.password) return alert("Usuario y contraseña requeridos");
        await postJson("/users", formUser);
      }
      setShowUserForm(false);
      loadData();
    } catch (e) { console.error(e); }
  }

  async function handleDeleteUser(id: number) {
    if (!confirm("¿Eliminar este usuario?")) return;
    try {
      await deleteJson(`/users/${id}`);
      loadData();
    } catch (e) { console.error(e); }
  }

  if (loading) return <Loading />;

  const ROL_LABELS: Record<string, string> = { admin: "Admin", manager: "Manager", operator: "Operador" };
  const ROL_COLORS: Record<string, string> = { admin: "#e74c3c", manager: "#f39c12", operator: "#27ae60" };

  return (
    <div style={{ maxWidth: "680px" }}>
      <PageTitle>🏪 Mi Negocio</PageTitle>

      {/* ── Visual Card ── */}
      <Card style={{ marginBottom: "20px", overflow: "hidden" }}>
        {/* Header con gradiente */}
        <div
          style={{
            margin: "-20px -20px 0",
            padding: "24px 24px 20px",
            background: "linear-gradient(135deg, #6c63ff 0%, #1a1a2e 100%)",
            color: "#fff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {formBiz.logo_url ? (
              <img
                src={formBiz.logo_url}
                alt="logo"
                style={{ width: "56px", height: "56px", borderRadius: "12px", objectFit: "cover", border: "2px solid rgba(255,255,255,0.3)" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div
                style={{
                  width: "56px", height: "56px", borderRadius: "12px",
                  background: "rgba(255,255,255,0.15)", display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: "24px",
                }}
              >
                🏪
              </div>
            )}
            <div>
              <div style={{ fontSize: "20px", fontWeight: 700 }}>{client?.name}</div>
              {formBiz.slogan ? (
                <div style={{ fontSize: "13px", opacity: 0.8, marginTop: "2px" }}>"{formBiz.slogan}"</div>
              ) : (
                <div style={{ fontSize: "13px", opacity: 0.5, marginTop: "2px" }}>Sin eslogan</div>
              )}
            </div>
          </div>
        </div>

        {/* Subdomain */}
        <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#888" }}>
          🌐 {client?.subdomain}.vib3ia.com
        </div>

        {/* Edit toggle */}
        <div style={{ marginTop: "12px" }}>
          {editingBiz ? (
            <div style={{ display: "flex", gap: "8px" }}>
              <Button onClick={handleSaveBiz} disabled={savingBiz} style={{ fontSize: "12px", padding: "6px 14px" }}>
                {savingBiz ? "Guardando..." : "✓ Guardar"}
              </Button>
              <Button variant="secondary" onClick={() => setEditingBiz(false)} style={{ fontSize: "12px", padding: "6px 14px" }}>
                ✕ Cancelar
              </Button>
            </div>
          ) : (
            <IconButton variant="ghost" title="Editar negocio" onClick={() => setEditingBiz(true)}>✏️</IconButton>
          )}
        </div>

        {/* Edit fields */}
        {editingBiz && (
          <div style={{ marginTop: "16px", borderTop: "1px solid #f0", paddingTop: "16px" }}>
            <Input
              label="URL del logo"
              value={formBiz.logo_url}
              onChange={(v) => setFormBiz({ ...formBiz, logo_url: v })}
              placeholder="https://..."
            />
            <Input
              label="Slogan"
              value={formBiz.slogan}
              onChange={(v) => setFormBiz({ ...formBiz, slogan: v })}
              placeholder="Tu eslogan aquí"
            />
            {bizSaved && (
              <div style={{ color: "#27ae60", fontSize: "13px", fontWeight: 600 }}>✓ Cambios guardados</div>
            )}
          </div>
        )}
      </Card>

      {/* ── Mi Equipo ── */}
      <Card>
        <CardHeader
          title="👥 Mi equipo"
          action={<IconButton variant="primary" title="Agregar usuario" onClick={openNewUser}>+</IconButton>}
        />

        {users.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px", color: "#aaa", fontSize: "13px" }}>
            Sin usuarios agregados
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {users.map((u) => (
              <div
                key={u.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  background: "#f8f8f8",
                  borderRadius: "10px",
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    background: "#6c63ff22",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "16px", flexShrink: 0,
                  }}
                >
                  {u.name ? u.name[0].toUpperCase() : u.username[0].toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#333" }}>{u.name || u.username}</div>
                  <div style={{ fontSize: "12px", color: "#aaa" }}>{u.email || u.username}</div>
                </div>

                {/* Rol badge */}
                <div style={{
                  padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 600,
                  background: (ROL_COLORS[u.rol] || "#888") + "22",
                  color: ROL_COLORS[u.rol] || "#888",
                }}>
                  {ROL_LABELS[u.rol] || u.rol}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "4px" }}>
                  <IconButton variant="ghost" title="Editar" onClick={() => openEditUser(u)}>✏️</IconButton>
                  <IconButton variant="danger" title="Eliminar" onClick={() => handleDeleteUser(u.id)}>🗑️</IconButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── User Form Modal ── */}
      {showUserForm && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 100, display: "flex", alignItems: "center",
            justifyContent: "center", padding: "20px",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowUserForm(false); }}
        >
          <div
            style={{
              background: "#fff", borderRadius: "16px", padding: "24px",
              width: "100%", maxWidth: "420px",
            }}
          >
            <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "20px" }}>
              {editingUser ? "✏️ Editar usuario" : "+ Nuevo usuario"}
            </h3>

            <Input label="Nombre" value={formUser.name} onChange={(v) => setFormUser({ ...formUser, name: v })} />
            <Input label="Usuario" value={formUser.username} onChange={(v) => setFormUser({ ...formUser, username: v })} disabled={!!editingUser} />
            {!editingUser && (
              <Input label="Contraseña" value={formUser.password} onChange={(v) => setFormUser({ ...formUser, password: v })} type="password" />
            )}
            <Input label="Email" value={formUser.email} onChange={(v) => setFormUser({ ...formUser, email: v })} />
            <Input label="Teléfono" value={formUser.phone} onChange={(v) => setFormUser({ ...formUser, phone: v })} />

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "4px", color: "#555" }}>Rol</label>
              <select
                value={formUser.rol}
                onChange={(e) => setFormUser({ ...formUser, rol: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px" }}
              >
                <option value="operator">Operador</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <Button variant="secondary" onClick={() => setShowUserForm(false)}>✕</Button>
              <Button onClick={handleSaveUser}>{editingUser ? "✓ Guardar" : "+ Crear"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
