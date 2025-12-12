
import { useState } from "react";
import {useNavigate} from "react-router";

type OrderItem = {
    productId: number;
    itemName: string;
    quantity: number;
    totalPrice: number;
};

type Product = {
    id: number;
    name: string;
    price: number | null;
    category: string | null;
    isActive: boolean;
};

export default function CreateOrderPage() {
    const navigate = useNavigate();
    const [customer, setCustomer] = useState("");
    const [note, setNote] = useState("");
    const [items, setItems] = useState<OrderItem[]>([]);
    const [showInventory, setShowInventory] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadProducts = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem("access-token");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products`, {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (!res.ok) throw new Error(`Failed to load products (${res.status})`);

            const data = await res.json();
            setProducts(data.data);
        } catch (err: any) {
            setError(err.message ?? "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            setLoading(true);
            setError(null);

            if (items.length === 0) {
                setError("At least one item is required");
                return;
            }

            const token = localStorage.getItem("access-token");

            const orderData = {
                customerIdentifier: customer,
                employeeId: "4bed74b1-0fe3-4c57-98c0-03c187acdbf6", // TODO
                items: items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                })),
                note: note
            };

            console.log("Sending order data:", orderData);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(orderData)
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error("Error response:", errorText);
                throw new Error(`Failed to create order (${res.status})`);
            }

            const createdOrder = await res.json();
            console.log("Created order:", createdOrder);

            navigate("/orders/view");
        } catch (err: any) {
            setError(err.message ?? "Failed to create order");
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async () => {
        setShowInventory(true);
        await loadProducts();
    };

    const handleDeleteItem = (productId: number) => {
        const item = items.find((item) => item.productId === productId);
        if (item && item.quantity === 1) {
            setItems(items.filter((item) => item.productId !== productId));
        } else if (item) {
            setItems(
                items.map((i) =>
                    i.productId === productId ? { ...i, quantity: i.quantity - 1, totalPrice: (i.quantity - 1) * (i.totalPrice / i.quantity) } : i
                )
            );
        }
    };

    const handleSelectProduct = (product: Product) => {
        // Check if item already exists
        const existingItem = items.find(
            (item) => item.productId === product.id
        );

        if (existingItem) {
            // Increment quantity
            setItems(
                items.map((item) =>
                    item.productId === product.id
                        ? {
                            ...item,
                            quantity: item.quantity + 1,
                            totalPrice: (item.quantity + 1) * (product.price || 0),
                        }
                        : item
                )
            );
        } else {
            // Add new item
            setItems([
                ...items,
                {
                    productId: product.id,
                    itemName: product.name,
                    quantity: 1,
                    totalPrice: product.price || 0,
                },
            ]);
        }
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2);
    };

    return (
        <div className="bg-gray-200 flex flex-col" style={{ height: "calc(100vh - 52px)" }}>
            {/* Main Content */}
            <div className="p-6 flex-1 flex flex-col overflow-hidden">
                <div className="space-y-6 flex-1 flex flex-col">
                    <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
                        Create Order
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    {/* Content Grid - Left side details/inventory, Right side items */}
                    <div className="grid grid-cols-2 gap-6 flex-1">
                        {/* Left Side - Order Details OR Inventory */}
                        {!showInventory ? (
                            <div className="bg-gray-300 rounded-md p-8 space-y-8">
                                <div className="space-y-4">
                                    <label className="block text-black font-medium">Customer</label>
                                    <input
                                        type="text"
                                        value={customer}
                                        onChange={(e) => setCustomer(e.target.value)}
                                        className="w-full bg-gray-400 rounded-md px-4 py-3 text-black focus:outline-none"
                                        placeholder="Table 1"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-black font-medium">Note</label>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        className="w-full bg-gray-400 rounded-md px-4 py-3 text-black focus:outline-none resize-none"
                                        placeholder="Add special instructions or notes..."
                                        rows={4}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-black font-medium">Total</label>
                                    <div className="bg-gray-400 rounded-md px-4 py-3 text-white">
                                        ${calculateTotal()}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-300 rounded-md p-6 flex flex-col overflow-hidden">
                                {/* Inventory Header */}
                                <div className="text-center text-black font-medium mb-4">
                                    Inventory
                                </div>

                                {/* Table Header */}
                                <div className="grid grid-cols-12 gap-2 px-2 text-black font-medium text-sm mb-3">
                                    <span className="col-span-2">ItemID</span>
                                    <span className="col-span-4">Name</span>
                                    <span className="col-span-2 text-center">Units</span>
                                    <span className="col-span-3 text-center">Price</span>
                                    <span className="col-span-1 text-center">Add</span>
                                </div>

                                {/* Product Rows - Scrollable */}
                                <div className="space-y-2 overflow-y-auto flex-1 mb-4">
                                    {loading && (
                                        <div className="text-black text-center py-8">
                                            Loading products…
                                        </div>
                                    )}

                                    {error && (
                                        <div className="text-red-600 text-center py-8">
                                            Failed to load products: {error}
                                        </div>
                                    )}

                                    {!loading && !error && products.length > 0 && products.map((product) => (
                                        <div
                                            key={product.id}
                                            className="grid grid-cols-12 gap-2 bg-gray-400 px-2 py-2 rounded-md items-center text-sm"
                                        >
                                            <span className="col-span-2 text-black">{product.id}</span>
                                            <span className="col-span-4 text-black">{product.name}</span>
                                            <span className="col-span-2 text-black text-center">-</span>
                                            <span className="col-span-3 text-black text-center">
                                                {product.price != null ? `$${product.price}` : "-"}
                                            </span>
                                            <button
                                                onClick={() => handleSelectProduct(product)}
                                                className="col-span-1 flex justify-center hover:opacity-70"
                                            >
                                                <span className="text-xl text-black">+</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Back Button */}
                                <button
                                    onClick={() => setShowInventory(false)}
                                    className="w-full bg-gray-400 hover:bg-gray-500 rounded-md py-2 text-black font-medium"
                                >
                                    Back
                                </button>
                            </div>
                        )}

                        {/* Right Side - Items */}
                        <div className="space-y-4 flex flex-col">
                            {/* Items Header */}
                            <div className="bg-gray-400 rounded-md py-3 px-4 text-center text-white font-medium">
                                Items
                            </div>

                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-3 px-4 text-white font-medium">
                                <span className="col-span-4 text-black">Item name</span>
                                <span className="col-span-3 text-center text-black">Quantity</span>
                                <span className="col-span-3 text-center text-black">Total price</span>
                                <span className="col-span-2 text-center text-black">Delete</span>
                            </div>

                            {/* Table Rows - Scrollable */}
                            <div className="space-y-3 overflow-y-auto flex-1">
                                {items.length === 0 && (
                                    <div className="text-center text-gray-500 py-8">
                                        No items added yet
                                    </div>
                                )}
                                {items.map((item) => (
                                    <div
                                        key={item.productId}
                                        className="grid grid-cols-12 gap-3 bg-gray-300 px-4 py-3 rounded-md items-center"
                                    >
                                        <span className="col-span-4 text-black">{item.itemName}</span>
                                        <span className="col-span-3 text-black text-center">{item.quantity}</span>
                                        <span className="col-span-3 text-black text-center">${item.totalPrice.toFixed(2)}</span>
                                        <button
                                            onClick={() => handleDeleteItem(item.productId)}
                                            className="col-span-2 flex justify-center hover:opacity-70"
                                        >
                                            <svg
                                                className="w-6 h-6"
                                                fill="black"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Buttons */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* Left buttons */}
                        <div className="flex gap-6">
                            <button
                                className="flex-1 bg-gray-300 hover:bg-gray-400 rounded-md py-3 text-black font-medium disabled:opacity-50"
                                onClick={handleCreate}
                                disabled={loading || items.length === 0}
                            >
                                {loading ? "Creating..." : "Create"}
                            </button>
                            <button
                                className="flex-1 bg-gray-300 hover:bg-gray-400 rounded-md py-3 text-black font-medium"
                                onClick={() => navigate("/")}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                        </div>

                        {/* Right button */}
                        <div>
                            <button
                                onClick={handleAddItem}
                                className="w-full bg-gray-300 hover:bg-gray-400 rounded-md py-3 text-black font-medium"
                                disabled={loading}
                            >
                                Add item
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
