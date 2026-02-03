import asyncHandler from "express-async-handler";
import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";
import CustomError from "../utils/CustomError.js";
import { productValidationSchema } from "./../utils/productValidation.js";
import { Readable } from "stream";

// Helper: normalize sizes input to array of objects {name, price, mrpPrice, inStock, sku}
// Accepts array of strings, array of objects, or JSON string. defaultPrice used when price missing.
const normalizeSizes = (sizesInput, defaultPrice) => {
  if (sizesInput === undefined || sizesInput === null) return undefined;
  let arr = [];
  if (typeof sizesInput === "string") {
    try {
      arr = JSON.parse(sizesInput);
    } catch (e) {
      // comma-separated or single string
      arr = sizesInput.split(",").map((s) => s.trim()).filter(Boolean);
    }
  } else if (Array.isArray(sizesInput)) {
    arr = sizesInput;
  } else {
    return undefined;
  }

  return arr
    .map((item) => {
      if (typeof item === 'string') {
        return {
          name: item,
          price: typeof defaultPrice === 'number' ? defaultPrice : undefined,
        };
      } else if (item && typeof item === 'object') {
        return {
          name: item.name,
          price: item.price !== undefined ? Number(item.price) : (typeof defaultPrice === 'number' ? defaultPrice : undefined),
          mrpPrice: item.mrpPrice !== undefined ? Number(item.mrpPrice) : undefined,
          inStock: item.inStock !== undefined ? Boolean(item.inStock) : undefined,
          sku: item.sku !== undefined ? String(item.sku) : undefined,
        };
      }
      return null;
    })
    .filter((s) => s && s.name);
};

//! Add Product: /api/product/add

export const addProduct = asyncHandler(async (req, res, next) => {
  // When using upload.fields, req.files will be an object with arrays for each field (images, colorImages)
  const imagesFiles = (req.files && req.files.images) || [];

  if (!imagesFiles.length) {
    return next(new CustomError(400, "No files uploaded"));
  }

  let productData;
  try {
    productData = JSON.parse(req.body.productData);
  } catch (err) {
    return next(new CustomError(400, "Invalid JSON format in 'productData'"));
  }

  // Validation will be performed after uploading images and mapping colors to ensure
  // that image and color.image fields (which depend on uploads) are present/valid.
  // So skip validation here and perform it later once we have the final payload.
  // (This avoids failing validation for missing image fields before upload.)

  try {
    // req.files will be an object when using upload.fields
    const imagesFiles = (req.files && req.files.images) || [];
    const colorFiles = (req.files && req.files.colorImages) || [];

    const imagesUrl = await Promise.all(
      imagesFiles.map(file => {
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

    // Upload color swatches and build mapping originalname -> url
    const colorMapping = {};
    if (colorFiles.length > 0) {
      const colorUploads = await Promise.all(
        colorFiles.map(file => {
          return new Promise((resolve, reject) => {
            if (!file.buffer) {
              return reject(new Error("File buffer is undefined"));
            }
            const stream = cloudinary.uploader.upload_stream(
              { resource_type: "image" },
              (error, result) => {
                if (error) return reject(error);
                // map by originalname
                colorMapping[file.originalname] = result.secure_url;
                resolve(result.secure_url);
              }
            );
            Readable.from(file.buffer).pipe(stream);
          });
        })
      );
    }

    // Map colors from productData to include uploaded image urls when provided
    let parsedColors = productData.colors || [];
    if (Array.isArray(parsedColors) && parsedColors.length > 0) {
      parsedColors = parsedColors.map((c) => ({
        name: c.name,
        // Use uploaded URL when available; otherwise preserve an existing URL if provided, or leave undefined
        image: colorMapping[c.image] ? colorMapping[c.image] : (c.image || undefined),
      }));
    }

    // Debug: log files and payload to help diagnose validation failures
    console.log("addProduct: req.files keys", Object.keys(req.files || {}), "images count", imagesFiles.length, "colorFiles count", colorFiles.length);

    // Validate the final payload (after images and colors have been resolved)
    const finalPayload = {
      ...productData,
      image: imagesUrl,
      colors: parsedColors,
    };

    // Normalize sizes to objects (use offerPrice or price as fallback)
    const defaultSizePrice = finalPayload.offerPrice || finalPayload.price;
    finalPayload.sizes = normalizeSizes(finalPayload.sizes, defaultSizePrice) || [];

    console.log("addProduct: finalPayload ->", JSON.stringify(finalPayload, null, 2));

    const { error: validationError } = productValidationSchema.validate(finalPayload, {
      convert: true,
    });

    if (validationError) {
      console.error("addProduct validationError details:", validationError.details);
      const message = `The field '${validationError.details[0].context.key}' is missing or invalid. Please provide a valid value.`;
      return next(new CustomError(400, message));
    }

    const newProduct = await Product.create(finalPayload);

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      newProduct,
    });
  } catch (err) {
    next(new CustomError(500, err.message || "Error adding product"));
  }
});

// New endpoint: direct add where images are already hosted (array of URLs in productData.image)
export const addProductDirect = asyncHandler(async (req, res, next) => {
  try {
    const productData = req.body;

    // Normalize sizes to objects for compatibility (use offerPrice or price as fallback)
    productData.sizes = normalizeSizes(productData.sizes, productData.offerPrice || productData.price) || [];

    // Validate directly
    const { error } = productValidationSchema.validate(productData, { convert: true });
    if (error) {
      const message = `The field '${error.details[0].context.key}' is missing or invalid. Please provide a valid value.`;
      return next(new CustomError(400, message));
    }

    const newProduct = await Product.create(productData);

    res.status(201).json({ success: true, message: "Product added successfully", newProduct });
  } catch (err) {
    next(new CustomError(500, err.message || "Error adding product"));
  }
});

// New endpoint: direct update where images/colors are provided as URLs in JSON
export const updateProductDirect = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    const productData = req.body || {};

    // Allow partial updates: make schema optional for required fields
    const { error } = productValidationSchema.validate(productData, { convert: true, presence: 'optional' });
    if (error) {
      const message = `The field '${error.details[0].context.key}' is missing or invalid. Please provide a valid value.`;
      return next(new CustomError(400, message));
    }

    const product = await Product.findById(id);
    if (!product) return next(new CustomError(404, 'Product not found'));

    // Prepare update object
    const updateFields = {};
    if (productData.name !== undefined) updateFields.name = productData.name;
    if (productData.category !== undefined) updateFields.category = productData.category;
    if (productData.price !== undefined) updateFields.price = productData.price;
    if (productData.offerPrice !== undefined) updateFields.offerPrice = productData.offerPrice;
    if (productData.image !== undefined) updateFields.image = productData.image;
    if (productData.colors !== undefined) updateFields.colors = productData.colors;

    if (productData.description !== undefined) {
      updateFields.description = Array.isArray(productData.description)
        ? productData.description
        : typeof productData.description === 'string'
        ? [productData.description]
        : productData.description;
    }

    if (productData.sizes !== undefined) {
      // Normalize sizes objects; use offerPrice or price from payload as fallback
      updateFields.sizes = normalizeSizes(productData.sizes, productData.offerPrice || productData.price) || [];
    }

    const updated = await Product.findByIdAndUpdate(id, { $set: updateFields }, { new: true });

    res.status(200).json({ success: true, message: 'Product updated successfully', updated });
  } catch (err) {
    next(new CustomError(500, err.message || 'Error updating product'));
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
    const { name, category, price, offerPrice, description, existingImages, sizes } = req.body;
    const files = req.files || [];

    const product = await Product.findById(id);
    if (!product) {
        return next(new CustomError(404, "Product not found"));
    }

    try {
        let imagesUrl = [];

        // Handle existing images (may be single value or array)
        if (existingImages) {
            const existingImgsArray = Array.isArray(existingImages) ? existingImages : [existingImages];
            imagesUrl = existingImgsArray;
        }

        // Upload new images (expecting req.files.images when using upload.fields)
        const imagesFiles = (req.files && req.files.images) || [];
        if (imagesFiles.length > 0) {
            const newImageUrls = await Promise.all(
                imagesFiles.map((file) => {
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
        const imagesToDelete = (product.image || []).filter((img) => !imagesUrl.includes(img));
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

        // Parse description only if provided
        let parsedDescription;
        if (description !== undefined) {
            parsedDescription = description;
            if (typeof description === "string") {
                try {
                    parsedDescription = JSON.parse(description);
                } catch (e) {
                    parsedDescription = [description];
                }
            }
        }

        // Parse sizes only if provided, then normalize to objects
        let parsedSizes;
        if (sizes !== undefined) {
            if (typeof sizes === "string") {
                try {
                    parsedSizes = JSON.parse(sizes);
                } catch (e) {
                    // fallback to empty
                    parsedSizes = [];
                }
            } else if (Array.isArray(sizes)) {
                parsedSizes = sizes;
            }

            // Use product's pricing as default for size prices when not supplied
            const defaultSizePrice = product.offerPrice || product.price;
            parsedSizes = normalizeSizes(parsedSizes, defaultSizePrice) || [];
        }

        // Parse colors only if provided
        let parsedColors;
        if (req.body.colors !== undefined) {
            const colorsInput = req.body.colors;
            if (typeof colorsInput === "string") {
                try {
                    parsedColors = JSON.parse(colorsInput);
                } catch (e) {
                    parsedColors = [];
                }
            } else if (Array.isArray(colorsInput)) {
                parsedColors = colorsInput;
            } else {
                parsedColors = [];
            }
        }

        // handle uploaded color images mapping
        const colorFiles = (req.files && req.files.colorImages) || [];
        const colorMapping = {};
        if (colorFiles.length > 0) {
            await Promise.all(
                colorFiles.map((file) => {
                    return new Promise((resolve, reject) => {
                        if (!file.buffer) return reject(new Error("File buffer is undefined"));
                        const stream = cloudinary.uploader.upload_stream({ resource_type: "image" }, (error, result) => {
                            if (error) return reject(error);
                            colorMapping[file.originalname] = result.secure_url;
                            resolve(result.secure_url);
                        });
                        Readable.from(file.buffer).pipe(stream);
                    });
                })
            );

            // If colors were sent, map their image field to uploaded url if it references a filename,
            // and preserve existing URLs when no matching filename found.
            if (parsedColors) {
                parsedColors = parsedColors.map((c) => ({
                    name: c.name,
                    image: colorMapping[c.image] ? colorMapping[c.image] : (c.image || undefined),
                }));
            }
        } else {
            // No new color files uploaded: ensure parsedColors preserves existing image urls
            if (parsedColors) {
                parsedColors = parsedColors.map((c) => ({
                    name: c.name,
                    image: c.image || undefined,
                }));
            }
        }

        // Build update fields only for provided data to avoid accidental overwrites
        const updateFields = {};
        if (name !== undefined) updateFields.name = name;
        if (category !== undefined) updateFields.category = category;
        if (price !== undefined) updateFields.price = price;
        if (offerPrice !== undefined) updateFields.offerPrice = offerPrice;
        if (parsedDescription !== undefined) updateFields.description = parsedDescription;
        if (existingImages !== undefined || (req.files && req.files.images && req.files.images.length > 0)) updateFields.image = imagesUrl;
        if (parsedSizes !== undefined) updateFields.sizes = parsedSizes;
        if (parsedColors !== undefined) updateFields.colors = parsedColors;

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { $set: updateFields },
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
