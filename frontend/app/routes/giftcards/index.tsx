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
  const [searchCode, setSearchCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadGiftcards = async () => {
    try {
      setError(null);
      const merchantId = 1;
      const params = new URLSearchParams({
        includeInactive: String(includeInactive),
      });

      if (searchCode) {
        params.append("code", searchCode);
      }

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
        throw new Error(`Failed to load giftcards: ${res.status}`);
      }

      const data = await res.json();
      setGiftcards(Array.isArray(data.data) ? data.data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load giftcards");
      setGiftcards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGiftcards();
  }, [includeInactive]);

  const deleteGiftcard = async (id: number) => {
    if (!confirm("Are you sure you want to delete this giftcard?")) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/giftcards/${id}`,
        {
          method: "DELETE",
          headers: authHeaders(),
        }
      );

      if (!res.ok) {
        alert("Failed to delete giftcard");
        return;
      }

      loadGiftcards();
    } catch (err) {
      alert("Error deleting giftcard");
    }
  };

  const restoreGiftcard = async (id: number) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/giftcards/${id}/restore`,
        {
          method: "POST",
          headers: authHeaders(),
        }
      );

      if (!res.ok) {
        alert("Failed to restore giftcard");
        return;
      }

      loadGiftcards();
    } catch (err) {
      alert("Error restoring giftcard");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadGiftcards();
  };

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

        {/* ERROR MESSAGE */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* SEARCH SECTION */}
        <form
          onSubmit={handleSearch}
          className="bg-gray-300 rounded-md p-4 space-y-3"
        >
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search by code..."
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="flex-1 bg-gray-200 rounded-md px-3 py-2 text-black"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchCode("");
              }}
              className="bg-gray-400 text-black px-4 py-2 rounded hover:bg-gray-500"
            >
              Clear
            </button>
          </div>

          {/* Show inactive checkbox */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            <span className="text-black">Show inactive</span>
          </div>
        </form>

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
          {giftcards.length === 0 ? (
            <div className="bg-gray-300 rounded-md px-4 py-3 text-black text-center">
              No giftcards found
            </div>
          ) : (
            giftcards.map((giftcard) => (
              <div
                key={giftcard.id}
                className={`grid grid-cols-6 bg-gray-300 text-black rounded-md px-4 py-3 items-center ${
                  !giftcard.isActive ? "opacity-50" : ""
                }`}
              >
                <span className="font-mono font-bold cursor-pointer hover:text-blue-600" onClick={() => navigate(`/giftcards/view/${giftcard.id}`)}>{giftcard.code}</span>
                <span>€ {giftcard.initialBalance.toFixed(2)}</span>
                <span>€ {giftcard.balance.toFixed(2)}</span>
                <span>
                  {new Date(giftcard.issuedAt).toLocaleDateString()}
                </span>
                <span>
                  {giftcard.expiresAt
                    ? new Date(giftcard.expiresAt).toLocaleDateString()
                    : "-"}
                </span>

                {/* ACTION BUTTONS */}
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => navigate(`/giftcards/view/${giftcard.id}`)}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
                  >
                    View
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* CREATE BUTTON */}
        <div className="pt-6">
          <button
            onClick={() => navigate("/giftcards/create")}
            className="w-48 bg-gray-400 hover:bg-gray-500 rounded-md py-2 text-black"
          >
            Issue New
          </button>
        </div>
      </div>
    </div>
  );
}
