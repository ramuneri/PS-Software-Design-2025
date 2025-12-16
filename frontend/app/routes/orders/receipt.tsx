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
    taxBreakdown?: TaxBreakdown[];
};

export default function OrderReceiptPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
        } catch (err: any) {
            setError(err.message ?? "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    const currency = "EUR";

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
                    <button
                        onClick={() => navigate(-1)}
                        className="px-3 py-1 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 text-sm"
                    >
                        Back
                    </button>
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
            </div>
        </div>
    );
}
