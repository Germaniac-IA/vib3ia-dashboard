"use client";

import { useEffect, useState } from "react";
import { fetchJson, postJson, putJson, deleteJson } from "../../../lib";
import { Card, CardHeader, Button, Input, PageTitle, Loading, Empty, Badge } from "../../../components/UI";

// ─── Payment Method ────────────────────────────────────────────
type PaymentMethod = { id: number; name: string; is_active: boolean; sort_order: number };

function PaymentMethodsABM() {
  const [items, setItems] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");

  function load() {
    setLoading(true);
    fetchJson<PaymentMethod[]>("/payment-methods")
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function add() {
    if (!newName.trim()) return;
    try {
      await postJson("/payment-methods", { name: newName.trim() });
      setNewName("");
      load();
    } catch (e) { console.error(e); }
  }

  async function toggleActive(item: PaymentMethod) {
    try {
      await putJson(`/payment-methods/${item.id}`, { is_active: !item.is_active });
      load();
    } catch (e) { console.error(e); }
  }

  async function remove(id: number) {
    if (!confirm("¿Eliminar?")) return;
    try { await deleteJson(`/payment-methods/${id}`); load(); } catch (e) { console.error(e); }
  }

  return (
    <Card style={{ marginBottom: "20px" }}>
      <CardHeader title="💳 Medios de Pago" />
      {loading ? <Loading /> : (
        <>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nuevo medio de pago"
              style={{ flex: 1, padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px" }}
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
            <Button onClick={add}>Agregar</Button>
          </div>
          {items.length === 0 ? <Empty message="Sin medios de pago" /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {items.map((item) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: item.is_active ? "#f8f8f8" : "#fff0f0", borderRadius: "8px" }}>
                  <span style={{ fontSize: "14px", color: item.is_active ? "#333" : "#aaa", textDecoration: item.is_active ? "none" : "line-through" }}>{item.name}</span>
                  <Button variant="danger" onClick={() => remove(item.id)} style={{ padding: "4px 10px", fontSize: "12px" }}>×</Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
}

// ─── Product Category ─────────────────────────────────────────
type Category = { id: number; name: string; description: string; is_active: boolean };

function CategoriesABM() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");

  function load() {
    setLoading(true);
    fetchJson<Category[]>("/product-categories")
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function add() {
    if (!newName.trim()) return;
    try { await postJson("/product-categories", { name: newName.trim() }); setNewName(""); load(); } catch (e) { console.error(e); }
  }

  async function remove(id: number) {
    if (!confirm("¿Eliminar?")) return;
    try { await deleteJson(`/product-categories/${id}`); load(); } catch (e) { console.error(e); }
  }

  return (
    <Card style={{ marginBottom: "20px" }}>
      <CardHeader title="📂 Categorías de Producto" />
      {loading ? <Loading /> : (
        <>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nueva categoría" style={{ flex: 1, padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px" }} onKeyDown={(e) => e.key === "Enter" && add()} />
            <Button onClick={add}>Agregar</Button>
          </div>
          {items.length === 0 ? <Empty message="Sin categorías" /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {items.map((item) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f8f8f8", borderRadius: "8px" }}>
                  <span style={{ fontSize: "14px" }}>{item.name}</span>
                  <Button variant="danger" onClick={() => remove(item.id)} style={{ padding: "4px 10px", fontSize: "12px" }}>×</Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
}

// ─── Product Brand ─────────────────────────────────────────────
type Brand = { id: number; name: string; is_active: boolean };

function BrandsABM() {
  const [items, setItems] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");

  function load() {
    setLoading(true);
    fetchJson<Brand[]>("/product-brands")
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function add() {
    if (!newName.trim()) return;
    try { await postJson("/product-brands", { name: newName.trim() }); setNewName(""); load(); } catch (e) { console.error(e); }
  }

  async function remove(id: number) {
    if (!confirm("¿Eliminar?")) return;
    try { await deleteJson(`/product-brands/${id}`); load(); } catch (e) { console.error(e); }
  }

  return (
    <Card>
      <CardHeader title="🏷️ Marcas" />
      {loading ? <Loading /> : (
        <>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nueva marca" style={{ flex: 1, padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px" }} onKeyDown={(e) => e.key === "Enter" && add()} />
            <Button onClick={add}>Agregar</Button>
          </div>
          {items.length === 0 ? <Empty message="Sin marcas" /> : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {items.map((item) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "#f8f8f8", borderRadius: "20px" }}>
                  <span style={{ fontSize: "13px" }}>{item.name}</span>
                  <button onClick={() => remove(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#e74c3c", fontSize: "14px", lineHeight: 1, padding: "0" }}>×</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────
export default function ParametrosPage() {
  return (
    <div>
      <PageTitle>⚙️ Parámetros</PageTitle>
      <p style={{ color: "#888", fontSize: "14px", marginBottom: "20px" }}>
        Configurá los catálogos de tu negocio antes de cargar productos y procesar pedidos.
      </p>
      <PaymentMethodsABM />
      <CategoriesABM />
      <BrandsABM />
    </div>
  );
}
