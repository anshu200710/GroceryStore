import React, { useEffect, useState } from "react";
import { assets } from "../../assets/assets";

const AdminHeroBanners = () => {
  const [banners, setBanners] = useState([
    { _id: "1", desktopImageUrl: assets.main_banner_bg, mobileImageUrl: assets.main_banner_bg_sm },
    { _id: "2", desktopImageUrl: assets.bottom_banner_image, mobileImageUrl: assets.bottom_banner_image_sm },
  ]);
  const [desktop, setDesktop] = useState(null);
  const [mobile, setMobile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch all banners (static from assets)
  const fetchBanners = async () => {
    // Banners loaded from assets
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Add banner (disabled - using static assets)
  const addBanner = async (e) => {
    alert("Using static banners from assets folder");
  };

  // Delete banner (disabled - using static assets)
  const deleteBanner = async (id) => {
    alert("Cannot delete static banners");
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
                src={b.desktopImageUrl}
                className="h-32 w-full object-cover rounded"
              />
            )}

            {b.mobileImageUrl && (
              <img
                src={b.mobileImageUrl}
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
