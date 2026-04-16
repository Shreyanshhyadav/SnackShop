import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api";
import toast from "react-hot-toast";

export default function Checkout() {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/cart").then((res) => {
      if (!res.data.items.length) navigate("/cart");
      else setCart(res.data);
    });
  }, [navigate]);

  const handlePayment = async () => {
    setPaying(true);
    try {
      const { data } = await API.post("/payment/create-order", { amount: cart.total });

      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "SnackShop",
        description: "Snack Order Payment",
        order_id: data.order_id,
        handler: async (response) => {
          // Verify payment on backend
          try {
            await API.post("/payment/verify", {
              order_id: data.order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            setSuccess(true);
            window.dispatchEvent(new Event("cart-updated"));
            setTimeout(() => navigate("/"), 3000);
          } catch {
            toast.error("Payment verification failed");
            setPaying(false);
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: { color: "#4f46e5" },
        modal: {
          ondismiss: () => setPaying(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        toast.error("Payment failed: " + (response.error?.description || "Unknown error"));
        setPaying(false);
      });
      rzp.open();
    } catch (err) {
      toast.error("Failed to create order");
      setPaying(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-200 mb-6 animate-bounce">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-400 text-lg">Your order has been placed. Redirecting...</p>
          <div className="mt-6 inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Order confirmed
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Checkout</h1>
        <p className="text-gray-400 mt-1">Review your order and pay</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6 space-y-3">
          {cart.items.map((item) => (
            <div key={item.product_id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <img src={item.image_url} alt={item.product_name} className="w-12 h-12 rounded-lg object-cover" />
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{item.product_name}</p>
                  <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                </div>
              </div>
              <span className="font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(0)}</span>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>Subtotal</span>
            <span>₹{cart.total}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500 mb-3">
            <span>Delivery</span>
            <span className="text-green-500 font-medium">Free</span>
          </div>
          <div className="flex justify-between text-xl font-extrabold text-gray-900 pt-3 border-t border-gray-200">
            <span>Total</span>
            <span>₹{cart.total}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="px-6 py-4 border-t border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-3">Payment Method</p>
          <div className="flex items-center gap-3 bg-indigo-50 border-2 border-indigo-200 rounded-xl p-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-xl">💳</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800 text-sm">Razorpay</p>
              <p className="text-xs text-gray-400">UPI · Cards · Netbanking · QR Code</p>
            </div>
            <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="p-6 pt-4">
          <button onClick={handlePayment} disabled={paying}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-green-200 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed">
            {paying ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Processing...
              </span>
            ) : (
              `Pay ₹${cart.total}`
            )}
          </button>
          <p className="text-xs text-gray-300 text-center mt-3">
            🔒 Secured by Razorpay · Test mode (no real charges)
          </p>
        </div>
      </div>
    </div>
  );
}
