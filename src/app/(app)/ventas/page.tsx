"use client";

import { useEffect, useState } from "react";
import { fetchJson, postJson, putJson, deleteJson, money } from "../../lib";
import { Card, Badge, IconButton, Input, Select, PageTitle, Loading, Empty } from "../../components/shared/UI";
import OrderDetailModal from "../../components/OrderDetailModal";
import NewSaleModal from "../../components/NewSaleModal";
import type {
  OrderDetail, Product, Contact, SaleChannel, OrderStatus, PaymentStatus, User
} from "../../types";

type OrderRow = {
  id: number;
  order_number: string;
  total: number;
  subtotal: number;
  discount_type: string;
  discount_value: number;
  delivery_fee: number;
  contact_name: string;
  seller_name: string;
  sale_channel_name: string;
  order_status_name: string;
  order_status_color: string;
  payment_status_name: string;
  payment_status_color: string;
  payment_paid: number;
  payment_pending: number;
  items: Array<{ quantity: number }>;
  created_at: string;
};

const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50,
  display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
};

export default function VentasPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [search, setSearch] = useState("");
  const [filterChannel, setFilterChannel] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPayment, setFilterPayment] = useState("");

  const [saleChannels, setSaleChannels] = useState<SaleChannel[]>([]);
  const [orderStatuses, setOrderStatuses] = useState<OrderStatus[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatus[]>([]);

  const [detailId, setDetailId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  function load() {
    setLoading(true);
    Promise.all([
      fetchJson<OrderRow[]>("/orders"),
      fetchJson<SaleChannel[]>("/sale-channels"),
      fetchJson<OrderStatus[]>("/order-statuses"),
      fetchJson<PaymentStatus[]>("/payment-statuses"),
    ]).then(([o, sc, os, ps]) => {
      setOrders(o);
      setSaleChannels(sc);
      setOrderStatuses(os);
      setPaymentStatuses(ps);
    }).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [refreshKey]);

  function handleUpdated() { setDetailId(null); setRefreshKey(k => k + 1); }
  function handleCreated() { setShowNew(false); setRefreshKey(k => k + 1); }

  const filtered = orders.filter(o => {
    if (search && !o.contact_name?.toLowerCase().includes(search.toLowerCase()) &&
        !o.order_number?.toLowerCase().includes(search.toLowerCase()) &&
        !o.seller_name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterChannel && String(o.sale_channel_name) !== filterChannel) return false;
    if (filterStatus && String(o.order_status_name) !== filterStatus) return false;
    if (filterPayment && String(o.payment_status_name) !== filterPayment) return false;
    return true;
  });

  const itemCount = (o: OrderRow) => o.items?.reduce((s, i) => s + (i.quantity || 1), 0) ?? 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
        <PageTitle>🧾 Ventas</PageTitle>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={() => setViewMode("cards")}
            style={{ padding: "6px 12px", borderRadius: "8px", border: "none", background: viewMode === "cards" ? "#1a1a2e" : "#e0e0e0", color: viewMode === "cards" ? "#fff" : "#333", cursor: "pointer", fontSize: "13px" }}
          >Cards</button>
          <button
            onClick={() => setViewMode("list")}
            style={{ padding: "6px 12px", borderRadius: "8px", border: "none", background: viewMode === "list" ? "#1a1a2e" : "#e0e0e0", color: viewMode === "list" ? "#fff" : "#333", cursor: "pointer", fontSize: "13px" }}
          >Lista</button>
          <button
            onClick={() => setShowNew(true)}
            style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#27ae60", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 700 }}
          >+ Nueva Venta</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por cliente, #NV, vendedor..."
          style={{ flex: 1, minWidth: "180px", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }}
        />
        <select value={filterChannel} onChange={e => setFilterChannel(e.target.value)}
          style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px", minWidth: "130px" }}>
          <option value="">Canal: Todos</option>
          {saleChannels.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px", minWidth: "130px" }}>
          <option value="">Estado: Todos</option>
          {orderStatuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
        <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)}
          style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px", minWidth: "130px" }}>
          <option value="">Pago: Todos</option>
          {paymentStatuses.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select>
      </div>

      {loading ? <Loading /> : filtered.length === 0 ? (
        <Empty message="Sin ventas registradas" />
      ) : viewMode === "cards" ? (
        <div style={{ display: "grid", gap: "10px" }}>
          {filtered.map(o => (
            <Card key={o.id} onClick={() => setDetailId(o.id)} style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 800, fontSize: "14px", color: "#1a1a2e" }}>{o.order_number}</span>
                    {o.sale_channel_name && (
                      <span style={{ fontSize: "11px", background: "#f0f0f0", padding: "2px 6px", borderRadius: "4px", color: "#666" }}>
                        {o.sale_channel_name}
                      </span>
                    )}
                    {o.seller_name && (
                      <span style={{ fontSize: "11px", color: "#888" }}>👤 {o.seller_name}</span>
                    )}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>
                    {o.contact_name || "Sin cliente"} · {new Date(o.created_at).toLocaleDateString("es-AR")}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "17px", fontWeight: 800, color: "#1a1a2e" }}>
                      ${Number(o.total).toLocaleString("es-AR")}
                    </span>
                    {o.discount_value > 0 && (
                      <span style={{ fontSize: "12px", color: "#e74c3c", textDecoration: "line-through" }}>
                        ${Number(o.subtotal + o.discount_value + o.delivery_fee).toLocaleString("es-AR")}
                      </span>
                    )}
                    <span style={{ fontSize: "11px", color: "#aaa" }}>({itemCount(o)} items)</span>
                  </div>
                  <div style={{ display: "flex", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
                    {o.order_status_name && (
                      <Badge color={o.order_status_color || "#888"}>{o.order_status_name}</Badge>
                    )}
                    {o.payment_status_name && (
                      <Badge color={o.payment_status_color || "#888"}>{o.payment_status_name}</Badge>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: "11px", color: "#aaa", textAlign: "right" }}>
                  {o.payment_paid > 0 && (
                    <div style={{ color: "#27ae60" }}>Cobrado: ${Number(o.payment_paid).toLocaleString("es-AR")}</div>
                  )}
                  {o.payment_pending > 0 && o.payment_pending < o.total && (
                    <div style={{ color: "#f39c12" }}>Pendiente: ${Number(o.payment_pending).toLocaleString("es-AR")}</div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f8f8f8" }}>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700 }}>#</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700 }}>Cliente</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700 }}>Fecha</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700 }}>Vendedor</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700 }}>Canal</th>
                <th style={{ padding: "8px", textAlign: "right", fontWeight: 700 }}>Total</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700 }}>Pago</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} onClick={() => setDetailId(o.id)} style={{ cursor: "pointer", borderBottom: "1px solid #f0" }}>
                  <td style={{ padding: "8px", fontWeight: 700 }}>{o.order_number}</td>
                  <td style={{ padding: "8px" }}>{o.contact_name || "—"}</td>
                  <td style={{ padding: "8px" }}>{new Date(o.created_at).toLocaleDateString("es-AR")}</td>
                  <td style={{ padding: "8px", color: "#666" }}>{o.seller_name || "—"}</td>
                  <td style={{ padding: "8px", color: "#666" }}>{o.sale_channel_name || "—"}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontWeight: 700 }}>${Number(o.total).toLocaleString("es-AR")}</td>
                  <td style={{ padding: "8px" }}>
                    {o.payment_status_name && <Badge color={o.payment_status_color || "#888"}>{o.payment_status_name}</Badge>}
                  </td>
                  <td style={{ padding: "8px" }}>
                    {o.order_status_name && <Badge color={o.order_status_color || "#888"}>{o.order_status_name}</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detailId && (
        <div style={overlayStyle} onClick={e => e.target === e.currentTarget && setDetailId(null)}>
          <OrderDetailModal
            orderId={detailId}
            orderStatuses={orderStatuses}
            paymentStatuses={paymentStatuses}
            saleChannels={saleChannels}
            onClose={() => setDetailId(null)}
            onUpdated={handleUpdated}
          />
        </div>
      )}

      {showNew && (
        <div style={overlayStyle} onClick={e => e.target === e.currentTarget && setShowNew(false)}>
          <NewSaleModal
            saleChannels={saleChannels}
            orderStatuses={orderStatuses}
            paymentStatuses={paymentStatuses}
            onClose={() => setShowNew(false)}
            onCreated={handleCreated}
          />
        </div>
      )}
    </div>
  );
}
