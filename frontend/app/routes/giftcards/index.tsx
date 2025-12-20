import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Giftcard = {
  id: number;
  code: string;
  initialBalance: number;
  balance: number;
  issuedAt: string;
  expiresAt: string | null;
  isActive: boolean;
};

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("access-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function GiftcardsPage() {
  const navigate = useNavigate();

  const [giftcards, setGiftcards] = useState<Giftcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadGiftcards = async () => {
    try {
      setLoading(true);
      setError(null);

      const merchantId = 1;
      const params = new URLSearchParams({
        includeInactive: String(includeInactive),
        limit: "200",
      });

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/giftcards?${params}`,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Merchant-Id": String(merchantId),
            ...authHeaders(),
          },
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to load giftcards (${res.status})`);
      }

      const data = await res.json();
      const rows = Array.isArray(data.data) ? data.data : [];
      setGiftcards(rows);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load giftcards");
      setGiftcards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGiftcards();
  }, [includeInactive]);

  /** 🔍 Client-side filtering (same pattern as Services) */
  const filteredGiftcards = giftcards.filter((g) => {
    if (!includeInactive && !g.isActive) return false;

    if (!search.trim()) return true;

    return g.code.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) {
    return <div className="p-6 text-black">Loading giftcards…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-[90%] mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          Gift Cards
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* CONTROLS (Services-style) */}
        <div className="bg-gray-300 rounded-md p-6 space-y-4">

          {/* Show inactive */}
          <label className="flex items-center gap-2 text-black text-sm">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            Show inactive
          </label>

          {/* Search */}
          <div className="flex justify-center">
            <div className="flex items-center bg-gray-200 border border-gray-400 rounded-md w-full max-w-3xl px-4 py-3">
              <input
                type="text"
                className="grow bg-transparent focus:outline-none text-black"
                placeholder="Search by gift card code"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="text-black text-lg">⌕</span>
            </div>
          </div>
        </div>

        {/* TABLE HEADERS */}
        <div className="grid grid-cols-6 px-4 text-sm font-medium text-black">
          <span>Code</span>
          <span>Initial Balance</span>
          <span>Balance</span>
          <span>Issued</span>
          <span>Expires</span>
          <span className="text-right">Actions</span>
        </div>

        {/* GIFTCARDS LIST */}
        <div className="space-y-3">
          {filteredGiftcards.length === 0 && (
            <div className="bg-gray-300 rounded-md px-4 py-3 text-black text-center">
              No giftcards found
            </div>
          )}

          {filteredGiftcards.map((giftcard) => (
            <div
              key={giftcard.id}
              className={`grid grid-cols-6 bg-gray-300 text-black rounded-md px-4 py-3 items-center ${
                !giftcard.isActive ? "opacity-50" : ""
              }`}
            >
              <span
                className="font-mono font-bold cursor-pointer hover:text-blue-600"
                onClick={() => navigate(`/giftcards/view/${giftcard.id}`)}
              >
                {giftcard.code}
              </span>

              <span>€ {giftcard.initialBalance.toFixed(2)}</span>
              <span>€ {giftcard.balance.toFixed(2)}</span>
              <span>{new Date(giftcard.issuedAt).toLocaleDateString()}</span>
              <span>
                {giftcard.expiresAt
                  ? new Date(giftcard.expiresAt).toLocaleDateString()
                  : "-"}
              </span>

              <div className="flex justify-end">
                <button
                  onClick={() => navigate(`/giftcards/view/${giftcard.id}`)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CREATE */}
        <div className="pt-6">
          <button
            onClick={() => navigate("/giftcards/create")}
            className="w-48 bg-gray-400 hover:bg-gray-500 rounded-md py-2 text-black"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
