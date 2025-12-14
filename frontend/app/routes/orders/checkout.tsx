import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";

type OrderItemDetail = {
    orderItemId: number;
    productId?: number;
    serviceId?: number;
    quantity: number;
    productName?: string;
    serviceName?: string;
    price?: number;
    defaultPrice?: number;
};

type PaymentDetail = {
    paymentId: number;
    orderId: number;
    method: string;
    amount: number;
    provider?: string;
    currency: string;
    paymentStatus: string;
};

type OrderDetail = {
    id: number;
    customerIdentifier: string;
    employeeId: string;
    note: string;
    createdAt: string;
    closedAt?: string;
    cancelledAt?: string;
    orderItems: OrderItemDetail[];
    payments?: PaymentDetail[];
};

type PaymentMethod = "CASH" | "CARD" | "GIFT_CARD";

function isOpen(order: OrderDetail) {
    return !order.closedAt && !order.cancelledAt;
}

export default function OrderCheckoutPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [method, setMethod] = useState<PaymentMethod>("CASH");
    const [amountPaid, setAmountPaid] = useState<string>("");
    const [currency, setCurrency] = useState("EUR");
    const [tip, setTip] = useState<string>("");
    const [change, setChange] = useState<number | null>(null);
    const [requires3DS, setRequires3DS] = useState(false);
    const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [paying, setPaying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadOrder();
    }, [id]);

    const loadOrder = async () => {
        if (!id) return;
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem("access-token");
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/orders/${id}`,
                {
                    headers: token
                        ? { Authorization: `Bearer ${token}` }
                        : {},
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch order: ${response.status}`);
            }

            const data = await response.json();
            setOrder(data);

            // Pre-fill amount with remaining balance
            if (data.payments) {
                const paid = data.payments.reduce(
                    (sum: number, p: PaymentDetail) => sum + p.amount,
                    0
                );
                const total = data.orderItems.reduce(
                    (sum: number, item: OrderItemDetail) =>
                        sum + (item.price ?? item.defaultPrice ?? 0) * item.quantity,
                    0
                );
                const remaining = total - paid;
                if (remaining > 0) {
                    setAmountPaid(remaining.toFixed(2));
                }
            }
        } catch (err: any) {
            setError(err.message ?? "Unknown error loading order");
        } finally {
            setLoading(false);
        }
    };

    const subtotal = useMemo(() => {
        if (!order) return 0;
        return order.orderItems.reduce(
            (sum, item) =>
                sum + (item.price ?? item.defaultPrice ?? 0) * item.quantity,
            0
        );
    }, [order]);

    const tax = useMemo(() => {
        // Simplified tax calculation - 21% VAT
        return subtotal * 0.21;
    }, [subtotal]);

    const total = useMemo(() => {
        return subtotal + tax;
    }, [subtotal, tax]);

    const paid = useMemo(() => {
        if (!order?.payments) return 0;
        return order.payments.reduce(
            (sum, p) => sum + (p.paymentStatus === "SUCCEEDED" ? p.amount : 0),
            0
        );
    }, [order]);

    const remaining = useMemo(() => {
        return Math.max(0, total - paid);
    }, [total, paid]);

    const handlePayAndClose = async () => {
        if (!id || !order) return;

        setChange(null);
        setError(null);
        setRequires3DS(false);
        setPaymentIntentId(null);

        const amount = Number(amountPaid);
        const tipAmount = Number(tip) || 0;

        if (!Number.isFinite(amount) || amount <= 0) {
            setError("Enter a valid amount.");
            return;
        }

        // For cash, validate minimum amount
        if (method === "CASH" && amount < remaining) {
            setError(
                `Cash must be at least the remaining amount (${remaining.toFixed(2)}).`
            );
            return;
        }

        // Validate tip
        if (tipAmount < 0) {
            setError("Tip cannot be negative.");
            return;
        }

        try {
            setPaying(true);
            const token = localStorage.getItem("access-token");

            // Build payment request
            const payment: any = {
                method,
                amount,
                currency,
            };

            // Add provider and idempotency key for card payments
            if (method === "CARD") {
                payment.provider = "STRIPE";
                payment.idempotencyKey = `order-${id}-${Date.now()}-${Math.random()
                    .toString(36)
                    .substring(7)}`;
            }

            const payload: any = {
                payments: [payment],
            };

            // Add tip if provided
            if (tipAmount > 0) {
                payload.tip = {
                    source: method,
                    amount: tipAmount,
                };
            }

            // Single atomic operation - close order with payment
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/orders/${id}/close`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                const errBody = await response.json().catch(() => null);
                throw new Error(
                    errBody?.message ?? `Payment failed (${response.status})`
                );
            }

            const result = await response.json();

            // Check if 3DS is required
            if (result.requires3DS) {
                setRequires3DS(true);
                setPaymentIntentId(result.paymentIntentId);
                setError(
                    "3D Secure authentication required. In production, redirect to Stripe 3DS flow."
                );
                return;
            }

            // Show change for cash payments
            if (method === "CASH" && result.change !== null && result.change > 0) {
                setChange(result.change);
                // Show change notification and then navigate after 3 seconds
                setTimeout(() => {
                    navigate(`/orders/view/${id}`);
                }, 3000);
            } else {
                // Success - navigate to order view immediately
                navigate(`/orders/view/${id}`);
            }
        } catch (err: any) {
            setError(err.message ?? "Unknown error");
        } finally {
            setPaying(false);
        }
    };

    return (
        <div className="bg-gray-200 flex flex-col min-h-[calc(100vh-52px)] overflow-y-auto">
            <div className="p-6 flex-1 flex flex-col space-y-6">
                <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-gray-900 font-medium">
                    Checkout Order {id}
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        <div className="font-medium">Error</div>
                        <div className="text-sm mt-1">{error}</div>
                        {requires3DS && paymentIntentId && (
                            <div className="mt-2 text-xs bg-red-50 p-2 rounded">
                                <div className="font-medium">Payment Intent ID:</div>
                                <div className="font-mono">{paymentIntentId}</div>
                                <div className="mt-1 text-gray-600">
                                    In production, the user would be redirected to complete 3D
                                    Secure authentication.
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {change !== null && change > 0 && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        <div className="font-medium text-lg">
                            Change: {currency} {change.toFixed(2)}
                        </div>
                        <div className="text-sm mt-1">
                            Order closed successfully. Redirecting...
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="bg-gray-300 rounded-md py-8 text-center text-gray-600">
                        Loading order...
                    </div>
                )}

                {!loading && !order && (
                    <div className="bg-gray-300 rounded-md py-8 text-center text-gray-600">
                        Order not found.
                    </div>
                )}

                {!loading && order && (
                    <>
                        <div className="bg-gray-300 rounded-md p-6 flex flex-col gap-6 text-gray-900">
                            {/* Order Summary */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Customer:</span>
                                    <span className="font-medium">
                                        {order.customerIdentifier}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Order ID:</span>
                                    <span className="font-medium">#{order.id}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Created:</span>
                                    <span className="font-medium">
                                        {new Date(order.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                {order.note && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Note:</span>
                                        <span className="font-medium">{order.note}</span>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-400 pt-4">
                                <div className="text-gray-800 font-medium mb-3">
                                    Order Items
                                </div>
                                <div className="space-y-2">
                                    {order.orderItems.map((item) => {
                                        const name =
                                            item.productName || item.serviceName || "Unknown";
                                        const price =
                                            item.price ?? item.defaultPrice ?? 0;
                                        return (
                                            <div
                                                key={item.orderItemId}
                                                className="flex justify-between text-sm"
                                            >
                                                <span>
                                                    {item.quantity}x {name}
                                                </span>
                                                <span className="font-medium">
                                                    {currency} {(price * item.quantity).toFixed(2)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="border-t border-gray-400 pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span>
                                        {currency} {subtotal.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Tax (21%):</span>
                                    <span>
                                        {currency} {tax.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t border-gray-400 pt-2">
                                    <span>Total:</span>
                                    <span>
                                        {currency} {total.toFixed(2)}
                                    </span>
                                </div>
                                {paid > 0 && (
                                    <>
                                        <div className="flex justify-between text-sm text-green-700">
                                            <span>Paid:</span>
                                            <span>
                                                -{currency} {paid.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold text-orange-700">
                                            <span>Remaining:</span>
                                            <span>
                                                {currency} {remaining.toFixed(2)}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Previous Payments */}
                            {order.payments && order.payments.length > 0 && (
                                <div className="border-t border-gray-400 pt-4">
                                    <div className="text-gray-800 font-medium mb-3">
                                        Previous Payments
                                    </div>
                                    <div className="space-y-2">
                                        {order.payments.map((payment) => (
                                            <div
                                                key={payment.paymentId}
                                                className="flex justify-between text-sm bg-gray-200 p-2 rounded"
                                            >
                                                <span>
                                                    {payment.method}
                                                    {payment.provider && ` (${payment.provider})`}
                                                </span>
                                                <span className="font-medium">
                                                    {payment.currency} {payment.amount.toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Payment Form */}
                            {isOpen(order) ? (
                                <>
                                    <div className="bg-gray-200 rounded-md p-4 space-y-4 text-gray-900">
                                        <div className="text-gray-800 font-medium">
                                            New Payment
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-gray-800">
                                                Payment Method
                                            </label>
                                            <select
                                                className="w-full border border-gray-400 rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={method}
                                                onChange={(e) =>
                                                    setMethod(e.target.value as PaymentMethod)
                                                }
                                                disabled={paying}
                                            >
                                                <option value="CASH">Cash</option>
                                                <option value="CARD">Card (Stripe)</option>
                                                <option value="GIFT_CARD">Gift Card</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-gray-800">
                                                Amount Paid
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    className="flex-1 border border-gray-400 rounded px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={amountPaid}
                                                    onChange={(e) => setAmountPaid(e.target.value)}
                                                    placeholder={remaining.toFixed(2)}
                                                    inputMode="decimal"
                                                    disabled={paying}
                                                />
                                                <select
                                                    className="border border-gray-400 rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={currency}
                                                    onChange={(e) => setCurrency(e.target.value)}
                                                    disabled={paying}
                                                >
                                                    <option value="EUR">EUR</option>
                                                    <option value="USD">USD</option>
                                                    <option value="GBP">GBP</option>
                                                </select>
                                            </div>
                                            {method === "CASH" && (
                                                <div className="text-xs text-gray-600 mt-1">
                                                    Cash must be at least the remaining amount.
                                                    Change will be calculated.
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-gray-800">
                                                Tip (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full border border-gray-400 rounded px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={tip}
                                                onChange={(e) => setTip(e.target.value)}
                                                placeholder="0.00"
                                                inputMode="decimal"
                                                disabled={paying}
                                            />
                                        </div>

                                        {method === "CARD" && (
                                            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-200">
                                                <div className="font-medium text-blue-800 mb-1">
                                                    (i) Simulated Stripe Payment
                                                </div>
                                                <ul className="text-xs space-y-1">
                                                    <li>
                                                        - Amounts &le; {currency} 100: Immediate success
                                                    </li>
                                                    <li>
                                                        - Amounts &gt; {currency} 100: Requires 3D
                                                        Secure
                                                    </li>
                                                    <li>
                                                        - Idempotency key automatically generated
                                                    </li>
                                                </ul>
                                            </div>
                                        )}

                                        {method === "GIFT_CARD" && (
                                            <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded border border-yellow-200">
                                                <div className="font-medium text-yellow-800">
                                                    (!) Gift Card Not Yet Implemented
                                                </div>
                                                <div className="text-xs mt-1">
                                                    Gift card payments will be available in the next
                                                    phase.
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => navigate(`/orders/view/${id}`)}
                                            className="flex-1 bg-gray-200 hover:bg-gray-300 rounded-md py-3 text-gray-900 font-medium transition-colors disabled:opacity-50"
                                            disabled={paying}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handlePayAndClose}
                                            className="flex-1 bg-green-200 hover:bg-green-300 rounded-md py-3 text-gray-900 font-medium transition-colors disabled:opacity-50"
                                            disabled={
                                                paying ||
                                                remaining <= 0 ||
                                                method === "GIFT_CARD"
                                            }
                                        >
                                            {paying
                                                ? "Processing..."
                                                : `Pay ${currency} ${amountPaid || remaining.toFixed(2)} & Close`}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="bg-gray-200 rounded-md py-6 text-center text-gray-700">
                                    <div className="font-medium">
                                        This order is {order.closedAt ? "closed" : "cancelled"}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                        Cannot process payments for this order.
                                    </div>
                                    <button
                                        onClick={() => navigate(`/orders/view/${id}`)}
                                        className="mt-4 bg-gray-300 hover:bg-gray-400 rounded-md py-2 px-6 text-gray-900 font-medium transition-colors"
                                    >
                                        Back to Order
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}