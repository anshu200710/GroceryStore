import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        name: { type: String, trim: true, required: true },
        description: { type: Array, required: true },
        price: { type: Number, required: true },
        offerPrice: { type: Number, required: true },
        image: { type: Array, required: true },
        category: { type: String, required: true },
        inStock: { type: Boolean, default: true },
        sizes: {
            type: [{
                name: { type: String, trim: true },
                price: { type: Number },        // offer price
                mrpPrice: { type: Number },     // NEW: MRP for this size
                inStock: { type: Boolean, default: true },
                sku: { type: String },
            }],
            default: [],
        },
        colors: {
            type: [
                {
                    name: { type: String, trim: true },
                    image: { type: String },
                },
            ],
            default: [],
        },
    },
    { timestamps: true }
);

const Product =
    mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
