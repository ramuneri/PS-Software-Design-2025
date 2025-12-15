import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { apiFetch } from "~/api";

export default function TaxCreate() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<{ id: number; name: string; isActive?: boolean }[]>([]);
  const [useExisting, setUseExisting] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [rate, setRate] = useState<string>("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await apiFetch(`${import.meta.env.VITE_API_URL}/tax/categories`);
        const json = await res.json();
        const data = Array.isArray(json.data) ? json.data : json.data?.data || [];
        setCategories(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      let catId = selectedCategoryId;

      if (useExisting) {
        const selected = categories.find((c) => c.id === selectedCategoryId);
        if (selected && selected.isActive === false) {
          await apiFetch(`${import.meta.env.VITE_API_URL}/tax/categories/${selected.id}/restore`, {
            method: "POST"
          });
        }
      } else {
        const catRes = await apiFetch(`${import.meta.env.VITE_API_URL}/tax/categories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() })
        });
        if (!catRes.ok) throw new Error("Failed to create category");
        const catJson = await catRes.json();
        catId = catJson.data?.id ?? catJson.id;
      }

      if (!catId) {
        setError("Please select or create a category.");
        return;
      }

      if (catId && rate) {
        const rateDecimal = Number(rate) / 100;
        const parsedFrom = effectiveFrom ? Date.parse(effectiveFrom) : Date.now();
        const parsedTo = effectiveTo ? Date.parse(effectiveTo) : NaN;
        const rateRes = await apiFetch(`${import.meta.env.VITE_API_URL}/tax/categories/${catId}/rates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rate: rateDecimal,
            effectiveFrom: isNaN(parsedFrom) ? new Date().toISOString() : new Date(parsedFrom).toISOString(),
            effectiveTo: isNaN(parsedTo) ? null : new Date(parsedTo).toISOString()
          })
        });
        if (!rateRes.ok) throw new Error("Failed to create tax rate");
      }

      navigate("/taxes");
    } catch (err) {
      console.error(err);

      // Try to give a helpful overlap message
      if (useExisting && selectedCategoryId) {
        try {
          const catRes = await apiFetch(`${import.meta.env.VITE_API_URL}/tax/categories/${selectedCategoryId}`);
          const catJson = await catRes.json();
          const catData = catJson.data ?? catJson;

          const requestedStart = effectiveFrom ? Date.parse(effectiveFrom) : Date.now();
          const overlapping = (catData.rates ?? []).find((r: any) => {
            const from = Date.parse(r.effectiveFrom);
            const to = r.effectiveTo ? Date.parse(r.effectiveTo) : null;
            return from <= requestedStart && (to === null || to > requestedStart);
          });

          if (overlapping) {
            const to = overlapping.effectiveTo
              ? new Date(overlapping.effectiveTo).toLocaleString()
              : null;
            setError(
              to
                ? `Overlaps existing rate (${(overlapping.rate * 100).toFixed(2)}%) active until ${to}. Choose a start after that.`
                : `Overlaps an existing rate with no end date. End that rate or choose a later start after it is closed.`
            );
            return;
          }
        } catch (lookupErr) {
          console.error("Could not analyze overlap", lookupErr);
        }
      }

      setError("Failed to create tax");
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-[90%] max-w-3xl space-y-6">
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          Create Tax
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-300 rounded-md p-6 space-y-6 text-black"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm">Rate (percent)</label>
              <input
                type="number"
                step="0.01"
                className="bg-gray-200 p-2 rounded w-full"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="e.g. 15"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm">Effective from</label>
              <input
                type="datetime-local"
                className="bg-gray-200 p-2 rounded w-full"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 text-sm">Effective until (optional)</label>
              <input
                type="datetime-local"
                className="bg-gray-200 p-2 rounded w-full"
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.target.value)}
              />
            </div>
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
