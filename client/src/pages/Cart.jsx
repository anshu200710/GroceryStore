import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { assets, dummyAddress } from "../assets/assets";
import toast from "react-hot-toast";
import Login from "../components/Login";

const Cart = () => {
    const {
        products,
        currency,
        cartItems,
        setCartItems,
        removeFromCart,
        getCartCount,
        updateCartItem,
        navigate,
        getCartAmount,
        axios,
        user,
    } = useAppContext();
    const [cartArray, setCartArray] = useState([]);
    const [addresses, setAddress] = useState([]);
    const [showAddress, setShowAddress] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [paymentOption, setPaymentOption] = useState("COD");
    const [loading, setLoading] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const getCart = () => {
        let tempArray = [];
        for (const key in cartItems) {
            // Robust parsing: cartKey can be "productId" or "productId-size" where size may be arbitrary (numeric or text)
            const parts = key.split("-");
            let productId = key; // default assume whole key is product id
            let size = null;

            if (parts.length > 1) {
                // candidate id is everything except the last part
                const candidateId = parts.slice(0, -1).join("-");
                const candidateProduct = products.find((item) => item._id === candidateId);
                if (candidateProduct) {
                    productId = candidateId;
                    size = parts.slice(-1)[0];
                }
            }

            // Fallbacks: try matching full key as id (backwards compatibility)
            let product = products.find((item) => item._id === productId);
            if (!product) {
                product = products.find((item) => item._id === key);
            }

            if (product) {
                const cartItem = { ...product };
                cartItem.quantity = cartItems[key];
                cartItem.cartKey = key;
                cartItem.size = size;
                tempArray.push(cartItem);
            }
        }
        setCartArray(tempArray);
    };



    const getUserAddresses = async () => {
        try {
            const { data } = await axios.get("/address/get");

            if (data.success) {
                setAddress(data.addresses);
                if (data.addresses.length > 0) {
                    setSelectedAddress(data.addresses[0]);
                }
            }
        } catch (error) {
            if (error.response && error.response.data) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Something went wrong");
            }
        }
    };

    const placeOrder = async () => {
        try {
            if (!selectedAddress) {
                toast("Please Select an Address", {
                    style: {
                        background: "#2d9cdb",
                        color: "#fff",
                    },
                });
                return;
            }
            setLoading(true);

            // Place Order with COD
            if (paymentOption === "COD") {
                const { data } = await axios.post("/order/cod", {
                    items: cartArray.map((item) => ({
                        product: item._id,
                        quantity: item.quantity,
                        size: item.size || null,
                    })),
                    address: selectedAddress._id,
                });

                if (data.success) {
                    toast.success(data.message);
                    setCartItems({});
                    navigate("/my-orders");
                }
            } else {
                // Place order with Stripe
                const { data } = await axios.post("/order/stripe", {
                    items: cartArray.map((item) => ({
                        product: item._id,
                        quantity: item.quantity,
                        size: item.size || null,
                    })),
                    address: selectedAddress._id,
                });

                if (data.success) {
                    window.location.replace(data.url);
                }
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

    useEffect(() => {
        if (products.length > 0 && cartItems) {
            getCart();
        }
    }, [products, cartItems]);

    useEffect(() => {
        if (user) {
            getUserAddresses();
        }
    }, [user]);

    return (
        <>
            {showLoginModal && (
                <Login 
                    setShowLogin={setShowLoginModal} 
                    onLoginSuccess={() => setShowLoginModal(false)}
                />
            )}
            {products.length > 0 && cartItems ? (
                <div className="flex flex-col md:flex-row mt-16">
                    <div className="flex-1 max-w-4xl">
                <h1 className="text-3xl font-medium mb-6">
                    Shopping Cart{" "}
                    <span className="text-sm text-primabg-primary">
                        {getCartCount()} Items
                    </span>
                </h1>

                <div className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 text-base font-medium pb-3">
                    <p className="text-left">Product Details</p>
                    <p className="text-center">Subtotal</p>
                    <p className="text-center">Action</p>
                </div>

                {cartArray.map((product, index) => (
                    <div
                        key={index}
                        className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 items-center text-sm md:text-base font-medium pt-3"
                    >
                        <div className="flex items-center md:gap-6 gap-3">
                            <div
                                onClick={() => {
                                    navigate(
                                        `/products/${product.category.toLowerCase()}/${
                                            product._id
                                        }`
                                    );
                                    scrollTo(0, 0);
                                }}
                                className="cursor-pointer w-24 h-24 flex items-center justify-center border border-gray-300 rounded"
                            >
                                <img
                                    className="max-w-full h-full object-cover"
                                    src={product.image[0]}
                                    alt={product.name}
                                />
                            </div>
                            <div>
                                <p className="hidden md:block font-semibold">
                                    {product.name}
                                </p>
                                <div className="font-normal text-gray-500/70">
                                    {product.size && (
                                        <div className="flex items-center">
                                            <p>Size:</p>
                                            <span className="ml-2 font-medium">{String(product.size).replace("_", " ")}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center">
                                        <p>Qty:</p>
                                        <select
                                            onChange={(e) =>
                                                updateCartItem(
                                                    product.cartKey,
                                                    Number(e.target.value)
                                                )
                                            }
                                            value={cartItems[product.cartKey]}
                                            className="outline-none border border-gray-300 rounded px-2 py-1 ml-1"
                                        >
                                            {Array(
                                                cartItems[product.cartKey] > 9
                                                    ? cartItems[product.cartKey]
                                                    : 9
                                            )
                                                .fill("")
                                                .map((_, index) => (
                                                    <option
                                                        key={index}
                                                        value={index + 1}
                                                    >
                                                        {index + 1}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-center">
                            {currency}
                            {parseFloat(
                                (product.offerPrice * product.quantity).toFixed(
                                    2
                                )
                            )}
                        </p>
                        <button
                            onClick={() => removeFromCart(product.cartKey)}
                            className="cursor-pointer mx-auto"
                        >
                            <img
                                src={assets.remove_icon}
                                alt="remove"
                                className="inline-block w-6 h-6"
                            />
                        </button>
                    </div>
                ))}

                <button
                    onClick={() => {
                        navigate("/products");
                        scrollTo(0, 0);
                    }}
                    className="group cursor-pointer flex items-center mt-8 gap-2 text-primabg-primary font-medium"
                >
                    <img
                        className="group-hover:-translate-x-1 transition"
                        src={assets.arrow_right_icon_colored}
                        alt="arrow"
                    />
                    Continue Shopping
                </button>
            </div>

            <div className="max-w-[360px] w-full bg-gray-100/40 p-5 max-md:mt-16 border border-gray-300/70">
                <h2 className="text-xl md:text-xl font-medium">
                    Order Summary
                </h2>
                <hr className="border-gray-300 my-5" />

                <div className="mb-6">
                    <p className="text-sm font-medium uppercase">
                        Delivery Address
                    </p>
                    <div className="relative flex justify-between items-start mt-2">
                        <p className="text-gray-500">
                            {selectedAddress
                                ? `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state}, ${selectedAddress.country}`
                                : "No address found"}
                        </p>
                        <button
                            onClick={() => setShowAddress(!showAddress)}
                            className="text-primary hover:underline cursor-pointer"
                        >
                            Change
                        </button>
                        {showAddress && (
                            <div className="absolute top-12 py-1 bg-white border border-gray-300 text-sm w-full">
                                {addresses.map((address, index) => (
                                    <p
                                        key={index}
                                        onClick={() => {
                                            setSelectedAddress(address);
                                            setShowAddress(false);
                                        }}
                                        className="text-gray-500 p-2 hover:bg-gray-100"
                                    >
                                        {address.street}, {address.city},{" "}
                                        {address.state}, {address.country}
                                    </p>
                                ))}
                                <p
                                    onClick={() => {
                                        if (!user) {
                                            setShowLoginModal(true);
                                            setShowAddress(false);
                                        } else {
                                            navigate("/add-address");
                                        }
                                    }}
                                    className="text-primabg-primary text-center cursor-pointer p-2 hover:bg-primary/10"
                                >
                                    Add address
                                </p>
                            </div>
                        )}
                    </div>

                    <p className="text-sm font-medium uppercase mt-6">
                        Payment Method
                    </p>

                    <select
                        onChange={(e) => setPaymentOption(e.target.value)}
                        className="w-full border border-gray-300 bg-white px-3 py-2 mt-2 outline-none"
                    >
                        <option value="COD">Cash On Delivery</option>
                        {/* <option value="Online">Online Payment</option> */}
                    </select>
                </div>

                <hr className="border-gray-300" />

                <div className="text-gray-500 mt-4 space-y-2">
                    <p className="flex justify-between">
                        <span>Price</span>
                        <span>
                            {currency}
                            {getCartAmount()}
                        </span>
                    </p>
                    <p className="flex justify-between">
                        <span>Shipping Fee</span>
                        <span className="text-green-600">Free</span>
                    </p>
                    <p className="flex justify-between text-lg font-medium mt-3">
                        <span>Total Amount:</span>
                        <span>
                            {currency}
                            {parseFloat(getCartAmount().toFixed(2))}
                        </span>
                    </p>
                </div>

                {user ? (
                    <button
                        onClick={placeOrder}
                        disabled={loading}
                        className={`w-full py-3 mt-6 cursor-pointer bg-primary text-white font-medium hover:bg-primary-dull transition ${
                            loading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                    >
                        {loading
                            ? "Processing..."
                            : paymentOption === "COD"
                            ? "Place Order"
                            : "Proceed to Checkout"}
                    </button>
                ) : (
                    <button
                        disabled
                        className="w-full py-3 mt-6 bg-gray-300 text-gray-600 font-medium cursor-not-allowed"
                    >
                        Login to proceed
                    </button>
                )}
            </div>
        </div>
            ) : (
                <div className="mt-16 text-center text-gray-500">
                    Your cart is empty.
                </div>
            )}
        </>
    );
};

export default Cart;
