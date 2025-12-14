import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";

type OrderItemDetail = {
    id: number;
    productId?: number;
    serviceId?: number;
    quantity: number;
    productName?: string;
    serviceName?: string;
    itemTotal: number;
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
    items: OrderItemDetail[];
    payments?: PaymentDetail[];
    subTotal: number;
    tax: number;
    totalAmount: number;
};

type PaymentMethod = "CASH" | "CARD" | "GIFT_CARD";
type TipType = "percentage" | "custom";

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

    // Tip settings
    const [tipType, setTipType] = useState<TipType>("percentage");
    const [tipPercentage, setTipPercentage] = useState<number>(0);
    const [tipCustom, setTipCustom] = useState<string>("");

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
                const remaining = data.totalAmount - paid;
                if (remaining > 0) {
                    setAmountPaid(remaining.toFixed(2));
                }
            } else {
                setAmountPaid(data.totalAmount.toFixed(2));
            }
        } catch (err: any) {
            setError(err.message ?? "Unknown error loading order");
        } finally {
            setLoading(false);
        }
    };

    const subtotal = useMemo(() => {
        if (!order?.items) return 0;
        return order.items.reduce((sum, item) => sum + item.itemTotal, 0);
    }, [order]);

    const tax = useMemo(() => {
        return order?.tax ?? subtotal * 0.21;
    }, [order, subtotal]);

    const total = useMemo(() => {
        return order?.totalAmount ?? subtotal + tax;
    }, [order, subtotal, tax]);

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

    const calculatedTip = useMemo(() => {
        if (tipType === "percentage") {
            return (remaining * tipPercentage) / 100;
        }
        return Number(tipCustom) || 0;
    }, [tipType, tipPercentage, tipCustom, remaining]);

    const calculatedChange = useMemo(() => {
        if (method !== "CASH") return null;
        const amount = Number(amountPaid);
        if (!Number.isFinite(amount) || amount <= 0) return null;
        const changeAmount = amount - remaining;
        return changeAmount > 0 ? changeAmount : null;
    }, [method, amountPaid, remaining]);

    const handlePayAndClose = async () => {
        if (!id || !order) return;

        setChange(null);
        setError(null);
        setRequires3DS(false);
        setPaymentIntentId(null);

        const amount = Number(amountPaid);
        const tipAmount = calculatedTip;

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
                setTimeout(() => {
                    navigate(`/orders/view/${id}`);
                }, 3000);
            } else {
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
            <div className="p-8 flex-1 flex flex-col space-y-8">
                <div className="bg-gray-300 rounded-md py-4 px-6 text-center text-gray-900 font-semibold text-xl">
                    Checkout Order {id}
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-md">
                        <div className="font-semibold text-lg">Error</div>
                        <div className="mt-2">{error}</div>
                        {requires3DS && paymentIntentId && (
                            <div className="mt-3 text-sm bg-red-50 p-3 rounded">
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
                    <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-md">
                        <div className="font-semibold text-xl">
                            Change: {currency} {change.toFixed(2)}
                        </div>
                        <div className="mt-2">
                            Order closed successfully. Redirecting...
                        </div>
                    </div>
                )}

                {calculatedChange !== null && calculatedChange > 0 && (
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-4 rounded-md">
                        <div className="font-semibold text-lg">
                            Change to return: {currency} {calculatedChange.toFixed(2)}
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="bg-gray-300 rounded-md py-12 text-center text-gray-600 text-lg">
                        Loading order...
                    </div>
                )}

                {!loading && !order && (
                    <div className="bg-gray-300 rounded-md py-12 text-center text-gray-600 text-lg">
                        Order not found.
                    </div>
                )}

                {!loading && order && (
                    <>
                        <div className="grid grid-cols-2 gap-8">
                            {/* LEFT SIDE - Payment Details */}
                            <div className="bg-gray-300 rounded-md p-8 space-y-6">
                                <div className="text-gray-800 font-semibold text-xl mb-6">
                                    Payment Details
                                </div>

                                {/* Customer Info */}
                                <div>
                                    <div className="text-sm text-gray-600 mb-2">Customer</div>
                                    <div className="bg-gray-200 rounded-md px-4 py-3 text-gray-900 font-medium text-lg">
                                        {order.customerIdentifier}
                                    </div>
                                </div>

                                {/* Order Summary */}
                                <div className="space-y-3 pt-4 border-t border-gray-400">
                                    <div className="flex justify-between text-base">
                                        <span className="text-gray-600">Subtotal:</span>
                                        <span className="font-medium">{currency} {subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-base">
                                        <span className="text-gray-600">Tax (21%):</span>
                                        <span className="font-medium">{currency} {tax.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-xl font-bold border-t border-gray-400 pt-3">
                                        <span>Total:</span>
                                        <span>{currency} {total.toFixed(2)}</span>
                                    </div>
                                    {paid > 0 && (
                                        <>
                                            <div className="flex justify-between text-base text-green-700">
                                                <span>Paid:</span>
                                                <span className="font-medium">-{currency} {paid.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-xl font-bold text-orange-700">
                                                <span>Remaining:</span>
                                                <span>{currency} {remaining.toFixed(2)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Previous Payments */}
                                {order.payments && order.payments.length > 0 && (
                                    <div className="border-t border-gray-400 pt-6">
                                        <div className="text-gray-800 font-medium mb-3 text-lg">
                                            Previous Payments
                                        </div>
                                        <div className="space-y-2">
                                            {order.payments.map((payment) => (
                                                <div
                                                    key={payment.paymentId}
                                                    className="flex justify-between bg-gray-200 p-3 rounded text-base"
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
                            </div>

                            {/* RIGHT SIDE - Payment Form */}
                            <div className="bg-gray-300 rounded-md p-8 space-y-6">
                                {isOpen(order) ? (
                                    <>
                                        <div className="text-gray-800 font-semibold text-xl mb-6">
                                            New Payment
                                        </div>

                                        {/* Payment Method */}
                                        <div>
                                            <label className="block text-base font-medium mb-2 text-gray-800">
                                                Payment Method
                                            </label>
                                            <select
                                                className="w-full border border-gray-400 rounded-md px-4 py-3 text-gray-900 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                                        {/* Amount Paid */}
                                        <div>
                                            <label className="block text-base font-medium mb-2 text-gray-800">
                                                Amount Paid
                                            </label>
                                            <div className="flex gap-3">
                                                <input
                                                    type="text"
                                                    className="flex-1 border border-gray-400 rounded-md px-4 py-3 text-gray-900 text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={amountPaid}
                                                    onChange={(e) => setAmountPaid(e.target.value)}
                                                    placeholder={remaining.toFixed(2)}
                                                    inputMode="decimal"
                                                    disabled={paying}
                                                />
                                                <select
                                                    className="border border-gray-400 rounded-md px-4 py-3 text-gray-900 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                                <div className="text-sm text-gray-600 mt-2">
                                                    Cash must be at least the remaining amount.
                                                    Change will be calculated.
                                                </div>
                                            )}
                                        </div>

                                        {/* Tip */}
                                        <div>
                                            <label className="block text-base font-medium mb-2 text-gray-800">
                                                Tip (Optional)
                                            </label>

                                            {/* Tip Type Selector */}
                                            <div className="flex gap-3 mb-3">
                                                <button
                                                    onClick={() => setTipType("percentage")}
                                                    className={`flex-1 px-4 py-2 rounded-md text-base font-medium transition-colors ${tipType === "percentage"
                                                            ? "bg-blue-500 text-white"
                                                            : "bg-gray-200 text-gray-700 hover:bg-gray-400"
                                                        }`}
                                                    disabled={paying}
                                                >
                                                    Percentage
                                                </button>
                                                <button
                                                    onClick={() => setTipType("custom")}
                                                    className={`flex-1 px-4 py-2 rounded-md text-base font-medium transition-colors ${tipType === "custom"
                                                            ? "bg-blue-500 text-white"
                                                            : "bg-gray-200 text-gray-700 hover:bg-gray-400"
                                                        }`}
                                                    disabled={paying}
                                                >
                                                    Custom
                                                </button>
                                            </div>

                                            {/* Percentage Options */}
                                            {tipType === "percentage" && (
                                                <div className="grid grid-cols-4 gap-2 mb-3">
                                                    {[0, 5, 10, 15, 20].map((pct) => (
                                                        <button
                                                            key={pct}
                                                            onClick={() => setTipPercentage(pct)}
                                                            className={`px-4 py-2 rounded-md text-base font-medium transition-colors ${tipPercentage === pct
                                                                    ? "bg-green-500 text-white"
                                                                    : "bg-gray-200 text-gray-700 hover:bg-gray-400"
                                                                }`}
                                                            disabled={paying}
                                                        >
                                                            {pct}%
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Custom Amount */}
                                            {tipType === "custom" && (
                                                <input
                                                    type="text"
                                                    className="w-full border border-gray-400 rounded-md px-4 py-3 text-gray-900 text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={tipCustom}
                                                    onChange={(e) => setTipCustom(e.target.value)}
                                                    placeholder="0.00"
                                                    inputMode="decimal"
                                                    disabled={paying}
                                                />
                                            )}

                                            {calculatedTip > 0 && (
                                                <div className="text-sm text-gray-600 mt-2">
                                                    Tip amount: {currency} {calculatedTip.toFixed(2)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Card Payment Info */}
                                        {method === "CARD" && (
                                            <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-md border border-blue-200">
                                                <div className="font-medium text-blue-800 mb-2 text-base">
                                                    (i) Simulated Stripe Payment
                                                </div>
                                                <ul className="space-y-1">
                                                    <li>
                                                        - Amounts &lt;= {currency} 100: Immediate success
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

                                        {/* Gift Card Warning */}
                                        {method === "GIFT_CARD" && (
                                            <div className="text-sm text-gray-600 bg-yellow-50 p-4 rounded-md border border-yellow-200">
                                                <div className="font-medium text-yellow-800 text-base">
                                                    (!) Gift Card Not Yet Implemented
                                                </div>
                                                <div className="mt-1">
                                                    Gift card payments will be available in the next
                                                    phase.
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex gap-4 pt-4">
                                            <button
                                                onClick={() => navigate(`/orders/view/${id}`)}
                                                className="flex-1 bg-gray-200 hover:bg-gray-400 rounded-md py-4 text-gray-900 font-semibold text-lg transition-colors disabled:opacity-50"
                                                disabled={paying}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handlePayAndClose}
                                                className="flex-1 bg-green-200 hover:bg-green-300 rounded-md py-4 text-gray-900 font-semibold text-lg transition-colors disabled:opacity-50"
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
                                    <div className="text-center py-12">
                                        <div className="font-semibold text-xl text-gray-700">
                                            This order is {order.closedAt ? "closed" : "cancelled"}
                                        </div>
                                        <div className="text-gray-600 mt-2">
                                            Cannot process payments for this order.
                                        </div>
                                        <button
                                            onClick={() => navigate(`/orders/view/${id}`)}
                                            className="mt-6 bg-gray-400 hover:bg-gray-500 rounded-md py-3 px-8 text-gray-900 font-semibold text-lg transition-colors"
                                        >
                                            Back to Order
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Order Items - Below */}
                        <div className="bg-gray-300 rounded-md p-8">
                            <div className="text-gray-800 font-semibold text-xl mb-6">
                                Order Items
                            </div>
                            <div className="space-y-3">
                                {order.items.map((item) => {
                                    const name =
                                        item.productName || item.serviceName || "Unknown";
                                    return (
                                        <div
                                            key={item.id}
                                            className="flex justify-between bg-gray-200 px-4 py-3 rounded-md text-lg"
                                        >
                                            <span className="font-medium">
                                                {item.quantity}x {name}
                                            </span>
                                            <span className="font-semibold">
                                                {currency} {item.itemTotal.toFixed(2)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}