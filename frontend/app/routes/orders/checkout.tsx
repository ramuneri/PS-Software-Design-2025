import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

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
    status: number; // 0 open, 1 closed, 2 cancelled
    subTotal?: number;
    tax?: number;
};

export default function OrderCheckoutPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) loadOrder();
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

    const isOpen = (o: OrderDetail) => o.status === 0;

    const handleClose = async () => {
        if (!id) return;
        try {
            const token = localStorage.getItem("access-token");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}/close`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (!res.ok) throw new Error(`Failed to close order (${res.status})`);

            navigate(`/orders/view/${id}`);
        } catch (err: any) {
            setError(err.message ?? "Unknown error");
        }
    };

    return (
        <div className="bg-gray-200 flex flex-col min-h-[calc(100vh-52px)] overflow-y-auto">
            <div className="p-6 flex-1 flex flex-col space-y-6">
                <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
                    Checkout Order {id}
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="bg-gray-300 rounded-md flex-1 flex items-center justify-center">
                        <div className="text-black">Loading checkout...</div>
                    </div>
                )}

                {!loading && order && (
                    <div className="bg-gray-300 rounded-md p-6 flex flex-col gap-6">
                        <div className="flex gap-6">
                            <div className="w-1/2">
                                <div className="text-gray-700 font-medium mb-2">Summary</div>
                                <div className="bg-gray-200 rounded-md p-4 space-y-2">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>${(order.subTotal ?? order.totalAmount).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Tax</span>
                                        <span>${(order.tax ?? 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-medium">
                                        <span>Total</span>
                                        <span>${order.totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-1/2">
                                <div className="text-gray-700 font-medium mb-2">Items</div>
                                <div className="bg-gray-200 rounded-md p-4 space-y-2">
                                    {order.items?.length ? (
                                        order.items.map((it) => (
                                            <div key={it.id} className="flex justify-between">
                                                <span>{it.productName ?? `Product #${it.productId}`} x{it.quantity}</span>
                                                <span>${it.price.toFixed(2)}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-gray-500">No items</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {isOpen(order) ? (
                            <div className="flex gap-4">
                                <button
                                    onClick={() => navigate(`/orders/view/${id}`)}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 rounded-md py-3 text-black font-medium"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="flex-1 bg-gray-200 hover:bg-green-300 rounded-md py-3 text-black font-medium"
                                >
                                    Pay & Close
                                </button>
                            </div>
                        ) : (
                            <div className="bg-gray-200 rounded-md py-3 text-center text-gray-600 font-medium">
                                This order is not open and cannot be checked out.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
