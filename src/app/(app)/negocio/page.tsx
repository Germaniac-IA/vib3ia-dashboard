"use client";

import { useEffect, useState } from "react";
import { fetchJson, postJson } from "../../lib";
import { Card, CardHeader, Button, Input, PageTitle, Loading } from "../../components/shared/UI";

type Client = {
  id: number;
  name: string;
  subdomain: string;
  logo_url: string;
  slogan: string;
  default_currency: string;
  timezone: string;
};

export default function NegocioPage() {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ name: "", subdomain: "", slogan: "", logo_url: "" });

  useEffect(() => {
    fetchJson<Client>("/clients/1")
      .then((c) => {
        setClient(c);
        setForm({ name: c.name, subdomain: c.subdomain, slogan: c.slogan || "", logo_url: c.logo_url || "" });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await postJson<Client>("/clients/1", form);
      setClient(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div style={{ maxWidth: "600px" }}>
      <PageTitle>🏪 Mi Negocio</PageTitle>

      <Card>
        <CardHeader title="Datos del negocio" />
        <div>
          <Input label="Nombre del negocio" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Input label="Subdominio" value={form.subdomain} onChange={(v) => setForm({ ...form, subdomain: v })} placeholder="mi-negocio" />
          <Input label="Slogan" value={form.slogan} onChange={(v) => setForm({ ...form, slogan: v })} placeholder="Tu eslogan aquí" />
          <Input label="URL del logo" value={form.logo_url} onChange={(v) => setForm({ ...form, logo_url: v })} placeholder="https://..." />
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "8px" }}>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
            {saved && (
              <span style={{ color: "#27ae60", fontSize: "13px", fontWeight: 600 }}>✓ Guardado</span>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
