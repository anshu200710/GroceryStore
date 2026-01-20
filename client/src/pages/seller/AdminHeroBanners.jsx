import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : "https://aromadaily.shop/api";
const FILE_BASE = import.meta.env.VITE_BACKEND_URL || "https://aromadaily.shop";

const AdminHeroBanners = () => {
  const [banners, setBanners] = useState([]);
  const [desktop, setDesktop] = useState(null);
  const [mobile, setMobile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch all banners
  const fetchBanners = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/hero-banners/all`);
      setBanners(data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch banners");
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Add banner
  const addBanner = async (e) => {
  e.preventDefault();

  if (!desktop && !mobile) {
    alert("Select at least one image");
    return;
  }

  const formData = new FormData();
  if (desktop) formData.append("desktopBanner", desktop);
  if (mobile) formData.append("mobileBanner", mobile);
  formData.append("isActive", "true"); // must be string
  formData.append("order", banners.length.toString());

  try {
    setLoading(true);
    const { data } = await axios.post(`${API_URL}/hero-banners`, formData, {
      headers: { "Content-Type": "multipart/form-data" }, // <-- add this
      withCredentials: true,
    });
    setBanners((prev) => [data, ...prev]);
    setDesktop(null);
    setMobile(null);
    e.target.reset();
  } catch (err) {
    console.error(err.response?.data || err);
    alert("Upload failed");
  } finally {
    setLoading(false);
  }
};


  // Delete banner
  const deleteBanner = async (id) => {
    if (!window.confirm("Delete banner?")) return;
    try {
      await axios.delete(`${API_URL}/hero-banners/${id}`, {
        withCredentials: true,
      });
      setBanners((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      alert("Delete failed");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Hero Banners</h1>

      {/* Upload Form */}
      <form
        onSubmit={addBanner}
        className="bg-white p-6 rounded-xl shadow mb-8 space-y-4"
      >
        <h2 className="font-semibold">Add New Banner</h2>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setDesktop(e.target.files[0])}
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setMobile(e.target.files[0])}
        />

        <button
          disabled={loading}
          className="px-6 py-2 bg-primary text-white rounded"
        >
          {loading ? "Uploading..." : "Add Banner"}
        </button>
      </form>

      {/* Banner List */}
      <div className="grid md:grid-cols-3 gap-6">
        {banners.map((b) => (
          <div
            key={b._id}
            className="bg-white rounded-xl shadow p-4 space-y-3"
          >
            {b.desktopImageUrl && (
              <img
                src={`${FILE_BASE}${b.desktopImageUrl}`}
                className="h-32 w-full object-cover rounded"
              />
            )}

            {b.mobileImageUrl && (
              <img
                src={`${FILE_BASE}${b.mobileImageUrl}`}
                className="h-32 w-full object-cover rounded"
              />
            )}

            <button
              onClick={() => deleteBanner(b._id)}
              className="w-full bg-red-600 text-white py-2 rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminHeroBanners;
