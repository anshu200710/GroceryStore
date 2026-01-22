import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import CustomError from "../utils/CustomError.js";
import { JWT_SECRET } from "../config/index.js";
import { auth } from "../config/firebaseAdmin.js";

export const authenticate = asyncHandler(async (req, res, next) => {
    let token = req.headers.authorization?.replace("Bearer ", "");
    
    // Fallback to cookie
    if (!token) {
        token = req.cookies.token;
    }

    if (!token) {
        return next(
            new CustomError(
                401,
                "Not authenticated, token missing, please login to access this"
            )
        );
    }

    let decodedToken;
    try {
        // Try to verify as Firebase token first
        try {
            decodedToken = await auth.verifyIdToken(token);
            // Firebase token verified - find user by firebaseUid
            const user = await User.findOne({ firebaseUid: decodedToken.uid }).select(
                "-password"
            );
            if (!user) {
                return next(new CustomError(401, "User not found"));
            }
            req.user = user;
            return next();
        } catch (firebaseError) {
            // Not a Firebase token, try JWT
            decodedToken = jwt.verify(token, JWT_SECRET);
        }
    } catch (err) {
        return next(new CustomError(401, "Invalid or expired token"));
    }

    const user = await User.findById(decodedToken.id).select("-password");
    if (!user) {
        return next(new CustomError(401, "User not found"));
    }

    req.user = user;
    next();
});

export const authorize = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        return next(new CustomError(401, "Not authenticated"));
    }

    if (req.user.role !== "seller") {
        return next(
            new CustomError(
                403,
                "Forbidden: For Seller only, you're not authorized to access this"
            )
        );
    }

    next();
});
