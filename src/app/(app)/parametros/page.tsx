"use client";

import { useEffect, useState } from "react";
import { fetchJson, postJson, putJson, deleteJson } from "../../lib";
import { Card, CardHeader, IconButton, PageTitle, Loading, Input, Button } from "../../components/shared/UI";

type InputItem = { id: number; name: string; unit: string; default_cost: number; is_active: boolean };

function InsumosABM() {
  const [items, setItems] = useState<InputItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<InputItem | null>(null);
  const [form, setForm] = useState({ name: "", unit: "unidad", default_cost: "" });
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    fetchJson<InputItem[]>("/input-items")
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm({ name: "", unit: "unidad", default_cost: "" });
    setShowForm(true);
  }

  function openEdit(i: InputItem) {
    setEditing(i);
    setForm({ name: i.name || "", unit: i.unit || "unidad", default_cost: String(i.default_cost || "") });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await putJson(`/input-items/${editing.id}`, { name: form.name, unit: form.unit, default_cost: Number(form.default_cost) || 0 });
      } else {
        await postJson("/input-items", { name: form.name, unit: form.unit, default_cost: Number(form.default_cost) || 0 });
      }
      setShowForm(false);
      load();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function remove(id: number) {
    if (!confirm("Eliminar este insumo?")) return;
    try { await deleteJson(`/input-items/${id}`); load(); } catch (e) { console.error(e); }
  }

  return (
    <>
      <Card>
        <CardHeader
          title="🧵 Insumos"
          action={<IconButton variant="primary" title="Agregar" onClick={openNew}>+</IconButton>}
        />
        {loading ? <Loading /> : (
          <div style={{ fontSize: "13px", color: "#666" }}>
            {items.length === 0 && <div style={{ color: "#aaa", marginBottom: "12px" }}>Sin insumos cargados</div>}
            {items.map(i => (
              <div key={i.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", background: "#f8f8f8", borderRadius: "10px", marginBottom: "6px" }}>
                <span style={{ flex: 1, fontWeight: 500 }}>{i.name}</span>
                <span style={{ fontSize: "11px", color: "#aaa" }}>{i.unit}</span>
                <span style={{ fontSize: "12px", color: "#6c63ff", fontWeight: 600 }}>${Number(i.default_cost).toLocaleString("es-AR")}</span>
                <IconButton variant="ghost" title="Editar" onClick={() => openEdit(i)}>✏️</IconButton>
                <IconButton variant="danger" title="Eliminar" onClick={() => remove(i.id)}>🗑️</IconButton>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "400px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "20px" }}>{editing ? "✏️ Editar insumo" : "🧵 Nuevo insumo"}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Input label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Tela algodón, Hilo, Embalaje..." />
              <Input label="Unidad" value={form.unit} onChange={(v) => setForm({ ...form, unit: v })} placeholder="metro, rollo, unidad, hora..." />
              <Input label="Costo default" value={form.default_cost} onChange={(v) => setForm({ ...form, default_cost: v })} placeholder="0.00" type="number" />
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "20px" }}>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

type PaymentMethod = { id: number; name: string; is_active: boolean; sort_order: number };

type PaymentMethod = {
  id: number;
  name: string;
  is_personal: boolean;
  is_cash: boolean;
  cbu_cvu: string;
  alias: string;
  banco: string;
  is_active: boolean;
  sort_order: number;
};

function PaymentMethodsABM() {
  const [items, setItems] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [form, setForm] = useState({ name: "", is_personal: false, is_cash: true, cbu_cvu: "", alias: "", banco: "" });
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    fetchJson<PaymentMethod[]>("/payment-methods")
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm({ name: "", is_personal: false, is_cash: true, cbu_cvu: "", alias: "", banco: "" });
    setShowForm(true);
  }

  function openEdit(m: PaymentMethod) {
    setEditing(m);
    setForm({
      name: m.name || "",
      is_personal: m.is_personal || false,
      is_cash: m.is_cash !== false,
      cbu_cvu: m.cbu_cvu || "",
      alias: m.alias || "",
      banco: m.banco || "",
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await putJson(`/payment-methods/${editing.id}`, { ...form });
      } else {
        await postJson("/payment-methods", form);
      }
      setShowForm(false);
      load();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function remove(id: number) {
    if (!confirm("Eliminar este medio de pago?")) return;
    try { await deleteJson(`/payment-methods/${id}`); load(); } catch (e) { console.error(e); }
  }

  const cashMethods = items.filter(m => m.is_cash);
  const nonCashMethods = items.filter(m => !m.is_cash);

  return (
    <>
      <Card style={{ marginBottom: "16px" }}>
        <CardHeader
          title="💳 Medios de Pago"
          action={<IconButton variant="primary" title="Agregar" onClick={openNew}>+</IconButton>}
        />
        {loading ? <Loading /> : (
          <div style={{ fontSize: "13px", color: "#666" }}>
            {items.length === 0 && <div style={{ color: "#aaa", marginBottom: "12px" }}>Sin medios de pago cargados</div>}
            {cashMethods.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#888", marginBottom: "6px" }}>EFECTIVO</div>
                {cashMethods.map(m => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", background: "#f8f8f8", borderRadius: "10px", marginBottom: "6px" }}>
                    <span style={{ flex: 1, fontWeight: 500 }}>{m.is_personal ? "👤 " : ""}{m.name}</span>
                    <span style={{ fontSize: "11px", color: "#aaa" }}>#{m.sort_order}</span>
                    <IconButton variant="ghost" title="Editar" onClick={() => openEdit(m)}>✏️</IconButton>
                    <IconButton variant="danger" title="Eliminar" onClick={() => remove(m.id)}>🗑️</IconButton>
                  </div>
                ))}
              </div>
            )}
            {nonCashMethods.length > 0 && (
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#888", marginBottom: "6px" }}>TRANSFERENCIA / OTROS</div>
                {nonCashMethods.map(m => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", background: "#f8f8f8", borderRadius: "10px", marginBottom: "6px" }}>
                    <span style={{ flex: 1, fontWeight: 500 }}>{m.is_personal ? "👤 " : ""}{m.name}</span>
                    {m.banco && <span style={{ fontSize: "11px", color: "#aaa" }}>🏦 {m.banco}</span>}
                    {m.alias && <span style={{ fontSize: "11px", color: "#aaa" }}>📱 {m.alias}</span>}
                    <span style={{ fontSize: "11px", color: "#aaa" }}>#{m.sort_order}</span>
                    <IconButton variant="ghost" title="Editar" onClick={() => openEdit(m)}>✏️</IconButton>
                    <IconButton variant="danger" title="Eliminar" onClick={() => remove(m.id)}>🗑️</IconButton>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "460px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "20px" }}>{editing ? "✏️ Editar medio de pago" : "💳 Nuevo medio de pago"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Input label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Efectivo, Tarjeta, Transferencia..." />
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "4px", color: "#555" }}>Tipo</label>
                <select value={form.is_cash ? "cash" : "nocash"} onChange={(e) => setForm({ ...form, is_cash: e.target.value === "cash" })} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px" }}>
                  <option value="cash">💵 Efectivo</option>
                  <option value="nocash">🏦 Transferencia / Otro</option>
                </select>
              </div>
              {!form.is_cash && (
                <>
                  <Input label="CBU / CVU" value={form.cbu_cvu} onChange={(v) => setForm({ ...form, cbu_cvu: v })} placeholder="0001234567890123456789" />
                  <Input label="Alias" value={form.alias} onChange={(v) => setForm({ ...form, alias: v })} placeholder="mi.alias.de.banco" />
                  <Input label="Banco" value={form.banco} onChange={(v) => setForm({ ...form, banco: v })} placeholder="Banco Santander, BBVA, etc" />
                </>
              )}
            </div>
            <div style={{ marginTop: "12px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input type="checkbox" checked={form.is_personal} onChange={(e) => setForm({ ...form, is_personal: e.target.checked })} />
                👤 Es cuenta personal (no del negocio)
              </label>
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "20px" }}>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

type Category = { id: number; name: string; is_active: boolean; auto_generate_sku: boolean; sku_counter: number; };

function CategoriesABM() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", auto_generate_sku: true });
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    fetchJson<Category[]>("/product-categories")
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm({ name: "" });
    setShowForm(true);
  }

  function openEdit(c: Category) {
    setEditing(c);
    setForm({ name: c.name || "", auto_generate_sku: c.auto_generate_sku !== false });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await putJson(`/product-categories/${editing.id}`, { name: form.name, auto_generate_sku: form.auto_generate_sku });
      } else {
        await postJson("/product-categories", { name: form.name, auto_generate_sku: form.auto_generate_sku });
      }
      setShowForm(false);
      load();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function remove(id: number) {
    if (!confirm("Eliminar esta categoria?")) return;
    try { await deleteJson(`/product-categories/${id}`); load(); } catch (e) { console.error(e); }
  }

  return (
    <>
      <Card style={{ marginBottom: "16px" }}>
        <CardHeader
          title="📂 Categorias"
          action={<IconButton variant="primary" title="Agregar" onClick={openNew}>+</IconButton>}
        />
        {loading ? <Loading /> : (
          <div style={{ fontSize: "13px", color: "#666" }}>
            {items.length === 0 && <div style={{ color: "#aaa", marginBottom: "12px" }}>Sin categorias cargadas</div>}
            {items.map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", background: "#f8f8f8", borderRadius: "10px", marginBottom: "6px" }}>
                <span style={{ flex: 1, fontWeight: 500 }}>{c.name}</span>
                <IconButton variant="ghost" title="Editar" onClick={() => openEdit(c)}>✏️</IconButton>
                <IconButton variant="danger" title="Eliminar" onClick={() => remove(c.id)}>🗑️</IconButton>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "400px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "20px" }}>{editing ? "✏️ Editar categoria" : "📂 Nueva categoria"}</h3>
            <Input label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Nombre de la categoria" />
            <div style={{ marginTop: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input type="checkbox" checked={form.auto_generate_sku} onChange={(e) => setForm({ ...form, auto_generate_sku: e.target.checked })} />
                Genera SKU automaticamente (ej: CAT-001)
              </label>
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "20px" }}>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

type Brand = {
  id: number;
  name: string;
  is_imported: boolean;
  premium_level: number;
  is_active: boolean;
};

function BrandsABM() {
  const [items, setItems] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState({ name: "", is_imported: false, premium_level: 5 });
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    fetchJson<Brand[]>("/product-brands")
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm({ name: "", is_imported: false, premium_level: 5 });
    setShowForm(true);
  }

  function openEdit(b: Brand) {
    setEditing(b);
    setForm({ name: b.name || "", is_imported: b.is_imported || false, premium_level: b.premium_level || 5 });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await putJson(`/product-brands/${editing.id}`, form);
      } else {
        await postJson("/product-brands", form);
      }
      setShowForm(false);
      load();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function remove(id: number) {
    if (!confirm("Eliminar esta marca?")) return;
    try { await deleteJson(`/product-brands/${id}`); load(); } catch (e) { console.error(e); }
  }

  return (
    <>
      <Card>
        <CardHeader
          title="🏷️ Marcas"
          action={<IconButton variant="primary" title="Agregar" onClick={openNew}>+</IconButton>}
        />
        {loading ? <Loading /> : (
          <div style={{ fontSize: "13px", color: "#666" }}>
            {items.length === 0 && <div style={{ color: "#aaa", marginBottom: "12px" }}>Sin marcas cargadas</div>}
            {items.map(b => (
              <div key={b.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", background: "#f8f8f8", borderRadius: "10px", marginBottom: "6px" }}>
                <span style={{ flex: 1, fontWeight: 500 }}>{b.is_imported ? "🌍 " : ""}{b.name}</span>
                {b.premium_level && (
                  <span style={{ fontSize: "11px", background: "#f39c1215", color: "#f39c12", padding: "2px 8px", borderRadius: "10px", fontWeight: 600 }}>
                    {b.premium_level}/10
                  </span>
                )}
                <IconButton variant="ghost" title="Editar" onClick={() => openEdit(b)}>✏️</IconButton>
                <IconButton variant="danger" title="Eliminar" onClick={() => remove(b.id)}>🗑️</IconButton>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "420px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "20px" }}>{editing ? "✏️ Editar marca" : "🏷️ Nueva marca"}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <Input label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Nombre de la marca" />
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input type="checkbox" checked={form.is_imported} onChange={(e) => setForm({ ...form, is_imported: e.target.checked })} />
                  🌍 Es marca importada
                </label>
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "4px", color: "#555" }}>
                  Nivel premium: {form.premium_level}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={form.premium_level}
                  onChange={(e) => setForm({ ...form, premium_level: parseInt(e.target.value) })}
                  style={{ width: "100%", accentColor: "#6c63ff" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#aaa", marginTop: "2px" }}>
                  <span>Básico</span><span>Premium</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "20px" }}>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function ParametrosPage() {
  return (
    <div>
      <PageTitle>⚙️ Parámetros</PageTitle>
      <p style={{ color: "#888", fontSize: "13px", marginBottom: "20px" }}>
        Configurá los catálogos antes de cargar productos y procesar pedidos.
      </p>
      <PaymentMethodsABM />
      <CategoriesABM />
      <BrandsABM />
      <InsumosABM />
    </div>
  );
}
