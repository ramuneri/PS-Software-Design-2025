import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function GiftcardCreate() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    initialBalance: 50,
    code: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("access-token");
      const merchantId = 1;

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/giftcards`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Merchant-Id": String(merchantId),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            initialBalance: form.initialBalance,
            code: form.code || null,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(
          err?.message || `Failed to create giftcard: ${res.status}`
        );
      }

      const data = await res.json();
      setGeneratedCode(data.data.code);
      
      setTimeout(() => {
        navigate("/giftcards");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to create giftcard");
    } finally {
      setLoading(false);
    }
  };

  if (generatedCode) {
    return (
      <div className="min-h-screen bg-gray-200 p-6 flex justify-center items-center">
        <div className="w-[90%] max-w-md bg-green-100 border border-green-400 rounded-md p-8 text-center space-y-4">
          <div className="text-2xl font-bold text-green-700">
            Gift Card Created!
          </div>
          <div className="text-gray-700">
            The gift card has been successfully created with the code:
          </div>
          <div className="bg-white border-2 border-green-500 rounded-md p-4 font-mono font-bold text-2xl text-green-700">
            {generatedCode}
          </div>
          <div className="text-sm text-gray-600">
            Redirecting to gift cards list...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-[90%] max-w-3xl space-y-6">
        
        {/* PAGE HEADER */}
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          Issue Gift Card
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="bg-gray-300 rounded-md p-6 space-y-6 text-black"
        >
          
          {/* INITIAL BALANCE */}
          <div>
            <label className="block mb-1 text-sm">Initial Balance (€)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="bg-gray-200 rounded-md p-2 w-full text-black"
              value={form.initialBalance}
              onChange={(e) =>
                setForm({ ...form, initialBalance: Number(e.target.value) })
              }
              required
            />
          </div>

          {/* CODE (OPTIONAL) */}
          <div>
            <label className="block mb-1 text-sm">Code (Optional)</label>
            <input
              type="text"
              className="bg-gray-200 rounded-md p-2 w-full text-black"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="Leave empty for auto-generated code or create yours"
            />
          </div>

          {/* BUTTONS */}
          <div>
            <label className="block mb-2 text-sm font-medium">
              Quick Amounts
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[25, 50, 100].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() =>
                    setForm({ ...form, initialBalance: amount })
                  }
                  className={`py-2 rounded-md font-medium transition-colors ${
                    form.initialBalance === amount
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-black hover:bg-gray-400"
                  }`}
                >
                  €{amount}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-400 hover:bg-gray-500 px-6 py-2 rounded-md text-black"
            >
              {loading ? "Creating..." : "Create"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/giftcards")}
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
