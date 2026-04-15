"use client";

import { useEffect, useState } from "react";
import { fetchJson, postJson, putJson, deleteJson } from "../../lib";
import { Card, IconButton, Input, Select, PageTitle, Loading } from "../../components/shared/UI";

type InputItem = { id: number; name: string; unit: string; default_cost: number };
type ProductComponent = { id: number; input_item_id: number; input_item_name: string; input_unit: string; quantity: number; default_cost: number };
type Category = { id: number; name: string; auto_generate_sku: boolean; sku_counter: number };
type Product = {
  id: number; name: string; sku: string; sku_externo: string; description: string;
  commercial_description: string;
  price: number; cost_price: number; computed_cost: number; unit: string;
  stock_quantity: number; min_stock: number; requires_stock: boolean;
  is_premium: boolean; premium_level: number;
  category_id: number; category_name: string;
  brand_id: number; brand_name: string;
  is_active: boolean;
  image_url: string;
};

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesFull, setCategoriesFull] = useState<Category[]>([]);
  const [categories, setCategories] = useState<{id:number;name:string}[]>([]);
  const [brands, setBrands] = useState<{id:number;name:string}[]>([]);
  const [allInputs, setAllInputs] = useState<InputItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [components, setComponents] = useState<ProductComponent[]>([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [form, setForm] = useState({
    name: "", sku: "", sku_externo: "", description: "", commercial_description: "",
    price: "", unit: "unidad", category_id: "", brand_id: "",
    stock_quantity: "", min_stock: "", requires_stock: false,
    is_premium: false, premium_level: 5, cost_price: "", uses_inputs: false,
    image_url: "",
    _pendingImage: "" as string | undefined,
  });
  const [selectedInput, setSelectedInput] = useState("");
  const [inputQty, setInputQty] = useState("1");

  function load() {
    setLoading(true);
    Promise.all([
      fetchJson<Product[]>("/products", true),
      fetchJson<Category[]>("/product-categories"),
      fetchJson<{id:number;name:string}[]>("/product-brands"),
      fetchJson<InputItem[]>("/input-items"),
    ])
      .then(([p, c, b, i]) => {
        setProducts(p);
        setCategoriesFull(c);
        setCategories(c.map(x => ({id: x.id, name: x.name})));
        setBrands(b);
        setAllInputs(i);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function loadComponents(productId: number) {
    try {
      const comps = await fetchJson<ProductComponent[]>(`/products/${productId}/components`);
      setComponents(comps);
    } catch { setComponents([]); }
  }

  function openNew() {
    setEditing(null);
    setForm({ name: "", sku: "", sku_externo: "", description: "", commercial_description: "", price: "", unit: "unidad", category_id: "", brand_id: "", stock_quantity: "", min_stock: "", requires_stock: false, is_premium: false, premium_level: 5, cost_price: "", uses_inputs: false, image_url: "", _pendingImage: "" });
    setComponents([]);
    setSelectedInput("");
    setInputQty("1");
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name || "", sku: p.sku || "", sku_externo: p.sku_externo || "", description: p.description || "",
      price: String(p.price || ""), unit: p.unit || "unidad", category_id: String(p.category_id || ""), brand_id: String(p.brand_id || ""),
      stock_quantity: String(p.stock_quantity || ""), min_stock: String(p.min_stock || ""),
      requires_stock: p.requires_stock || false,
      is_premium: p.is_premium || false, premium_level: p.premium_level || 5,
      cost_price: String(p.cost_price || ""), uses_inputs: false,
      image_url: p.image_url || "",
      commercial_description: p.commercial_description || "",
      _pendingImage: "",
    });
    setSelectedInput("");
    setInputQty("1");
    setShowForm(true);
    loadComponents(p.id);
  }

  async function addComponent() {
    if (!selectedInput || !editing) return;
    try {
      await postJson(`/products/${editing.id}/components`, { input_item_id: Number(selectedInput), quantity: Number(inputQty) });
      setSelectedInput("");
      setInputQty("1");
      loadComponents(editing.id);
    } catch (e) { console.error(e); }
  }

  async function removeComponent(compId: number) {
    if (!editing) return;
    try {
      await deleteJson(`/products/${editing.id}/components/${compId}`);
      loadComponents(editing.id);
    } catch (e) { console.error(e); }
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name, sku: form.sku, sku_externo: form.sku_externo, description: form.description,
        price: Number(form.price) || 0, unit: form.unit, category_id: form.category_id ? Number(form.category_id) : null,
        brand_id: form.brand_id ? Number(form.brand_id) : null,
        stock_quantity: form.requires_stock ? (Number(form.stock_quantity) || 0) : 0,
        min_stock: form.requires_stock ? (Number(form.min_stock) || 0) : 0,
        requires_stock: form.requires_stock,
        is_premium: form.is_premium, premium_level: form.is_premium ? (Number(form.premium_level) || 5) : null,
        cost_price: form.uses_inputs ? 0 : (Number(form.cost_price) || 0),
        commercial_description: form.commercial_description || null,
        image_url: form.image_url || null,
      };
      let savedId = editing ? editing.id : null;
      if (editing) {
        await putJson(`/products/${editing.id}`, payload);
      } else {
        const created = await postJson<{id:number}>(`/products`, payload);
        savedId = created.id;
      }
      // Upload image if pending file
      if ((form as any)._pendingImage && savedId) {
        const api = (window as any).__API_URL__ || 'http://149.50.148.131:4000/api';
        await fetch(`${api}/products/${savedId}/image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ file: (form as any)._pendingImage }),
        });
      } else if (form.image_url && savedId) {
        // URL directo: guardar en DB sin subir archivo
        await putJson(`/products/${savedId}`, { image_url: form.image_url });
      }
      setShowForm(false);
      load();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function toggleActive(p: Product) {
    try { await putJson(`/products/${p.id}`, { is_active: p.is_active === false }); load(); } catch (e) { console.error(e); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Eliminar este producto?")) return;
    try { await deleteJson(`/products/${id}`); load(); } catch (e) { console.error(e); }
  }

  const computedCost = components.reduce((sum, c) => sum + (Number(c.quantity) * Number(c.default_cost)), 0);

  const filtered = ((search
    ? products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.sku_externo || "").toLowerCase().includes(search.toLowerCase())
      )
    : products)).filter(p => showAll || p.is_active !== false);

  const grouped: Record<string, Product[]> = {};
  filtered.forEach(p => {
    const cat = p.category_name || "Sin categoria";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  });

  const discCount = products.filter(p => p.is_active === false).length;

  if (loading) return <Loading />;

  return (
    <div style={{ maxWidth: "900px" }}>
      <PageTitle>📦 Productos</PageTitle>
      <div style={{ background: "linear-gradient(135deg, #6c63ff15, #1a1a2e08)", border: "1px solid #6c63ff30", borderRadius: "12px", padding: "14px 18px", marginBottom: "20px", fontSize: "12px", color: "#666", lineHeight: "1.5" }}>
        <strong style={{ color: "#6c63ff" }}>📦 Catalogo de productos</strong><br />
        Carga tus productos, asignales categoria y marca, defini precios y niveles premium.
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, SKU, SKU externo..."
          style={{ flex: 1, maxWidth: "400px", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "13px" }} />
        <span style={{ color: "#888", fontSize: "13px" }}>
          {filtered.length}/{products.length}
          {discCount > 0 && <span style={{ color: "#e74c3c" }}> ({discCount} disc)</span>}
        </span>
        <label style={{ fontSize: "12px", color: "#888", display: "flex", alignItems: "center", gap: "4px", marginLeft: "8px", cursor: "pointer" }}>
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
          Ver todos
        </label>
        <IconButton variant="primary" title="Nuevo producto" onClick={openNew}>+</IconButton>
      </div>

      {products.length === 0 ? (
        <Card><div style={{ textAlign: "center", padding: "40px", color: "#aaa" }}>Sin productos cargados.</div></Card>
      ) : (
        Object.entries(grouped).map(([catName, prods]) => (
          <div key={catName} style={{ marginBottom: "24px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#888", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px" }}>{catName}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
              {prods.map(p => (
                <Card key={p.id} style={{ opacity: p.is_active === false ? 0.55 : 1, border: p.is_active === false ? "1px dashed #ccc" : undefined }}>
                  <div style={{ display: "flex", gap: "12px", cursor: "pointer" }} onClick={() => openEdit(p)}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "2px", textDecoration: p.is_active === false ? "line-through" : undefined, color: p.is_active === false ? "#aaa" : undefined }}>{p.name}</div>
                      {p.sku && <div style={{ fontSize: "11px", color: p.is_active === false ? "#ccc" : "#aaa" }}>SKU {p.sku}</div>}
                      {p.sku_externo && <div style={{ fontSize: "11px", color: p.is_active === false ? "#ccc" : "#aaa" }}>Ext: {p.sku_externo}</div>}
                      {p.is_active === false && <div style={{ fontSize: "11px", color: "#e74c3c", fontWeight: 700, marginBottom: "4px" }}>⏸ DISCONTINUADO</div>}
                      <div style={{ fontSize: "18px", fontWeight: 700, color: p.is_active === false ? "#ccc" : "#6c63ff", marginTop: "6px" }}>
                        ${Number(p.price).toLocaleString("es-AR")}
                      </div>
                      {p.cost_price > 0 && <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>Costo: ${Number(p.cost_price).toLocaleString("es-AR")}</div>}
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "8px" }}>
                        {p.brand_name && <span style={{ fontSize: "11px", background: "#eee", padding: "2px 6px", borderRadius: "8px" }}>{p.brand_name}</span>}
                        {p.requires_stock && (
                          <span style={{ fontSize: "11px", background: (p.stock_quantity || 0) <= (p.min_stock || 0) ? "#e74c3c22" : "#27ae6022", color: (p.stock_quantity || 0) <= (p.min_stock || 0) ? "#e74c3c" : "#27ae60", padding: "2px 6px", borderRadius: "8px" }}>
                            {(p.stock_quantity || 0)} {p.unit}
                          </span>
                        )}
                        {p.is_premium && p.premium_level && (
                          <span style={{ fontSize: "10px", background: "#f39c1215", color: "#f39c12", padding: "2px 6px", borderRadius: "8px", fontWeight: 600 }}>{p.premium_level}/10</span>
                        )}
                      </div>
                    </div>
                    <div style={{ width: "95px", height: "95px", flexShrink: 0, borderRadius: "8px", overflow: "hidden", border: "1px solid #eee", background: "#f8f8f8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ fontSize: "40px", opacity: 0.3 }}>📷</div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "2px", marginTop: "6px" }}>
                    <IconButton variant={p.is_active === false ? "primary" : "ghost"} title={p.is_active === false ? "Activar" : "Discontinuar"}
                      onClick={(e) => { e.stopPropagation(); toggleActive(p); }}>
                      {p.is_active === false ? "✓" : "⏸"}
                    </IconButton>
                    <IconButton variant="ghost" title="Editar" onClick={(e) => { e.stopPropagation(); openEdit(p); }}>✏️</IconButton>
                    <IconButton variant="danger" title="Eliminar" onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}>🗑️</IconButton>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "20px", overflowY: "auto" }} onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "640px", marginTop: "20px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "20px" }}>{editing ? "Editar producto" : "Nuevo producto"}</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Input label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Nombre del producto" />
              <Select label="Categoria" value={form.category_id} onChange={(v) => setForm({ ...form, category_id: v, sku: "" })}
                options={[{value:"",label:"Sin categoria"}, ...categories.map(c=>({value:String(c.id),label:c.name}))]} />
              <Select label="Marca" value={form.brand_id} onChange={(v) => setForm({ ...form, brand_id: v })}
                options={[{value:"",label:"Sin marca"}, ...brands.map(b=>({value:String(b.id),label:b.name}))]} />
              <Input label="SKU" value={form.sku} onChange={(v) => setForm({ ...form, sku: v })} placeholder="Codigo interno o se genera solo" />
              <Input label="SKU externo" value={form.sku_externo} onChange={(v) => setForm({ ...form, sku_externo: v })} placeholder="Codigo del proveedor" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", gridColumn: "1 / -1" }}>
                <Input label="Precio de venta" value={form.price} onChange={(v) => setForm({ ...form, price: v })} placeholder="0.00" type="number" />
                <Input label="Costo manual" value={form.cost_price} onChange={(v) => setForm({ ...form, cost_price: v })} placeholder="0.00" type="number" />
              </div>
            </div>
            <Input label="Unidad" value={form.unit} onChange={(v) => setForm({ ...form, unit: v })} placeholder="unidad, kilo, litro..." />
            <Input label="Descripcion" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Descripcion del producto" />

            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#555" }}>Descripcion comercial para IA</label>
                <span title="Texto que el agente de IA usara para describir este producto al cliente. Sea claro, conciso y orientalo a la venta." style={{ cursor: "help", fontSize: "14px", opacity: 0.6 }}>?</span>
              </div>
              <textarea
                value={form.commercial_description}
                onChange={(e) => setForm(f => ({ ...f, commercial_description: e.target.value }))}
                placeholder="Ej: Remeraoversized de algodon peinado, cuello redondo, ideal para uso diario y verano..."
                rows={3}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "13px", resize: "vertical", fontFamily: "inherit" }}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "4px", color: "#555" }}>Imagen del producto</label>
              <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                <input type="file" accept="image/*" id="img-upload" style={{ display: "none" }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setForm(f => ({ ...f, _pendingImage: reader.result as string, image_url: '' }));
                    reader.readAsDataURL(file);
                  }} />
                <label htmlFor="img-upload" style={{ padding: "6px 12px", background: "#6c63ff22", color: "#6c63ff", borderRadius: "8px", fontSize: "13px", cursor: "pointer", border: "1px solid #6c63ff40" }}>
                  📁 Subir
                </label>
                <span style={{ color: "#aaa", fontSize: "12px" }}>o</span>
                <input
                  value={form.image_url}
                  onChange={(e) => setForm(f => ({ ...f, image_url: e.target.value, _pendingImage: '' }))}
                  placeholder="Pega URL de imagen..."
                  style={{ flex: 1, minWidth: "180px", padding: "6px 10px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "13px" }}
                />
                {(form.image_url || (form as any)._pendingImage) && <span style={{ fontSize: "11px", color: "#27ae60" }}>✓</span>}
              </div>
              {(form.image_url || (form as any)._pendingImage) && (
                <div style={{ marginTop: "8px", width: "80px", height: "80px", borderRadius: "8px", overflow: "hidden", border: "1px solid #eee" }}>
                  <img src={(form as any)._pendingImage || form.image_url} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
            </div>

            {form.category_id && !form.sku && (() => {
              const cat = categoriesFull.find(c => String(c.id) === form.category_id);
              if (!cat || !cat.auto_generate_sku) return null;
              const code = (cat.sku_prefix || "XXX").toUpperCase();
              const next = (cat.sku_counter || 0) + 1;
              return <div style={{ fontSize: "12px", color: "#27ae60", marginTop: "4px" }}>Se generara: {code}-{String(next).padStart(3,"0")}</div>;
            })()}

            <div style={{ marginTop: "16px", padding: "12px", background: "#f8f8f8", borderRadius: "10px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input type="checkbox" checked={form.is_premium} onChange={(e) => setForm({ ...form, is_premium: e.target.checked })} />
                Producto premium
              </label>
              {form.is_premium && (
                <div style={{ marginTop: "8px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "4px", color: "#555" }}>Nivel: {form.premium_level}/10</label>
                  <input type="range" min="1" max="10" value={form.premium_level}
                    onChange={(e) => setForm({ ...form, premium_level: parseInt(e.target.value) })}
                    style={{ width: "100%", accentColor: "#6c63ff" }} />
                </div>
              )}
            </div>

            <div style={{ marginTop: "12px", padding: "12px", background: "#f8f8f8", borderRadius: "10px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input type="checkbox" checked={form.requires_stock} onChange={(e) => setForm({ ...form, requires_stock: e.target.checked })} />
                Controla stock
              </label>
              {form.requires_stock && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px" }}>
                  <Input label="Stock actual" value={form.stock_quantity} onChange={(v) => setForm({ ...form, stock_quantity: v })} placeholder="0" type="number" />
                  <Input label="Stock minimo" value={form.min_stock} onChange={(v) => setForm({ ...form, min_stock: v })} placeholder="0" type="number" />
                </div>
              )}
            </div>

            <div style={{ marginTop: "12px", padding: "12px", background: "#f8f8f8", borderRadius: "10px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input type="checkbox" checked={form.uses_inputs} onChange={(e) => setForm({ ...form, uses_inputs: e.target.checked })} />
                Usa insumos (costo calculado)
              </label>
              {form.uses_inputs && editing && (
                <div style={{ marginTop: "10px" }}>
                  {components.length > 0 && (
                    <div style={{ marginBottom: "8px" }}>
                      {components.map(c => (
                        <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", fontSize: "12px" }}>
                          <span style={{ flex: 1 }}>{c.quantity} x {c.input_item_name} ({c.input_unit})</span>
                          <span style={{ color: "#888" }}>${(Number(c.quantity) * Number(c.default_cost)).toLocaleString("es-AR")}</span>
                          <button onClick={() => removeComponent(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#e74c3c", fontSize: "13px" }}>x</button>
                        </div>
                      ))}
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "#6c63ff", marginTop: "4px", borderTop: "1px solid #ddd", paddingTop: "4px" }}>
                        Costo total: ${computedCost.toLocaleString("es-AR")}
                      </div>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "6px", alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }}>
                      <select value={selectedInput} onChange={(e) => setSelectedInput(e.target.value)} style={{ width: "100%", padding: "6px 8px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "12px" }}>
                        <option value="">Seleccionar insumo...</option>
                        {allInputs.map(i => <option key={i.id} value={i.id}>{i.name} (${Number(i.default_cost).toLocaleString("es-AR")}/{i.unit})</option>)}
                      </select>
                    </div>
                    <div style={{ width: "70px" }}>
                      <input value={inputQty} onChange={(e) => setInputQty(e.target.value)} type="number" min="0" step="0.01" placeholder="1"
                        style={{ width: "100%", padding: "6px 8px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "12px" }} />
                    </div>
                    <button onClick={addComponent} style={{ background: "#6c63ff", color: "#fff", border: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}>Agregar</button>
                  </div>
                  {allInputs.length === 0 && <div style={{ fontSize: "11px", color: "#e74c3c", marginTop: "4px" }}>No hay insumos. Ve a Parametros - Insumos.</div>}
                </div>
              )}
              {!form.uses_inputs && <div style={{ marginTop: "8px", color: "#888", fontSize: "12px" }}>El costo manual esta junto al precio de venta.</div>}
            </div>

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button onClick={() => setShowForm(false)} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: "14px" }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "#6c63ff", color: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
              {editing && (
                <button onClick={() => { handleDelete(editing.id); setShowForm(false); }} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#e74c3c22", color: "#e74c3c", cursor: "pointer", fontSize: "14px" }}>
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
