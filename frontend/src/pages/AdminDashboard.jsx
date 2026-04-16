import { useState, useEffect } from "react";
import API from "../api";

const emptyProduct = { name: "", description: "", price: "", category: "", image_url: "", stock: "100" };

export default function AdminDashboard() {
  const [tab, setTab] = useState("products");
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCart, setSelectedCart] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customerOrders, setCustomerOrders] = useState([]);

  // Product form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ ...emptyProduct });
  const [formError, setFormError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    API.get("/admin/customers").then((r) => setCustomers(r.data));
    API.get("/admin/orders").then((r) => setOrders(r.data));
    API.get("/products").then((r) => setProducts(r.data));
  }, []);

  // --- Product CRUD ---
  const openAddForm = () => {
    setEditingId(null);
    setFormData({ ...emptyProduct });
    setImageFile(null);
    setImagePreview("");
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (p) => {
    setEditingId(p.id);
    setFormData({ name: p.name, description: p.description, price: String(p.price), category: p.category, image_url: p.image_url || "", stock: String(p.stock) });
    setImageFile(null);
    setImagePreview(p.image_url || "");
    setFormError("");
    setShowForm(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      let imageUrl = formData.image_url;
      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);
        const upRes = await API.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        imageUrl = upRes.data.url.replace("http://0.0.0.0:8000", "http://localhost:8001");
      }
      const payload = { ...formData, image_url: imageUrl, price: parseFloat(formData.price), stock: parseInt(formData.stock) };

      if (editingId) {
        const res = await API.put(`/products/${editingId}`, payload);
        setProducts(products.map((p) => (p.id === editingId ? res.data : p)));
      } else {
        const res = await API.post("/products", payload);
        setProducts([...products, res.data]);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ ...emptyProduct });
      setImageFile(null);
      setImagePreview("");
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to save product");
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/products/${id}`);
      setProducts(products.filter((p) => p.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete");
    }
  };

  // --- Orders ---
  const updateOrderStatus = async (orderId, status) => {
    try {
      await API.put(`/admin/orders/${orderId}/status`, { status });
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status } : o)));
    } catch (err) {
      alert("Failed to update status");
    }
  };

  // --- Customers ---
  const viewCart = async (customerId, name) => {
    const [cartRes, ordersRes] = await Promise.all([
      API.get(`/admin/customers/${customerId}/cart`),
      API.get(`/admin/customers/${customerId}/orders`),
    ]);
    setSelectedCart(cartRes.data);
    setCustomerOrders(ordersRes.data);
    setSelectedCustomer(name);
  };

  const totalRevenue = orders.filter((o) => o.status === "paid" || o.status === "shipped" || o.status === "delivered").reduce((s, o) => s + o.total, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-400 mt-1">Manage products, customers and orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-200">
          <p className="text-blue-200 text-sm font-medium">Products</p>
          <p className="text-3xl font-extrabold mt-1">{products.length}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200">
          <p className="text-indigo-200 text-sm font-medium">Customers</p>
          <p className="text-3xl font-extrabold mt-1">{customers.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-green-200">
          <p className="text-green-200 text-sm font-medium">Orders</p>
          <p className="text-3xl font-extrabold mt-1">{orders.length}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl p-5 text-white shadow-lg shadow-orange-200">
          <p className="text-orange-200 text-sm font-medium">Revenue</p>
          <p className="text-3xl font-extrabold mt-1">₹{totalRevenue}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {["products", "customers", "orders"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-xl font-semibold capitalize transition-all ${
              tab === t ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200"
                : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 shadow-sm"
            }`}>
            {t === "products" ? "🛍️ Products" : t === "customers" ? "👥 Customers" : "📦 Orders"}
          </button>
        ))}
      </div>

      {/* ===== PRODUCTS TAB ===== */}
      {tab === "products" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-800 text-lg">All Products ({products.length})</h2>
            <button onClick={openAddForm}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-200 transition-all">
              + Add Product
            </button>
          </div>

          {/* Add / Edit Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 space-y-4">
              <h3 className="font-bold text-gray-800">{editingId ? "Edit Product" : "New Product"}</h3>
              {formError && <p className="text-red-500 text-sm font-medium">{formError}</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Product Name" required value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input type="text" placeholder="Category" required value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input type="number" step="0.01" placeholder="Price (₹)" required value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input type="number" placeholder="Stock" required value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input type="url" placeholder="Image URL (or upload below)" value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 md:col-span-2" />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                    <span className="text-gray-500 text-sm">{imageFile ? imageFile.name : "📁 Upload image from computer"}</span>
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                {imagePreview && <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />}
              </div>
              <textarea placeholder="Description" required value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={3} />
              <div className="flex gap-3">
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50">
                  {saving ? "Saving..." : editingId ? "Update Product" : "Add Product"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-all">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Product Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
                {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-40 object-cover" />}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-800">{p.name}</h3>
                    <span className="text-lg font-extrabold text-indigo-600">₹{p.price}</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{p.description}</p>
                  <div className="flex justify-between items-center mb-3">
                    <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-lg font-medium">{p.category}</span>
                    <span className="text-xs text-gray-400">Stock: {p.stock}</span>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-gray-50">
                    <button onClick={() => openEditForm(p)}
                      className="flex-1 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all">
                      ✏️ Edit
                    </button>
                    {deleteConfirm === p.id ? (
                      <div className="flex gap-1 flex-1">
                        <button onClick={() => handleDelete(p.id)}
                          className="flex-1 py-2 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-all">
                          Confirm
                        </button>
                        <button onClick={() => setDeleteConfirm(null)}
                          className="flex-1 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all">
                          No
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(p.id)}
                        className="flex-1 py-2 text-sm font-semibold text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-all">
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!products.length && <p className="text-gray-400 text-center py-8 col-span-full">No products yet</p>}
          </div>
        </div>
      )}

      {/* ===== CUSTOMERS TAB ===== */}
      {tab === "customers" && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <h2 className="font-bold text-gray-800 p-5 border-b border-gray-100">
              All Customers <span className="text-gray-400 font-normal">({customers.length})</span>
            </h2>
            <div className="divide-y divide-gray-50">
              {customers.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.email}</p>
                    </div>
                  </div>
                  <button onClick={() => viewCart(c.id, c.name)}
                    className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-all">
                    View Cart →
                  </button>
                </div>
              ))}
              {!customers.length && <p className="p-5 text-gray-400 text-center">No customers yet</p>}
            </div>
          </div>

          {selectedCart && (
            <div className="space-y-4">
              {/* Current Cart */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <h2 className="font-bold text-gray-800 p-5 border-b border-gray-100 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    {selectedCustomer.charAt(0).toUpperCase()}
                  </div>
                  {selectedCustomer}'s Cart
                </h2>
                {selectedCart.items.length ? (
                  <>
                    <div className="divide-y divide-gray-50">
                      {selectedCart.items.map((item) => (
                        <div key={item.product_id} className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <img src={item.image_url} alt={item.product_name} className="w-10 h-10 rounded-lg object-cover" />
                            <div>
                              <p className="font-medium text-gray-800 text-sm">{item.product_name}</p>
                              <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <span className="font-bold text-gray-900 text-sm">₹{(item.price * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 bg-gray-50 border-t border-gray-100 text-right font-extrabold text-gray-900">
                      Total: ₹{selectedCart.total}
                    </div>
                  </>
                ) : (
                  <p className="p-5 text-gray-400 text-center">Cart is empty</p>
                )}
              </div>

              {/* Customer Orders */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <h2 className="font-bold text-gray-800 p-5 border-b border-gray-100">
                  📦 {selectedCustomer}'s Orders <span className="text-gray-400 font-normal">({customerOrders.length})</span>
                </h2>
                {customerOrders.length ? (
                  <div className="divide-y divide-gray-50">
                    {customerOrders.map((o) => (
                      <div key={o.id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-400">#{o.id.slice(-8).toUpperCase()} · {o.created_at?.slice(0, 10)}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            o.status === "paid" || o.status === "delivered" ? "bg-green-100 text-green-700"
                            : o.status === "shipped" ? "bg-blue-100 text-blue-700"
                            : o.status === "cancelled" ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                          }`}>{o.status}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-1">
                          {o.items.map((item, i) => (
                            <span key={i} className="text-xs text-gray-500">{item.product_name} ×{item.quantity}{i < o.items.length - 1 ? "," : ""}</span>
                          ))}
                        </div>
                        <p className="text-sm font-bold text-gray-900">₹{o.total}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="p-5 text-gray-400 text-center">No orders yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== ORDERS TAB ===== */}
      {tab === "orders" && (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {o.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{o.user_name}</p>
                    <p className="text-xs text-gray-400">{o.user_email}</p>
                  </div>
                </div>
                <select value={o.status}
                  onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border-0 cursor-pointer focus:ring-2 focus:ring-indigo-300 ${
                    o.status === "delivered" ? "bg-green-100 text-green-700"
                    : o.status === "shipped" ? "bg-blue-100 text-blue-700"
                    : o.status === "paid" ? "bg-emerald-100 text-emerald-700"
                    : o.status === "cancelled" ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                  }`}>
                  <option value="pending">⏳ Pending</option>
                  <option value="paid">💰 Paid</option>
                  <option value="shipped">🚚 Shipped</option>
                  <option value="delivered">✅ Delivered</option>
                  <option value="cancelled">❌ Cancelled</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {o.items.map((item, i) => (
                  <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-lg font-medium">
                    {item.product_name} ×{item.quantity}
                  </span>
                ))}
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                <span className="text-xs text-gray-300">{o.created_at?.slice(0, 10)}</span>
                <span className="text-lg font-extrabold text-gray-900">₹{o.total}</span>
              </div>
            </div>
          ))}
          {!orders.length && <p className="text-gray-400 text-center py-8">No orders yet</p>}
        </div>
      )}
    </div>
  );
}
