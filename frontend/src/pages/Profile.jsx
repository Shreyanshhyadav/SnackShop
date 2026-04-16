import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import API from "../api";
import toast from "react-hot-toast";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.put("/auth/profile", { name });
      toast.success("Profile updated! Re-login to see changes in navbar.");
    } catch {
      toast.error("Failed to update");
    }
    setSaving(false);
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-indigo-200 mb-4">
          <span className="text-3xl font-bold text-white">{user?.name?.charAt(0).toUpperCase()}</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">My Profile</h1>
        <p className="text-gray-400 mt-1">{user?.email}</p>
        <span className="inline-block mt-2 px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full capitalize">{user?.role}</span>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label htmlFor="profileName" className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
            <input id="profileName" type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none bg-gray-50 focus:bg-white" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input type="email" value={user?.email || ""} disabled
              className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-100 text-gray-500 cursor-not-allowed" />
          </div>
          <button type="submit" disabled={saving}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
        <button onClick={handleLogout}
          className="w-full mt-4 py-3 border-2 border-red-200 text-red-500 rounded-xl font-semibold hover:bg-red-50 transition-all">
          Logout
        </button>
      </div>
    </div>
  );
}
