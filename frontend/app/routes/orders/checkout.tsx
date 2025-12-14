import { useEffect, useMemo, useState } from "react";
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

type PaymentMethod = "CASH" | "CARD" | "GIFT_CARD";

type Payment = {
    id: string;
    orderId: number;
    provider?: string | null;
    method: PaymentMethod;
    status: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED" | string;
    amount: number;
    currency: string;
    createdAt: string;
};

type PaymentsResponse = { data: Payment[] };
type CreatePaymentResponse = { data: Payment; change?: number };

export default function OrderCheckoutPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [method, setMethod] = useState<PaymentMethod>("CASH");
    const [amountPaid, setAmountPaid] = useState<string>("");
    const [currency, setCurrency] = useState("EUR");
    const [change, setChange] = useState<number | null>(null);

    const [loading, setLoading] = useState(false);
    const [paying, setPaying] = useState(false);
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

            // Load payments for remaining calculation + display
            const paymentsRes = await fetch(`${import.meta.env.VITE_API_URL}/orders/${id}/payments`, {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (paymentsRes.ok) {
                const paymentsJson: PaymentsResponse = await paymentsRes.json();
                setPayments(paymentsJson.data ?? []);
            } else {
                setPayments([]);
            }
        } catch (err: any) {
            setError(err.message ?? "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    const isOpen = (o: OrderDetail) => o.status === 0;

    const paidSoFar = useMemo(() => payments.reduce((sum, p) => sum + (p.amount ?? 0), 0), [payments]);

    const remaining = useMemo(() => {
        const total = order?.totalAmount ?? 0;
        return Math.max(0, total - paidSoFar);
    }, [order, paidSoFar]);

    const handlePayAndClose = async () => {
        if (!id || !order) return;

        setChange(null);
        setError(null);

        const amount = Number(amountPaid);
        if (!Number.isFinite(amount) || amount <= 0) {
            setError("Enter a valid amount.");
            return;
        }

        // Cash must cover remaining
        if (method === "CASH" && amount < remaining) {
            setError(`Cash must be at least the remaining amount (${remaining.toFixed(2)}).`);
            return;
        }

        try {
            setPaying(true);
            const token = localStorage.getItem("access-token");

            // 1) Create payment
            const payload: any = {
                method,
                amount,
                currency,
            };

            if (method !== "CASH") {
                payload.provider = "STRIPE";
            }

            const payRes = await fetch(`${import.meta.env.VITE_API_URL}/orders/${id}/payments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            });

            if (!payRes.ok) {
                const errBody = await payRes.json().catch(() => null);
                throw new Error(errBody?.message ?? `Payment failed (${payRes.status})`);
            }

            const payJson: CreatePaymentResponse = await payRes.json();
            const created = payJson.data;

            setPayments((prev) => [...prev, created]);

            if (method === "CASH") {
                if (typeof payJson.change === "number") setChange(payJson.change);
                else setChange(Math.max(0, amount - remaining));
            }

            // 2) Close order (separate API action per contract)
            const closeRes = await fetch(`${import.meta.env.VITE_API_URL}/orders/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ close: true }),
            });

            if (!closeRes.ok) {
                const errBody = await closeRes.json().catch(() => null);
                throw new Error(errBody?.message ?? `Close failed (${closeRes.status})`);
            }

            navigate(`/orders/view/${id}`);
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
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="bg-gray-300 rounded-md flex-1 flex items-center justify-center">
                        <div className="text-gray-900">Loading checkout...</div>
                    </div>
                )}

                {!loading && order && (
                    <div className="bg-gray-300 rounded-md p-6 flex flex-col gap-6 text-gray-900">
                        <div className="flex gap-6">
                            <div className="w-1/2">
                                <div className="text-gray-800 font-medium mb-2">Summary</div>
                                <div className="bg-gray-200 rounded-md p-4 space-y-2 text-gray-900">
                                    <div className="flex justify-between text-gray-700">
                                        <span>Subtotal</span>
                                        <span>${(order.subTotal ?? order.totalAmount).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-700">
                                        <span>Tax</span>
                                        <span>${(order.tax ?? 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-medium text-gray-900">
                                        <span>Total</span>
                                        <span>${order.totalAmount.toFixed(2)}</span>
                                    </div>

                                    <div className="pt-2 border-t border-gray-300" />

                                    <div className="flex justify-between text-gray-700">
                                        <span>Paid so far</span>
                                        <span>${paidSoFar.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-medium text-gray-900">
                                        <span>Remaining</span>
                                        <span>${remaining.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-1/2">
                                <div className="text-gray-800 font-medium mb-2">Items</div>
                                <div className="bg-gray-200 rounded-md p-4 space-y-2 text-gray-900">
                                    {order.items?.length ? (
                                        order.items.map((it) => (
                                            <div key={it.id} className="flex justify-between text-gray-700">
                                                <span>
                                                    {it.productName ?? `Product #${it.productId}`} x{it.quantity}
                                                </span>
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
                            <>
                                <div className="bg-gray-200 rounded-md p-4 space-y-3 text-gray-900">
                                    <div className="text-gray-800 font-medium">Payment</div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-800">
                                            Payment type
                                        </label>
                                        <select
                                            className="w-full border rounded px-3 py-2 text-gray-900"
                                            value={method}
                                            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                                        >
                                            <option value="CASH">Cash</option>
                                            <option value="CARD">Card</option>
                                            <option value="GIFT_CARD">Gift card</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-800">
                                            Amount paid
                                        </label>
                                        <input
                                            className="w-full border rounded px-3 py-2 text-gray-900 placeholder-gray-400"
                                            value={amountPaid}
                                            onChange={(e) => setAmountPaid(e.target.value)}
                                            placeholder={remaining.toFixed(2)}
                                            inputMode="decimal"
                                        />
                                    </div>

                                    {change !== null && (
                                        <div className="text-sm font-medium text-green-700 bg-green-100 rounded px-3 py-2">
                                            Change: {change.toFixed(2)} {currency}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => navigate(`/orders/view/${id}`)}
                                        className="flex-1 bg-gray-200 hover:bg-gray-300 rounded-md py-3 text-gray-900 font-medium"
                                        disabled={paying}
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handlePayAndClose}
                                        className="flex-1 bg-green-200 hover:bg-green-300 rounded-md py-3 text-gray-900 font-medium disabled:opacity-60"
                                        disabled={paying || remaining <= 0}
                                    >
                                        {paying ? "Processing..." : "Pay & Close"}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="bg-gray-200 rounded-md py-3 text-center text-gray-700 font-medium">
                                This order is not open and cannot be checked out.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
