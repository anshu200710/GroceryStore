import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL
  ? `${import.meta.env.VITE_BACKEND_URL}/api`
  : "https://groceries.vyaapaarniti.com/api";

const AdminHeroBanners = () => {
  const [banners, setBanners] = useState([]);
  const [desktop, setDesktop] = useState(null);
  const [mobile, setMobile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch all banners from database
  const fetchBanners = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/hero-banners/all`);
      setBanners(data || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to fetch banners");
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Add banner with image upload
  const addBanner = async (e) => {
    e.preventDefault();
    
    if (!desktop && !mobile) {
      setError("Please select at least one image");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      if (desktop) formData.append("desktopBanner", desktop);
      if (mobile) formData.append("mobileBanner", mobile);
      formData.append("isActive", true);

      await axios.post(`${API_URL}/hero-banners`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setDesktop(null);
      setMobile(null);
      
      // Reset file inputs
      document.querySelectorAll('input[type="file"]').forEach(input => input.value = "");
      
      await fetchBanners();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to upload banner");
    } finally {
      setLoading(false);
    }
  };

  // Delete banner
  const deleteBanner = async (id) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) return;

    try {
      await axios.delete(`${API_URL}/hero-banners/${id}`);
      await fetchBanners();
    } catch (err) {
      console.error(err);
      setError("Failed to delete banner");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Hero Banners</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Upload Form */}
      <form
        onSubmit={addBanner}
        className="bg-white p-6 rounded-xl shadow mb-8 space-y-4"
      >
        <h2 className="font-semibold">Add New Banner</h2>

        <div>
          <label className="block text-sm font-medium mb-2">Desktop Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setDesktop(e.target.files[0])}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Mobile Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setMobile(e.target.files[0])}
            className="w-full p-2 border rounded"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-primary text-white rounded hover:bg-primary-dull disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Add Banner"}
        </button>
      </form>

      {/* Banner List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((b) => (
          <div
            key={b._id}
            className="bg-white rounded-xl shadow p-4 space-y-3"
          >
            <div className="space-y-2">
              {b.desktopImageUrl && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Desktop</p>
                  <img
                    src={b.desktopImageUrl}
                    alt="Desktop"
                    className="h-32 w-full object-cover rounded"
                  />
                </div>
              )}

              {b.mobileImageUrl && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Mobile</p>
                  <img
                    src={b.mobileImageUrl}
                    alt="Mobile"
                    className="h-32 w-full object-cover rounded"
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => deleteBanner(b._id)}
              className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {banners.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No banners uploaded yet. Add your first banner!
        </div>
      )}
    </div>
  );
};

export default AdminHeroBanners;
