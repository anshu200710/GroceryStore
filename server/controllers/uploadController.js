import asyncHandler from "express-async-handler";
import { v2 as cloudinary } from "cloudinary";
import CustomError from "../utils/CustomError.js";

import { CLOUDINARY_NAME } from "../config/index.js";

export const getUploadSignature = asyncHandler(async (req, res) => {
  // requires CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_NAME in env
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request({ timestamp }, process.env.CLOUDINARY_API_SECRET);
  res.json({
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: CLOUDINARY_NAME || process.env.CLOUDINARY_NAME,
  });
});
