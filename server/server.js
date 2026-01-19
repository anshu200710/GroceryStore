import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db.js";
import connectCloudinary from "./config/cloudinary.js";

import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";
import addressRouter from "./routes/addressRoute.js";
import orderRouter from "./routes/orderRoute.js";
import heroBannerRoutes from "./routes/heroBannerRoutes.js";

// import errorHandler from "./middlewares/errorMiddleware.js";

import { PORT } from "./config/index.js";

const app = express();
const port = PORT;

// Connect DB & Cloudinary
await connectDB();
await connectCloudinary();

// Middlewares
// const allowedOrigins = [
//   "http://localhost:5173", // local dev
//   "https://grocery-store-red-two.vercel.app" // production frontend
// ];

// app.use(cors({
//   origin: allowedOrigins,
//   credentials: true, // needed for cookies/auth
// }));

// app.use(cors({
//   origin: ["https://shop.vyaapaarniti.com", "http://localhost:5173"], // Add your shop URL here
//   credentials: true
// }));
// app.use(cookieParser());
// app.use(morgan("dev"));

app.use(cors());
app.use(cookieParser());
app.use(morgan("dev"));

// JSON parsing for non-file requests
app.use(express.json());

// Serve uploads folder
app.use("/uploads", express.static("uploads"));

// Routes
app.get("/", (req, res) => res.send("API is Working"));
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/address", addressRouter);
app.use("/api/order", orderRouter);
app.use("/api/hero-banners", heroBannerRoutes);

// Error middleware
// app.use(errorHandler);

// Start server
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
