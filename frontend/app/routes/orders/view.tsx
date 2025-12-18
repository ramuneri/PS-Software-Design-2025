
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { apiFetch } from "../../api";

type OrderItem = {
    id: number;
    productId: number;
    quantity: number;
    itemTotal: number;
    productName?: string;
    productVariationName: string;
    serviceName?: string;
};

type OrderDetail = {
    id: number;
    customerIdentifier: string | null;
    openedAt?: string | null;
    createdAt?: string | null;
    closedAt: string | null;
    cancelledAt: string | null;
    employeeId: string | null;
    totalAmount: number;
    note: string | null;
    items: OrderItem[];
    status: number;
    taxBreakdown?: { taxCategoryId: number; categoryName: string; ratePercent: number; amount: number }[];
    subTotal?: number;
    tax?: number;
    payments?: { method: string; amount: number; currency: string }[];
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
            
            setOrder(data);
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
            const res = await apiFetch(`${import.meta.env.VITE_API_URL}/orders/${id}/cancel`, {
                method: "POST",
            });

            if (res.status === 401) return;
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
                                            <div className="bg-gray-200 rounded-md px-4 py-3 text-black min-h-20">
                                                {order.note || "-"}
                                            </div>
                                        </div>

                                        {/* Opened at */}
                                        <div className="space-y-2">
                                            <div className="text-gray-600 font-medium px-2">Opened at</div>
                                            <div className="bg-gray-200 rounded-md px-4 py-3 text-black">
                                                {formatDateTime(order.openedAt ?? order.createdAt ?? null)}
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
                                            {order.status !== 0 && (
                                                <button
                                                    onClick={() => navigate(`/orders/receipt/${order.id}`)}
                                                    className="mt-3 w-full bg-gray-800 text-white rounded-md py-2 hover:bg-gray-900 text-sm font-semibold"
                                                >
                                                    View receipt
                                                </button>
                                            )}
                                            {order.status !== 0 && order.payments && order.payments.length > 0 && (
                                                <div className="text-xs text-gray-700 space-y-1">
                                                    <div className="font-semibold">Payments</div>
                                                    {order.payments.map((p, idx) => (
                                                        <div key={idx} className="flex justify-between">
                                                            <span>{p.method}</span>
                                                            <span>{p.currency} {p.amount.toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
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
                                                        <div className="col-span-4 text-black">
                                                            <div className="font-medium">
                                                                {item.productName || item.serviceName || `Product #${item.productId}`}
                                                            </div>
                                                            {item.productVariationName && (
                                                                <div className="text-xs text-gray-600">
                                                                    + {item.productVariationName}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="col-span-2 text-black text-center">
                                                            {item.quantity}
                                                        </span>
                                                        <span className="col-span-3 text-black text-center">
                                                            ${item.itemTotal.toFixed(2)}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-gray-500 text-center py-8">
                                                    No items in this order
                                                </div>
                                            )}
                                        </div>

                                        {order.taxBreakdown && order.taxBreakdown.length > 0 && (
                                            <div className="mt-4 space-y-1 text-sm text-gray-800 px-4">
                                                <div className="flex justify-between font-medium">
                                                    <span>Subtotal</span>
                                                    <span>{order.subTotal?.toFixed(2) ?? ""}</span>
                                                </div>
                                                {order.taxBreakdown.map((t) => (
                                                    <div key={`${t.taxCategoryId}-${t.ratePercent}`} className="flex justify-between">
                                                        <span>{`VAT ${t.ratePercent}% (${t.categoryName || "Tax"})`}</span>
                                                        <span>{t.amount.toFixed(2)}</span>
                                                    </div>
                                                ))}
                                                <div className="flex justify-between font-semibold border-t border-gray-400 pt-1">
                                                    <span>Total</span>
                                                    <span>{order.totalAmount.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        )}
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
