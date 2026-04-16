import { useState, useEffect } from "react";
import API from "../api";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/payment/orders").then((r) => setOrders(r.data)).finally(() => setLoading(false));
  }, []);

  const statusStyle = (s) => {
    const map = {
      delivered: "bg-green-100 text-green-700",
      shipped: "bg-blue-100 text-blue-700",
      paid: "bg-emerald-100 text-emerald-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return map[s] || "bg-yellow-100 text-yellow-700";
  };

  const statusLabel = (s) => {
    const map = { delivered: "✅ Delivered", shipped: "🚚 Shipped", paid: "💰 Paid", cancelled: "❌ Cancelled", created: "⏳ Processing" };
    return map[s] || s;
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl h-32 border border-gray-100" />
        ))}
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="text-center py-24">
        <div className="text-6xl mb-4">📦</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No orders yet</h2>
        <p className="text-gray-400">Your order history will appear here after your first purchase.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">My Orders</h1>
        <p className="text-gray-400 mt-1">{orders.length} order{orders.length > 1 ? "s" : ""}</p>
      </div>

      <div className="space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-gray-400">Order #{o.id.slice(-8).toUpperCase()}</p>
                <p className="text-xs text-gray-300 mt-0.5">{o.created_at?.slice(0, 10)}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusStyle(o.status)}`}>
                {statusLabel(o.status)}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 mb-3">
              {o.items?.map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                  {item.image_url && <img src={item.image_url} alt={item.product_name} className="w-8 h-8 rounded-lg object-cover" />}
                  <div>
                    <p className="text-sm font-medium text-gray-700">{item.product_name}</p>
                    <p className="text-xs text-gray-400">×{item.quantity} · ₹{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-3 border-t border-gray-50">
              <span className="text-lg font-extrabold text-gray-900">₹{o.total}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
