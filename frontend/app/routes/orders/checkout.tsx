import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";

type OrderItemDetail = {
    id: number;
    productId?: number;
    serviceId?: number;
    quantity: number;
    productName?: string;
    serviceName?: string;
    itemTotal: number;
    productVariationId?: number;
    productVariationName?: string;
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

type TaxBreakdownLine = {
    ratePercent: number;
    categoryName?: string | null;
    amount: number;
};

type DisplayTaxLine = {
    label: string;
    amount: number;
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
    taxBreakdown?: TaxBreakdownLine[];
    totalAmount: number;
};

type PaymentMethod = "CASH" | "CARD" | "GIFT_CARD";
type TipType = "percentage" | "custom";

const defaultServiceChargeOptions: { id: string; label: string; percent: number }[] = [
    { id: "", label: "No service charge", percent: 0 },
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
    const currency = "EUR";
    const [giftCardCode, setGiftCardCode] = useState<string>("");
    const [splitMode, setSplitMode] = useState(false);
    const [payers, setPayers] = useState([{ method: "CASH" as PaymentMethod }]);
    const [itemAssignments, setItemAssignments] = useState<Record<number, number>>({});

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
    const [showConfirm, setShowConfirm] = useState(false);
    const [showPostClose, setShowPostClose] = useState(false);

    const [loading, setLoading] = useState(false);
    const [paying, setPaying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Discounts and Service Charges from API
    const [discountOptions, setDiscountOptions] = useState<{ id: string; label: string; percent: number }[]>([]);
    const [serviceChargeOptions, setServiceChargeOptions] = useState<{ id: string; label: string; percent: number }[]>(defaultServiceChargeOptions);

    // Gift card validation
    const [giftCardValidation, setGiftCardValidation] = useState<{
        isValid: boolean;
        message: string;
        balance?: number;
    } | null>(null);
    const [giftCardValidating, setGiftCardValidating] = useState(false);
    const giftCardValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        loadOrder();
        loadDiscounts();
        loadServiceCharges();
    }, [id]);

    useEffect(() => {
        if (!giftCardCode.trim()) {
            setGiftCardValidation(null);
            return;
        }

        if (giftCardValidationTimeoutRef.current) {
            clearTimeout(giftCardValidationTimeoutRef.current);
        }

        setGiftCardValidating(true);
        giftCardValidationTimeoutRef.current = setTimeout(() => {
            validateGiftCard();
        }, 500);

        return () => {
            if (giftCardValidationTimeoutRef.current) {
                clearTimeout(giftCardValidationTimeoutRef.current);
            }
        };
    }, [giftCardCode]);

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

            if (data.items) {
                const initial: Record<number, number> = {};
                data.items.forEach((item: OrderItemDetail) => (initial[item.id] = 0));
                setItemAssignments(initial);
            }

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

    const toggleItemAssignment = (itemId: number, payerIdx: number) => {
        setItemAssignments((prev) => {
            const prevPayer = prev[itemId];
            const next = { ...prev };
            if (prevPayer === payerIdx) {
                delete next[itemId];
            } else {
                next[itemId] = payerIdx;
            }
            return next;
        });
    };

    const loadDiscounts = async () => {
        try {
            const token = localStorage.getItem("access-token");
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/discounts?isActive=true`,
                {
                    headers: token
                        ? { Authorization: `Bearer ${token}` }
                        : {},
                }
            );

            if (response.ok) {
                const data = await response.json();
                const discounts = Array.isArray(data) ? data : data.data || [];
                const formatted = discounts.map((d: any) => ({
                    id: String(d.id),
                    label: d.name,
                    percent: Number(d.value) || 0,
                }));
                setDiscountOptions(formatted);
            }
        } catch (err) {
            console.error("Failed to load discounts", err);
        }
    };

    const loadServiceCharges = async () => {
        try {
            const token = localStorage.getItem("access-token");
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/service-charge-policies?merchantId=1&includeInactive=false`,
                {
                    headers: token
                        ? { Authorization: `Bearer ${token}` }
                        : {},
                }
            );

            if (response.ok) {
                const data = await response.json();
                const policies = Array.isArray(data) ? data : data.data || [];
                const formatted = policies.map((p: any) => ({
                    id: String(p.id),
                    label: p.name,
                    percent: Number(p.value) || 0,
                }));
                setServiceChargeOptions([defaultServiceChargeOptions[0], ...formatted]);
            }
        } catch (err) {
            console.error("Failed to load service charges", err);
        }
    };

    const addPayer = () => {
        setPayers((prev) => [...prev, { method: "CASH" }]);
    };

    const removePayer = (index: number) => {
        setPayers((prev) => {
            if (prev.length === 1) return prev;
            const next = prev.filter((_, i) => i !== index);
            setItemAssignments((assignments) => {
                const updated: Record<number, number> = {};
                Object.entries(assignments).forEach(([itemId, payerIdx]) => {
                    const numeric = Number(payerIdx);
                    if (numeric === index) {
                        updated[Number(itemId)] = 0;
                    } else {
                        updated[Number(itemId)] =
                            numeric > index ? numeric - 1 : numeric;
                    }
                });
                return updated;
            });
            return next;
        });
    };

    const updateAssignment = (itemId: number, payerIdx: number) => {
        setItemAssignments((prev) => ({
            ...prev,
            [itemId]: payerIdx,
        }));
    };

    const updatePayerMethod = (index: number, newMethod: PaymentMethod) => {
        setPayers((prev) =>
            prev.map((p, i) => (i === index ? { ...p, method: newMethod } : p))
        );
    };

    const validateGiftCard = async () => {
        try {
            const token = localStorage.getItem("access-token");
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/giftcards?code=${encodeURIComponent(giftCardCode)}`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "X-Merchant-Id": "1",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                }
            );

            setGiftCardValidating(false);

            if (!response.ok) {
                setGiftCardValidation({
                    isValid: false,
                    message: response.status === 404 ? "Gift card code not found" : "Gift card not found or invalid",
                });
                return;
            }

            const data = await response.json();
            const giftcard = data.data && data.data[0];

            if (!giftcard) {
                setGiftCardValidation({
                    isValid: false,
                    message: "",
                });
                return;
            }

            if (!giftcard.isActive) {
                setGiftCardValidation({
                    isValid: false,
                    message: "Gift card is inactive",
                });
                return;
            }

            if (giftcard.expiresAt && new Date(giftcard.expiresAt) < new Date()) {
                setGiftCardValidation({
                    isValid: false,
                    message: "Gift card has expired",
                });
                return;
            }

            if (giftcard.balance < amountDue) {
                setGiftCardValidation({
                    isValid: false,
                    message: `Insufficient balance. Available: €${giftcard.balance.toFixed(2)}, Required: €${amountDue.toFixed(2)}`,
                    balance: giftcard.balance,
                });
                return;
            }

            setGiftCardValidation({
                isValid: true,
                message: `Gift card valid. Balance: €${giftcard.balance.toFixed(2)}`,
                balance: giftcard.balance,
            });
        } catch (err: any) {
            setGiftCardValidating(false);
            setGiftCardValidation({
                isValid: false,
                message: "Error validating gift card",
            });
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

    // Calculate discount as percentage of subtotal (matching backend: discount applied to subtotal)
    const discountAmount = useMemo(() => {
        if (selectedDiscounts.length === 0) return 0;

        const totalPercent = selectedDiscounts.reduce((sum, id) => {
            const opt = discountOptions.find((o) => o.id === id);
            return sum + (opt?.percent ?? 0);
        }, 0);

        if (totalPercent <= 0) return 0;

        // Discount is calculated on subtotal, not remaining
        return (subtotal * totalPercent) / 100;
    }, [selectedDiscounts, subtotal]);

    // Calculate service charge as percentage of subtotal (matching backend)
    const serviceChargeAmount = useMemo(() => {
        const option = serviceChargeOptions.find(
            (opt) => opt.id === selectedServiceCharge
        );
        if (!option || option.percent <= 0) return 0;

        // Service charge is calculated on subtotal, not remaining
        return (subtotal * option.percent) / 100;
    }, [selectedServiceCharge, subtotal]);

    // Calculate tip as percentage of total before tip, or custom amount
    // Backend: tip is added to (subtotal - discount) + tax + service charge
    const calculatedTip = useMemo(() => {
        if (tipType === "percentage") {
            // Calculate total before tip: (subtotal - discount) + tax + service charge
            const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
            const totalBeforeTip = subtotalAfterDiscount + tax + serviceChargeAmount;
            return (totalBeforeTip * tipPercentage) / 100;
        }
        return Number(tipCustom) || 0;
    }, [tipType, tipPercentage, tipCustom, subtotal, discountAmount, tax, serviceChargeAmount]);

    // Calculate amount due: (subtotal - discount) + tax + service charge + tip - paid
    // This matches backend calculation: subtotalAfterDiscount + Tax + ServiceCharge + Tip
    const amountDue = useMemo(() => {
        const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
        const totalWithAdjustments = subtotalAfterDiscount + tax + serviceChargeAmount + calculatedTip;
        return Math.max(0, totalWithAdjustments - paid);
    }, [subtotal, discountAmount, tax, serviceChargeAmount, calculatedTip, paid]);

    const payerTotals = useMemo(() => {
        const totals = payers.map(() => 0);
        if (!order?.items) return totals;
        order.items.forEach((item) => {
            const idx = itemAssignments[item.id] ?? 0;
            if (totals[idx] === undefined) {
                totals[idx] = 0;
            }
            totals[idx] += item.itemTotal;
        });
        return totals;
    }, [payers, order, itemAssignments]);

    const payerTaxShare = useMemo(() => {
        const subtotalBase = order?.subTotal ?? subtotal;
        const taxTotal = order?.tax ?? tax;
        if (subtotalBase <= 0) return payers.map(() => 0);
        return payerTotals.map((pt) => (pt / subtotalBase) * taxTotal);
    }, [order, subtotal, tax, payerTotals, payers.length]);

    const allItemsAssigned = useMemo(() => {
        if (!order?.items) return false;
        return order.items.every((u) => itemAssignments[u.id] !== undefined);
    }, [order, itemAssignments]);

    const allPayersCash = useMemo(() => {
        return splitMode && payers.every((p) => p.method === "CASH");
    }, [splitMode, payers]);

    const unassignedItemsTotal = useMemo(() => {
        if (!order?.items) return 0;
        return order.items.reduce((sum, item) => {
            if (itemAssignments[item.id] === undefined) {
                return sum + item.itemTotal;
            }
            return sum;
        }, 0);
    }, [order, itemAssignments]);

    const calculatedChange = useMemo(() => {
        if (method !== "CASH") return null;
        const amount = Number(amountPaid);
        if (!Number.isFinite(amount) || amount <= 0) return null;
        const changeAmount = amount - amountDue;
        return changeAmount > 0 ? changeAmount : null;
    }, [method, amountPaid, amountDue]);

    useEffect(() => {
        // For all payment methods, set amountPaid to amountDue to ensure correct payment amount
        if (method === "CASH" || method === "GIFT_CARD" || method === "CARD") {
            setAmountPaid(amountDue.toFixed(2));
        }
    }, [amountDue, method]);

    useEffect(() => {
        if (allPayersCash) {
            setAmountPaid(amountDue.toFixed(2));
        }
    }, [allPayersCash, amountDue]);

    const handlePayAndClose = async () => {
        if (!id || !order) return;

        setChange(null);
        setError(null);
        setRequires3DS(false);
        setPaymentIntentId(null);
        setShowConfirm(false);

        const tipAmount = calculatedTip;

        try {
            setPaying(true);
            const token = localStorage.getItem("access-token");

            // Split mode
            if (splitMode) {
                // Build splits grouped by payer index
                let splits: { orderItemIds: number[]; method: PaymentMethod; currency: string; provider?: string }[] = [];
                if (!order.items) {
                    setError("Order has no items.");
                    setPaying(false);
                    return;
                }

                if (allPayersCash) {
                    // pooled cash: send a single split with all items
                    splits = [
                        {
                            orderItemIds: order.items.map((i) => i.id),
                            method: "CASH",
                            currency,
                        },
                    ];
                } else {
                    const splitsMap: Record<number, number[]> = {};
                    order.items.forEach((item) => {
                        const payerIdx = itemAssignments[item.id];
                        if (payerIdx === undefined) return;
                        if (!splitsMap[payerIdx]) splitsMap[payerIdx] = [];
                        // only push once per item (line)
                        splitsMap[payerIdx].push(item.id);
                    });

                    // ensure every item assigned
                    if (!allItemsAssigned) {
                        setError("Assign all items to a payer.");
                        setPaying(false);
                        return;
                    }

                    splits = Object.entries(splitsMap).map(([payerIdx, itemIds]) => {
                        const payer = payers[Number(payerIdx)] ?? payers[0];
                        return {
                            orderItemIds: itemIds,
                            method: payer.method,
                            currency,
                            provider: payer.method === "CARD" ? "STRIPE" : undefined,
                        };
                    });
                }

                const payload: any = {
                    splits,
                    discountAmount: discountAmount > 0 ? discountAmount : null,
                    serviceChargeAmount: serviceChargeAmount > 0 ? serviceChargeAmount : null,
                };

                if (tipAmount > 0) {
                    payload.tip = {
                        source: "CASH",
                        amount: tipAmount,
                    };
                }

                if (allPayersCash) {
                    const parsed = Number((amountPaid || "").replace(",", "."));
                    const totalPaid = Number.isFinite(parsed) && parsed > 0 ? parsed : amountDue;
                    let splitChange: number | null = null;

                    if (totalPaid < amountDue) {
                        setError("Enter the total cash received.");
                        setPaying(false);
                        return;
                    }
                    const changeAmount = totalPaid - amountDue;
                    if (changeAmount > 0) {
                        splitChange = changeAmount;
                        setChange(changeAmount);
                    }
                    // stash on payload for later redirect timing
                    payload.totalPaid = totalPaid;
                    payload.change = changeAmount > 0 ? changeAmount : 0;
                    // attach flag to reuse below
                    (payload as any).__splitChange = splitChange;
                }

                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/orders/${id}/split-close`,
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
                    const errJson = await response.json().catch(() => null);
                    throw new Error(errJson?.message || "Failed to close order with splits");
                }

                const changeFromPayload = (payload as any).__splitChange as number | null | undefined;
                if (allPayersCash && changeFromPayload !== null && changeFromPayload !== undefined && changeFromPayload > 0) {
                    setShowPostClose(true);
                    return;
                }
                setShowPostClose(true);
                return;
            }

            const amount = Number((amountPaid || "").replace(",", "."));

            if (!Number.isFinite(amount) || amount <= 0) {
                setError("Enter a valid amount.");
                setPaying(false);
                return;
            }

            if (method === "CASH" && amount < amountDue) {
                setError(
                    `Cash must be at least the amount due (${amountDue.toFixed(2)}).`
                );
                setPaying(false);
                return;
            }

            if (tipAmount < 0) {
                setError("Tip cannot be negative.");
                setPaying(false);
                return;
            }

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
                discountAmount: discountAmount > 0 ? discountAmount : null,
                serviceChargeAmount: serviceChargeAmount > 0 ? serviceChargeAmount : null,
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
            }
            setShowPostClose(true);
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

                {(!splitMode || allPayersCash) && change !== null && change > 0 && (
                    <div className="bg-green-50 border border-green-300 text-green-800 px-6 py-4 rounded-lg">
                        <div className="font-semibold text-xl">
                            Change: {currency} {change.toFixed(2)}
                        </div>
                        <div className="mt-2 text-gray-700">
                            Order closed successfully. Redirecting...
                        </div>
                    </div>
                )}

                {(!splitMode || allPayersCash) && calculatedChange !== null && calculatedChange > 0 && (
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

                {showConfirm && order && (
                    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-40">
                        <div className="bg-white rounded-lg shadow-2xl w-[700px] max-w-[90vw] p-6 space-y-4">
                            <div className="text-center space-y-1">
                                <div className="text-lg font-semibold text-gray-800">Confirm closing order</div>
                                <div className="text-sm text-gray-600">Review totals and proceed to close.</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 text-sm text-gray-800 bg-gray-100 rounded-md p-3">
                                    <div className="flex justify-between">
                                        <span>Employee</span>
                                        <span className="font-medium">{order.employeeId || "—"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span className="font-medium">{currency} {subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Tax</span>
                                        <span className="font-medium">{currency} {order.tax.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Discount</span>
                                        <span className="font-medium">{discountAmount > 0 ? `- ${currency} ${discountAmount.toFixed(2)}` : "—"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Service charge</span>
                                        <span className="font-medium">{serviceChargeAmount > 0 ? `+ ${currency} ${serviceChargeAmount.toFixed(2)}` : "—"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Tip</span>
                                        <span className="font-medium">{calculatedTip > 0 ? `+ ${currency} ${calculatedTip.toFixed(2)}` : "—"}</span>
                                    </div>
                                    {paid > 0 && (
                                        <div className="flex justify-between text-green-700">
                                            <span>Paid</span>
                                            <span className="font-medium">- {currency} {paid.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-semibold border-t border-gray-300 pt-2">
                                        <span>Total</span>
                                        <span>{currency} {(amountDue + paid).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm text-gray-800 bg-gray-100 rounded-md p-3">
                                    <div className="font-semibold text-gray-800">Items</div>
                                    <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
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
                                    </div>
                                    <button
                                        onClick={() => navigate(`/orders/receipt/${order.id}`)}
                                        className="w-full mt-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-medium py-2 rounded-md"
                                    >
                                        Receipt preview
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300"
                                    disabled={paying}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePayAndClose}
                                    className="px-4 py-2 rounded-md bg-green-500 text-white font-semibold hover:bg-green-600 disabled:opacity-60"
                                    disabled={paying}
                                >
                                    Yes, close order
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showPostClose && order && (
                    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-40">
                        <div className="bg-white rounded-lg shadow-2xl w-[700px] max-w-[90vw] p-6 space-y-4">
                            <div className="text-center space-y-1">
                                <div className="text-lg font-semibold text-gray-800">Order closed</div>
                                <div className="text-sm text-gray-600">Would you like to view the receipt?</div>
                            </div>
                            {change !== null && change > 0 && (
                                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-md text-sm text-center">
                                    Change: {currency} {change.toFixed(2)}
                                </div>
                            )}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setShowPostClose(false);
                                        navigate(`/orders/view/${id}`);
                                    }}
                                    className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPostClose(false);
                                        navigate(`/orders/receipt/${id}`);
                                    }}
                                    className="px-4 py-2 rounded-md bg-blue-500 text-white font-semibold hover:bg-blue-600"
                                >
                                    Receipt preview
                                </button>
                            </div>
                        </div>
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
                                        {serviceChargeOptions.map((opt) => (
                                            <option key={opt.id} value={opt.id}>
                                                {opt.label} {opt.percent > 0 ? `(${opt.percent}%)` : ""}
                                            </option>
                                        ))}
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
                                    {(() => {
                                        const displaySubtotal = order?.subTotal ?? subtotal;
                                        const breakdown: TaxBreakdownLine[] = order?.taxBreakdown ?? [];
                                        const taxLines: DisplayTaxLine[] = breakdown.length
                                            ? breakdown.map((t) => ({
                                                  label: `VAT ${t.ratePercent}% (${t.categoryName || "Tax"})`,
                                                  amount: t.amount,
                                              }))
                                            : [{ label: "Tax", amount: order?.tax ?? tax }];
                                        const taxTotal = taxLines.reduce((sum, t) => sum + t.amount, 0);
                                        const baseTotal = displaySubtotal + taxTotal;
                                        const totalWithAdjustments =
                                            baseTotal - discountAmount + serviceChargeAmount + calculatedTip;

                                        return (
                                            <>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Subtotal:</span>
                                                    <span className="text-gray-800 font-medium">{currency} {displaySubtotal.toFixed(2)}</span>
                                                </div>
                                                {taxLines.map((line, idx) => (
                                                    <div key={idx} className="flex justify-between text-sm">
                                                        <span className="text-gray-600">{line.label}:</span>
                                                        <span className="text-gray-800 font-medium">+ {currency} {line.amount.toFixed(2)}</span>
                                                    </div>
                                                ))}
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
                                                    <span className="text-gray-800">{currency} {totalWithAdjustments.toFixed(2)}</span>
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
                                            </>
                                        );
                                    })()}
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
                                    </div>
                                </div>

                                {/* Payment Form */}
                                {isOpen(order) ? (
                                    <div className="bg-gray-200 rounded-lg p-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="text-gray-800 font-semibold text-lg">
                                                {splitMode ? "Split Payments" : "Current Payment"}
                                            </div>
                                            <label className="flex items-center gap-2 text-sm text-gray-800">
                                                <input
                                                    type="checkbox"
                                                    checked={splitMode}
                                                    onChange={(e) => setSplitMode(e.target.checked)}
                                                    disabled={paying}
                                                />
                                                <span>Split by items</span>
                                            </label>
                                        </div>

                                        {splitMode ? (
                                            <div className="space-y-4">
                                                <div className="space-y-3">
                                                    {payers.map((payer, index) => (
                                                        <div key={index} className="bg-white rounded-md border border-gray-300 p-3 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="font-semibold text-gray-800">
                                                            Payer {index + 1}
                                                        </div>
                                                        {index > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removePayer(index)}
                                                                className="text-xs text-red-600 hover:underline"
                                                                disabled={paying}
                                                            >
                                                                Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                            <div>
                                                                <label className="block text-sm font-medium mb-1 text-gray-800">
                                                                    Payment Method
                                                                </label>
                                                                <select
                                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                                                                    value={payer.method}
                                                                    onChange={(e) =>
                                                                        updatePayerMethod(
                                                                            index,
                                                                            e.target.value as PaymentMethod
                                                                        )
                                                                    }
                                                                    disabled={paying}
                                                                >
                                                                    <option value="CASH">Cash</option>
                                                                    <option value="CARD">Card (Stripe)</option>
                                                                </select>
                                                            </div>
                                                            <div className="text-sm text-gray-700">
                                                                Items total (pre-discount/tax/service): {currency}{" "}
                                                                {(payerTotals[index] ?? 0).toFixed(2)}
                                                            </div>
                                                            <div className="text-sm text-gray-700">
                                                                Est. tax share: {currency} {(payerTaxShare[index] ?? 0).toFixed(2)}
                                                            </div>
                                                            <div className="text-sm font-semibold text-gray-800">
                                                                Items total (incl. est tax): {currency} {((payerTotals[index] ?? 0) + (payerTaxShare[index] ?? 0)).toFixed(2)}
                                                            </div>

                                                            <div className="space-y-2">
                                                                <div className="text-sm font-medium text-gray-800">
                                                                    Select items for this payer
                                                                </div>
                                                                <div className="space-y-1">
                                                                    {order.items
                                                                        .filter(
                                                                            (item) =>
                                                                                itemAssignments[item.id] === undefined ||
                                                                                itemAssignments[item.id] === index
                                                                        )
                                                                        .map((item) => {
                                                                            const name = item.productName || item.serviceName || "Unknown";
                                                                            const checked = itemAssignments[item.id] === index;
                                                                            const subtotalBase = order?.subTotal ?? subtotal;
                                                                            const taxTotal = order?.tax ?? tax;
                                                                            const itemTaxShare = subtotalBase > 0 ? (item.itemTotal / subtotalBase) * taxTotal : 0;
                                                                            const itemGross = item.itemTotal + itemTaxShare;
                                                                            return (
                                                                                <label
                                                                                    key={`${index}-${item.id}`}
                                                                                    className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded-md text-sm text-gray-800"
                                                                                >
                                                                                    <div className="flex flex-col">
                                                                                        <span className="font-medium">
                                                                                            {item.quantity}x {name}
                                                                                            {item.productVariationName && (
                                                                                                <span className="text-xs text-gray-500 ml-1">
                                                                                                    (+ {item.productVariationName})
                                                                                                </span>
                                                                                            )}
                                                                                        </span>
                                                                                                                                                            <span className="text-gray-700">
                                                                                            {currency} {itemGross.toFixed(2)} (incl. est tax {currency} {itemTaxShare.toFixed(2)})
                                                                                        </span>
                                                                                    </div>
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        className="h-4 w-4"
                                                                                        checked={checked}
                                                                                        onChange={() =>
                                                                                            toggleItemAssignment(item.id, index)
                                                                                        }
                                                                                        disabled={paying}
                                                                                    />
                                                                                </label>
                                                                            );
                                                                        })}
                                                                    {order.items.filter(
                                                                        (item) =>
                                                                            itemAssignments[item.id] === undefined ||
                                                                            itemAssignments[item.id] === index
                                                                    ).length === 0 && (
                                                                        <div className="text-xs text-gray-600">
                                                                            No available items for this payer.
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {!allItemsAssigned && (
                                                    <div className="text-xs text-red-700 mt-1">
                                                        Assign every item to a payer.
                                                    </div>
                                                )}

                                                {allPayersCash && (
                                                    <div className="border-t border-gray-300 pt-3 space-y-2">
                                                        <label className="block text-sm font-medium text-gray-800">
                                                            Total cash received
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                                            value={amountPaid}
                                                            onChange={(e) => setAmountPaid(e.target.value)}
                                                            placeholder={amountDue.toFixed(2)}
                                                            inputMode="decimal"
                                                            disabled={paying}
                                                        />
                                                        <div className="text-xs text-gray-600">
                                                            One combined cash amount for all payers. Change will be calculated.
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between pt-2">
                                                    <div className="text-sm text-gray-700">
                                                        Remaining items to allocate: {currency} {unassignedItemsTotal.toFixed(2)}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={addPayer}
                                                        className="px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-60"
                                                        disabled={paying || payers.length >= 6}
                                                    >
                                                        Add payer
                                                    </button>
                                                </div>

                                                <div className="text-xs text-gray-700 bg-blue-50 border border-blue-200 rounded-md p-3">
                                                    Discounts, service charges, tax, and tips are applied once at the
                                                    order level and split across payers based on their assigned item totals.
                                                </div>

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
                                                        disabled={paying || !allItemsAssigned}
                                                    >
                                                        {paying ? "Processing..." : "Split & Close Order"}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
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
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium mb-2 text-gray-800">
                                                            Gift Card Code
                                                        </label>
                                                        <div className="flex gap-2 items-center">
                                                            <input
                                                                type="text"
                                                                className={`flex-1 border rounded-md px-4 py-2 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 ${
                                                                    giftCardValidation?.isValid
                                                                        ? "border-green-500 focus:ring-green-400"
                                                                        : giftCardValidation?.isValid === false
                                                                        ? "border-red-500 focus:ring-red-400"
                                                                        : "border-gray-300 focus:ring-gray-400"
                                                                }`}
                                                                value={giftCardCode}
                                                                onChange={(e) => setGiftCardCode(e.target.value)}
                                                                placeholder="Enter gift card code"
                                                                disabled={paying}
                                                            />
                                                            {giftCardValidating && (
                                                                <span className="text-sm text-gray-600">
                                                                    ✓ Validating...
                                                                </span>
                                                            )}
                                                        </div>
                                                        {giftCardValidation && giftCardValidation.message && (
                                                            <div
                                                                className={`text-xs px-3 py-2 rounded ${
                                                                    giftCardValidation.isValid
                                                                        ? "bg-green-100 text-green-800 border border-green-300"
                                                                        : "bg-red-100 text-red-800 border border-red-300"
                                                                }`}
                                                            >
                                                                {giftCardValidation.message}
                                                            </div>
                                                        )}
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
                                                onClick={() => setShowConfirm(true)}
                                                className="flex-1 bg-green-500 hover:bg-green-600 rounded-md py-3 text-white font-semibold text-sm transition-colors disabled:opacity-50"
                                                disabled={
                                                    paying ||
                                                    amountDue <= 0 ||
                                                    (method === "GIFT_CARD" && !giftCardValidation?.isValid)
                                                }
                                            >
                                                {paying
                                                    ? "Processing..."
                                                    : `Pay ${currency} ${amountDue.toFixed(2)} & Close`}
                                            </button>
                                        </div>
                                    </>
                                )}
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
