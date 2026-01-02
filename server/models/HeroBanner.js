// models/heroBannerModel.js
import mongoose from "mongoose";

const heroBannerSchema = new mongoose.Schema(
  {
    desktopImageUrl: { type: String, required: false },
    mobileImageUrl: { type: String, required: false },

    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);


const HeroBanner = mongoose.model("HeroBanner", heroBannerSchema);
export default HeroBanner;
