"use client";

import { useEffect, useState } from "react";
import { fetchJson, postJson, putJson, deleteJson } from "../../lib";
import { Card, CardHeader, IconButton, PageTitle, Loading, Input, Button } from "../../components/shared/UI";

type PaymentMethod = { id: number; name: string; is_personal: boolean; is_cash: boolean; cbu_cvu: string; alias: string; banco: string; is_active: boolean; sort_order: number };
type Category = { id: number; name: string; is_active: boolean; auto_generate_sku: boolean; sku_counter: number };
type Brand = { id: number; name: string; is_imported: boolean; premium_level: number; is_active: boolean };
type InputItem = { id: number; name: string; unit: string; default_cost: number; is_active: boolean };

function CompactABM({ title, items, onAdd, onEdit, onDelete, renderItem }: {
  title: string; items: any[];
  onAdd: () => void; onEdit: (item: any) => void; onDelete: (id: number) => void;
  renderItem: (item: any) => React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(true);
  return (
    <Card style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", cursor: "pointer" }}
           onClick={() => setExpanded(!expanded)}>
        <span style={{ fontSize: "13px", fontWeight: 700, flex: 1 }}>{title}</span>
        <span style={{ fontSize: "11px", color: "#aaa", marginRight: "8px" }}>{items.length}</span>
        <span style={{ fontSize: "12px", color: "#888", marginRight: "8px" }}>{expanded ? "▼" : "▶"}</span>
        <IconButton variant="primary" title={"Agregar"} onClick={(e) => { e.stopPropagation(); onAdd(); }}>+</IconButton>
      </div>
      {expanded && (
        <div style={{ borderTop: "1px solid #f0", padding: "8px 16px 12px" }}>
          {items.length === 0 ? (
            <div style={{ fontSize: "12px", color: "#ccc", textAlign: "center", padding: "8px" }}>Sin datos</div>
          ) : (
            items.map(renderItem)
          )}
        </div>
      )}
    </Card>
  );
}

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
      .then(setItems).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openNew() { setEditing(null); setForm({ name: "", is_personal: false, is_cash: true, cbu_cvu: "", alias: "", banco: "" }); setShowForm(true); }
  function openEdit(m: PaymentMethod) {
    setEditing(m); setForm({ name: m.name || "", is_personal: m.is_personal || false, is_cash: m.is_cash !== false, cbu_cvu: m.cbu_cvu || "", alias: m.alias || "", banco: m.banco || "" });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) await putJson(`/payment-methods/${editing.id}`, { ...form });
      else await postJson("/payment-methods", form);
      setShowForm(false); load();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  }

  async function remove(id: number) {
    if (!confirm("Eliminar?")) return;
    try { await deleteJson(`/payment-methods/${id}`); load(); } catch (e) { console.error(e); }
  }

  function renderItem(m: PaymentMethod) {
    return (
      <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 0", borderBottom: "1px solid #f5", fontSize: "12px" }}>
        <span style={{ flex: 1 }}>{m.is_personal ? "👤 " : ""}{m.name}</span>
        {m.is_cash ? <span style={{ fontSize: "10px", color: "#27ae60" }}>💵</span> : <span style={{ fontSize: "10px", color: "#888" }}>🏦{m.banco ? " "+m.banco : ""}</span>}
        <IconButton variant="ghost" title="Editar" onClick={() => openEdit(m)}>✏️</IconButton>
        <IconButton variant="danger" title="Eliminar" onClick={() => remove(m.id)}>🗑️</IconButton>
      </div>
    );
  }

  return (
    <>
      {loading ? <Loading /> : (
        <CompactABM title="💳 Medios de Pago" items={items} onAdd={openNew} onEdit={openEdit} onDelete={remove} renderItem={renderItem} />
      )}
      {showForm && (
        <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={modalStyle}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "16px" }}>{editing ? "✏️ Editar" : "💳 Nuevo medio de pago"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Input label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Efectivo, Transferencia..." />
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "4px", color: "#555" }}>Tipo</label>
                <select value={form.is_cash ? "cash" : "nocash"} onChange={(e) => setForm({ ...form, is_cash: e.target.value === "cash" })}
                        style={{ width: "100%", padding: "7px 10px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "13px" }}>
                  <option value="cash">💵 Efectivo</option>
                  <option value="nocash">🏦 Transferencia / Otro</option>
                </select>
              </div>
              {!form.is_cash && (
                <>
                  <Input label="CBU / CVU" value={form.cbu_cvu} onChange={(v) => setForm({ ...form, cbu_cvu: v })} placeholder="000123456..." />
                  <Input label="Alias" value={form.alias} onChange={(v) => setForm({ ...form, alias: v })} placeholder="mi.alias.banco" />
                  <Input label="Banco" value={form.banco} onChange={(v) => setForm({ ...form, banco: v })} placeholder="Banco..." />
                </>
              )}
            </div>
            <div style={{ marginTop: "10px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input type="checkbox" checked={form.is_personal} onChange={(e) => setForm({ ...form, is_personal: e.target.checked })} />
                👤 Es cuenta personal
              </label>
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "16px" }}>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

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
      .then(setItems).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openNew() { setEditing(null); setForm({ name: "", auto_generate_sku: true }); setShowForm(true); }
  function openEdit(c: Category) {
    setEditing(c); setForm({ name: c.name || "", auto_generate_sku: c.auto_generate_sku !== false }); setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) await putJson(`/product-categories/${editing.id}`, { name: form.name, auto_generate_sku: form.auto_generate_sku });
      else await postJson("/product-categories", { name: form.name, auto_generate_sku: form.auto_generate_sku });
      setShowForm(false); load();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  }

  async function remove(id: number) {
    if (!confirm("Eliminar?")) return;
    try { await deleteJson(`/product-categories/${id}`); load(); } catch (e) { console.error(e); }
  }

  function renderItem(c: Category) {
    return (
      <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 0", borderBottom: "1px solid #f5", fontSize: "12px" }}>
        <span style={{ flex: 1 }}>📂 {c.name}</span>
        {c.auto_generate_sku && <span style={{ fontSize: "10px", color: "#6c63ff" }}>🔤</span>}
        <span style={{ fontSize: "10px", color: "#aaa" }}>{c.sku_counter > 0 ? `#${c.sku_counter}` : ""}</span>
        <IconButton variant="ghost" title="Editar" onClick={() => openEdit(c)}>✏️</IconButton>
        <IconButton variant="danger" title="Eliminar" onClick={() => remove(c.id)}>🗑️</IconButton>
      </div>
    );
  }

  return (
    <>
      {loading ? <Loading /> : (
        <CompactABM title="📂 Categorías" items={items} onAdd={openNew} onEdit={openEdit} onDelete={remove} renderItem={renderItem} />
      )}
      {showForm && (
        <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={modalStyle}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "16px" }}>{editing ? "✏️ Editar categoría" : "📂 Nueva categoría"}</h3>
            <Input label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Nombre de la categoría" />
            <div style={{ marginTop: "10px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input type="checkbox" checked={form.auto_generate_sku} onChange={(e) => setForm({ ...form, auto_generate_sku: e.target.checked })} />
                🔤 Genera SKU automáticamente (ej: CAT-001)
              </label>
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "16px" }}>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

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
      .then(setItems).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openNew() { setEditing(null); setForm({ name: "", is_imported: false, premium_level: 5 }); setShowForm(true); }
  function openEdit(b: Brand) {
    setEditing(b); setForm({ name: b.name || "", is_imported: b.is_imported || false, premium_level: b.premium_level || 5 }); setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) await putJson(`/product-brands/${editing.id}`, form);
      else await postJson("/product-brands", form);
      setShowForm(false); load();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  }

  async function remove(id: number) {
    if (!confirm("Eliminar?")) return;
    try { await deleteJson(`/product-brands/${id}`); load(); } catch (e) { console.error(e); }
  }

  function renderItem(b: Brand) {
    return (
      <div key={b.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 0", borderBottom: "1px solid #f5", fontSize: "12px" }}>
        <span style={{ flex: 1 }}>{b.is_imported ? "🌍 " : ""}{b.name}</span>
        {b.premium_level && b.premium_level !== 5 && (
          <span style={{ fontSize: "10px", background: "#f39c1215", color: "#f39c12", padding: "2px 6px", borderRadius: "8px", fontWeight: 600 }}>
            {b.premium_level}/10
          </span>
        )}
        <IconButton variant="ghost" title="Editar" onClick={() => openEdit(b)}>✏️</IconButton>
        <IconButton variant="danger" title="Eliminar" onClick={() => remove(b.id)}>🗑️</IconButton>
      </div>
    );
  }

  return (
    <>
      {loading ? <Loading /> : (
        <CompactABM title="🏷️ Marcas" items={items} onAdd={openNew} onEdit={openEdit} onDelete={remove} renderItem={renderItem} />
      )}
      {showForm && (
        <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={modalStyle}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "16px" }}>{editing ? "✏️ Editar marca" : "🏷️ Nueva marca"}</h3>
            <Input label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Nombre de la marca" />
            <div style={{ marginTop: "10px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input type="checkbox" checked={form.is_imported} onChange={(e) => setForm({ ...form, is_imported: e.target.checked })} />
                🌍 Es marca importada
              </label>
            </div>
            <div style={{ marginTop: "10px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "4px", color: "#555" }}>
                Nivel premium: {form.premium_level}/10
              </label>
              <input type="range" min="1" max="10" value={form.premium_level}
                onChange={(e) => setForm({ ...form, premium_level: parseInt(e.target.value) })}
                style={{ width: "100%", accentColor: "#6c63ff" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#aaa" }}>
                <span>Básico</span><span>Premium</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "16px" }}>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

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
      .then(setItems).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openNew() { setEditing(null); setForm({ name: "", unit: "unidad", default_cost: "" }); setShowForm(true); }
  function openEdit(i: InputItem) {
    setEditing(i); setForm({ name: i.name || "", unit: i.unit || "unidad", default_cost: String(i.default_cost || "") }); setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) await putJson(`/input-items/${editing.id}`, { name: form.name, unit: form.unit, default_cost: Number(form.default_cost) || 0 });
      else await postJson("/input-items", { name: form.name, unit: form.unit, default_cost: Number(form.default_cost) || 0 });
      setShowForm(false); load();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  }

  async function remove(id: number) {
    if (!confirm("Eliminar?")) return;
    try { await deleteJson(`/input-items/${id}`); load(); } catch (e) { console.error(e); }
  }

  function renderItem(i: InputItem) {
    return (
      <div key={i.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 0", borderBottom: "1px solid #f5", fontSize: "12px" }}>
        <span style={{ flex: 1 }}>🧵 {i.name}</span>
        <span style={{ fontSize: "10px", color: "#aaa" }}>{i.unit}</span>
        <span style={{ fontSize: "11px", color: "#6c63ff", fontWeight: 600 }}>${Number(i.default_cost).toLocaleString("es-AR")}</span>
        <IconButton variant="ghost" title="Editar" onClick={() => openEdit(i)}>✏️</IconButton>
        <IconButton variant="danger" title="Eliminar" onClick={() => remove(i.id)}>🗑️</IconButton>
      </div>
    );
  }

  return (
    <>
      {loading ? <Loading /> : (
        <CompactABM title="🧵 Insumos" items={items} onAdd={openNew} onEdit={openEdit} onDelete={remove} renderItem={renderItem} />
      )}
      {showForm && (
        <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={modalStyle}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "16px" }}>{editing ? "✏️ Editar insumo" : "🧵 Nuevo insumo"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Input label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Tela, Hilo, Embalaje..." />
              <Input label="Unidad" value={form.unit} onChange={(v) => setForm({ ...form, unit: v })} placeholder="metro, rollo, hora..." />
              <Input label="Costo default" value={form.default_cost} onChange={(v) => setForm({ ...form, default_cost: v })} placeholder="0.00" type="number" />
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "16px" }}>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const overlayStyle: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" };
const modalStyle: React.CSSProperties = { background: "#fff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "420px" };

export default function ParametrosPage() {
  return (
    <div style={{ maxWidth: "860px" }}>
      <PageTitle>⚙️ Parámetros</PageTitle>
      <div style={{ background: "linear-gradient(135deg, #6c63ff15, #1a1a2e08)", border: "1px solid #6c63ff30", borderRadius: "12px", padding: "14px 18px", marginBottom: "20px", fontSize: "12px", color: "#666", lineHeight: "1.5" }}>
        <strong style={{ color: "#6c63ff" }}>Configurá los parámetros de tu negocio.</strong><br />
        Hacé click en ▶/▼ para expandir o colapsar cada sección.
      </div>
      <PaymentMethodsABM />
      <CategoriesABM />
      <BrandsABM />
      <InsumosABM />
    </div>
  );
}
