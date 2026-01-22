import { Router } from "express";
import { authenticate } from "./../middlewares/authMiddleware.js";
import {
    firebaseAuth,
    refreshAccessToken,
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
} from "../controllers/userController.js";

const userRouter = Router();

// Firebase authentication
userRouter.post("/firebase-auth", firebaseAuth);
userRouter.post("/refresh-token", refreshAccessToken);

// Legacy endpoints (keep for backward compatibility)
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

// Protected endpoints
userRouter.get("/me", authenticate, getCurrentUser);
userRouter.post("/logout", authenticate, logoutUser);

export default userRouter;
