import express from "express";
import  upload  from "../config/multer.js";
import {
  createHeroBanner,
  getActiveHeroBanners,
  getAllHeroBanners,
  updateHeroBanner,
  deleteHeroBanner,
} from "../controllers/heroBannerController.js";

const router = express.Router();

// Public
router.get("/", getActiveHeroBanners);

// Admin: get all banners
router.get("/all", getAllHeroBanners);

// Admin: create banner
router.post(
  "/",
  upload.fields([
  { name: "desktopBanner", maxCount: 1 },
  { name: "mobileBanner", maxCount: 1 }
]),
  createHeroBanner
);

// Admin: update
router.put(
  "/:id",
  upload.fields([
    { name: "desktopBanner", maxCount: 1 },
    { name: "mobileBanner", maxCount: 1 },
  ]),
  updateHeroBanner
);

// Admin: delete
router.delete("/:id", deleteHeroBanner);

export default router;
