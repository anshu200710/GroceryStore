// // controllers/heroBannerController.js
// import HeroBanner from "../models/HeroBanner.js";

// // @desc   Create hero banner (admin upload)
// // @route  POST /api/hero-banners
// // @access Admin (protect in route if you have auth)

// export const createHeroBanner = async (req, res) => {
//   try {
//     const desktopImage = req.files?.desktopBanner?.[0];
//     const mobileImage = req.files?.mobileBanner?.[0];

//     if (!desktopImage && !mobileImage) {
//       return res.status(400).json({ message: "Upload desktop or mobile image" });
//     }

//     const banner = await HeroBanner.create({
//       desktopImageUrl: desktopImage ? `/uploads/${desktopImage.filename}` : null,
//       mobileImageUrl: mobileImage ? `/uploads/${mobileImage.filename}` : null,
//       isActive: req.body.isActive ?? true,
//       order: req.body.order ?? 0
//     });

//     res.status(201).json(banner);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // @desc   Get all active hero banners (for frontend)
// // @route  GET /api/hero-banners
// // @access Public
// export const getActiveHeroBanners = async (req, res) => {
//   try {
//     const banners = await HeroBanner.find({ isActive: true }).sort({
//       order: 1,
//       createdAt: -1,
//     });
//     return res.json(banners);
//   } catch (error) {
//     console.error("Error fetching active hero banners:", error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// // @desc   Get all hero banners (admin)
// // @route  GET /api/hero-banners/all
// // @access Admin
// export const getAllHeroBanners = async (req, res) => {
//   try {
//     const banners = await HeroBanner.find().sort({
//       createdAt: -1,
//     });
//     return res.json(banners);
//   } catch (error) {
//     console.error("Error fetching all hero banners:", error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// // @desc   Update hero banner (change image, isActive, order)
// // @route  PUT /api/hero-banners/:id
// // @access Admin
// export const updateHeroBanner = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { isActive, order } = req.body;

//     const banner = await HeroBanner.findById(id);
//     if (!banner) {
//       return res.status(404).json({ message: "Banner not found" });
//     }

//     // If a new image is uploaded, replace the path
//     if (req.files?.desktopBanner) {
//       banner.desktopImageUrl = `/uploads/${req.files.desktopBanner[0].filename}`;
//     }
//     if (req.files?.mobileBanner) {
//       banner.mobileImageUrl = `/uploads/${req.files.mobileBanner[0].filename}`;
//     }

//     if (typeof isActive !== "undefined") {
//       banner.isActive = isActive;
//     }

//     if (typeof order !== "undefined") {
//       banner.order = order;
//     }

//     const updatedBanner = await banner.save();
//     return res.json(updatedBanner);
//   } catch (error) {
//     console.error("Error updating hero banner:", error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// // @desc   Delete hero banner
// // @route  DELETE /api/hero-banners/:id
// // @access Admin
// export const deleteHeroBanner = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const banner = await HeroBanner.findById(id);
//     if (!banner) {
//       return res.status(404).json({ message: "Banner not found" });
//     }

//     await banner.deleteOne();
//     return res.json({ message: "Banner deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting hero banner:", error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };
import HeroBanner from "../models/HeroBanner.js";

// Create banner
export const createHeroBanner = async (req, res) => {
  try {
    console.log("REQ.BODY:", req.body);
    console.log("REQ.FILES:", req.files);

    const desktopImage = req.files?.desktopBanner?.[0];
    const mobileImage = req.files?.mobileBanner?.[0];

    if (!desktopImage && !mobileImage) {
      return res.status(400).json({ message: "Upload desktop or mobile image" });
    }

    // const banner = await HeroBanner.create({
    //   desktopImageUrl: desktopImage ? `/uploads/${desktopImage.filename}` : null,
    //   mobileImageUrl: mobileImage ? `/uploads/${mobileImage.filename}` : null,
    //   isActive: req.body.isActive === "true", // convert string to boolean
    //   order: parseInt(req.body.order) || 0,
    // });

    const banner = await HeroBanner.create({
      desktopImageUrl: desktopImage ? `/uploads/${desktopImage.filename}` : null,
      mobileImageUrl: mobileImage ? `/uploads/${mobileImage.filename}` : null,
      isActive: req.body.isActive ?? true,
      order: req.body.order ?? 0,
    });



    res.status(201).json(banner);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// Get all active banners (frontend)
export const getActiveHeroBanners = async (req, res) => {
  try {
    const banners = await HeroBanner.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.json(banners);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all banners (admin)
export const getAllHeroBanners = async (req, res) => {
  try {
    const banners = await HeroBanner.find().sort({ createdAt: -1 });
    res.json(banners);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update banner
export const updateHeroBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await HeroBanner.findById(id);
    if (!banner) return res.status(404).json({ message: "Banner not found" });

    if (req.files?.desktopBanner) banner.desktopImageUrl = `/uploads/${req.files.desktopBanner[0].filename}`;
    if (req.files?.mobileBanner) banner.mobileImageUrl = `/uploads/${req.files.mobileBanner[0].filename}`;

    if (req.body.isActive !== undefined) banner.isActive = req.body.isActive;
    if (req.body.order !== undefined) banner.order = req.body.order;

    await banner.save();
    res.json(banner);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete banner
export const deleteHeroBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await HeroBanner.findById(id);
    if (!banner) return res.status(404).json({ message: "Banner not found" });

    await banner.deleteOne();
    res.json({ message: "Banner deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
