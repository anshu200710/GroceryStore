import { Router } from "express";
import  upload  from "../config/multer.js";
import { authenticate, authorize } from "./../middlewares/authMiddleware.js";
import {
    addProduct,
    changeStock,
    deleteProduct,
    getProductById,
    productList,
    updateProduct,
} from "../controllers/productController.js";

const productRouter = Router();

productRouter.post(
    "/add",
    upload.fields([
        { name: "images", maxCount: 10 },
        { name: "colorImages", maxCount: 10 },
    ]),
    authenticate,
    authorize,
    addProduct
);
productRouter.get("/list", productList);
productRouter.get("/:id", getProductById);
productRouter.patch(
    "/:id",
    authenticate,
    authorize,
    upload.fields([
        { name: "images", maxCount: 10 },
        { name: "colorImages", maxCount: 10 },
    ]),
    (req, res, next) => {
        // Check if only inStock is being updated (for toggle)
        if (Object.keys(req.body).length === 1 && req.body.hasOwnProperty("inStock")) {
            return changeStock(req, res, next);
        }
        updateProduct(req, res, next);
    }
);
productRouter.delete("/:id", authenticate, authorize, deleteProduct);

export default productRouter;
