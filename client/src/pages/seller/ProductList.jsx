import React, { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { categories } from "../../assets/assets";
import toast from "react-hot-toast";

const ProductList = () => {
    const { products, currency, axios, fetchProducts, isProductsLoading } =
        useAppContext();

    const [showModal, setShowModal] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Edit states
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: "",
        category: "",
        price: "",
        offerPrice: "",
        description: "",
        images: [],
        sizes: [],
    });
    const [newImages, setNewImages] = useState([]);
    const [editSizeInput, setEditSizeInput] = useState("");

    // Color edit states
    const [editColorInput, setEditColorInput] = useState("");
    const [editColorFile, setEditColorFile] = useState(null);
    const [newColorFiles, setNewColorFiles] = useState([]);

    const normalizeSizeValue = (s) => {
        if (!s) return "";
        let v = s.trim().toUpperCase();
        v = v.replace(/\s+/g, "_");
        return v;
    };

    const addEditSizesFromInput = (input) => {
        if (!input) return;
        const parts = input
            .split(",")
            .map((s) => normalizeSizeValue(s))
            .filter((s) => s !== "");
        const unique = parts.filter((p) => !(editFormData.sizes || []).includes(p));
        if (unique.length) setEditFormData((prev) => ({ ...prev, sizes: [...(prev.sizes || []), ...unique] }));
    };

    const handleEditAddSize = () => {
        addEditSizesFromInput(editSizeInput);
        setEditSizeInput("");
    };

    const handleEditAddColor = () => {
        const name = editColorInput.trim();
        if (!name) return;
        setEditFormData((prev) => ({ ...prev, colors: [...(prev.colors || []), { name, image: editColorFile ? editColorFile.name : null }] }));
        if (editColorFile) setNewColorFiles((prev) => [...prev, editColorFile]);
        setEditColorInput("");
        setEditColorFile(null);
    };

    const handleEditSizeKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addEditSizesFromInput(editSizeInput);
            setEditSizeInput("");
        }
    };

    const removeEditSize = (size) => {
        setEditFormData((prev) => ({ ...prev, sizes: (prev.sizes || []).filter((s) => s !== size) }));
    }; 

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedStock, setSelectedStock] = useState("all");

    // Get category paths for dropdown
    const categoryPaths = categories.map((cat) => cat.path);

    const toggleStock = async (id, inStock) => {
        try {
            const { data } = await axios.patch(`/product/${id}`, {
                inStock,
            });
            if (data.success) {
                fetchProducts();
                toast.success(data.message);
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                    "Something went wrong, Please try again."
            );
        }
    };

    const confirmDelete = (id) => {
        setSelectedProductId(id);
        setShowModal(true);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setEditFormData({
            name: product.name,
            category: product.category,
            price: product.price || "",
            offerPrice: product.offerPrice,
            description: product.description?.join("\n") || "",
            images: product.image || [],
            sizes: product.sizes || [],
            colors: product.colors || [],
        });
        setNewImages([]);
        setShowEditModal(true);
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setNewImages((prev) => [...prev, ...files]);
    };

    const removeExistingImage = (index) => {
        setEditFormData((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    };

    const removeNewImage = (index) => {
        setNewImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handleEditProduct = async () => {
        if (!editFormData.name.trim()) {
            toast.error("Product name is required");
            return;
        }
        if (!editFormData.category.trim()) {
            toast.error("Category is required");
            return;
        }
        if (!editFormData.price || parseFloat(editFormData.price) <= 0) {
            toast.error("Valid price is required");
            return;
        }
        if (!editFormData.offerPrice || parseFloat(editFormData.offerPrice) <= 0) {
            toast.error("Valid offer price is required");
            return;
        }

        setIsEditing(true);
        try {
            const formData = new FormData();
            formData.append("name", editFormData.name);
            formData.append("category", editFormData.category);
            formData.append("price", editFormData.price);
            formData.append("offerPrice", editFormData.offerPrice);
            
            // Convert description string to array
            const descriptionArray = editFormData.description
                .split("\n")
                .filter((line) => line.trim() !== "");
            formData.append("description", JSON.stringify(descriptionArray));
            formData.append("sizes", JSON.stringify(editFormData.sizes));
            formData.append("colors", JSON.stringify(editFormData.colors));
            
            // Append existing images
            editFormData.images.forEach((img) => {
                formData.append("existingImages", img);
            });
            
            // Append new images
            newImages.forEach((file) => {
                formData.append("images", file);
            });

            // Append new color swatch files
            newColorFiles.forEach((file) => {
                formData.append("colorImages", file);
            });

            const { data } = await axios.patch(`/product/${editingProduct._id}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            if (data.success) {
                toast.success(data.message);
                fetchProducts();
                setShowEditModal(false);
                setEditingProduct(null);                setNewImages([]);
                setNewColorFiles([]);
                setEditColorFile(null);            }
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Failed to update product"
            );
        } finally {
            setIsEditing(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const { data } = await axios.delete(
                `/product/${selectedProductId}`
            );
            if (data.success) {
                toast.success(data.message);
                fetchProducts();
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Something went wrong"
            );
        } finally {
            setIsDeleting(false);
            setShowModal(false);
        }
    };

    return (
        <div className="no-scrollbar flex-1 h-[95vh] overflow-y-auto flex flex-col justify-between">
            <div className="w-full md:p-10 p-4">
                <h2 className="pb-4 text-lg font-medium">All Products</h2>

                {/* Search and Filter Controls */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    {/* Search Bar */}
                    <input
                        type="text"
                        placeholder="Search by product name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {/* Category Dropdown */}
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 w-full md:w-1/4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Categories</option>
                        {categoryPaths.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                    {/* In Stock Dropdown */}
                    <select
                        value={selectedStock}
                        onChange={(e) => setSelectedStock(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 w-full md:w-1/4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All</option>
                        <option value="in">In Stock</option>
                        <option value="out">Out of Stock</option>
                    </select>
                </div>

                {isProductsLoading ? (
                    <div className="w-full bg-white border border-gray-300 rounded-md p-6 text-center text-gray-600">
                        Loading products...
                    </div>
                ) : products.length === 0 ? (
                    <div className="w-full bg-white border border-gray-300 rounded-md p-6 text-center text-gray-600">
                        No products found.
                    </div>
                ) : (
                    <>
                        {/* Filter and display products */}
                        {(() => {
                            const q = searchTerm.trim().toLowerCase();
                            const filtered = products.filter((p) => {
                                // Search by name
                                const nameMatch = p.name?.toLowerCase().includes(q);

                                // Filter by category
                                const categoryMatch =
                                    selectedCategory === "all" || p.category === selectedCategory;

                                // Filter by stock
                                const stockMatch =
                                    selectedStock === "all" ||
                                    (selectedStock === "in" && p.inStock) ||
                                    (selectedStock === "out" && !p.inStock);

                                // Search only applies if text entered, otherwise show all
                                const searchMatch = q === "" || nameMatch;

                                return categoryMatch && stockMatch && searchMatch;
                            });

                            return (
                                <>
                                    {filtered.length === 0 ? (
                                        <div className="w-full bg-white border border-gray-300 rounded-md p-6 text-center text-gray-600">
                                            No products match your filters.
                                        </div>
                                    ) : (
                                        <>
                                            {/* Product Table */}
                                            <div className="w-full overflow-x-auto bg-white border border-gray-300 rounded-md">
                                                <table className="min-w-full text-sm text-left text-gray-700">
                                                    <thead className="bg-gray-100 text-gray-900">
                                                        <tr>
                                                            <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                                                Product
                                                            </th>
                                                            <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                                                Category
                                                            </th>
                                                            <th className="px-4 py-3 font-semibold whitespace-nowrap hidden md:table-cell">
                                                                Selling Price
                                                            </th>
                                                            <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                                                In Stock
                                                            </th>
                                                            <th className="px-4 py-3 font-semibold whitespace-nowrap hidden sm:table-cell">
                                                                Delete
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200">
                                                        {filtered.map((product) => (
                                                            <tr key={product._id}>
                                                                <td className="px-4 py-3 flex items-center space-x-3 min-w-[200px]">
                                                                    <div className="border border-gray-300 rounded p-1">
                                                                        <img
                                                                            src={product.image[0]}
                                                                            alt="Product"
                                                                            className="w-12 h-12 object-cover"
                                                                        />
                                                                    </div>
                                                                    <span 
                                                                        className="truncate max-w-[150px] sm:max-w-xs cursor-pointer text-black hover:underline transition"
                                                                        onClick={() => openEditModal(product)}
                                                                    >
                                                                        {product.name}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap">
                                                                    {product.category}
                                                                </td>
                                                                <td className="px-4 py-3 hidden md:table-cell whitespace-nowrap">
                                                                    {currency}
                                                                    {product.offerPrice}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                                        <input
                                                                            onChange={() =>
                                                                                toggleStock(
                                                                                    product._id,
                                                                                    !product.inStock
                                                                                )
                                                                            }
                                                                            checked={
                                                                                product.inStock
                                                                            }
                                                                            type="checkbox"
                                                                            className="sr-only peer"
                                                                        />
                                                                        <div className="w-12 h-7 bg-slate-300 rounded-full peer peer-checked:bg-blue-600 transition-colors duration-200"></div>
                                                                        <span className="dot absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-5"></span>
                                                                    </label>
                                                                </td>
                                                                <td className="px-4 py-3 hidden sm:table-cell">
                                                                    {/* <button
                                                                        onClick={() =>
                                                                            confirmDelete(
                                                                                product._id
                                                                            )
                                                                        }
                                                                        className="text-sm cursor-pointer px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                                                                    >
                                                                        Delete
                                                                    </button> */}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Mobile Delete Buttons */}
                                            <div className="sm:hidden mt-4 space-y-2">
                                                {filtered.map((product) => (
                                                    <div
                                                        key={product._id}
                                                        className="flex justify-between items-center px-4 py-2 border rounded shadow-sm"
                                                    >
                                                        <span className="text-sm font-medium truncate">
                                                            {product.name}
                                                        </span>
                                                        <button
                                                            onClick={() =>
                                                                confirmDelete(product._id)
                                                            }
                                                            className="text-xs cursor-pointer px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </>
                            );
                        })()}
                    </>
                )}
            </div>

            {/* Edit Modal */}
            {showEditModal && editingProduct && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg">
                        <div className="sticky top-0 bg-white border-b p-6">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Edit Product
                            </h3>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Product Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={editFormData.name}
                                    onChange={handleEditFormChange}
                                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category
                                </label>
                                <select
                                    name="category"
                                    value={editFormData.category}
                                    onChange={handleEditFormChange}
                                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select a category</option>
                                    {categoryPaths.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Product Price
                                    </label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={editFormData.price}
                                        onChange={handleEditFormChange}
                                        step="0.01"
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Offer Price
                                    </label>
                                    <input
                                        type="number"
                                        name="offerPrice"
                                        value={editFormData.offerPrice}
                                        onChange={handleEditFormChange}
                                        step="0.01"
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description (one per line)
                                </label>
                                <textarea
                                    name="description"
                                    value={editFormData.description}
                                    onChange={handleEditFormChange}
                                    rows="4"
                                    placeholder="Enter each description point on a new line"
                                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>
                            {(editFormData.category === "Mens-Clothing" || editFormData.category === "Womens-Clothing" || editFormData.category === "Kids-Clothing") && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Sizes Available
                                    </label>
                                    <p className="text-xs text-gray-500">Type sizes separated by commas or press Enter to add (e.g. S, M, L or UK_6, US_8)</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <input
                                            value={editSizeInput}
                                            onChange={(e) => setEditSizeInput(e.target.value)}
                                            onKeyDown={handleEditSizeKeyDown}
                                            placeholder="Type and press Enter or click Add"
                                            className="outline-none py-2 px-3 rounded border border-gray-300 flex-1"
                                        />
                                        <button type="button" onClick={handleEditAddSize} className="px-4 py-2 bg-primary text-white rounded">Add</button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {(editFormData.sizes || []).map((size) => (
                                            <span key={size} className="flex items-center gap-2 bg-gray-100 border border-gray-300 rounded px-3 py-1 text-sm">
                                                <span>{size.replace("_"," ")}</span>
                                                <button type="button" onClick={() => removeEditSize(size)} className="text-gray-500 hover:text-red-500">×</button>
                                            </span>
                                        ))}
                                        {(editFormData.sizes || []).length === 0 && (
                                            <p className="text-gray-500/70">No sizes added yet</p>
                                        )}
                                    </div>

                                    {/* Color Variants */}
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Color Variants</label>
                                        <p className="text-xs text-gray-500">Add color name and optionally upload a swatch image.</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <input
                                                value={editColorInput}
                                                onChange={(e) => setEditColorInput(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleEditAddColor(); } }}
                                                placeholder="Color name (e.g., Red, Navy)"
                                                className="outline-none py-2 px-3 rounded border border-gray-300 flex-1"
                                            />
                                            <label className="px-4 py-2 bg-white border border-gray-300 rounded cursor-pointer">
                                                <input type="file" accept="image/*" onChange={(e) => setEditColorFile(e.target.files[0])} hidden />
                                                Upload
                                            </label>
                                            <button type="button" onClick={handleEditAddColor} className="px-4 py-2 bg-primary text-white rounded">Add</button>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {(editFormData.colors || []).map((c) => (
                                                <div key={c.name} className="flex items-center gap-2 bg-gray-100 border border-gray-300 rounded px-3 py-1 text-sm">
                                                    {c.image ? (
                                                        <img src={c.image} alt={c.name} className="w-6 h-6 object-cover rounded-full" />
                                                    ) : (
                                                        <span className="inline-block w-6 h-6 bg-gray-300 rounded-full"></span>
                                                    )}
                                                    <span>{c.name}</span>
                                                    <button type="button" onClick={() => removeEditColor(c.name)} className="text-gray-500 hover:text-red-500">×</button>
                                                </div>
                                            ))}
                                            {(editFormData.colors || []).length === 0 && (
                                                <p className="text-gray-500/70">No colors added yet</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Product Images
                                </label>
                                
                                {/* Existing Images */}
                                {editFormData.images.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-xs text-gray-600 mb-2">Current Images:</p>
                                        <div className="flex flex-wrap gap-3">
                                            {editFormData.images.map((img, index) => (
                                                <div key={index} className="relative">
                                                    <img
                                                        src={img}
                                                        alt={`Product ${index}`}
                                                        className="w-16 h-16 object-cover border border-gray-300 rounded"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeExistingImage(index)}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* New Images */}
                                {newImages.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-xs text-gray-600 mb-2">New Images:</p>
                                        <div className="flex flex-wrap gap-3">
                                            {newImages.map((file, index) => (
                                                <div key={index} className="relative">
                                                    <img
                                                        src={URL.createObjectURL(file)}
                                                        alt={`New ${index}`}
                                                        className="w-16 h-16 object-cover border border-gray-300 rounded"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeNewImage(index)}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* File Input */}
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                />
                            </div>
                        </div>
                        
                        <div className="sticky bottom-0 bg-white border-t p-6 flex justify-end gap-4">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 cursor-pointer rounded-md border border-gray-300 hover:bg-gray-100 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditProduct}
                                disabled={isEditing}
                                className={`px-4 py-2 cursor-pointer rounded-md bg-blue-500 text-white transition ${
                                    isEditing
                                        ? "opacity-50 cursor-not-allowed"
                                        : "hover:bg-blue-600"
                                }`}
                            >
                                {isEditing ? "Updating..." : "Update"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 w-[90%] max-w-md shadow-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Confirm Deletion
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this product? This
                            action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 cursor-pointer rounded-md border border-gray-300 hover:bg-gray-100 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className={`px-4 py-2 cursor-pointer rounded-md bg-red-500 text-white transition ${
                                    isDeleting
                                        ? "opacity-50 cursor-not-allowed"
                                        : "hover:bg-red-600"
                                }`}
                            >
                                {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductList;
