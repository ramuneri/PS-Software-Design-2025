import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type PaymentRow = {
  paymentId: number;
  orderId: number;
  method?: string | null;
  amount: number;
  currency?: string | null;
  paymentStatus?: string | null;
};

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("access-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function PaymentsPage() {
  const navigate = useNavigate();

  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("");

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/payments`,
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

      if (!res.ok) {
        throw new Error(`Failed to load payments (${res.status})`);
      }

      const data = await res.json();
      const rows = Array.isArray(data) ? data : data.data ?? [];
      setPayments(rows);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load payments");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadPayments();
  }, []);

  const filteredPayments = payments.filter((p) => {
    const searchMatch =
      !search.trim() ||
      p.orderId.toString().includes(search.trim()) ||
      p.method?.toLowerCase().includes(search.toLowerCase());

    if (!searchMatch) return false;

    if (method && p.method !== method) return false;

    return true;
  });

  if (loading) {
    return (
      <div className="p-6 text-black">
        Loading payments…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-[90%] mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          Payment List
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* CONTROLS */}
        <div className="bg-gray-300 rounded-md p-6 space-y-4">

          {/* Search */}
          <div className="flex justify-center">
            <div className="flex items-center bg-gray-200 border border-gray-400 rounded-md w-full max-w-3xl px-4 py-3">
              <input
                type="text"
                className="grow bg-transparent focus:outline-none text-black"
                placeholder="Search by order id or method"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="text-black text-lg">⌕</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-black text-sm">Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="bg-gray-200 rounded-md px-3 py-2 text-black"
            >
              <option value="">All</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="GIFT_CARD">Gift Card</option>
            </select>
          </div>
        </div>

        {/* TABLE HEADER */}
        <div className="grid grid-cols-5 px-4 text-sm font-medium text-black">
          <span>Order</span>
          <span>Method</span>
          <span>Amount</span>
          <span>Currency</span>
          <span className="text-right">Payment status</span>
        </div>

        {/* PAYMENTS LIST */}
        <div className="space-y-3">
          {filteredPayments.length === 0 && (
            <div className="bg-gray-300 rounded-md px-4 py-3 text-center text-black">
              No payments found
            </div>
          )}

          {filteredPayments.map((payment) => (
            <div
              key={payment.paymentId}
              onClick={() => navigate(`/payments/${payment.paymentId}`)}
              className="grid grid-cols-5 bg-gray-300 text-black rounded-md px-4 py-3 items-center cursor-pointer hover:bg-gray-400 transition-colors"
            >
              <span>{payment.orderId}</span>
              <span>{payment.method ?? "-"}</span>
              <span>{payment.amount.toFixed(2)}</span>
              <span>{payment.currency ?? "-"}</span>
              <span className="text-right">
                {payment.paymentStatus ?? "-"}
              </span>
            </div>
          ))}
        </div>

        {/* ACTION BUTTON */}
        <div className="pt-6">
          <button
            onClick={() => navigate("/payments/create")}
            className="w-48 bg-gray-400 hover:bg-gray-500 rounded-md py-2 text-black"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
