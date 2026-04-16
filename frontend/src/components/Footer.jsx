import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <span className="text-white text-lg">🛒</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">SnackShop</span>
            </div>
            <p className="text-gray-400 text-sm max-w-xs">Premium snacks delivered to your doorstep. Fresh, crunchy, and always delicious.</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-3 text-sm">Quick Links</h4>
            <div className="space-y-2">
              <Link to="/" className="block text-sm text-gray-400 hover:text-indigo-600 transition-colors">Products</Link>
              <Link to="/cart" className="block text-sm text-gray-400 hover:text-indigo-600 transition-colors">Cart</Link>
              <Link to="/orders" className="block text-sm text-gray-400 hover:text-indigo-600 transition-colors">My Orders</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-3 text-sm">Account</h4>
            <div className="space-y-2">
              <Link to="/profile" className="block text-sm text-gray-400 hover:text-indigo-600 transition-colors">Profile</Link>
              <Link to="/login" className="block text-sm text-gray-400 hover:text-indigo-600 transition-colors">Login</Link>
              <Link to="/register" className="block text-sm text-gray-400 hover:text-indigo-600 transition-colors">Register</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-300">© 2026 SnackShop. Built with ❤️</p>
        </div>
      </div>
    </footer>
  );
}
