import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api";
import toast from "react-hot-toast";

function StarRating({ rating, onRate, interactive = false }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" disabled={!interactive}
          onClick={() => interactive && onRate(star)}
          className={`text-sm ${interactive ? "cursor-pointer hover:scale-125 transition-transform" : "cursor-default"}`}>
          {star <= rating ? "⭐" : "☆"}
        </button>
      ))}
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [cartMap, setCartMap] = useState({});
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    API.get("/products").then((res) => setProducts(res.data));
  }, []);

  useEffect(() => {
    if (user && user.role === "customer") {
      API.get("/cart").then((res) => {
        const map = {};
        res.data.items.forEach((item) => { map[item.product_id] = item.quantity; });
        setCartMap(map);
      });
    }
  }, [user]);

  const notifyCart = () => window.dispatchEvent(new Event("cart-updated"));

  const updateCart = async (productId, delta) => {
    if (!user) return toast.error("Please login first");
    const product = products.find((p) => (p.id || p._id) === productId);
    const current = cartMap[productId] || 0;
    if (delta > 0 && product && product.stock <= current) {
      return toast.error("Out of stock");
    }
    const newQty = current + delta;
    if (newQty <= 0) {
      await API.delete(`/cart/remove/${productId}`);
      const updated = { ...cartMap };
      delete updated[productId];
      setCartMap(updated);
      toast.success("Removed from cart");
    } else {
      await API.post("/cart/add", { product_id: productId, quantity: delta });
      setCartMap({ ...cartMap, [productId]: newQty });
      toast.success(delta > 0 ? "Added to cart" : "Quantity updated");
    }
    notifyCart();
  };

  const openReviews = async (product) => {
    setReviewModal(product);
    setReviewRating(5);
    setReviewComment("");
    setLoadingReviews(true);
    try {
      const res = await API.get(`/reviews/${product.id || product._id}`);
      setReviews(res.data);
    } catch { setReviews([]); }
    setLoadingReviews(false);
  };

  const submitReview = async () => {
    if (!user) return toast.error("Please login first");
    const pid = reviewModal.id || reviewModal._id;
    try {
      await API.post(`/reviews/${pid}`, { rating: reviewRating, comment: reviewComment });
      toast.success("Review submitted!");
      const res = await API.get(`/reviews/${pid}`);
      setReviews(res.data);
      // Refresh products to get updated rating
      const prodRes = await API.get("/products");
      setProducts(prodRes.data);
      setReviewComment("");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit review");
    }
  };

  const categories = [...new Set(products.map((p) => p.category.toLowerCase()))];
  let filtered = filter === "all" ? products : products.filter((p) => p.category.toLowerCase() === filter);

  // Search
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || (p.brand || "").toLowerCase().includes(q));
  }

  // Sort
  if (sort === "price-low") filtered = [...filtered].sort((a, b) => a.price - b.price);
  else if (sort === "price-high") filtered = [...filtered].sort((a, b) => b.price - a.price);
  else if (sort === "rating") filtered = [...filtered].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
  else if (sort === "name") filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm mb-10">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 text-xs font-semibold rounded-full w-fit mb-4">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Delivery in 10 minutes
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-3">
              Grocery & Daily<br />Essentials
            </h1>
            <p className="text-gray-500 text-base max-w-sm mb-6">
              Fresh products, top brands, and unbeatable prices delivered to your doorstep.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500">🚚</span>
                <span>Free Delivery</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-orange-500">💰</span>
                <span>Best Prices</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-500">✅</span>
                <span>Top Brands</span>
              </div>
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-orange-50 to-green-50"></div>
            <div className="relative p-8 flex items-center justify-center">
              <div className="grid grid-cols-3 gap-3">
                {["🥛", "🍞", "🧴", "🥚", "🍪", "🧈", "🥤", "🍫", "🧹"].map((emoji, i) => (
                  <div key={i} className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-2xl hover:scale-110 transition-transform cursor-default">
                    {emoji}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Sort + Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search products..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-600 cursor-pointer">
          <option value="default">Sort: Default</option>
          <option value="price-low">Price: Low → High</option>
          <option value="price-high">Price: High → Low</option>
          <option value="rating">Top Rated</option>
          <option value="name">Name: A → Z</option>
        </select>
      </div>

      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <button onClick={() => setFilter("all")}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
            filter === "all" ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200"
              : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 shadow-sm"
          }`}>🍿 All</button>
        {categories.map((cat) => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-5 py-2 rounded-full text-sm font-semibold capitalize transition-all duration-200 ${
              filter === cat ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200"
                : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 shadow-sm"
            }`}>{cat}</button>
        ))}
        <span className="ml-auto text-sm text-gray-400">{filtered.length} products</span>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.map((p) => {
          const pid = p.id || p._id;
          const qty = cartMap[pid] || 0;
          const outOfStock = p.stock <= 0;
          return (
            <div key={pid}
              className={`group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-indigo-100 ${outOfStock ? "opacity-70" : ""}`}>
              <div className="relative overflow-hidden">
                <img src={p.image_url} alt={p.name}
                  className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {outOfStock && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-full">Out of Stock</span>
                  </div>
                )}
                {qty > 0 && (
                  <span className="absolute top-3 right-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg animate-pulse">
                    ✓ {qty} in cart
                  </span>
                )}
                {p.discount > 0 && (
                  <span className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                    {p.discount}% OFF
                  </span>
                )}
                {p.isBestSeller && (
                  <span className="absolute bottom-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                    ⭐ Bestseller
                  </span>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  {p.brand && <span className="text-xs font-semibold text-indigo-500 uppercase">{p.brand}</span>}
                  {p.unit && <span className="text-xs text-gray-400">· {p.unit}</span>}
                </div>
                <h3 className="font-bold text-gray-800 text-base leading-tight">{p.name}</h3>
                <p className="text-sm text-gray-400 mt-1 line-clamp-1">{p.description}</p>

                {/* Rating */}
                <button onClick={() => openReviews(p)} className="flex items-center gap-1.5 mt-2 hover:opacity-80 transition-opacity">
                  <StarRating rating={Math.round(p.avg_rating || 0)} />
                  <span className="text-xs text-gray-400">({p.review_count || 0})</span>
                </button>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-extrabold text-gray-900">₹{p.price}</span>
                      {p.originalPrice > p.price && (
                        <span className="text-sm text-gray-400 line-through">₹{p.originalPrice}</span>
                      )}
                    </div>
                    {p.stock > 0 && p.stock <= 10 && (
                      <p className="text-xs text-orange-500 font-medium mt-0.5">Only {p.stock} left</p>
                    )}
                  </div>
                  {user?.role === "customer" && !outOfStock && (
                    <>
                      {qty === 0 ? (
                        <button onClick={() => updateCart(pid, 1)}
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-indigo-200 active:scale-95 transition-all">
                          + Add
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl p-1">
                          <button onClick={() => updateCart(pid, -1)}
                            className="w-9 h-9 rounded-lg bg-white text-red-500 font-bold hover:bg-red-50 flex items-center justify-center shadow-sm border border-gray-100 active:scale-90 transition-all text-lg">−</button>
                          <span className="font-bold text-gray-800 w-8 text-center">{qty}</span>
                          <button onClick={() => updateCart(pid, 1)}
                            className="w-9 h-9 rounded-lg bg-white text-green-500 font-bold hover:bg-green-50 flex items-center justify-center shadow-sm border border-gray-100 active:scale-90 transition-all text-lg">+</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!filtered.length && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No products found</h3>
          <p className="text-gray-400">Try a different search or filter.</p>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setReviewModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{reviewModal.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating rating={Math.round(reviewModal.avg_rating || 0)} />
                  <span className="text-sm text-gray-400">{reviewModal.avg_rating || 0} ({reviewModal.review_count || 0} reviews)</span>
                </div>
              </div>
              <button onClick={() => setReviewModal(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">✕</button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[40vh]">
              {loadingReviews ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
                </div>
              ) : reviews.length ? (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {r.user_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-gray-800 text-sm">{r.user_name}</span>
                        </div>
                        <StarRating rating={r.rating} />
                      </div>
                      {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                      <p className="text-xs text-gray-300 mt-2">{r.created_at?.slice(0, 10)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-4">No reviews yet. Be the first!</p>
              )}
            </div>

            {user?.role === "customer" && (
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <p className="font-semibold text-gray-800 text-sm mb-3">Write a Review</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-gray-500">Your rating:</span>
                  <StarRating rating={reviewRating} onRate={setReviewRating} interactive />
                </div>
                <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your thoughts..." rows={2}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm mb-3" />
                <button onClick={submitReview}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all">
                  Submit Review
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
