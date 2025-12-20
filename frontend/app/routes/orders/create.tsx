
import { useState } from "react";
import {useNavigate} from "react-router";
import { apiFetch } from "../../api";

type OrderItem = {
    productId: number;
    itemName: string;
    quantity: number;
    totalPrice: number;
    variationId?: number;
    variationName?: string;
};

type Product = {
    id: number;
    name: string;
    price: number | null;
    category: string | null;
    isActive: boolean;
};

type ProductVariation = {
    id: number;
    productId: number;
    name: string;
    priceAdjustment: number;
};

function getEmployeeIdFromToken(): string | null {
    const token = localStorage.getItem("access-token");
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return (
            payload[
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
                ] || payload.sub || null
        );
    } catch {
        return null;
    }
}

export default function CreateOrderPage() {
    const navigate = useNavigate();
    const [customer, setCustomer] = useState("");
    const [note, setNote] = useState("");
    const [items, setItems] = useState<OrderItem[]>([]);
    const [showInventory, setShowInventory] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [productsError, setProductsError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    
    const [showVariationModal, setShowVariationModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [variations, setVariations] = useState<ProductVariation[]>([]);
    const [selectedVariation, setSelectedVariation] = useState<number | null>(null);
    const [loadingVariations, setLoadingVariations] = useState(false);

    const loadProducts = async () => {
        try {
            setLoading(true);
            setProductsError(null);

            const res = await apiFetch(`${import.meta.env.VITE_API_URL}/api/products`);
            if (res.status === 401) return;

            if (!res.ok) throw new Error(`Failed to load products (${res.status})`);

            const data = await res.json();
            setProducts(data.data);
        } catch (err: any) {
            setProductsError(err.message ?? "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    const loadVariations = async (productId: number) => {
        try {
            setLoadingVariations(true);
            const res = await apiFetch(
                `${import.meta.env.VITE_API_URL}/api/products/${productId}/variations`
            );
            if (res.status === 401) return;

            if (!res.ok) throw new Error(`Failed to load variations (${res.status})`);

            const data = await res.json();
            const variationData = Array.isArray(data.data) ? data.data : data.data?.data || [];
            setVariations(variationData);
        } catch (err: any) {
            console.error("Failed to load variations:", err);
            setVariations([]);
        } finally {
            setLoadingVariations(false);
        }
    };

    const handleCreate = async () => {
        try {
            setLoading(true);
            setSubmitError(null);

            if (items.length === 0) {
                setSubmitError("At least one item is required");
                return;
            }

            const orderData = {
                customerIdentifier: customer,
                employeeId: getEmployeeIdFromToken(),
                items: items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    productVariationId: item.variationId || null,
                })),
                note: note
            };

            console.log("Sending order data:", orderData);

            const res = await apiFetch(`${import.meta.env.VITE_API_URL}/orders`, {
                method: "POST",
                body: JSON.stringify(orderData)
            });
            if (res.status === 401) return;

            if (!res.ok) {
                const errorText = await res.text();
                console.error("Error response:", errorText);
                throw new Error(`Failed to create order (${res.status})`);
            }

            const createdOrder = await res.json();
            console.log("Created order:", createdOrder);

            navigate("/orders/view");
        } catch (err: any) {
            setSubmitError(err.message ?? "Failed to create order");
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async () => {
        setSubmitError(null);
        setShowInventory(true);
        await loadProducts();
    };

    const handleDeleteItem = (productId: number, variationId?: number) => {
        const item = items.find((item) =>
            item.productId === productId && item.variationId === variationId
        );
        if (item && item.quantity === 1) {
            setItems(items.filter((item) =>
                !(item.productId === productId && item.variationId === variationId)
            ));
        } else if (item) {
            setItems(
                items.map((i) =>
                    i.productId === productId && i.variationId === variationId
                        ? { ...i, quantity: i.quantity - 1, totalPrice: (i.quantity - 1) * (i.totalPrice / i.quantity) }
                        : i
                )
            );
        }
    };

    const handleSelectProduct = async (product: Product) => {
        setSelectedProduct(product);
        await loadVariations(product.id);
        setShowVariationModal(true);
        setSelectedVariation(null);
    };

    const handleConfirmVariation = () => {
        if (!selectedProduct) return;

        const variation = selectedVariation
            ? variations.find(v => v.id === selectedVariation)
            : null;

        const basePrice = selectedProduct.price || 0;
        const adjustedPrice = variation ? variation.priceAdjustment : basePrice;
        
        const existingItem = items.find(
            (item) => item.productId === selectedProduct.id && item.variationId === selectedVariation
        );

        if (existingItem) {
            setItems(
                items.map((item) =>
                    item.productId === selectedProduct.id && item.variationId === selectedVariation
                        ? {
                            ...item,
                            quantity: item.quantity + 1,
                            totalPrice: (item.quantity + 1) * adjustedPrice,
                        }
                        : item
                )
            );
        } else {
            setItems([
                ...items,
                {
                    productId: selectedProduct.id,
                    itemName: selectedProduct.name,
                    quantity: 1,
                    totalPrice: adjustedPrice,
                    variationId: selectedVariation || undefined,
                    variationName: variation?.name || undefined,
                },
            ]);
        }

        setShowVariationModal(false);
        setSelectedProduct(null);
        setSelectedVariation(null);
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2);
    };

    return (
        <div className="bg-gray-100 flex flex-col min-h-[calc(100vh-52px)] overflow-y-auto">
            {/* Variation Modal */}
            {showVariationModal && selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl w-[500px] max-w-[90vw] p-6 space-y-4">
                        <div className="text-center">
                            <div className="text-lg font-semibold text-gray-800">
                                {selectedProduct.name}
                            </div>
                            <div className="text-sm text-gray-600">
                                Select variation (optional)
                            </div>
                        </div>

                        {loadingVariations ? (
                            <div className="text-center py-8 text-gray-600">
                                Loading variations...
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {/* No variation option */}
                                <button
                                    onClick={() => setSelectedVariation(null)}
                                    className={`w-full text-left px-4 py-3 rounded-md border-2 transition-colors ${
                                        selectedVariation === null
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-300 bg-white hover:bg-gray-50"
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-gray-800">
                                            No variation
                                        </span>
                                        <span className="text-gray-600">
                                            ${(selectedProduct.price || 0).toFixed(2)}
                                        </span>
                                    </div>
                                </button>

                                {/* Variation options */}
                                {variations.map((variation) => (
                                    <button
                                        key={variation.id}
                                        onClick={() => setSelectedVariation(variation.id)}
                                        className={`w-full text-left px-4 py-3 rounded-md border-2 transition-colors ${
                                            selectedVariation === variation.id
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-gray-300 bg-white hover:bg-gray-50"
                                        }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="font-medium text-gray-800">
                                                    {variation.name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Price: ${variation.priceAdjustment.toFixed(2)}
                                                </div>
                                            </div>
                                            <span className="text-gray-600 font-medium">
                                                ${variation.priceAdjustment.toFixed(2)}
                                            </span>
                                        </div>
                                    </button>
                                ))}

                                {variations.length === 0 && (
                                    <div className="text-center py-4 text-gray-500 text-sm">
                                        No variations available
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => {
                                    setShowVariationModal(false);
                                    setSelectedProduct(null);
                                    setSelectedVariation(null);
                                }}
                                className="flex-1 px-4 py-2 rounded-md bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmVariation}
                                className="flex-1 px-4 py-2 rounded-md bg-blue-500 text-white font-semibold hover:bg-blue-600"
                            >
                                Add to Order
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="p-6 flex-1 flex flex-col overflow-hidden">
                <div className="space-y-6 flex-1 flex flex-col">
                    <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
                        Create Order
                    </div>

                    {/* Error Display */}
                    {submitError && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {submitError}
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
                                        className="w-full bg-gray-200 rounded-md px-4 py-3 text-black focus:outline-none"
                                        placeholder="Table 1"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-black font-medium">Note</label>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        className="w-full bg-gray-200 rounded-md px-4 py-3 text-black focus:outline-none resize-none"
                                        placeholder="Add special instructions or notes..."
                                        rows={4}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-black font-medium">Total</label>
                                    <div className="bg-gray-200 rounded-md px-4 py-3 text-black font-semibold">
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

                                    {productsError && (
                                        <div className="text-red-600 text-center py-8">
                                            Failed to load products: {productsError}
                                        </div>
                                    )}

                                    {!loading && !productsError && products.length > 0 && products.map((product) => (
                                        <div
                                            key={product.id}
                                            className="grid grid-cols-12 gap-2 bg-gray-200 px-2 py-2 rounded-md items-center text-sm"
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
                        <div className="space-y-4 flex flex-col text-black">
                            {/* Items Header */}
                            <div className="bg-gray-300 rounded-md py-3 px-4 text-center  font-medium">
                                Items
                            </div>

                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-3 px-4 text-black font-medium">
                                <span className="col-span-5">Item name</span>
                                <span className="col-span-2 text-center">Quantity</span>
                                <span className="col-span-3 text-center">Total price</span>
                                <span className="col-span-2 text-center">Delete</span>
                            </div>

                            {/* Table Rows - Scrollable */}
                            <div className="space-y-3 overflow-y-auto flex-1">
                                {items.length === 0 && (
                                    <div className="text-center text-gray-500 py-8">
                                        No items added yet
                                    </div>
                                )}
                                {items.map((item, index) => (
                                    <div
                                        key={`${item.productId}-${item.variationId || 'none'}-${index}`}
                                        className="grid grid-cols-12 gap-3 bg-gray-300 px-4 py-3 rounded-md items-center"
                                    >
                                        <div className="col-span-5 text-black">
                                            <div className="font-medium">{item.itemName}</div>
                                            {item.variationName && (
                                                <div className="text-xs text-gray-600">
                                                    + {item.variationName}
                                                </div>
                                            )}
                                        </div>
                                        <span className="col-span-2 text-black text-center">{item.quantity}</span>
                                        <span className="col-span-3 text-black text-center">${item.totalPrice.toFixed(2)}</span>
                                        <button
                                            onClick={() => handleDeleteItem(item.productId, item.variationId)}
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
