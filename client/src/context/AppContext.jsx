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

    // Add Product to Cart with Size and Color
    const addToCart = (itemId, size = null, color = null) => {
        let cartData = structuredClone(cartItems);
        let cartKey = itemId;
        if (size) cartKey += `-${size}`;
        if (color) cartKey += `-${color}`;

        if (cartData[cartKey]) {
            cartData[cartKey] += 1;
        } else {
            cartData[cartKey] = 1;
        }
        setCartItems(cartData);
        toast.success("Added to Cart");
    };

    // Update Cart Item Quantity
    const updateCartItem = (itemId, quantity) => {
        let cartData = structuredClone(cartItems);
        cartData[itemId] = quantity;
        setCartItems(cartData);
        toast.success("Cart Updated");
    };

    // Remove Product from Cart
    const removeFromCart = (cartKey) => {
        let cartData = structuredClone(cartItems);
        if (cartData[cartKey]) {
            cartData[cartKey] -= 1;
            if (cartData[cartKey] === 0) {
                delete cartData[cartKey];
            }
        }
        toast.success("Remove from Cart");
        setCartItems(cartData);
    };

    // Get Cart Item Count
    const getCartCount = () => {
        let totalCount = 0;
        for (const item in cartItems) {
            totalCount += cartItems[item];
        }
        return totalCount;
    };

    // Get Cart Total Amount
    const getCartAmount = () => {
        let totalAmount = 0;
        for (const items in cartItems) {
            // Extract product ID from cartKey (format: "productId" or "productId-size")
            const productId = items.split("-").slice(0, -1).join("-") || items.split("-")[0];
            let itemInfo = products.find((product) => product._id === productId || product._id === items);
            
            // Try to find by the original items key first (for backward compatibility)
            if (!itemInfo) {
                itemInfo = products.find((product) => product._id === items);
            }
            
            if (itemInfo && cartItems[items] > 0) {
                totalAmount += itemInfo.offerPrice * cartItems[items];
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
