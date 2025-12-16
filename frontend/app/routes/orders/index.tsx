
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

type Order = {
    id: number;
    customerIdentifier: string | null;
    openedAt?: string | null;
    createdAt?: string | null;
    closedAt: string | null;
    cancelledAt: string | null;
    totalAmount: number;
    status?: number;
};

export default function OrdersListPage() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false);

    const statusLabel = (o: Order) => {
        if (typeof o.status === "number") {
            return o.status === 0 ? "Open"
                : o.status === 1 ? "Closed"
                    : o.status === 2 ? "Cancelled"
                        : o.status === 3 ? "Refunded"
                            : "Unknown";
        }

        //fallback
        if (o.cancelledAt) return "Cancelled";
        if (o.closedAt) return "Closed";
        return "Open";
    };

    const isOpen = (o: Order) => statusLabel(o) === "Open";

    const visibleOrders = showAll ? orders : orders.filter(isOpen);


    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem("access-token");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/orders`, {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (!res.ok) throw new Error(`Failed to load orders (${res.status})`);

            const data = await res.json();
            setOrders(data);
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

    const handleCreateOrder = () => {
        navigate("/orders/create");
    };

    const handleOrderClick = (orderId: number) => {
        navigate(`/orders/view/${orderId}`);
    };

    return (
        <div className="bg-gray-200 flex flex-col" style={{ height: "calc(100vh - 52px)" }}>
            <div className="p-6 flex-1 flex flex-col overflow-hidden">
                <div className="space-y-6 flex-1 flex flex-col">
                    {/* Header */}
                    <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
                        Orders
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            id="showAllOrders"
                            type="checkbox"
                            checked={showAll}
                            onChange={(e) => setShowAll(e.target.checked)}
                            className="h-4 w-4"
                        />
                        <label htmlFor="showAllOrders" className="text-gray-700 font-medium">
                            Show all
                        </label>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    {/* Table Container */}
                    <div className="bg-gray-300 rounded-md flex-1 flex flex-col overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-4 text-gray-600 font-medium border-b border-gray-400">
                            <span className="col-span-2">OrderID</span>
                            <span className="col-span-3">Customer</span>
                            <span className="col-span-3">Opened at</span>
                            <span className="col-span-2 text-center">Status</span>
                            <span className="col-span-2 text-right">Total</span>
                        </div>

                        {/* Table Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {loading && (
                                <div className="text-black text-center py-8">
                                    Loading orders...
                                </div>
                            )}

                            {!loading && orders.length === 0 && (
                                <div className="text-gray-500 text-center py-8">
                                    No orders found
                                </div>
                            )}

                            <div className="space-y-3">
                                {!loading && visibleOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        onClick={() => handleOrderClick(order.id)}
                                        className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-200 rounded-md items-center cursor-pointer hover:bg-gray-400 transition-colors"
                                    >
                                        <span className="col-span-2 text-black">{order.id}</span>
                                        <span className="col-span-3 text-black">
                                            {order.customerIdentifier || "N/A"}
                                        </span>
                                        <span className="col-span-3 text-black">
                                            {formatDateTime(order.openedAt ?? order.createdAt ?? null)}
                                        </span>
                                        <span className="col-span-2 text-black text-center">
                                            {statusLabel(order)}
                                        </span>
                                        <span className="col-span-2 text-black text-right">
                                            ${order.totalAmount.toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Create Button */}
                    <div className="w-64">
                        <button
                            onClick={handleCreateOrder}
                            className="w-full bg-gray-300 hover:bg-gray-400 rounded-md py-3 text-black font-medium"
                            disabled={loading}
                        >
                            Create
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
