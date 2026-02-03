import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { Link, useParams } from "react-router-dom";
import { assets } from "../assets/assets";
import ProductCard from "../components/ProductCard";
import toast from "react-hot-toast";

const ProductDetails = () => {
    const { products, navigate, currency, addToCart } = useAppContext();
    const { id } = useParams();

    const [relatedProducts, setRelatedProducts] = useState([]);
    const [thumbnail, setThumbnail] = useState(null);
    const [selectedSizeName, setSelectedSizeName] = useState(null);
    const [selectedSizePrice, setSelectedSizePrice] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSizeMRP, setSelectedSizeMRP] = useState(null);

    const product = products.find((item) => item._id === id);

    useEffect(() => {
        if (products.length > 0) {
            let productsCopy = products.slice();
            productsCopy = productsCopy.filter(
                (item) => product.category === item.category
            );
            setRelatedProducts(productsCopy.slice(0, 5));
        }
    }, [products]);

    useEffect(() => {
        setThumbnail(product?.image[0] ? product.image[0] : null);

        // If only one size present, pre-select it
        if (product && product.sizes && product.sizes.length === 1) {
            const single = Array.isArray(product.sizes[0]) ? product.sizes[0] : product.sizes[0];
            const sName = typeof single === 'string' ? single : single.name;
            const sPrice = typeof single === 'object' ? single.price : undefined;
            const sMRP = typeof single === 'object' ? single.mrpPrice : undefined;
            setSelectedSizeName(sName);
            setSelectedSizePrice(sPrice !== undefined ? sPrice : null);
            setSelectedSizeMRP(sMRP !== undefined ? sMRP : null);
        } else {
            setSelectedSizeName(null);
            setSelectedSizePrice(null);
            setSelectedSizeMRP(null);
        }
    }, [product]);

    const handleAddToCart = (goToCart = false) => {
        const isClothingCategory = product.category === "Mens-Clothing" || product.category === "Womens-Clothing" || product.category === "Kids-Clothing";
        
        // Validate color if applicable
        if (product.colors && product.colors.length > 0) {
            if (!selectedColor) {
                toast.error("Please select Color to continue");
                return;
            }
        }

        if (isClothingCategory && product.sizes && product.sizes.length > 0) {
            if (!selectedSizeName) {
                toast.error("Please select Size to continue");
                return;
            }
            // Ensure unit price is always provided (fallback to product.offerPrice)
            const unitPrice = selectedSizePrice !== null && selectedSizePrice !== undefined ? selectedSizePrice : product.offerPrice;
            addToCart(product._id, selectedSizeName, selectedColor, unitPrice);
        } else {
            addToCart(product._id, null, selectedColor, product.offerPrice);
        }
    };

        if (!product) return null;

    return (
        <div className="mt-12">
            {/* Header / Breadcrumb */}
            <p>
                <Link to={`/`}>Home</Link> /
                <Link to={`/products`}> Products</Link> /
                <Link to={`/products/${product.category.toLowerCase()}`}> {product.category}</Link> /
                <span className="text-primary"> {product.name}</span>
            </p>

            <div className="flex flex-col md:flex-row gap-16 mt-4">
                <div className="flex gap-3">
                    <div className="flex flex-col gap-3">
                        {product.image.map((img, index) => (
                            <div
                                key={index}
                                onClick={() => setThumbnail(img)}
                                className="border max-w-24 border-gray-500/30 rounded overflow-hidden cursor-pointer"
                            >
                                <img src={img} alt={`Thumbnail ${index + 1}`} />
                            </div>
                        ))}
                    </div>

                    <div className="border border-gray-500/30 max-w-100 rounded overflow-hidden">
                        <img src={thumbnail} alt="Selected product" />
                    </div>
                </div>

                <div className="text-sm w-full md:w-1/2">
                    <h1 className="text-3xl font-medium">{product.name}</h1>

                    <div className="mt-6">
                        <p className="text-gray-500/70 line-through">MRP: {currency}{selectedSizeMRP ?? product.price}</p>
                        <p className="text-2xl font-medium">Offer Price: {currency}{selectedSizePrice ?? product.offerPrice}</p>
                        <span className="text-gray-500/70">(inclusive of all taxes)</span>
                    </div>

                    <div className="mt-6">
                        <p className="text-base font-medium">About Product</p>
                        <ul className="list-disc ml-4 text-gray-500/70">
                            {product.description.map((desc, index) => (
                                <li key={index}>{desc}</li>
                            ))}
                        </ul>
                    </div>

                    {(product.category === "Mens-Clothing" || product.category === "Womens-Clothing" || product.category === "Kids-Clothing") && (
                        <>
                            {product.colors && product.colors.length > 0 && (
                                <div className="mt-6">
                                    <p className="text-base font-medium mb-2">Available Colors</p>
                                    <div className="flex flex-wrap gap-2">
                                        {product.colors.map((c, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedColor(c.name)}
                                                title={c.name}
                                                className={`flex items-center gap-2 border-2 rounded px-3 py-2 text-sm font-medium transition cursor-pointer ${
                                                    selectedColor === c.name
                                                        ? "border-primary bg-primary text-white"
                                                        : "border-gray-300 hover:border-primary"
                                                }`}
                                            >
                                                {c.image ? (
                                                    <img src={c.image} alt={c.name} className="w-6 h-6 object-cover rounded-full" />
                                                ) : (
                                                    <span className="inline-block w-6 h-6 bg-gray-300 rounded-full"></span>
                                                )}
                                                <span>{c.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {product.sizes && product.sizes.length > 0 && (
                                <div className="mt-6">
                                    <p className="text-base font-medium mb-2">Available Sizes</p>
                                    <div className="flex flex-wrap gap-2">
                                        {(() => {
                                            const seen = new Set();
                                            const options = (product.sizes || []).reduce((acc, s) => {
                                                const name = typeof s === 'string' ? s : s.name;
                                                const price = typeof s === 'string' ? undefined : s.price;
                                                if (!seen.has(name)) {
                                                    seen.add(name);
                                                    acc.push({ name, price });
                                                }
                                                return acc;
                                            }, []);
                                            return options.map((opt, idx) => {
                                                const display = String(opt.name).replace("_", " ");
                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => { 
                                                            setSelectedSizeName(opt.name); 
                                                            setSelectedSizePrice(opt.price !== undefined ? opt.price : null);
                                                            setSelectedSizeMRP(opt.mrpPrice !== undefined ? opt.mrpPrice : null);  // NEW
                                                        }}
                                                        className={`border-2 rounded px-4 py-2 text-sm font-medium transition cursor-pointer ${
                                                            selectedSizeName === opt.name
                                                                ? "border-primary bg-primary text-white"
                                                                : "border-gray-300 hover:border-primary"
                                                        }`}
                                                    >
                                                        {display}{opt.price !== undefined && <span className="ml-2 text-xs text-gray-600">{currency}{opt.price}</span>}
                                                    </button>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <div className="flex items-center mt-10 gap-4 text-base">
                        <button onClick={() => handleAddToCart(false)} className="w-full py-3.5 cursor-pointer font-medium bg-gray-100 text-gray-800/80 hover:bg-gray-200 transition">Add to Cart</button>
                        <button onClick={() => handleAddToCart(true)} className="w-full py-3.5 cursor-pointer font-medium bg-primary text-white hover:bg-primary-dull transition">Buy now</button>
                    </div>
                </div>
            </div>

            {/* --------Realted Products--------- */}
            <div className="flex flex-col items-center mt-20">
                <div className="flex flex-col items-center w-max">
                    <p className="text-3xl font-medium">Related Products</p>
                    <div className="w-20 h-0.5 bg-primary rounded-full"></div>
                </div>
                <div className="grid justify-items-center grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-y-6 gap-x-4 mt-6">
                    {relatedProducts
                        .filter((product) => product.inStock)
                        .map((product, index) => (
                            <ProductCard key={index} product={product} />
                        ))}
                </div>
                <button onClick={() => { navigate(`/products`); scrollTo(0, 0); }} className="mx-auto cursor-pointer px-12 my-16 py-2.5 border rounded text-primary hover:bg-primary/10 transition">See More</button>
            </div>
        </div>
    );
};

export default ProductDetails;
