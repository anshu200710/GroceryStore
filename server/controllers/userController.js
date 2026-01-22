import asyncHandler from "express-async-handler";
import CustomError from "../utils/CustomError.js";
import User from "../models/User.js";
import genToken from "../utils/jwt.js";
import { auth } from "../config/firebaseAdmin.js";
import { NODE_ENV, FIREBASE_ADMIN_EMAIL } from "../config/index.js";

//! Firebase Auth: /api/user/firebase-auth

export const firebaseAuth = asyncHandler(async (req, res, next) => {
    const { idToken } = req.body;

    if (!idToken) {
        return next(new CustomError(400, "ID token is required"));
    }

    try {
        // Verify Firebase ID token
        const decodedToken = await auth.verifyIdToken(idToken);
        const { uid, email, name } = decodedToken;

        // Check if user already exists
        let user = await User.findOne({ firebaseUid: uid });

        if (!user) {
            // Determine role based on admin email
            const role = email === FIREBASE_ADMIN_EMAIL ? "seller" : "user";

            // Create new user
            user = await User.create({
                firebaseUid: uid,
                name: name || email.split("@")[0],
                email: email.toLowerCase(),
                role,
            });
        }

        // Generate custom refresh token
        const refreshToken = genToken(user._id);
        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30); // 30 days

        user.refreshToken = refreshToken;
        user.refreshTokenExpiry = refreshTokenExpiry;
        user.lastLogin = new Date();
        user.loginAttempts = 0;
        user.isLocked = false;
        await user.save();

        // Set refresh token in cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: NODE_ENV === "production",
            sameSite: NODE_ENV === "production" ? "none" : "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        res.status(200).json({
            success: true,
            message: "Authentication successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            refreshToken,
        });
    } catch (error) {
        next(new CustomError(401, "Invalid or expired token: " + error.message));
    }
});

//! Refresh Access Token: /api/user/refresh-token

export const refreshAccessToken = asyncHandler(async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return next(new CustomError(400, "Refresh token is required"));
    }

    try {
        // Find user with this refresh token
        const user = await User.findOne({ refreshToken });

        if (!user) {
            return next(new CustomError(401, "Invalid refresh token"));
        }

        // Check if refresh token has expired
        if (new Date() > user.refreshTokenExpiry) {
            return next(new CustomError(401, "Refresh token expired"));
        }

        // Generate new refresh token
        const newRefreshToken = genToken(user._id);
        const newRefreshTokenExpiry = new Date();
        newRefreshTokenExpiry.setDate(newRefreshTokenExpiry.getDate() + 30);

        user.refreshToken = newRefreshToken;
        user.refreshTokenExpiry = newRefreshTokenExpiry;
        await user.save();

        // Update refresh token cookie
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: NODE_ENV === "production",
            sameSite: NODE_ENV === "production" ? "none" : "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            refreshToken: newRefreshToken,
        });
    } catch (error) {
        next(new CustomError(500, "Error refreshing token: " + error.message));
    }
});

//! Register User : /api/user/register

export const registerUser = asyncHandler(async (req, res, next) => {
    const { error } = registerUserSchema.validate(req.body);
    if (error) {
        const message = `The field '${error.details[0].context.key}' is missing or invalid. Please provide a valid value.`;
        return next(new CustomError(400, message));
    }

    const { name, email, password, role } = req.body;

    const existinUser = await User.findOne({ email });

    if (existinUser) {
        return next(new CustomError(409, "User already exists"));
    }

    const user = await User.create({ name, email, password, role });

    const token = await genToken(user._id);

    res.cookie("token", token, {
        httpOnly: true, // Prevent JavaScript to access cookie
        secure: NODE_ENV === "production", // Use secure cookies in production
        sameSite: NODE_ENV === "production" ? "none" : "strict", // CSRF production
        maxAge: 7 * 24 * 60 * 60 * 1000, // Cookie expiration time
    });

    res.status(201).json({
        success: true,
        message: "New user created successfully",
        user: { name: user.name, email: user.email, role: user.role },
    });
});

//! Login User : /api/user/login

export const loginUser = asyncHandler(async (req, res, next) => {
    const { error } = loginUserSchema.validate(req.body);
    if (error) {
        const message = `The field '${error.details[0].context.key}' is missing or invalid. Please provide a valid value.`;
        return next(new CustomError(400, message));
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return next(new CustomError(404, "User not found"));
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        return next(new CustomError(401, "Invalid credentials"));
    }

    const token = await genToken(user._id);

    res.cookie("token", token, {
        httpOnly: true,
        secure: NODE_ENV === "production",
        sameSite: NODE_ENV === "production" ? "none" : "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
        success: true,
        message: "User logged-in successfully",
        user: { email: user.email, name: user.name, role: user.role },
    });
});

//! Logout User : /api/user/logout

export const logoutUser = asyncHandler(async (req, res) => {
    try {
        // Invalidate refresh token if user is authenticated
        if (req.user) {
            await User.findByIdAndUpdate(req.user._id, {
                refreshToken: null,
                refreshTokenExpiry: null,
            });
        }

        // Clear cookies
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: NODE_ENV === "production",
            sameSite: NODE_ENV === "production" ? "none" : "strict",
        });

        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error during logout",
        });
    }
});

//! Get current user details: /api/user/me

export const getCurrentUser = (req, res) => {
    res.status(200).json({
        success: true,
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
        },
    });
};
