
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";

type OrderItem = {
    id: number;
    productId: number;
    quantity: number;
    price: number;
    productName?: string;
};

type OrderDetail = {
    id: number;
    customerIdentifier: string | null;
    openedAt: string;
    closedAt: string | null;
    cancelledAt: string | null;
    employeeId: string | null;
    totalAmount: number;
    note: string | null;
    items: OrderItem[];
    status: number;
};

type Product = {
    id: number;
    name: string;
    price: number | null;
};

export default function OrderViewPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            loadOrder();
        }
    }, [id]);

    const loadOrder = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem("access-token");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/orders/${id}`, {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (!res.ok) throw new Error(`Failed to load order (${res.status})`);

            const data = await res.json();

            // Fetch product names for all items
            const itemsWithNames = await Promise.all(
                data.items.map(async (item: OrderItem) => {
                    try {
                        const productRes = await fetch(
                            `${import.meta.env.VITE_API_URL}/api/products/${item.productId}`,
                            {
                                headers: {
                                    "Content-Type": "application/json",
                                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                },
                            }
                        );

                        if (productRes.ok) {
                            const product: Product = await productRes.json();
                            return { ...item, productName: product.name };
                        }
                        return { ...item, productName: `Product #${item.productId}` };
                    } catch {
                        return { ...item, productName: `Product #${item.productId}` };
                    }
                })
            );

            setOrder({ ...data, items: itemsWithNames });
        } catch (err: any) {
            setError(err.message ?? "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace(',', '');
    };

    const isOpen = (o: OrderDetail) => o.status === 0;

    const handleCheckout = () => {
        navigate(`/orders/checkout/${id}`);
    };

    const handleCancel = async () => {
        if (!window.confirm("Are you sure you want to cancel this order?")) return;

        try {
            const token = localStorage.getItem("access-token");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}/cancel`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (!res.ok) throw new Error(`Failed to cancel order (${res.status})`);

            await loadOrder();
        } catch (err: any) {
            setError(err.message ?? "Unknown error");
        }
    };


    return (
        <div className="bg-gray-200 flex flex-col min-h-[calc(100vh-52px)] overflow-y-auto">
            <div className="p-6 flex-1 flex flex-col">
                <div className="space-y-6 flex-1 flex flex-col">
                    {/* Header */}
                    <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
                        Order {id}
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="bg-gray-300 rounded-md flex-1 flex items-center justify-center">
                            <div className="text-black">Loading order details...</div>
                        </div>
                    )}

                    {/* Order Details */}
                    {!loading && order && (
                        <>
                            <div className="bg-gray-300 rounded-md p-6 flex flex-col gap-6">
                                <div className="flex gap-6">
                                    {/* Left Side - Order Info */}
                                    <div className="w-1/2 space-y-4">
                                        {/* OrderID */}
                                        <div className="space-y-2">
                                            <div className="text-gray-600 font-medium px-2">OrderID</div>
                                            <div className="bg-gray-200 rounded-md px-4 py-3 text-black">
                                                {order.id}
                                            </div>
                                        </div>

                                        {/* Customer */}
                                        <div className="space-y-2">
                                            <div className="text-gray-600 font-medium px-2">Customer</div>
                                            <div className="bg-gray-200 rounded-md px-4 py-3 text-black">
                                                {order.customerIdentifier || "N/A"}
                                            </div>
                                        </div>

                                        {/* Note */}
                                        <div className="space-y-2">
                                            <div className="text-gray-600 font-medium px-2">Note</div>
                                            <div className="bg-gray-200 rounded-md px-4 py-3 text-black min-h-[80px]">
                                                {order.note || "-"}
                                            </div>
                                        </div>

                                        {/* Opened at */}
                                        <div className="space-y-2">
                                            <div className="text-gray-600 font-medium px-2">Opened at</div>
                                            <div className="bg-gray-200 rounded-md px-4 py-3 text-black">
                                                {formatDateTime(order.openedAt)}
                                            </div>
                                        </div>

                                        {/* Closed at */}
                                        <div className="space-y-2">
                                            <div className="text-gray-600 font-medium px-2">Closed at</div>
                                            <div className="bg-gray-200 rounded-md px-4 py-3 text-black">
                                                {formatDateTime(order.closedAt)}
                                            </div>
                                        </div>

                                        {/* Cancelled at */}
                                        <div className="space-y-2">
                                            <div className="text-gray-600 font-medium px-2">Cancelled at</div>
                                            <div className="bg-gray-200 rounded-md px-4 py-3 text-black">
                                                {formatDateTime(order.cancelledAt)}
                                            </div>
                                        </div>

                                        {/* EmployeeID */}
                                        <div className="space-y-2">
                                            <div className="text-gray-600 font-medium px-2">EmployeeID</div>
                                            <div className="bg-gray-200 rounded-md px-4 py-3 text-black">
                                                {order.employeeId || "N/A"}
                                            </div>
                                        </div>

                                        {/* Total */}
                                        <div className="space-y-2">
                                            <div className="text-gray-600 font-medium px-2">Total</div>
                                            <div className="bg-gray-200 rounded-md px-4 py-3 text-black font-medium">
                                                ${order.totalAmount.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side - Order Items */}
                                    <div className="w-1/2 flex flex-col">
                                        {/* Items Header */}
                                        <div className="bg-gray-400 rounded-md py-3 px-4 text-center text-white font-medium mb-4">
                                            Items
                                        </div>

                                        {/* Table Header */}
                                        <div className="grid grid-cols-9 gap-3 px-4 mb-3 text-black font-medium">
                                            <span className="col-span-4">Item name</span>
                                            <span className="col-span-2 text-center">Quantity</span>
                                            <span className="col-span-3 text-center">Total price</span>
                                        </div>

                                        {/* Items List - Scrollable */}
                                        <div className="space-y-3 overflow-y-auto flex-1">
                                            {order.items && order.items.length > 0 ? (
                                                order.items.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="grid grid-cols-9 gap-3 bg-gray-200 px-4 py-3 rounded-md items-center"
                                                    >
                                                        <span className="col-span-4 text-black">
                                                            {item.productName || `Product #${item.productId}`}
                                                        </span>
                                                        <span className="col-span-2 text-black text-center">
                                                            {item.quantity}
                                                        </span>
                                                        <span className="col-span-3 text-black text-center">
                                                            ${item.price.toFixed(2)}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-gray-500 text-center py-8">
                                                    No items in this order
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                {order && isOpen(order) && (
                                    <>
                                        <button
                                            onClick={handleCancel}
                                            className="flex-1 bg-gray-300 hover:bg-red-300 rounded-md py-3 text-black font-medium"
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            onClick={() => navigate(`/orders/edit/${id}`)}
                                            className="flex-1 bg-gray-300 hover:bg-gray-400 rounded-md py-3 text-black font-medium"
                                        >
                                            Modify
                                        </button>

                                        <button
                                            onClick={handleCheckout}
                                            className="flex-1 bg-gray-300 hover:bg-blue-300 rounded-md py-3 text-black font-medium"
                                        >
                                            Checkout
                                        </button> 
                                    </>
                                )}

                                {order && !isOpen(order) && (
                                    <div className="flex-1 bg-gray-200 rounded-md py-3 text-center text-gray-600 font-medium">
                                        This order is {order.status === 1 ? "closed" : order.status === 2 ? "cancelled" : "not editable"}.
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Not Found State */}
                    {!loading && !order && !error && (
                        <div className="bg-gray-300 rounded-md flex-1 flex items-center justify-center">
                            <div className="text-gray-500">Order not found</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
