import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

type OrderItem = {
    id: number;
    productId?: number;
    serviceId?: number;
    quantity: number;
    itemTotal: number;
    productName?: string;
    serviceName?: string;
    productVariationId?: number;
    productVariationName?: string;
};

type TaxBreakdown = {
    taxCategoryId: number;
    categoryName: string;
    ratePercent: number;
    amount: number;
};

type OrderDetail = {
    id: number;
    employeeId: string | null;
    customerIdentifier: string | null;
    items: OrderItem[];
    payments?: { method: string; amount: number; currency: string }[];
    subTotal: number;
    tax: number;
    totalAmount: number;
    note: string | null;
    status: number;
    closedAt: string | null;
    taxBreakdown?: TaxBreakdown[];
};

type Refund = {
    refundId: number;
    orderId: number;
    amount: number;
    reason?: string;
    isPartial: boolean;
    createdAt: string;
};

export default function OrderReceiptPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refunds, setRefunds] = useState<Refund[]>([]);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundAmount, setRefundAmount] = useState<string>("");
    const [refundReason, setRefundReason] = useState<string>("");
    const [refundLoading, setRefundLoading] = useState(false);
    const [refundError, setRefundError] = useState<string | null>(null);
    const [refundSuccess, setRefundSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (id) load();
    }, [id]);

    const load = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem("access-token");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/orders/${id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error(`Failed to load receipt (${res.status})`);
            const data = await res.json();
            setOrder(data);

            const refundRes = await fetch(`${import.meta.env.VITE_API_URL}/refunds/order/${id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (refundRes.ok) {
                const refundData = await refundRes.json();
                setRefunds(refundData || []);
            }
        } catch (err: any) {
            setError(err.message ?? "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    const currency = "EUR";

    const getTotalRefunded = () => {
        return refunds.reduce((sum, refund) => sum + refund.amount, 0);
    };

    const isFullyRefunded = () => {
        return order && getTotalRefunded() >= order.totalAmount;
    };

    const handleRefundClick = () => {
        setRefundAmount("");
        setRefundReason("");
        setRefundError(null);
        setRefundSuccess(null);
        setShowRefundModal(true);
    };

    const handleRefundSubmit = async () => {
        if (!refundAmount || parseFloat(refundAmount) <= 0) {
            setRefundError("Please enter a valid refund amount");
            return;
        }

        const amount = parseFloat(refundAmount);
        if (order && amount > order.totalAmount) {
            setRefundError(`Refund amount cannot exceed order total (${currency} ${order.totalAmount.toFixed(2)})`);
            return;
        }

        try {
            setRefundLoading(true);
            setRefundError(null);
            const token = localStorage.getItem("access-token");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/refunds/${id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    amount: parseFloat(refundAmount),
                    reason: refundReason || null,
                }),
            });

            if (!res.ok) {
                const errData: any = await res.json().catch(() => ({}));
                const message =
                    errData?.message || `Failed to create refund (${res.status})`;
                const detail =
                    typeof errData?.detail === "string" ? errData.detail : null;
                throw new Error(detail ? `${message}: ${detail}` : message);
            }

            setRefundSuccess(`Refund of ${currency} ${amount.toFixed(2)} created successfully`);
            setShowRefundModal(false);
            
            setTimeout(() => {
                load();
                setRefundSuccess(null);
            }, 1500);
        } catch (err: any) {
            setRefundError(err.message ?? "Unknown error");
        } finally {
            setRefundLoading(false);
        }
    };

    const renderTax = () => {
        const breakdown = order?.taxBreakdown || [];
        if (!breakdown.length) {
            return (
                <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>{currency} {order?.tax.toFixed(2)}</span>
                </div>
            );
        }
        return (
            <div className="space-y-1">
                {breakdown.map((t) => (
                    <div key={`${t.taxCategoryId}-${t.ratePercent}`} className="flex justify-between text-sm">
                        <span>{`VAT ${t.ratePercent}% (${t.categoryName || "Tax"})`}</span>
                        <span>{currency} {t.amount.toFixed(2)}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="bg-gray-100 min-h-[calc(100vh-52px)] py-8 px-6">
            <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div className="text-xl font-semibold text-gray-800">Receipt for Order {id}</div>
                    <div className="flex gap-2">
                        {order && order.status === 1 && order.closedAt && !isFullyRefunded() && (
                            <button
                                onClick={handleRefundClick}
                                className="px-3 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600 text-sm"
                            >
                                Refund
                            </button>
                        )}
                        <button
                            onClick={() => navigate(-1)}
                            className="px-3 py-1 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 text-sm"
                        >
                            Back
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-2 rounded-md text-sm">
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="text-gray-700">Loading...</div>
                )}

                {!loading && order && (
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div className="text-lg font-semibold text-gray-800">Summary</div>
                            <div className="space-y-2 bg-gray-50 border border-gray-200 rounded-md p-4 text-sm text-gray-800">
                                <div className="flex justify-between">
                                    <span>Employee</span>
                                    <span className="font-medium">{order.employeeId || "—"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Discount</span>
                                    <span className="font-medium">—</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Service charge</span>
                                    <span className="font-medium">—</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tip</span>
                                    <span className="font-medium">—</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="font-medium">{currency} {order.subTotal.toFixed(2)}</span>
                                </div>
                                {renderTax()}
                                <div className="flex justify-between text-base font-semibold border-t border-gray-200 pt-2">
                                    <span>Total</span>
                                    <span>{currency} {order.totalAmount.toFixed(2)}</span>
                                </div>
                            </div>

                            {order.payments && order.payments.length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-lg font-semibold text-gray-800">Payments</div>
                                    <div className="space-y-1 bg-gray-50 border border-gray-200 rounded-md p-4 text-sm text-gray-800">
                                        {order.payments.map((p, idx) => (
                                            <div key={idx} className="flex justify-between">
                                                <span>{p.method}</span>
                                                <span>{p.currency} {p.amount.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {refunds.length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-lg font-semibold text-gray-800">
                                        {isFullyRefunded() ? "Fully Refunded" : "Refunds"}
                                    </div>
                                    <div className="space-y-2 bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-gray-800">
                                        {refunds.map((refund) => (
                                            <div key={refund.refundId} className="space-y-1">
                                                <div className="flex justify-between">
                                                    <span>Amount:</span>
                                                    <span className="font-medium">{currency} {refund.amount.toFixed(2)}</span>
                                                </div>
                                                {refund.reason && (
                                                    <div className="flex justify-between">
                                                        <span>Reason:</span>
                                                        <span className="text-xs text-gray-600">{refund.reason}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between text-xs text-gray-500">
                                                    <span>Date:</span>
                                                    <span>{new Date(refund.createdAt).toLocaleString()}</span>
                                                </div>
                                                {refunds.length > 1 && refunds[refunds.length - 1] !== refund && (
                                                    <div className="border-t border-blue-200 my-2" />
                                                )}
                                            </div>
                                        ))}
                                        <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between font-semibold">
                                            <span>Total Refunded:</span>
                                            <span>{currency} {getTotalRefunded().toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div className="text-lg font-semibold text-gray-800">Items</div>
                            <div className="space-y-2 bg-gray-50 border border-gray-200 rounded-md p-4 text-sm text-gray-800">
                                {order.items.map((item) => {
                                    const name = item.productName || item.serviceName || "Item";
                                    return (
                                        <div key={item.id} className="flex justify-between">
                                            <div>
                                                <div>{item.quantity}x {name}</div>
                                                {item.productVariationName && (
                                                    <div className="text-xs text-gray-500">
                                                        + {item.productVariationName}
                                                    </div>
                                                )}
                                            </div>
                                            <span>{currency} {item.itemTotal.toFixed(2)}</span>
                                        </div>
                                    );
                                })}
                                <div className="border-t border-gray-200 pt-2 flex justify-between font-medium">
                                    <span>Subtotal</span>
                                    <span>{currency} {order.subTotal.toFixed(2)}</span>
                                </div>
                                {renderTax()}
                                <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-semibold">
                                    <span>Total</span>
                                    <span>{currency} {order.totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showRefundModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm w-full mx-4">
                            <div className="text-lg font-semibold text-gray-800 mb-4">Create Refund</div>

                            {refundSuccess && (
                                <div className="bg-green-50 border border-green-300 text-green-800 px-4 py-2 rounded-md text-sm mb-4">
                                    {refundSuccess}
                                </div>
                            )}

                            {refundError && (
                                <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-2 rounded-md text-sm mb-4">
                                    {refundError}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Amount ({currency})
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max={order?.totalAmount}
                                        value={refundAmount}
                                        onChange={(e) => setRefundAmount(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="0.00"
                                        disabled={refundLoading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Reason (optional)
                                    </label>
                                    <textarea
                                        value={refundReason}
                                        onChange={(e) => setRefundReason(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        rows={3}
                                        placeholder="Enter reason for refund..."
                                        disabled={refundLoading}
                                    />
                                </div>

                                <div className="flex gap-2 justify-end pt-4">
                                    <button
                                        onClick={() => setShowRefundModal(false)}
                                        className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 text-sm"
                                        disabled={refundLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleRefundSubmit}
                                        className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 text-sm disabled:bg-blue-300"
                                        disabled={refundLoading}
                                    >
                                        {refundLoading ? "Processing..." : "Refund"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
