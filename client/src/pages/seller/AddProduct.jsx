import React, { useState } from "react";
import { assets, categories } from "../../assets/assets";
import { useAppContext } from "./../../context/AppContext";
import toast from "react-hot-toast";

const AddProduct = () => {
    const { axios } = useAppContext();

    const [files, setFiles] = useState([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [price, setPrice] = useState("");
    const [offerPrice, setOfferPrice] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedSizes, setSelectedSizes] = useState([]);
    const [sizesInput, setSizesInput] = useState("");

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
        const unique = parts.filter((p) => !selectedSizes.includes(p));
        if (unique.length) setSelectedSizes([...selectedSizes, ...unique]);
    };

    const handleAddSizeClick = () => {
        addSizesFromInput(sizesInput);
        setSizesInput("");
    };

    const handleSizeKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addSizesFromInput(sizesInput);
            setSizesInput("");
        }
    };

    const removeSize = (size) => {
        setSelectedSizes(selectedSizes.filter((s) => s !== size));
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

            const productData = {
                name,
                description: description.split("\n"),
                category,
                price,
                offerPrice,
                sizes: selectedSizes,
                colors: selectedColors.map((c) => ({ name: c.name, image: c.image })),
            };

            const formData = new FormData();
            formData.append("productData", JSON.stringify(productData));

            for (let i = 0; i < files.length; i++) {
                formData.append("images", files[i]);
            }

            // append color swatch files
            for (let i = 0; i < selectedColors.length; i++) {
                const c = selectedColors[i];
                if (c.file) {
                    formData.append("colorImages", c.file);
                }
            }

            const { data } = await axios.post("/product/add", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

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
                            <button
                                type="button"
                                onClick={handleAddSizeClick}
                                className="px-4 py-2 bg-primary text-white rounded"
                            >
                                Add
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                            {selectedSizes.map((size) => (
                                <span key={size} className="flex items-center gap-2 bg-gray-100 border border-gray-300 rounded px-3 py-1 text-sm">
                                    <span>{size.replace("_"," ")}</span>
                                    <button type="button" onClick={() => removeSize(size)} className="text-gray-500 hover:text-red-500">×</button>
                                </span>
                            ))}
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
