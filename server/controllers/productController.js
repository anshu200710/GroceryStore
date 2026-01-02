import asyncHandler from "express-async-handler";
import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";
import CustomError from "../utils/CustomError.js";
import { productValidationSchema } from "./../utils/productValidation.js";

//! Add Product: /api/product/add
import multer from "multer";
import { Readable } from "stream";

// Multer memory storage
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// Upload endpoint
export const addProduct = async (req, res) => {
  try {
    const productData = JSON.parse(req.body.productData);
    const files = req.files || [];

    const imagesUrl = await Promise.all(
      files.map(file => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: "image" },
            (error, result) => {
              if (error) return reject(error);
              resolve(result.secure_url);
            }
          );
          Readable.from(file.buffer).pipe(stream);
        });
      })
    );

    const newProduct = await Product.create({
      ...productData,
      image: imagesUrl
    });

    res.status(201).json({ success: true, newProduct });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// export const addProduct = asyncHandler(async (req, res, next) => {
//     let productData;

//     try {
//         productData = JSON.parse(req.body.productData);
//     } catch (err) {
//         throw new CustomError(400, "Invalid JSON format in 'productData'");
//     }

//     const { error } = productValidationSchema.validate(productData, {
//         convert: true,
//     });

//     if (error) {
//         const message = `The field '${error.details[0].context.key}' is missing or invalid. Please provide a valid value.`;
//         return next(new CustomError(400, message));
//     }

//     // const images = req.files;

//     // let imagesUrl = await Promise.all(
//     //     images.map(async (item) => {
//     //         let result = await cloudinary.uploader.upload(item.path, {
//     //             resource_type: "image",
//     //         });
//     //         return result.secure_url;
//     //     })
//     // );

//     const images = req.files || [];
//     console.log("req.files:", req.files);
//  // fallback to empty array

//     let imagesUrl = [];
//     if (images.length > 0) {
//         imagesUrl = await Promise.all(
//             images.map(async (item) => {
//                 let result = await cloudinary.uploader.upload(item.path, {
//                     resource_type: "image",
//                 });
//                 return result.secure_url;
//             })
//         );
//     }


//     const newProduct = await Product.create({
//         ...productData,
//         image: imagesUrl,
//     });

//     res.status(201).json({
//         success: true,
//         message: "Product added successfully",
//         newProduct,
//     });
// });

//! Get All Product: /api/product/list

export const productList = asyncHandler(async (req, res, next) => {
    const products = await Product.find({});

    if (!products) {
        return next(new CustomError(404, "Not found any product"));
    }

    res.status(200).json({
        success: true,
        message: "All products fetched successfully",
        products,
    });
});

//! Get Single Product: /api/product/:id

export const getProductById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
        return next(new CustomError(404, "Product not found"));
    }

    res.status(200).json({
        success: true,
        message: "Product details fetched successfully",
        product,
    });
});

//! Change Product inStock: /api/product/:id

export const changeStock = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { inStock } = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(
        id,
        { $set: { inStock } },
        { new: true }
    );
    if (!updatedProduct) {
        return next(new CustomError(404, "Product not found"));
    }

    res.status(200).json({
        success: true,
        message: "Stock Updated",
        updatedProduct,
    });
});

//! Delete Product: /api/product/:id

export const deleteProduct = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
        return next(new CustomError(404, "Product not found"));
    }

    // Delete product images from Cloudinary
    try {
        await Promise.all(
            product.image.map(async (url) => {
                // Extract public ID from the image URL
                const publicId = url.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(publicId, {
                    resource_type: "image",
                });
            })
        );
    } catch (error) {
        console.error("cloudinary deletion error:", error.message);
    }

    await Product.findByIdAndDelete(id);

    res.status(200).json({
        success: true,
        message: "Product deleted successfully",
    });
});
