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

export default function GiftcardEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [giftcard, setGiftcard] = useState<Giftcard | null>(null);
  const [form, setForm] = useState({
    balance: 0,
    expiresAt: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      const gc = data.data as Giftcard;
      setGiftcard(gc);
      setForm({
        balance: gc.balance,
        expiresAt: gc.expiresAt ? gc.expiresAt.split("T")[0] : "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to load giftcard");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftcard) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/giftcards/${giftcard.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({
            balance: Number(form.balance),
            expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(
          err?.message || `Failed to update giftcard: ${res.status}`
        );
      }

      navigate(`/giftcards/view/${giftcard.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to update giftcard");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-black">Loading giftcard…</div>;
  }

  if (error && !giftcard) {
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

  if (!giftcard) return null;

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-[90%] max-w-3xl space-y-6">
        
        {/* HEADER */}
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          <div>Edit Gift Card</div>
        </div>

        {/* CODE DISPLAY */}
        <div className="bg-gray-300 rounded-md p-4 space-y-2">
          <div className="text-black text-sm font-medium">Code</div>
          <div className="bg-white border border-gray-400 rounded-md p-2 font-mono font-bold text-black text-center">
            {giftcard.code}
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="bg-gray-300 rounded-md p-6 space-y-6 text-black">
          
          {/* BALANCE */}
          <div>
            <label className="block mb-1 text-sm">
              Current Balance (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="bg-gray-200 rounded-md p-2 w-full text-black"
              value={form.balance}
              onChange={(e) =>
                setForm({ ...form, balance: Number(e.target.value) })
              }
              required
            />
            <div className="text-xs text-gray-600 mt-1">
              Initial balance: €{giftcard.initialBalance.toFixed(2)}
            </div>
          </div>

          {/* EXPIRATION DATE */}
          <div>
            <label className="block mb-1 text-sm">
              Expiration Date
            </label>
            <input
              type="date"
              className="bg-gray-200 rounded-md p-2 w-full text-black"
              value={form.expiresAt}
              onChange={(e) =>
                setForm({ ...form, expiresAt: e.target.value })
              }
            />
            <div className="text-xs text-gray-600 mt-1">
              Leave empty for no expiration
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-gray-400 hover:bg-gray-500 px-6 py-2 rounded-md text-black"
            >
              {saving ? "Saving..." : "Save"}
            </button>

            <button
              type="button"
              onClick={() => navigate(`/giftcards/view/${giftcard.id}`)}
              className="bg-gray-400 hover:bg-gray-500 px-6 py-2 rounded-md text-black"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
