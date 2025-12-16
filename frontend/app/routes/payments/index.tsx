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

  const loadPayments = async (
    nextSearch: string = search,
    nextMethod: string = method
  ) => {
    try {
      setLoading(true);
      setError(null);

      const url = new URL(`${import.meta.env.VITE_API_URL}/api/payments`);
      if (nextSearch.trim()) url.searchParams.set("search", nextSearch.trim());
      if (nextMethod) url.searchParams.set("method", nextMethod);

      const res = await fetch(url.toString(), {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
      });

      if (res.status === 401) {
        localStorage.removeItem("access-token");
        navigate("/login");
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to load payments (${res.status})`);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadPayments(search, method);
  };

  const clearFilters = () => {
    setSearch("");
    setMethod("");
    loadPayments("", "");
  };

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-[90%] mx-auto space-y-6">

        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          Payment List
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSearch}
          className="bg-gray-300 rounded-md p-4 space-y-3"
        >
          <div className="flex gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order id or method…"
              className="flex-1 bg-gray-200 rounded-md px-3 py-2 text-black"
            />
            <button
              type="submit"
              className="bg-gray-400 text-black px-4 py-2 rounded hover:bg-gray-500"
            >
              Search
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300"
            >
              Clear
            </button>
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
            <button
              type="button"
              onClick={loadPayments}
              className="ml-auto bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300"
            >
              Refresh
            </button>
          </div>
        </form>

        <div className="grid grid-cols-5 px-4 text-sm font-medium text-black">
          <span>Order</span>
          <span>Method</span>
          <span>Amount</span>
          <span>Currency</span>
          <span className="text-right">Payment status</span>
        </div>

        <div className="space-y-3">
          {loading && (
            <div className="bg-gray-300 rounded-md px-4 py-3 text-center text-black">
              Loading payments…
            </div>
          )}

          {!loading && payments.length === 0 && (
            <div className="bg-gray-300 rounded-md px-4 py-3 text-center text-black">
              No payments found
            </div>
          )}

          {!loading &&
            payments.map((payment) => (
              <div
                key={payment.paymentId}
                onClick={() => navigate(`/payments/${payment.paymentId}`)}
                className="grid grid-cols-5 bg-gray-300 text-black rounded-md px-4 py-3 items-center cursor-pointer hover:bg-gray-400 transition-colors"
              >
                <span className="font-mono font-semibold">{payment.orderId}</span>
                <span>{payment.method ?? "-"}</span>
                <span>{payment.amount.toFixed(2)}</span>
                <span>{payment.currency ?? "-"}</span>
                <span className="text-right">{payment.paymentStatus ?? "-"}</span>
              </div>
            ))}
        </div>

        <div className="pt-6 flex gap-3">
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
