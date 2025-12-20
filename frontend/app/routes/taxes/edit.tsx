import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "~/api";

type ApiTaxRate = {
  id: number;
  rate?: number;
  ratePercent?: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive?: boolean;
};

type ApiTaxCategory = {
  id: number;
  name: string;
  isActive?: boolean;
  rates?: ApiTaxRate[];
  taxRates?: ApiTaxRate[];
};

function normalizeArray<T>(json: any): T[] {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.data?.data)) return json.data.data;
  return [];
}

export default function TaxEdit() {
  const { categoryId, rateId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<{
    categoryName: string;
    ratePercent: string; // display percent (e.g. "21")
    effectiveFrom: string; // datetime-local
    effectiveTo: string;   // datetime-local
    rateActive: boolean;
  } | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await apiFetch(
        `${import.meta.env.VITE_API_URL}/tax/categories/${categoryId}?includeInactive=true`
      );
      const json = await res.json();

      const category: ApiTaxCategory = json.data ?? json;
      const rates = (category.rates ?? category.taxRates ?? []) as ApiTaxRate[];
      const rate = rates.find((r) => r.id === Number(rateId));

      if (!category || !rate) {
        navigate("/taxes");
        return;
      }

      const rateDecimal =
        typeof rate.rate === "number"
          ? rate.rate
          : typeof rate.ratePercent === "number"
          ? rate.ratePercent
          : 0;

      const rateActive = rate.isActive !== false;

      setForm({
        categoryName: category.name ?? "",
        ratePercent: (rateDecimal * 100).toString(),
        effectiveFrom: rate.effectiveFrom ? rate.effectiveFrom.slice(0, 16) : "",
        effectiveTo: rate.effectiveTo ? rate.effectiveTo.slice(0, 16) : "",
        rateActive,
      });
    } catch {
      setError("Failed to load tax");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, rateId]);

  const restoreRate = async () => {
    await apiFetch(`${import.meta.env.VITE_API_URL}/tax/rates/${rateId}/restore`, {
      method: "POST",
    });
    load();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    try {
      setError(null);

      // Update category name
      await apiFetch(`${import.meta.env.VITE_API_URL}/tax/categories/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.categoryName }),
      });

      // If rate is inactive, backend UpdateRateAsync returns null (it checks IsActive).
      // Keep behavior consistent: require restoring first.
      if (!form.rateActive) {
        setError("This rate is inactive. Restore it before editing.");
        return;
      }

      const rateDecimal = Number(form.ratePercent) / 100;

      await apiFetch(`${import.meta.env.VITE_API_URL}/tax/rates/${rateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taxCategoryId: Number(categoryId),

          // send both to avoid backend binding mismatch
          rate: rateDecimal,
          ratePercent: rateDecimal,

          effectiveFrom: form.effectiveFrom
            ? new Date(form.effectiveFrom).toISOString()
            : new Date().toISOString(),
          effectiveTo: form.effectiveTo ? new Date(form.effectiveTo).toISOString() : null,
        }),
      });

      navigate("/taxes");
    } catch {
      setError("Failed to update tax");
    }
  };

  if (loading || !form) {
    return <div className="p-6 text-black">Loading tax…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-[90%] max-w-3xl space-y-6">
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          Edit Tax
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-300 rounded-md p-6 space-y-6 text-black">
          <div>
            <label className="block mb-1 text-sm">Category Name</label>
            <input
              className="bg-gray-200 p-2 rounded w-full"
              value={form.categoryName}
              onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">Rate (percent)</label>
            <input
              type="number"
              step="0.01"
              className="bg-gray-200 p-2 rounded w-full"
              value={form.ratePercent}
              onChange={(e) => setForm({ ...form, ratePercent: e.target.value })}
              required
              disabled={!form.rateActive}
            />
            {!form.rateActive && (
              <div className="text-xs text-red-700 mt-1">
                This rate is inactive. Restore it to edit.
              </div>
            )}
          </div>

          <div>
            <label className="block mb-1 text-sm">Effective From</label>
            <input
              type="datetime-local"
              className="bg-gray-200 p-2 rounded w-full"
              value={form.effectiveFrom}
              onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
              disabled={!form.rateActive}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">Effective To (optional)</label>
            <input
              type="datetime-local"
              className="bg-gray-200 p-2 rounded w-full"
              value={form.effectiveTo}
              onChange={(e) => setForm({ ...form, effectiveTo: e.target.value })}
              disabled={!form.rateActive}
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-4 pt-2">
            {!form.rateActive ? (
              <button
                type="button"
                onClick={restoreRate}
                className="bg-green-400 hover:bg-green-500 px-6 py-2 rounded-md text-black"
              >
                Restore rate
              </button>
            ) : (
              <button
                type="submit"
                className="bg-gray-400 hover:bg-gray-500 px-6 py-2 rounded-md text-black"
              >
                Save
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate("/taxes")}
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
