import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("access-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function PaymentEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [orderId, setOrderId] = useState("");
  const [method, setMethod] = useState("CASH");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [paymentStatus, setPaymentStatus] = useState("SUCCEEDED");
  const [provider, setProvider] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPayment = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/payments/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
        }
      );

      if (res.status === 401) {
        localStorage.removeItem("access-token");
        navigate("/login");
        return;
      }

      if (res.status === 404) {
        setError("Payment not found");
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to load payment (${res.status})`);
      }

      const data = await res.json();
      const payment = data.data ?? data;

      setOrderId(String(payment.orderId ?? ""));
      setMethod(payment.method ?? "CASH");
      setAmount(payment.amount != null ? String(payment.amount) : "");
      setCurrency(payment.currency ?? "EUR");
      setPaymentStatus(payment.paymentStatus ?? "SUCCEEDED");
      setProvider(payment.provider ?? "");
    } catch (err: any) {
      setError(err?.message ?? "Failed to load payment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayment();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedOrderId = Number(orderId);
    const parsedAmount = Number(amount);

    if (!orderId || Number.isNaN(parsedOrderId)) {
      setError("Valid order id is required.");
      return;
    }

    if (!amount || Number.isNaN(parsedAmount)) {
      setError("Valid amount is required.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/payments/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({
            orderId: parsedOrderId,
            method: method.trim(),
            amount: parsedAmount,
            currency: currency.trim(),
            provider: provider.trim() || undefined,
            paymentStatus: paymentStatus.trim(),
          }),
        }
      );

      if (res.status === 401) {
        localStorage.removeItem("access-token");
        navigate("/login");
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to update payment (${res.status})`);
      }

      const data = await res.json();
      const updated = data.data ?? data;
      navigate(`/payments/${updated.paymentId}`);
    } catch (err: any) {
      setError(err?.message ?? "Failed to update payment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-black">Loading payment…</div>;
  }

  if (error && !submitting) {
    return (
      <div className="min-h-screen bg-gray-200 p-6 flex justify-center items-center">
        <div className="w-[90%] max-w-md bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded space-y-4">
          <div className="font-bold">{error}</div>
          <button
            onClick={() => navigate("/payments")}
            className="w-full bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
          >
            Back to list
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-[90%] max-w-3xl space-y-6">

        <div className="bg-gray-300 rounded-md py-3 px-4">
          <button
            onClick={() => navigate(`/payments/${id}`)}
            className="text-blue-600 hover:text-blue-700 underline text-sm"
            type="button"
          >
            ← Back to detail
          </button>
          <div className="text-black font-medium text-lg">Edit payment</div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-gray-300 rounded-md p-6 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-gray-700">Order</label>
              <input
                type="number"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full bg-gray-200 rounded-md px-3 py-2 text-black"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-700">Method</label>
              <input
                list="payment-methods-edit"
                value={method}
                onChange={(e) => setMethod(e.target.value.toUpperCase())}
                className="w-full bg-gray-200 rounded-md px-3 py-2 text-black"
                required
              />
              <datalist id="payment-methods-edit">
                <option value="CASH" />
                <option value="CARD" />
                <option value="GIFT_CARD" />
              </datalist>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-700">Amount</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-gray-200 rounded-md px-3 py-2 text-black"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-700">Currency</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                className="w-full bg-gray-200 rounded-md px-3 py-2 text-black"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-700">Payment status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full bg-gray-200 rounded-md px-3 py-2 text-black"
              >
                <option value="SUCCEEDED">SUCCEEDED</option>
                <option value="PENDING">PENDING</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-700">Provider (optional)</label>
              <input
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-gray-200 rounded-md px-3 py-2 text-black"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/payments/${id}`)}
              className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
