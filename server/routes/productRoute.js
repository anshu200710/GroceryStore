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
    addProductDirect,
    updateProductDirect,
} from "../controllers/productController.js";
import { getUploadSignature } from "../controllers/uploadController.js";

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
// Direct (small JSON) product add after direct-to-cloud uploads
productRouter.post(
    "/add-direct",
    authenticate,
    authorize,
    addProductDirect
);
// Signature endpoint for Cloudinary direct uploads
productRouter.get("/upload/sign", authenticate, getUploadSignature);

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

// Direct update (images already hosted as URLs in payload)
productRouter.patch(
    "/:id/direct",
    authenticate,
    authorize,
    updateProductDirect
);
productRouter.delete("/:id", authenticate, authorize, deleteProduct);

export default productRouter;
