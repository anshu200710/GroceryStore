import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";

axios.defaults.withCredentials = true;
axios.defaults.headers.common["Content-Type"] = "application/json";
axios.defaults.baseURL = `${import.meta.env.VITE_BACKEND_URL}/api`;

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
    const currency = import.meta.env.VITE_CURRENCY;

    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [seller, setSeller] = useState(null);
    const [showUserLogin, setShowUserLogin] = useState(false);
    const [redirectPath, setRedirectPath] = useState("/");
    const [products, setProducts] = useState([]);

    const [cartItems, setCartItems] = useState({});
    const [searchQuery, setSearchQuery] = useState({});

    const [isProductsLoading, setIsProductsLoading] = useState(true);

    const API_URL = import.meta.env.VITE_BACKEND_URL
  ? `${import.meta.env.VITE_BACKEND_URL}/api`
  : "https://groceries.vyaapaarniti.com";

    const fetchProducts = async () => {
        try {
            setIsProductsLoading(true);
            const { data } = await axios.get("/product/list");

            if (data.success) {
                setProducts(data.products);
            }
        } catch (error) {
            if (error.response && error.response.data) {
                toast.error(error.response.data.message);
            }
        } finally {
            setIsProductsLoading(false);
        }
    };

    const fetchUser = async () => {
        try {
            const { data } = await axios.get("/user/me");

            if (data.success) {
                if (data.user.role === "user") {
                    setUser(data.user);
                    setCartItems(data.user.cartItems);
                }

                if (data.user.role === "seller") {
                    setSeller(data.user);
                }
            }
        } catch (error) {
            setUser(null);
            setSeller(null);
        }
    };

    // Fetch All Products
    useEffect(() => {
        fetchUser();
        fetchProducts();
    }, []);

    // Update Database with Cart Items
    useEffect(() => {
        const updateCart = async () => {
            try {
                await axios.patch("/cart/update", {
                    cartItems,
                });
            } catch (error) {
                if (error.response && error.response.data) {
                    toast.error(error.response.data.message);
                } else {
                    toast.error("Something went wrong");
                }
            }
        };

        if (user) {
            updateCart();
        }
    }, [cartItems]);

    // Add Product to Cart with Size and Color and snapshot unit price
    const addToCart = (itemId, size = null, color = null, sizePrice = null) => {
        let cartData = structuredClone(cartItems);
        let cartKey = itemId;
        if (size) cartKey += `-${size}`;
        if (color) cartKey += `-${color}`;

        if (cartData[cartKey]) {
            // existing entry may be legacy number or object
            if (typeof cartData[cartKey] === 'number') {
                cartData[cartKey] = { qty: cartData[cartKey] + 1, productId: itemId, size, sizePrice, color };
            } else {
                cartData[cartKey].qty += 1;
            }
        } else {
            cartData[cartKey] = { qty: 1, productId: itemId, size, sizePrice, color };
        }
        setCartItems(cartData);
        toast.success("Added to Cart");
    };

    // Update Cart Item Quantity
    const updateCartItem = (itemId, quantity) => {
        let cartData = structuredClone(cartItems);
        if (cartData[itemId]) {
            if (typeof cartData[itemId] === 'number') {
                cartData[itemId] = quantity;
            } else {
                cartData[itemId].qty = quantity;
            }
            setCartItems(cartData);
            toast.success("Cart Updated");
        }
    };

    // Remove Product from Cart
    const removeFromCart = (cartKey) => {
        let cartData = structuredClone(cartItems);
        if (cartData[cartKey]) {
            if (typeof cartData[cartKey] === 'number') {
                cartData[cartKey] -= 1;
                if (cartData[cartKey] === 0) delete cartData[cartKey];
            } else {
                cartData[cartKey].qty -= 1;
                if (cartData[cartKey].qty <= 0) delete cartData[cartKey];
            }
        }
        toast.success("Remove from Cart");
        setCartItems(cartData);
    };

    // Get Cart Item Count
    const getCartCount = () => {
        let totalCount = 0;
        for (const key in cartItems) {
            const val = cartItems[key];
            if (typeof val === 'number') totalCount += val;
            else if (val && typeof val === 'object') totalCount += val.qty || 0;
        }
        return totalCount;
    };

    // Get Cart Total Amount (respect per-size pricing if present)
    const getCartAmount = () => {
        let totalAmount = 0;
        for (const items in cartItems) {
            const parts = items.split("-");
            const productId = parts[0];
            const sizePart = parts.length > 1 ? parts[1] : null;

            let itemInfo = products.find((product) => product._id === productId);
            if (!itemInfo) {
                // fallback for older keys
                itemInfo = products.find((product) => product._id === items);
            }

            if (itemInfo) {
                let qty = 0;
                let unitPrice = itemInfo.offerPrice;
                const val = cartItems[items];
                if (typeof val === 'number') {
                    qty = val;
                    // legacy: infer price from selected size in key
                    if (sizePart) {
                        const sizeObj = (itemInfo.sizes || []).find((s) => (typeof s === 'string' ? s : s.name) === sizePart);
                        if (sizeObj && typeof sizeObj !== 'string' && sizeObj.price !== undefined) {
                            unitPrice = Number(sizeObj.price);
                        }
                    }
                } else if (val && typeof val === 'object') {
                    qty = val.qty || 0;
                    if (val.sizePrice !== undefined && val.sizePrice !== null) unitPrice = Number(val.sizePrice);
                }
                if (qty > 0) totalAmount += unitPrice * qty;
            }
        }
        return parseFloat(totalAmount.toFixed(2));
    };

    const value = {
        navigate,
        user,
        setUser,
        seller,
        setSeller,
        showUserLogin,
        setShowUserLogin,
        products,
        currency,
        addToCart,
        cartItems,
        setCartItems,
        updateCartItem,
        removeFromCart,
        searchQuery,
        setSearchQuery,
        getCartCount,
        getCartAmount,
        axios,
        fetchProducts,
        redirectPath,
        setRedirectPath,
        isProductsLoading,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    return useContext(AppContext);
};
