"use client";

import { useEffect, useState } from "react";
import { fetchJson, postJson, deleteJson } from "../../lib";
import { Card, CardHeader, IconButton, PageTitle, Loading } from "../../components/shared/UI";

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
    try { await postJson("/payment-methods", { name: newName.trim() }); setNewName(""); load(); } catch (e) { console.error(e); }
  }

  async function remove(id: number) {
    if (!confirm("¿Eliminar?")) return;
    try { await deleteJson(`/payment-methods/${id}`); load(); } catch (e) { console.error(e); }
  }

  return (
    <Card style={{ marginBottom: "16px" }}>
      <CardHeader title="💳 Medios de Pago" />
      {loading ? <Loading /> : (
        <>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nuevo..."
              style={{ flex: 1, padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px" }}
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
            <IconButton variant="primary" title="Agregar" onClick={add}>+</IconButton>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {items.map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px", background: "#f4f4f4", borderRadius: "20px" }}>
                <span style={{ fontSize: "13px" }}>{item.name}</span>
                <button onClick={() => remove(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#e74c3c", fontSize: "14px", padding: "0", lineHeight: 1 }}>×</button>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

type Category = { id: number; name: string; is_active: boolean };

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
    <Card style={{ marginBottom: "16px" }}>
      <CardHeader title="📂 Categorías" />
      {loading ? <Loading /> : (
        <>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nueva..." style={{ flex: 1, padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px" }} onKeyDown={(e) => e.key === "Enter" && add()} />
            <IconButton variant="primary" title="Agregar" onClick={add}>+</IconButton>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {items.map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px", background: "#f4f4f4", borderRadius: "20px" }}>
                <span style={{ fontSize: "13px" }}>{item.name}</span>
                <button onClick={() => remove(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#e74c3c", fontSize: "14px", padding: "0", lineHeight: 1 }}>×</button>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

type Brand = { id: number; name: string };

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
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nueva..." style={{ flex: 1, padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px" }} onKeyDown={(e) => e.key === "Enter" && add()} />
            <IconButton variant="primary" title="Agregar" onClick={add}>+</IconButton>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {items.map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px", background: "#f4f4f4", borderRadius: "20px" }}>
                <span style={{ fontSize: "13px" }}>{item.name}</span>
                <button onClick={() => remove(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#e74c3c", fontSize: "14px", padding: "0", lineHeight: 1 }}>×</button>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
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
    </div>
  );
}
