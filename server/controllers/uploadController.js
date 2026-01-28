import asyncHandler from "express-async-handler";
import { v2 as cloudinary } from "cloudinary";
import CustomError from "../utils/CustomError.js";

export const getUploadSignature = asyncHandler(async (req, res) => {
  // requires CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME in env
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request({ timestamp }, process.env.CLOUDINARY_API_SECRET);
  res.json({
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  });
});
