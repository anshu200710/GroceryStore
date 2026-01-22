import asyncHandler from "express-async-handler";
import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";
import CustomError from "../utils/CustomError.js";
import { productValidationSchema } from "./../utils/productValidation.js";
import { Readable } from "stream";

//! Add Product: /api/product/add

export const addProduct = asyncHandler(async (req, res, next) => {
  const files = req.files || [];

  if (!files.length) {
    return next(new CustomError(400, "No files uploaded"));
  }

  let productData;
  try {
    productData = JSON.parse(req.body.productData);
  } catch (err) {
    return next(new CustomError(400, "Invalid JSON format in 'productData'"));
  }

  const { error } = productValidationSchema.validate(productData, {
    convert: true,
  });

  if (error) {
    const message = `The field '${error.details[0].context.key}' is missing or invalid. Please provide a valid value.`;
    return next(new CustomError(400, message));
  }

  try {
    const imagesUrl = await Promise.all(
      files.map(file => {
        return new Promise((resolve, reject) => {
          if (!file.buffer) {
            return reject(new Error("File buffer is undefined"));
          }
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
      image: imagesUrl,
    });

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      newProduct,
    });
  } catch (err) {
    next(new CustomError(500, err.message || "Error adding product"));
  }
});


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

//! Update Product: /api/product/:id

export const updateProduct = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { name, category, price, offerPrice, description, existingImages } = req.body;
    const files = req.files || [];

    const product = await Product.findById(id);
    if (!product) {
        return next(new CustomError(404, "Product not found"));
    }

    try {
        let imagesUrl = [];

        // Handle existing images
        if (existingImages) {
            const existingImgsArray = Array.isArray(existingImages)
                ? existingImages
                : [existingImages];
            imagesUrl = existingImgsArray;
        }

        // Upload new images
        if (files.length > 0) {
            const newImageUrls = await Promise.all(
                files.map((file) => {
                    return new Promise((resolve, reject) => {
                        if (!file.buffer) {
                            return reject(new Error("File buffer is undefined"));
                        }
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
            imagesUrl = [...imagesUrl, ...newImageUrls];
        }

        // Delete removed images from Cloudinary
        const imagesToDelete = product.image.filter(
            (img) => !imagesUrl.includes(img)
        );
        await Promise.all(
            imagesToDelete.map(async (url) => {
                try {
                    const publicId = url.split("/").pop().split(".")[0];
                    await cloudinary.uploader.destroy(publicId, {
                        resource_type: "image",
                    });
                } catch (error) {
                    console.error("Error deleting image from Cloudinary:", error);
                }
            })
        );

        // Parse description if it's a string
        let parsedDescription = description;
        if (typeof description === "string") {
            try {
                parsedDescription = JSON.parse(description);
            } catch (e) {
                parsedDescription = [description];
            }
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            {
                $set: {
                    name,
                    category,
                    price,
                    offerPrice,
                    description: parsedDescription,
                    image: imagesUrl,
                },
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            updatedProduct,
        });
    } catch (err) {
        next(new CustomError(500, err.message || "Error updating product"));
    }
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
