"use client";

import { useEffect, useState } from "react";
import { fetchJson, postJson } from "../../lib";
import { Card, CardHeader, IconButton, Input, Select, PageTitle, Loading, Empty, Badge } from "../../components/shared/UI";

type Product = {
  id: number;
  name: string;
  sku: string;
  price: number;
  unit: string;
  category_name: string;
  brand_name: string;
  stock_quantity: number;
};

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState<{id:number;name:string}[]>([]);
  const [brands, setBrands] = useState<{id:number;name:string}[]>([]);
  const [form, setForm] = useState({ name: "", sku: "", price: "", unit: "unidad", category_id: "", brand_id: "" });

  function load() {
    setLoading(true);
    Promise.all([
      fetchJson<Product[]>("/products"),
      fetchJson<{id:number;name:string}[]>("/product-categories"),
      fetchJson<{id:number;name:string}[]>("/product-brands"),
    ])
      .then(([p, c, b]) => { setProducts(p); setCategories(c); setBrands(b); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleAdd() {
    if (!form.name) return;
    try {
      await postJson("/products", {
        name: form.name, sku: form.sku, price: Number(form.price) || 0,
        unit: form.unit, category_id: form.category_id || null, brand_id: form.brand_id || null,
      });
      setForm({ name: "", sku: "", price: "", unit: "unidad", category_id: "", brand_id: "" });
      setShowForm(false);
      load();
    } catch (e) { console.error(e); }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <PageTitle>📦 Productos</PageTitle>
        <IconButton variant="primary" title="Nuevo producto" onClick={() => setShowForm(!showForm)}>+</IconButton>
      </div>

      {showForm && (
        <Card style={{ marginBottom: "20px" }}>
          <CardHeader title="+ Nuevo producto" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Input label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Input label="SKU" value={form.sku} onChange={(v) => setForm({ ...form, sku: v })} />
            <Input label="Precio" value={form.price} onChange={(v) => setForm({ ...form, price: v })} type="number" />
            <Input label="Unidad" value={form.unit} onChange={(v) => setForm({ ...form, unit: v })} />
            <Select label="Categoría" value={form.category_id} onChange={(v) => setForm({ ...form, category_id: v })}
              options={[{value:"",label:"Sin categoría"}, ...categories.map(c=>({value:String(c.id),label:c.name}))]} />
            <Select label="Marca" value={form.brand_id} onChange={(v) => setForm({ ...form, brand_id: v })}
              options={[{value:"",label:"Sin marca"}, ...brands.map(b=>({value:String(b.id),label:b.name}))]} />
          </div>
          <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
            <IconButton variant="primary" onClick={handleAdd}>✓</IconButton>
            <IconButton variant="secondary" onClick={() => setShowForm(false)}>✕</IconButton>
          </div>
        </Card>
      )}

      {loading ? <Loading /> : products.length === 0 ? (
        <Empty message="Sin productos" />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" }}>
          {products.map((p) => (
            <Card key={p.id}>
              <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>{p.name}</div>
              {p.sku && <div style={{ fontSize: "11px", color: "#aaa" }}>SKU {p.sku}</div>}
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#6c63ff", marginTop: "6px" }}>
                ${Number(p.price).toLocaleString("es-AR")}
              </div>
              <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>📦 {p.stock_quantity} {p.unit}</div>
              {p.category_name && <Badge style={{ marginTop: "6px" }}>{p.category_name}</Badge>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
