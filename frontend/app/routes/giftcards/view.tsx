import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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

export default function GiftcardViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [giftcard, setGiftcard] = useState<Giftcard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadGiftcard();
  }, [id]);

  const loadGiftcard = async () => {
    if (!id) return;

    try {
      setError(null);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/giftcards/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to load giftcard: ${res.status}`);
      }

      const data = await res.json();
      setGiftcard(data.data);
    } catch (err: any) {
      setError(err.message || "Failed to load giftcard");
    } finally {
      setLoading(false);
    }
  };

  const deleteGiftcard = async () => {
    if (!giftcard || !confirm("Are you sure you want to delete this giftcard?")) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/giftcards/${giftcard.id}`,
        {
          method: "DELETE",
          headers: authHeaders(),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to delete giftcard");
      }

      navigate("/giftcards");
    } catch (err: any) {
      alert(err.message || "Error deleting giftcard");
    }
  };

  const restoreGiftcard = async () => {
    if (!giftcard) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/giftcards/${giftcard.id}/restore`,
        {
          method: "POST",
          headers: authHeaders(),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to restore giftcard");
      }

      loadGiftcard();
    } catch (err: any) {
      alert(err.message || "Error restoring giftcard");
    }
  };

  if (loading) {
    return <div className="p-6 text-black">Loading giftcard…</div>;
  }

  if (error || !giftcard) {
    return (
      <div className="min-h-screen bg-gray-200 p-6 flex justify-center items-center">
        <div className="w-[90%] max-w-md bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded space-y-4">
          <div className="font-bold">{error || "Giftcard not found"}</div>
          <button
            onClick={() => navigate("/giftcards")}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  const isExpired = giftcard.expiresAt && new Date(giftcard.expiresAt) < new Date();
  const daysRemaining = giftcard.expiresAt
    ? Math.ceil(
        (new Date(giftcard.expiresAt).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-[90%] max-w-3xl space-y-6">
        
        {/* HEADER */}
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          Gift Card View
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* MAIN DETAILS */}
        <div className="bg-gray-300 rounded-md p-6 space-y-6">
          {/* CODE */}
          <div className="space-y-2">
            <div className="text-black font-medium text-sm">Gift Card Code</div>
            <div className="bg-white border-2 border-gray-400 rounded-md p-4 font-mono font-bold text-2xl text-black text-center">
              {giftcard.code}
            </div>
          </div>

          {/* STATUS BADGE */}
          <div>
            <div
              className={`bg-gray-200 p-2 rounded w-full text-black ${
                giftcard.isActive
                  ? "bg-green-100"
                  : "bg-red-100"
              }`}
            >
              {giftcard.isActive ? "Active" : "Inactive"}
            </div>
            {isExpired && (
              <div className="px-3 py-1 rounded text-sm font-medium bg-orange-200 text-orange-800">
                Expired
              </div>
            )}
          </div>

          {/* BALANCE SECTION */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-200 rounded-md p-4">
              <div className="text-black text-sm font-medium mb-2">
                Initial Balance
              </div>
              <div className="text-black text-2xl font-bold">
                €{giftcard.initialBalance.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-200 rounded-md p-4">
              <div className="text-black text-sm font-medium mb-2">
                Current Balance
              </div>
              <div className="text-black text-2xl font-bold">
                €{giftcard.balance.toFixed(2)}
              </div>
            </div>
          </div>

          {/* USAGE */}
          <div className="bg-gray-200 rounded-md p-4">
            <div className="text-black text-sm font-medium mb-2">Used Amount</div>
            <div className="text-black text-2xl font-bold">
              €{(giftcard.initialBalance - giftcard.balance).toFixed(2)}
            </div>
            <div className="text-gray-700 text-sm mt-2">
              {(
                ((giftcard.initialBalance - giftcard.balance) /
                  giftcard.initialBalance) *
                100
              ).toFixed(1)}
              % used
            </div>
          </div>

          {/* DATES */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-black text-sm font-medium mb-2">
                Issued Date
              </div>
              <div className="text-black">
                {new Date(giftcard.issuedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
            <div>
              <div className="text-black text-sm font-medium mb-2">
                Expiration Date
              </div>
              <div
                className={`${
                  isExpired
                    ? "text-red-600 font-bold"
                    : giftcard.expiresAt
                    ? "text-black"
                    : "text-gray-600"
                }`}
              >
                {giftcard.expiresAt
                  ? new Date(giftcard.expiresAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "No expiration"}
                {daysRemaining !== null && daysRemaining > 0 && (
                  <div className="text-sm text-gray-600 mt-1">
                    {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-4 justify-end">
          <button
            onClick={() => navigate("/giftcards")}
            className="bg-gray-400 hover:bg-gray-500 px-6 py-2 rounded-md text-black"
          >
            Back
          </button>
          {giftcard.isActive && (
            <button
              onClick={() => navigate(`/giftcards/edit/${giftcard.id}`)}
              className="bg-blue-400 hover:bg-bue-500 px-6 py-2 rounded-md text-black"
            >
              Edit
            </button>
          )}
          {giftcard.isActive ? (
            <button
              onClick={deleteGiftcard}
              className="bg-red-400 hover:bg-red-500 px-6 py-2 rounded-md text-black"
            >
              Delete
            </button>
          ) : (
            <button
              onClick={restoreGiftcard}
              className="bg-green-400 hover:bg-green-500 px-6 py-2 rounded-md text-black"
            >
              Restore
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
