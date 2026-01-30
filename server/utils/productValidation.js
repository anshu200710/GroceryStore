import Joi from "joi";

export const productValidationSchema = Joi.object({
    name: Joi.string().trim().required(),
    description: Joi.array().items(Joi.string()).required(),
    // Product image URLs uploaded to Cloudinary
    image: Joi.array().items(Joi.string().uri()).min(1).required(),
    price: Joi.number().positive().required(),
    offerPrice: Joi.number().positive().required(),
    category: Joi.string().required(),
    inStock: Joi.boolean().default(true),
    sizes: Joi.array().items(
        Joi.alternatives().try(
            Joi.string().trim(),
            Joi.object({
                name: Joi.string().trim().required(),
                price: Joi.number().positive().required(),
                inStock: Joi.boolean().optional(),
                sku: Joi.string().optional(),
            })
        )
    ).default([]),
    colors: Joi.array()
        .items(
            Joi.object({
                name: Joi.string().trim().max(40).required(),
                image: Joi.string().uri().optional(),
            })
        )
        .default([]),
});
