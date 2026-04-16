import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import toast from "react-hot-toast";

export default function Cart() {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const navigate = useNavigate();

  const fetchCart = () => API.get("/cart").then((res) => setCart(res.data));
  const notifyCart = () => window.dispatchEvent(new Event("cart-updated"));

  useEffect(() => { fetchCart(); }, []);

  const updateQty = async (productId, delta) => {
    const item = cart.items.find((i) => i.product_id === productId);
    if (!item) return;
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      await API.delete(`/cart/remove/${productId}`);
      toast.success("Removed");
    } else {
      await API.post("/cart/add", { product_id: productId, quantity: delta });
    }
    fetchCart();
    notifyCart();
  };

  const remove = async (productId) => {
    await API.delete(`/cart/remove/${productId}`);
    toast.success("Removed");
    fetchCart();
    notifyCart();
  };

  if (!cart.items.length) {
    return (
      <div className="text-center py-24">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
        <p className="text-gray-400 mb-6">Looks like you haven't added any snacks yet</p>
        <button onClick={() => navigate("/")}
          className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-200 transition-all">
          Browse Snacks
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Your Cart</h1>
          <p className="text-gray-400 mt-1">{cart.items.length} item{cart.items.length > 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="space-y-3">
        {cart.items.map((item) => (
          <div key={item.product_id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-4 flex items-center gap-5">
            <img src={item.image_url} alt={item.product_name}
              className="w-20 h-20 rounded-xl object-cover shadow-sm" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-800">{item.product_name}</h3>
              <p className="text-sm text-gray-400 mt-0.5">₹{item.price} per item</p>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl p-1">
              <button onClick={() => updateQty(item.product_id, -1)}
                className="w-9 h-9 rounded-lg bg-white text-red-500 font-bold hover:bg-red-50 flex items-center justify-center shadow-sm border border-gray-100 active:scale-90 transition-all text-lg">
                −
              </button>
              <span className="font-bold w-8 text-center text-gray-800">{item.quantity}</span>
              <button onClick={() => updateQty(item.product_id, 1)}
                className="w-9 h-9 rounded-lg bg-white text-green-500 font-bold hover:bg-green-50 flex items-center justify-center shadow-sm border border-gray-100 active:scale-90 transition-all text-lg">
                +
              </button>
            </div>
            <span className="font-extrabold text-gray-900 w-20 text-right text-lg">
              ₹{(item.price * item.quantity).toFixed(0)}
            </span>
            <button onClick={() => remove(item.product_id)}
              className="w-9 h-9 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-indigo-200 text-sm font-medium">Order Total</p>
            <p className="text-3xl font-extrabold text-white mt-1">₹{cart.total}</p>
          </div>
          <button onClick={() => navigate("/checkout")}
            className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all">
            Checkout →
          </button>
        </div>
      </div>
    </div>
  );
}
