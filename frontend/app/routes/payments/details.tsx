import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type PaymentDetail = {
  paymentId: number;
  orderId: number;
  method?: string | null;
  amount: number;
  provider?: string | null;
  currency?: string | null;
  paymentStatus?: string | null;
};

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("access-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-gray-700">{label}</div>
      <div className="bg-gray-200 rounded-md px-3 py-2 text-black">{value}</div>
    </div>
  );
}

export default function PaymentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
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
        setPayment(null);
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to load payment (${res.status})`);
      }

      const data = await res.json();
      setPayment(data.data ?? data);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load payment");
      setPayment(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayment();
  }, [id]);

  const handleDelete = async () => {
    if (!payment) return;
    if (!confirm("Delete this payment?")) return;

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/payments/${payment.paymentId}`,
      {
        method: "DELETE",
        headers: authHeaders(),
      }
    );

    if (res.status === 401) {
      localStorage.removeItem("access-token");
      navigate("/login");
      return;
    }

    if (!res.ok && res.status !== 404) {
      const text = await res.text();
      alert(text || "Failed to delete payment");
      return;
    }

    navigate("/payments");
  };

  if (loading) {
    return <div className="p-6 text-black">Loading payment…</div>;
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen bg-gray-200 p-6 flex justify-center items-center">
        <div className="w-[90%] max-w-md bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded space-y-4">
          <div className="font-bold">{error || "Payment not found"}</div>
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
            onClick={() => navigate("/payments")}
            className="text-blue-600 hover:text-blue-700 underline text-sm"
          >
            ← Back to list
          </button>
          <div className="text-black font-medium text-lg">Payment detail</div>
        </div>

        <div className="bg-gray-300 rounded-md p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Order" value={
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold">{payment.orderId}</span>
                <button
                  onClick={() => navigate(`/orders/view/${payment.orderId}`)}
                  className="text-blue-600 hover:text-blue-700 underline text-sm"
                >
                  Open order
                </button>
              </div>
            } />
            <InfoRow label="Method" value={payment.method ?? "-"} />
            <InfoRow label="Amount" value={payment.amount.toFixed(2)} />
            <InfoRow label="Currency" value={payment.currency ?? "-"} />
            <InfoRow label="Payment status" value={payment.paymentStatus ?? "-"} />
            <InfoRow label="Provider" value={payment.provider ?? "-"} />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/payments/${payment.paymentId}/edit`)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Modify
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-400 text-black px-4 py-2 rounded hover:bg-red-500"
          >
            Delete
          </button>
          <button
            onClick={() => navigate("/payments")}
            className="ml-auto bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
