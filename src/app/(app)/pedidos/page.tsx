"use client";

import { useEffect, useState } from "react";
import { fetchJson, putJson } from "../../lib";
import { Card, Button, PageTitle, Loading, Empty, Badge } from "../../components/shared/UI";

type Order = {
  id: number;
  order_number: string;
  total: number;
  status: string;
  payment_status: string;
  payment_method_name: string;
  contact_name: string;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#f39c12",
  confirmed: "#3498db",
  preparing: "#9b59b6",
  delivered: "#27ae60",
  cancelled: "#e74c3c",
};

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJson<Order[]>("/orders")
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: number, status: string) {
    try {
      await putJson(`/orders/${id}`, { status });
      const updated = await fetchJson<Order[]>("/orders");
      setOrders(updated);
    } catch (e) { console.error(e); }
  }

  return (
    <div>
      <PageTitle>🧾 Pedidos</PageTitle>
      {loading ? <Loading /> : orders.length === 0 ? (
        <Empty message="No hay pedidos" />
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {orders.map((o) => (
            <Card key={o.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "14px" }}>{o.order_number}</div>
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>
                    {o.contact_name || "Sin cliente"} · {new Date(o.created_at).toLocaleDateString("es-AR")}
                  </div>
                  <div style={{ marginTop: "6px" }}>
                    <Badge color={STATUS_COLORS[o.status] || "#888"}>{o.status}</Badge>
                    <span style={{ fontSize: "13px", marginLeft: "8px", fontWeight: 600 }}>
                      ${Number(o.total).toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>
                <select
                  value={o.status}
                  onChange={(e) => updateStatus(o.id, e.target.value)}
                  style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }}
                >
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="preparing">Preparando</option>
                  <option value="delivered">Entregado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
