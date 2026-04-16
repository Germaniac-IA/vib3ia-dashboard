"use client";

import { useEffect, useState } from "react";
import { fetchJson, postJson, money } from "../lib";
import type { Contact, Product, SaleChannel, OrderStatus, PaymentStatus, User } from "../types";

type SaleChannel = { id: number; name: string; sort_order: number };
type OrderStatus = { id: number; name: string; color: string; sort_order: number };
type PaymentStatus = { id: number; name: string; color: string; sort_order: number };

type ItemDraft = { product_id: number; product_name: string; quantity: number; unit_price: number };

type Props = {
  saleChannels: SaleChannel[];
  orderStatuses: OrderStatus[];
  paymentStatuses: PaymentStatus[];
  onClose: () => void;
  onCreated: () => void;
};

export default function NewSaleModal({ saleChannels, orderStatuses, paymentStatuses, onClose, onCreated }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);

  const [contactSearch, setContactSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const [form, setForm] = useState({
    contact_id: "",
    seller_id: "",
    sale_channel_id: "",
    payment_method_id: "",
    notes: "",
    delivery_address: "",
    delivery_location: "",
    scheduled_date: "",
    scheduled_time: "",
    delivery_fee: "0",
    discount_type: "",
    discount_value: "",
  });

  const [items, setItems] = useState<ItemDraft[]>([]);

  useEffect(() => {
    Promise.all([
      fetchJson<Contact[]>("/contacts"),
      fetchJson<Product[]>("/products"),
      fetchJson<User[]>("/users"),
    ]).then(([c, p, u]) => {
      setContacts(c);
      setProducts(p);
      setUsers(u.filter(user => user.is_active !== false));
    }).catch(console.error);
  }, []);

  const filteredContacts = contacts.filter(co =>
    !contactSearch || co.name?.toLowerCase().includes(contactSearch.toLowerCase()) ||
    co.phone?.includes(contactSearch) || co.email?.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const filteredProducts = products.filter(pr =>
    (!productSearch || pr.name?.toLowerCase().includes(productSearch.toLowerCase())) &&
    pr.discontinued !== 1
  );

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  let discountAmount = 0;
  if (form.discount_type === "percent" && Number(form.discount_value)) {
    discountAmount = subtotal * (Number(form.discount_value) / 100);
  } else if (form.discount_type === "fixed" && Number(form.discount_value)) {
    discountAmount = Number(form.discount_value);
  }
  const deliveryFee = Number(form.delivery_fee) || 0;
  const total = Math.max(0, subtotal - discountAmount + deliveryFee);

  function addProduct(p: Product) {
    if (items.find(i => i.product_id === p.id)) return;
    setItems([...items, { product_id: p.id, product_name: p.name, quantity: 1, unit_price: Number(p.price) || 0 }]);
    setProductSearch("");
  }

  function updateItem(idx: number, field: keyof ItemDraft, value: string | number) {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!form.contact_id) { alert("Seleccioná un cliente"); return; }
    if (items.length === 0) { alert("Agregá al menos un producto"); return; }
    setSaving(true);
    try {
      await postJson("/orders", {
        contact_id: Number(form.contact_id),
        seller_id: form.seller_id ? Number(form.seller_id) : undefined,
        sale_channel_id: form.sale_channel_id ? Number(form.sale_channel_id) : undefined,
        payment_method_id: form.payment_method_id ? Number(form.payment_method_id) : undefined,
        discount_type: form.discount_type || undefined,
        discount_value: form.discount_value ? Number(form.discount_value) : undefined,
        delivery_fee: deliveryFee,
        notes: form.notes || undefined,
        items: items.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
        delivery: (form.delivery_address || form.scheduled_date) ? {
          address: form.delivery_address,
          location: form.delivery_location,
          scheduled_date: form.scheduled_date,
          scheduled_time: form.scheduled_time,
          notes: "",
        } : undefined,
      });
      onCreated();
    } catch (e: any) {
      alert("Error: " + (e?.message || "No se pudo crear la venta"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "680px", maxHeight: "90vh", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>🧾 Nueva Venta</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", padding: "4px 8px" }}>✕</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {/* Cliente */}
        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "#666", display: "block", marginBottom: "4px" }}>Cliente *</label>
          <input
            value={contactSearch}
            onChange={e => setContactSearch(e.target.value)}
            placeholder="Buscar por nombre, teléfono o email..."
            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px", boxSizing: "border-box" }}
          />
          {contactSearch && (
            <div style={{ border: "1px solid #ddd", borderRadius: "8px", marginTop: "4px", maxHeight: "150px", overflowY: "auto", background: "#fff", zIndex: 10, position: "relative" }}>
              {filteredContacts.length === 0 ? (
                <div style={{ padding: "8px", fontSize: "12px", color: "#999", textAlign: "center" }}>Sin resultados</div>
              ) : filteredContacts.slice(0, 10).map(c => (
                <div key={c.id} onClick={() => { setForm(f => ({ ...f, contact_id: String(c.id) })); setContactSearch(c.name || ""); }}
                  style={{ padding: "8px 12px", cursor: "pointer", fontSize: "13px", borderBottom: "1px solid #f0" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f5")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                  <b>{c.name}</b> {c.phone && <span style={{ color: "#888" }}>· {c.phone}</span>}
                </div>
              ))}
            </div>
          )}
          {form.contact_id && <div style={{ fontSize: "11px", color: "#27ae60", marginTop: "2px" }}>✓ Cliente seleccionado (ID: {form.contact_id})</div>}
        </div>

        {/* Vendedor */}
        <div>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "#666", display: "block", marginBottom: "4px" }}>Vendedor</label>
          <select value={form.seller_id} onChange={e => setForm(f => ({ ...f, seller_id: e.target.value }))}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }}>
            <option value="">— Asignar vendedor —</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name || u.username}</option>)}
          </select>
        </div>

        {/* Canal */}
        <div>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "#666", display: "block", marginBottom: "4px" }}>Canal de Venta</label>
          <select value={form.sale_channel_id} onChange={e => setForm(f => ({ ...f, sale_channel_id: e.target.value }))}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }}>
            <option value="">— Seleccionar —</option>
            {saleChannels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Productos */}
        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "#666", display: "block", marginBottom: "4px" }}>Productos</label>
          <input
            value={productSearch}
            onChange={e => setProductSearch(e.target.value)}
            placeholder="Buscar producto..."
            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }}
          />
          {productSearch && (
            <div style={{ border: "1px solid #ddd", borderRadius: "8px", marginTop: "4px", maxHeight: "150px", overflowY: "auto", background: "#fff" }}>
              {filteredProducts.slice(0, 8).map(p => (
                <div key={p.id} onClick={() => addProduct(p)}
                  style={{ padding: "8px 12px", cursor: "pointer", fontSize: "13px", borderBottom: "1px solid #f0", display: "flex", justifyContent: "space-between" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f5")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                  <span>{p.name}</span>
                  <span style={{ color: "#888", fontWeight: 700 }}>${Number(p.price).toLocaleString("es-AR")}</span>
                </div>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <div style={{ marginTop: "8px", border: "1px solid #eee", borderRadius: "8px", overflow: "hidden" }}>
              {items.map((item, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderBottom: "1px solid #f0", fontSize: "13px" }}>
                  <span style={{ flex: 1 }}>{item.product_name}</span>
                  <input type="number" value={item.quantity} min={1}
                    onChange={e => updateItem(idx, "quantity", Number(e.target.value))}
                    style={{ width: "50px", padding: "4px 6px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "12px", textAlign: "center" }} />
                  <span style={{ color: "#888", fontSize: "12px" }}>×</span>
                  <input type="number" value={item.unit_price}
                    onChange={e => updateItem(idx, "unit_price", Number(e.target.value))}
                    style={{ width: "80px", padding: "4px 6px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "12px" }} />
                  <span style={{ fontWeight: 700, minWidth: "70px", textAlign: "right" }}>
                    ${(item.quantity * item.unit_price).toLocaleString("es-AR")}
                  </span>
                  <button onClick={() => removeItem(idx)} style={{ background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontSize: "14px", padding: "2px 4px" }}>✕</button>
                </div>
              ))}
              <div style={{ padding: "8px 12px", fontWeight: 800, fontSize: "13px", textAlign: "right", background: "#f9f9f9" }}>
                Subtotal: ${subtotal.toLocaleString("es-AR")}
              </div>
            </div>
          )}
        </div>

        {/* Descuento */}
        <div>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "#666", display: "block", marginBottom: "4px" }}>Tipo Descuento</label>
          <select value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }}>
            <option value="">Sin descuento</option>
            <option value="percent">% Porcentaje</option>
            <option value="fixed">$ Monto fijo</option>
          </select>
        </div>
        {form.discount_type && (
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#666", display: "block", marginBottom: "4px" }}>
              {form.discount_type === "percent" ? "% Descuento" : "$ Descuento"}
            </label>
            <input type="number" value={form.discount_value} min={0}
              onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }} />
          </div>
        )}

        {/* Costo envío */}
        <div>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "#666", display: "block", marginBottom: "4px" }}>Costo de Envío</label>
          <input type="number" value={form.delivery_fee} min={0}
            onChange={e => setForm(f => ({ ...f, delivery_fee: e.target.value }))}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }} />
        </div>

        {/* Método de pago */}
        <div>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "#666", display: "block", marginBottom: "4px" }}>Método de Pago</label>
          <select value={form.payment_method_id} onChange={e => setForm(f => ({ ...f, payment_method_id: e.target.value }))}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }}>
            <option value="">— Seleccionar —</option>
            <option value="1">Efectivo</option>
            <option value="2">Mercado Pago</option>
            <option value="3">Transferencia</option>
          </select>
        </div>

        {/* Entrega */}
        <div style={{ gridColumn: "1/-1", borderTop: "1px solid #eee", paddingTop: "12px", marginTop: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "#666", display: "block", marginBottom: "4px" }}>Dirección de Entrega</label>
          <input value={form.delivery_address} onChange={e => setForm(f => ({ ...f, delivery_address: e.target.value }))}
            placeholder="Dirección completa"
            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px", marginBottom: "6px" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <input value={form.delivery_location} onChange={e => setForm(f => ({ ...f, delivery_location: e.target.value }))}
              placeholder="Localidad" style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }} />
            <input type="date" value={form.scheduled_date}
              onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))}
              style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }} />
          </div>
          <div style={{ marginTop: "6px" }}>
            <input value={form.scheduled_time} onChange={e => setForm(f => ({ ...f, scheduled_time: e.target.value }))}
              placeholder="Horario preferido (ej: 14:00 a 18:00)"
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }} />
          </div>
        </div>

        {/* Notas */}
        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "#666", display: "block", marginBottom: "4px" }}>Notas</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Observaciones..."
            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px", minHeight: "60px", resize: "vertical" }} />
        </div>
      </div>

      {/* Resumen y acciones */}
      <div style={{ marginTop: "16px", borderTop: "2px solid #1a1a2e", paddingTop: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
          <span>Subtotal:</span><span>${subtotal.toLocaleString("es-AR")}</span>
        </div>
        {discountAmount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#e74c3c", marginBottom: "4px" }}>
            <span>Descuento:</span><span>-${discountAmount.toLocaleString("es-AR")}</span>
          </div>
        )}
        {deliveryFee > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
            <span>Envío:</span><span>${deliveryFee.toLocaleString("es-AR")}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: 800, color: "#1a1a2e", marginTop: "4px" }}>
          <span>Total:</span><span>${total.toLocaleString("es-AR")}</span>
        </div>
        <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: "14px" }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 2, padding: "10px", borderRadius: "8px", border: "none", background: "#27ae60", color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
            {saving ? "Guardando..." : "✅ Crear Venta"}
          </button>
        </div>
      </div>
    </div>
  );
}
