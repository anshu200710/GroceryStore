import React, { useState } from "react";
import { assets, categories } from "../../assets/assets";
import { useAppContext } from "./../../context/AppContext";
import toast from "react-hot-toast";

const AddProduct = () => {
    const { axios, currency } = useAppContext();

    const [files, setFiles] = useState([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [price, setPrice] = useState("");
    const [offerPrice, setOfferPrice] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedSizes, setSelectedSizes] = useState([]); // array of { name, price }
    const [sizesInput, setSizesInput] = useState("");
    const [sizePriceInput, setSizePriceInput] = useState("");

    const normalizeSizeValue = (s) => {
        if (!s) return "";
        let v = s.trim().toUpperCase();
        // convert 'UK 6' -> 'UK_6' and 'US 8' -> 'US_8'
        v = v.replace(/\s+/g, "_");
        return v;
    };

    const addSizesFromInput = (input) => {
        if (!input) return;
        // support comma separated entries
        const parts = input
            .split(",")
            .map((s) => normalizeSizeValue(s))
            .filter((s) => s !== "");
        if (parts.length === 0) return;
        const existingNames = (selectedSizes || []).map((s) => (typeof s === 'string' ? s : s.name));
        const unique = parts.filter((p) => !existingNames.includes(p));
        if (unique.length) {
            const defaultPrice = Number(sizePriceInput) || Number(offerPrice) || Number(price) || undefined;
            const newSizes = unique.map((name) => ({ name, price: defaultPrice }));
            setSelectedSizes((prev) => [...(prev || []), ...newSizes]);
        }
    };

    const handleAddSizeClick = () => {
        addSizesFromInput(sizesInput);
        setSizesInput("");
        setSizePriceInput("");
    };

    const handleSizeKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addSizesFromInput(sizesInput);
            setSizesInput("");
            setSizePriceInput("");
        }
    };

    const removeSize = (sizeName) => {
        setSelectedSizes((prev) => (prev || []).filter((s) => (typeof s === 'string' ? s : s.name) !== sizeName));
    }; 

    // Color variant states
    const [selectedColors, setSelectedColors] = useState([]); // { name, image (string or null), file }
    const [colorNameInput, setColorNameInput] = useState("");
    const [colorFile, setColorFile] = useState(null);

    const handleAddColor = () => {
        const name = colorNameInput.trim();
        if (!name) return;
        const imagePlaceholder = colorFile ? colorFile.name : null;
        setSelectedColors([...selectedColors, { name, image: imagePlaceholder, file: colorFile }]);
        setColorNameInput("");
        setColorFile(null);
    };

    const removeColor = (name) => {
        setSelectedColors(selectedColors.filter((c) => c.name !== name));
    }; 

    const onSubmitHandler = async (event) => {
        try {
            event.preventDefault();
            setLoading(true);

            // Direct-to-Cloudinary flow: upload files to Cloudinary first, then send small JSON to server
            const uploadSignatureResp = await axios.get("/product/upload/sign");
            const { signature, timestamp, apiKey, cloudName } = uploadSignatureResp.data;

            const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

            const compressImage = async (file, maxWidth = 1600, maxHeight = 1600, quality = 0.85) => {
                // use createImageBitmap for better performance
                const imageBitmap = await createImageBitmap(file);
                let { width, height } = imageBitmap;
                const ratio = Math.min(1, Math.min(maxWidth / width, maxHeight / height));
                const targetWidth = Math.round(width * ratio);
                const targetHeight = Math.round(height * ratio);

                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

                const blob = await new Promise((resolve) => canvas.toBlob(resolve, file.type || 'image/jpeg', quality));
                const compressed = new File([blob], file.name, { type: blob.type });
                return compressed;
            };

            const uploadToCloudinary = async (file) => {
                let f = file;

                // If file is too large, attempt progressive compression
                if (f.size > MAX_FILE_SIZE) {
                    let q = 0.85;
                    for (let i = 0; i < 4 && f.size > MAX_FILE_SIZE; i++) {
                        f = await compressImage(f, 1600, 1600, q);
                        q = Math.max(0.4, q - 0.15);
                    }
                } else if (f.size > 500 * 1024) {
                    // moderate compression for medium files
                    f = await compressImage(f, 2000, 2000, 0.9);
                }

                if (f.size > MAX_FILE_SIZE) {
                    throw new Error('File too large after compression (max 10MB)');
                }

                const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
                const fd = new FormData();
                fd.append("file", f);
                fd.append("timestamp", timestamp);
                fd.append("signature", signature);
                fd.append("api_key", apiKey);
                const res = await fetch(url, { method: "POST", body: fd });
                const json = await res.json();
                if (!res.ok) throw new Error(json.error?.message || "Upload failed");
                return json.secure_url;
            };

            // upload images
            const imagesUrls = [];
            for (let i = 0; i < files.length; i++) {
                if (!files[i]) continue;
                try {
                    const url = await uploadToCloudinary(files[i]);
                    imagesUrls.push(url);
                } catch (err) {
                    toast.error(`Image upload failed: ${err.message}`);
                    setLoading(false);
                    return;
                }
            }

            // upload color swatches where provided
            const colorsPayload = [];
            for (let i = 0; i < selectedColors.length; i++) {
                const c = selectedColors[i];
                let imageUrl = c.image || null;
                if (c.file) {
                    try {
                        imageUrl = await uploadToCloudinary(c.file);
                    } catch (err) {
                        toast.error(`Color swatch upload failed for ${c.name}: ${err.message}`);
                        setLoading(false);
                        return;
                    }
                }
                colorsPayload.push({ name: c.name, image: imageUrl });
            }

            const productData = {
                name,
                description: description.split("\n"),
                category,
                price,
                offerPrice,
                sizes: selectedSizes,
                colors: colorsPayload,
                image: imagesUrls,
            };

            const { data } = await axios.post("/product/add-direct", productData);

            if (data.success) {
                toast.success(data.message);
                setName("");
                setDescription("");
                setCategory("");
                setPrice("");
                setOfferPrice("");
                setFiles([]);
                setSelectedSizes([]);
                setSelectedColors([]);
            }
        } catch (error) {
            if (error.response && error.response.data) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Something went wrong");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="no-scrollbar flex-1 h-[95vh] overflow-y-scroll flex flex-col justify-between">
            <form
                onSubmit={onSubmitHandler}
                className="md:p-10 p-4 space-y-5 max-w-lg"
            >
                <div>
                    <p className="text-base font-medium">Product Image (Ideal Size 1:1)</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                        {Array(4)
                            .fill("")
                            .map((_, index) => (
                                <label key={index} htmlFor={`image${index}`}>
                                    <input
                                        onChange={(e) => {
                                            const updatedFiles = [...files];
                                            updatedFiles[index] =
                                                e.target.files[0];
                                            setFiles(updatedFiles);
                                        }}
                                        accept="image/*"
                                        type="file"
                                        id={`image${index}`}
                                        hidden
                                    />
                                    <img
                                        className="max-w-24 cursor-pointer"
                                        src={
                                            files[index]
                                                ? URL.createObjectURL(
                                                    files[index]
                                                )
                                                : assets.upload_area
                                        }
                                        alt="uploadArea"
                                        width={100}
                                        height={100}
                                    />
                                </label>
                            ))}
                    </div>
                </div>
                <div className="flex flex-col gap-1 max-w-md">
                    <label
                        className="text-base font-medium"
                        htmlFor="product-name"
                    >
                        Product Name
                    </label>
                    <input
                        onChange={(e) => setName(e.target.value)}
                        value={name}
                        id="product-name"
                        type="text"
                        placeholder="Type here"
                        className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
                        required
                    />
                </div>
                <div className="flex flex-col gap-1 max-w-md">
                    <label
                        className="text-base font-medium"
                        htmlFor="product-description"
                    >
                        Product Description
                    </label>
                    <textarea
                        onChange={(e) => setDescription(e.target.value)}
                        value={description}
                        id="product-description"
                        rows={4}
                        className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 resize-none"
                        placeholder="Type here"
                    ></textarea>
                </div>
                <div className="w-full flex flex-col gap-1">
                    <label className="text-base font-medium" htmlFor="category">
                        Category
                    </label>
                    <select
                        onChange={(e) => setCategory(e.target.value)}
                        value={category}
                        id="category"
                        className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
                    >
                        <option value="">Select Category</option>
                        {categories.map((item, index) => (
                            <option key={index} value={item.path}>
                                {item.path}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-5 flex-wrap">
                    <div className="flex-1 flex flex-col gap-1 w-32">
                        <label
                            className="text-base font-medium"
                            htmlFor="product-price"
                        >
                            Product Price
                        </label>
                        <input
                            onChange={(e) => setPrice(e.target.value)}
                            value={price}
                            id="product-price"
                            type="number"
                            placeholder="0"
                            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
                            required
                        />
                    </div>
                    <div className="flex-1 flex flex-col gap-1 w-32">
                        <label
                            className="text-base font-medium"
                            htmlFor="offer-price"
                        >
                            Offer Price
                        </label>
                        <input
                            onChange={(e) => setOfferPrice(e.target.value)}
                            value={offerPrice}
                            id="offer-price"
                            type="number"
                            placeholder="0"
                            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
                            required
                        />
                    </div>
                </div>
                {(category === "Mens-Clothing" || category === "Womens-Clothing" || category === "Kids-Clothing") && (
                    <div className="flex flex-col gap-1 max-w-md">
                        <label className="text-base font-medium">Sizes Available</label>
                        <p className="text-xs text-gray-500 mt-1">Type sizes separated by commas or press Enter to add (e.g. S, M, L or UK_6, US_8)</p>
                        <div className="flex items-center gap-2 mt-2">
                            <input
                                value={sizesInput}
                                onChange={(e) => setSizesInput(e.target.value)}
                                onKeyDown={handleSizeKeyDown}
                                placeholder="Type and press Enter or click Add"
                                className="outline-none py-2 px-3 rounded border border-gray-500/40 flex-1"
                            />
                            <input
                                value={sizePriceInput}
                                onChange={(e) => setSizePriceInput(e.target.value)}
                                type="number"
                                placeholder="Price"
                                className="outline-none py-2 px-3 rounded border border-gray-500/40 w-28"
                            />
                            <button
                                type="button"
                                onClick={handleAddSizeClick}
                                className="px-4 py-2 bg-primary text-white rounded"
                            >
                                Add
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                            {selectedSizes.map((s, idx) => {
                                const name = s ? (typeof s === 'string' ? s : s.name) : '';
                                const priceVal = s && typeof s === 'object' && s.price !== undefined ? s.price : '';
                                if (!name) return null; // skip invalid entries
                                const display = String(name).replace("_"," ");
                                return (
                                    <span key={`${name}-${idx}`} className="flex items-center gap-2 bg-gray-100 border border-gray-300 rounded px-3 py-1 text-sm">
                                        <span>{display}{priceVal !== '' && <span className="ml-2 text-xs text-gray-600">{currency}{priceVal}</span>}</span>
                                        <button type="button" onClick={() => removeSize(name)} className="text-gray-500 hover:text-red-500">×</button>
                                    </span>
                                );
                            })}
                            {selectedSizes.length === 0 && (
                                <p className="text-gray-500/70">No sizes added yet</p>
                            )}
                        </div>

                        {/* Color Variants */}
                        <div className="mt-6">
                            <label className="text-base font-medium">Color Variants</label>
                            <p className="text-xs text-gray-500 mt-1">Add color name and optionally upload a swatch image.</p>
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    value={colorNameInput}
                                    onChange={(e) => setColorNameInput(e.target.value)}
                                    placeholder="Color name (e.g., Red, Navy)"
                                    className="outline-none py-2 px-3 rounded border border-gray-500/40 flex-1"
                                />
                                <label className="px-4 py-2 bg-white border border-gray-300 rounded cursor-pointer">
                                    <input type="file" accept="image/*" onChange={(e) => setColorFile(e.target.files[0])} hidden />
                                    Upload
                                </label>
                                <button type="button" onClick={handleAddColor} className="px-4 py-2 bg-primary text-white rounded">Add</button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {selectedColors.map((c) => (
                                    <div key={c.name} className="flex items-center gap-2 bg-gray-100 border border-gray-300 rounded px-3 py-1 text-sm">
                                        {c.file ? (
                                            <img src={URL.createObjectURL(c.file)} alt={c.name} className="w-6 h-6 object-cover rounded-full" />
                                        ) : c.image ? (
                                            <img src={c.image} alt={c.name} className="w-6 h-6 object-cover rounded-full" />
                                        ) : (
                                            <span className="inline-block w-6 h-6 bg-gray-300 rounded-full"></span>
                                        )}
                                        <span>{c.name}</span>
                                        <button type="button" onClick={() => removeColor(c.name)} className="text-gray-500 hover:text-red-500">×</button>
                                    </div>
                                ))}
                                {selectedColors.length === 0 && (
                                    <p className="text-gray-500/70">No colors added yet</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <button
                    className={`px-8 py-2.5 bg-primary text-white font-medium rounded cursor-pointer ${loading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                    disabled={loading}
                >
                    {loading ? "Adding..." : "ADD"}
                </button>
            </form>
        </div>
    );
};

export default AddProduct;
