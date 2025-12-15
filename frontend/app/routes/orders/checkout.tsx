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

const discountOptions: { id: string; label: string; percent: number }[] = [
    { id: "DISCOUNT_1", label: "Discount 1 (placeholder)", percent: 5 },
    { id: "DISCOUNT_2", label: "Discount 2 (placeholder)", percent: 5 },
    { id: "DISCOUNT_3", label: "Discount 3 (placeholder)", percent: 5 },
    { id: "DISCOUNT_4", label: "Discount 4 (placeholder)", percent: 5 },
];

const serviceChargeOptions: { id: string; label: string; percent: number }[] = [
    { id: "", label: "No service charge", percent: 0 },
    { id: "SERVICE_10", label: "Service 10% (placeholder)", percent: 10 },
    { id: "SERVICE_15", label: "Service 15% (placeholder)", percent: 15 },
];

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
    const [giftCardCode, setGiftCardCode] = useState<string>("");

    // Tip settings
    const [tipType, setTipType] = useState<TipType>("percentage");
    const [tipPercentage, setTipPercentage] = useState<number>(0);
    const [tipCustom, setTipCustom] = useState<string>("");

    // Discounts and Service Charge
    const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([]);
    const [selectedServiceCharge, setSelectedServiceCharge] = useState<string>("");
    const [isDiscountDropdownOpen, setIsDiscountDropdownOpen] = useState(false);

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

    const discountAmount = useMemo(() => {
        if (selectedDiscounts.length === 0) return 0;

        const totalPercent = selectedDiscounts.reduce((sum, id) => {
            const opt = discountOptions.find((o) => o.id === id);
            return sum + (opt?.percent ?? 0);
        }, 0);

        if (totalPercent <= 0) return 0;

        return (remaining * totalPercent) / 100;
    }, [selectedDiscounts, remaining]);

    const serviceChargeAmount = useMemo(() => {
        const option = serviceChargeOptions.find(
            (opt) => opt.id === selectedServiceCharge
        );
        if (!option || option.percent <= 0) return 0;

        return (remaining * option.percent) / 100;
    }, [selectedServiceCharge, remaining]);

    const amountDue = useMemo(() => {
        const baseAfterDiscounts = remaining - discountAmount;
        const clampedBase = Math.max(0, baseAfterDiscounts);
        return clampedBase + serviceChargeAmount + calculatedTip;
    }, [remaining, discountAmount, serviceChargeAmount, calculatedTip]);

    const calculatedChange = useMemo(() => {
        if (method !== "CASH") return null;
        const amount = Number(amountPaid);
        if (!Number.isFinite(amount) || amount <= 0) return null;
        const changeAmount = amount - amountDue;
        return changeAmount > 0 ? changeAmount : null;
    }, [method, amountPaid, amountDue]);

    useEffect(() => {
        if (method === "CASH") {
            setAmountPaid(amountDue.toFixed(2));
        }
    }, [amountDue, method]);

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

        if (method === "CASH" && amount < amountDue) {
            setError(
                `Cash must be at least the amount due (${amountDue.toFixed(2)}).`
            );
            return;
        }

        if (tipAmount < 0) {
            setError("Tip cannot be negative.");
            return;
        }

        try {
            setPaying(true);
            const token = localStorage.getItem("access-token");

            const payment: any = {
                method,
                amount,
                currency,
            };

            if (method === "CARD") {
                payment.provider = "STRIPE";
                payment.idempotencyKey = `order-${id}-${Date.now()}-${Math.random()
                    .toString(36)
                    .substring(7)}`;
            }

            if (method === "GIFT_CARD") {
                payment.giftCardCode = giftCardCode;
            }

            const payload: any = {
                payments: [payment],
            };

            if (tipAmount > 0) {
                payload.tip = {
                    source: method,
                    amount: tipAmount,
                };
            }

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

            if (result.requires3DS) {
                setRequires3DS(true);
                setPaymentIntentId(result.paymentIntentId);
                setError(
                    "3D Secure authentication required. In production, redirect to Stripe 3DS flow."
                );
                return;
            }

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
        <div className="bg-gray-100 flex flex-col min-h-[calc(100vh-52px)] overflow-y-auto">
            <div className="p-8 flex-1 flex flex-col space-y-6">
                <div className="bg-gray-200 rounded-lg py-4 px-6 text-center text-gray-800 font-semibold text-xl">
                    Checkout Order {id}
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-300 text-red-800 px-6 py-4 rounded-lg">
                        <div className="font-semibold text-lg">Error</div>
                        <div className="mt-2 text-gray-700">{error}</div>
                        {requires3DS && paymentIntentId && (
                            <div className="mt-3 text-sm bg-red-100 p-3 rounded">
                                <div className="font-medium">Payment Intent ID:</div>
                                <div className="font-mono text-gray-700">{paymentIntentId}</div>
                                <div className="mt-1 text-gray-600">
                                    In production, the user would be redirected to complete 3D
                                    Secure authentication.
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {change !== null && change > 0 && (
                    <div className="bg-green-50 border border-green-300 text-green-800 px-6 py-4 rounded-lg">
                        <div className="font-semibold text-xl">
                            Change: {currency} {change.toFixed(2)}
                        </div>
                        <div className="mt-2 text-gray-700">
                            Order closed successfully. Redirecting...
                        </div>
                    </div>
                )}

                {calculatedChange !== null && calculatedChange > 0 && (
                    <div className="bg-blue-50 border border-blue-300 text-gray-800 px-6 py-4 rounded-lg">
                        <div className="font-semibold text-lg">
                            Change to return: {currency} {calculatedChange.toFixed(2)}
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="bg-gray-200 rounded-lg py-12 text-center text-gray-600 text-lg">
                        Loading order...
                    </div>
                )}

                {!loading && !order && (
                    <div className="bg-gray-200 rounded-lg py-12 text-center text-gray-600 text-lg">
                        Order not found.
                    </div>
                )}

                {!loading && order && (
                    <>
                        <div className="grid grid-cols-2 gap-6">
                            {/* LEFT COLUMN - Single Block */}
                            <div className="bg-gray-200 rounded-lg p-6 space-y-6">
                                {/* Customer */}
                                <div>
                                    <div className="text-gray-800 font-semibold text-lg mb-4">
                                        Payment Details
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600 mb-2">Customer</div>
                                        <div className="bg-gray-100 rounded-md px-4 py-3 text-gray-800 font-medium">
                                            {order.customerIdentifier}
                                        </div>
                                    </div>
                                </div>

                                {/* Discount */}
                                <div className="border-t border-gray-300 pt-6">
                                    <label className="block text-sm font-medium mb-2 text-gray-800">
                                        Discount
                                    </label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setIsDiscountDropdownOpen((open) => !open)
                                            }
                                            className="w-full flex items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                            disabled={paying}
                                        >
                                            <span>
                                                {selectedDiscounts.length === 0
                                                    ? "Type"
                                                    : `${selectedDiscounts.length} selected`}
                                            </span>
                                            <span className="ml-2 text-gray-500">v</span>
                                        </button>

                                        {isDiscountDropdownOpen && (
                                            <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-md border border-gray-300 bg-white shadow-lg">
                                                {discountOptions.map((opt) => {
                                                    const checked = selectedDiscounts.includes(opt.id);
                                                    return (
                                                        <button
                                                            key={opt.id}
                                                            type="button"
                                                            onClick={() =>
                                                                setSelectedDiscounts((prev) =>
                                                                    prev.includes(opt.id)
                                                                        ? prev.filter((id) => id !== opt.id)
                                                                        : [...prev, opt.id]
                                                                )
                                                            }
                                                            className="w-full flex items-center justify-between px-4 py-2 text-left text-gray-800 hover:bg-gray-100"
                                                        >
                                                            <span className="text-sm">{opt.label}</span>
                                                            <input
                                                                type="checkbox"
                                                                readOnly
                                                                checked={checked}
                                                                className="h-4 w-4"
                                                            />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Service Charge */}
                                <div className="border-t border-gray-300 pt-6">
                                    <label className="block text-sm font-medium mb-2 text-gray-800">
                                        Service charge
                                    </label>
                                    <select
                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                        value={selectedServiceCharge}
                                        onChange={(e) => setSelectedServiceCharge(e.target.value)}
                                        disabled={paying}
                                    >
                                        <option value="">No service charge</option>
                                        <option value="SERVICE_10">Service 10% (placeholder)</option>
                                        <option value="SERVICE_15">Service 15% (placeholder)</option>
                                    </select>
                                </div>

                                {/* Tip */}
                                <div className="border-t border-gray-300 pt-6">
                                    <label className="block text-sm font-medium mb-2 text-gray-800">
                                        Tip (Optional)
                                    </label>

                                    <div className="flex gap-2 mb-3">
                                        <button
                                            onClick={() => setTipType("percentage")}
                                            type="button"
                                            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors border ${tipType === "percentage"
                                                    ? "bg-gray-300 text-gray-800 border-gray-400"
                                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                                }`}
                                            disabled={paying}
                                        >
                                            Percentage
                                        </button>
                                        <button
                                            onClick={() => setTipType("custom")}
                                            type="button"
                                            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors border ${tipType === "custom"
                                                    ? "bg-gray-300 text-gray-800 border-gray-400"
                                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                                }`}
                                            disabled={paying}
                                        >
                                            Custom
                                        </button>
                                    </div>

                                    {tipType === "percentage" && (
                                        <div className="grid grid-cols-5 gap-2 mb-2">
                                            {[0, 5, 10, 15, 20].map((pct) => (
                                                <button
                                                    key={pct}
                                                    onClick={() => setTipPercentage(pct)}
                                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${tipPercentage === pct
                                                            ? "bg-gray-300 text-gray-800 border border-gray-400"
                                                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                                                        }`}
                                                    disabled={paying}
                                                >
                                                    {pct}%
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {tipType === "custom" && (
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                            value={tipCustom}
                                            onChange={(e) => setTipCustom(e.target.value)}
                                            placeholder="0.00"
                                            inputMode="decimal"
                                            disabled={paying}
                                        />
                                    )}
                                </div>

                                {/* Order Summary */}
                                <div className="border-t border-gray-300 pt-6 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal:</span>
                                        <span className="text-gray-800 font-medium">{currency} {subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Tax (21%):</span>
                                        <span className="text-gray-800 font-medium">+ {currency} {tax.toFixed(2)}</span>
                                    </div>
                                    {discountAmount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Discounts:</span>
                                            <span className="text-gray-800 font-medium">
                                                - {currency} {discountAmount.toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                    {serviceChargeAmount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Service charge:</span>
                                            <span className="text-gray-800 font-medium">
                                                + {currency} {serviceChargeAmount.toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                    {calculatedTip > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Tip:</span>
                                            <span className="text-gray-800 font-medium">
                                                + {currency} {calculatedTip.toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2 mt-2">
                                        <span className="text-gray-800">Total:</span>
                                        <span className="text-gray-800">{currency} {amountDue.toFixed(2)}</span>
                                    </div>
                                    {paid > 0 && (
                                        <>
                                            <div className="flex justify-between text-sm text-green-700">
                                                <span>Paid:</span>
                                                <span className="font-medium">-{currency} {paid.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-base font-bold text-orange-700">
                                                <span>Remaining:</span>
                                                <span>{currency} {remaining.toFixed(2)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Previous Payments */}
                                {order.payments && order.payments.length > 0 && (
                                    <div className="border-t border-gray-300 pt-6">
                                        <div className="text-gray-800 font-medium mb-2">
                                            Previous Payments
                                        </div>
                                        <div className="space-y-2">
                                            {order.payments.map((payment) => (
                                                <div
                                                    key={payment.paymentId}
                                                    className="flex justify-between bg-gray-100 p-2 rounded text-sm"
                                                >
                                                    <span className="text-gray-700">
                                                        {payment.method}
                                                        {payment.provider && ` (${payment.provider})`}
                                                    </span>
                                                    <span className="text-gray-800 font-medium">
                                                        {payment.currency} {payment.amount.toFixed(2)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* RIGHT COLUMN - Order Items & Payment */}
                            <div className="space-y-6">
                                {/* Order Items (Scrollable) */}
                                <div className="bg-gray-200 rounded-lg p-6">
                                    <div className="text-gray-800 font-semibold text-lg mb-4">
                                        Order Items
                                    </div>
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                        {order.items.map((item) => {
                                            const name = item.productName || item.serviceName || "Unknown";
                                            return (
                                                <div
                                                    key={item.id}
                                                    className="flex justify-between bg-gray-100 px-4 py-3 rounded-md"
                                                >
                                                    <span className="text-sm text-gray-800 font-medium">
                                                        {item.quantity}x {name}
                                                    </span>
                                                    <span className="text-sm text-gray-800 font-semibold">
                                                        {currency} {item.itemTotal.toFixed(2)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Payment Form */}
                                {isOpen(order) ? (
                                    <div className="bg-gray-200 rounded-lg p-6 space-y-4">
                                        <div className="text-gray-800 font-semibold text-lg">
                                            Current Payment
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-gray-800">
                                                Payment Method
                                            </label>
                                            <select
                                                className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-800 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                                                value={method}
                                                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                                                disabled={paying}
                                            >
                                                <option value="CASH">Cash</option>
                                                <option value="CARD">Card (Stripe)</option>
                                                <option value="GIFT_CARD">Gift Card</option>
                                            </select>
                                        </div>

                                        {method === "CASH" && (
                                            <div>
                                                <label className="block text-sm font-medium mb-2 text-gray-800">
                                                    Amount Paid
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                                        value={amountPaid}
                                                        onChange={(e) => setAmountPaid(e.target.value)}
                                                        placeholder={amountDue.toFixed(2)}
                                                        inputMode="decimal"
                                                        disabled={paying}
                                                    />
                                                    <select
                                                        className="border border-gray-300 rounded-md px-3 py-2 text-gray-800 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                                                        value={currency}
                                                        onChange={(e) => setCurrency(e.target.value)}
                                                        disabled={paying}
                                                    >
                                                        <option value="EUR">EUR</option>
                                                        <option value="USD">USD</option>
                                                        <option value="GBP">GBP</option>
                                                    </select>
                                                </div>
                                                <div className="text-xs text-gray-600 mt-1">
                                                    Cash must be at least the amount due. Change will be calculated.
                                                </div>
                                            </div>
                                        )}

                                        {/* Total to pay now */}
                                        <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-3">
                                            <span className="text-gray-800">Total to pay now:</span>
                                            <span className="text-gray-800">{currency} {amountDue.toFixed(2)}</span>
                                        </div>

                                        {method === "CARD" && (
                                            <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-md border border-blue-200">
                                                <div className="font-medium text-blue-800 mb-1">
                                                    (i) Simulated Stripe Payment
                                                </div>
                                                <ul className="space-y-1">
                                                    <li>- Amounts &lt;= {currency} 100: Immediate success</li>
                                                    <li>- Amounts &gt; {currency} 100: Requires 3D Secure</li>
                                                </ul>
                                            </div>
                                        )}

                                        {method === "GIFT_CARD" && (
                                            <div>
                                                <label className="block text-sm font-medium mb-2 text-gray-800">
                                                    Gift Card Code
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                                    value={giftCardCode}
                                                    onChange={(e) => setGiftCardCode(e.target.value)}
                                                    placeholder="Enter gift card code"
                                                    disabled={paying}
                                                />
                                            </div>
                                        )}

                                        <div className="flex gap-3 pt-2">
                                            <button
                                                onClick={() => navigate(`/orders/view/${id}`)}
                                                className="flex-1 bg-gray-300 hover:bg-gray-400 rounded-md py-3 text-gray-800 font-semibold text-sm transition-colors disabled:opacity-50"
                                                disabled={paying}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handlePayAndClose}
                                                className="flex-1 bg-green-500 hover:bg-green-600 rounded-md py-3 text-white font-semibold text-sm transition-colors disabled:opacity-50"
                                                disabled={
                                                    paying ||
                                                    amountDue <= 0 ||
                                                    (method === "GIFT_CARD" && !giftCardCode)
                                                }
                                            >
                                                {paying
                                                    ? "Processing..."
                                                    : `Pay ${currency} ${amountDue.toFixed(2)} & Close`}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-200 rounded-lg p-6 text-center">
                                        <div className="font-semibold text-lg text-gray-800">
                                            This order is {order.closedAt ? "closed" : "cancelled"}
                                        </div>
                                        <div className="text-gray-600 text-sm mt-2">
                                            Cannot process payments for this order.
                                        </div>
                                        <button
                                            onClick={() => navigate(`/orders/view/${id}`)}
                                            className="mt-4 bg-gray-400 hover:bg-gray-500 rounded-md py-2 px-6 text-gray-800 font-semibold text-sm transition-colors"
                                        >
                                            Back to Order
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}