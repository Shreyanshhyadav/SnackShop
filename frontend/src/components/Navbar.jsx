import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import API from "../api";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (user && user.role === "customer") {
      API.get("/cart").then((res) => {
        setCartCount(res.data.items.reduce((sum, i) => sum + i.quantity, 0));
      });
    }
  }, [user]);

  // Listen for cart updates
  useEffect(() => {
    const handler = () => {
      if (user && user.role === "customer") {
        API.get("/cart").then((res) => {
          setCartCount(res.data.items.reduce((sum, i) => sum + i.quantity, 0));
        });
      }
    };
    window.addEventListener("cart-updated", handler);
    return () => window.removeEventListener("cart-updated", handler);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:shadow-indigo-300 transition-shadow">
            <span className="text-white text-lg">🛒</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            SnackShop
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <Link to="/" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
            Products
          </Link>

          {user ? (
            <>
              {user.role === "customer" && (
                <Link to="/cart" className="relative px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                  Cart
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}
              {user.role === "customer" && (
                <Link to="/orders" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                  My Orders
                </Link>
              )}
              {user.role === "admin" && (
                <Link to="/admin" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                  Dashboard
                </Link>
              )}
              <div className="ml-2 pl-3 border-l border-gray-200 flex items-center gap-3">
                <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.name}</span>
                </Link>
                <button onClick={handleLogout}
                  className="text-sm font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                Login
              </Link>
              <Link to="/register"
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:shadow-lg hover:shadow-indigo-200 transition-all">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
