import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "~/api";

type TaxCategoryOption = { id: number; name: string; isActive?: boolean };

function normalizeArray<T>(json: any): T[] {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.data?.data)) return json.data.data;
  return [];
}

export default function TaxCreate() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<TaxCategoryOption[]>([]);
  const [useExisting, setUseExisting] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await apiFetch(`${import.meta.env.VITE_API_URL}/tax/categories?includeInactive=true`);
        const json = await res.json();
        setCategories(normalizeArray<TaxCategoryOption>(json));
      } catch {
        console.error("Failed to load tax categories");
      }
    }
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      let catId = selectedCategoryId;

      // If using existing category, restore if inactive (your original behavior)
      if (useExisting) {
        if (!catId) {
          setError("Please select a category.");
          return;
        }

        const selected = categories.find((c) => c.id === catId);
        if (selected && selected.isActive === false) {
          await apiFetch(`${import.meta.env.VITE_API_URL}/tax/categories/${selected.id}/restore`, {
            method: "POST",
          });
        }
      } else {
        if (!name.trim()) {
          setError("Please enter a category name.");
          return;
        }

        const catRes = await apiFetch(`${import.meta.env.VITE_API_URL}/tax/categories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        });

        const catJson = await catRes.json();
        catId = catJson.data?.id ?? catJson.id;

        if (!catId) {
          setError("Failed to create category.");
          return;
        }
      }

      const rateDecimal = Number(rate) / 100;

      await apiFetch(`${import.meta.env.VITE_API_URL}/tax/categories/${catId}/rates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // send both names to avoid binding mismatch
          rate: rateDecimal,
          ratePercent: rateDecimal,

          effectiveFrom: effectiveFrom
            ? new Date(effectiveFrom).toISOString()
            : new Date().toISOString(),
          effectiveTo: effectiveTo ? new Date(effectiveTo).toISOString() : null,
        }),
      });

      navigate("/taxes");
    } catch {
      setError("Failed to create tax");
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-[90%] max-w-3xl space-y-6">
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          Create Tax
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-300 rounded-md p-6 space-y-6 text-black">
          <div className="flex items-center gap-6">
            <label className="text-sm flex items-center gap-2">
              <input
                type="radio"
                checked={useExisting}
                onChange={() => setUseExisting(true)}
              />
              Use existing category
            </label>

            <label className="text-sm flex items-center gap-2">
              <input
                type="radio"
                checked={!useExisting}
                onChange={() => {
                  setUseExisting(false);
                  setSelectedCategoryId(null);
                }}
              />
              Create new category
            </label>
          </div>

          {useExisting ? (
            <div>
              <label className="block mb-1 text-sm">Select Category</label>
              <select
                className="bg-gray-200 p-2 rounded w-full"
                value={selectedCategoryId ?? ""}
                onChange={(e) =>
                  setSelectedCategoryId(e.target.value ? Number(e.target.value) : null)
                }
                required
              >
                <option value="">-- Choose --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.isActive === false ? "(inactive)" : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block mb-1 text-sm">New Category Name</label>
              <input
                className="bg-gray-200 p-2 rounded w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label className="block mb-1 text-sm">Rate (percent)</label>
            <input
              type="number"
              step="0.01"
              className="bg-gray-200 p-2 rounded w-full"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="e.g. 21"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">Effective From</label>
            <input
              type="datetime-local"
              className="bg-gray-200 p-2 rounded w-full"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">Effective To (optional)</label>
            <input
              type="datetime-local"
              className="bg-gray-200 p-2 rounded w-full"
              value={effectiveTo}
              onChange={(e) => setEffectiveTo(e.target.value)}
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              className="bg-gray-400 hover:bg-gray-500 px-6 py-2 rounded-md text-black"
            >
              Create
            </button>

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
