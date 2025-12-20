import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "~/api";

type TaxRate = {
  id: number;
  taxCategoryId: number;
  ratePercent: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
};

type TaxCategory = {
  id: number;
  name: string;
  isActive: boolean;
  rates: TaxRate[];
};

type TaxRow = {
  categoryId: number;
  categoryName: string;
  categoryActive: boolean;
  rate: TaxRate;
};

export default function TaxesPage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<TaxCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);

  const loadTaxes = async () => {
    try {
      setLoading(true);

      const res = await apiFetch(
        `${import.meta.env.VITE_API_URL}/tax/categories?includeInactive=true`
      );
      const json = await res.json();

      const data: TaxCategory[] =
        Array.isArray(json.data) ? json.data : json.data?.data || [];

      setCategories(data);
    } catch {
      console.error("Failed to load taxes");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadTaxes();
  }, []);

  const rows: TaxRow[] = useMemo(() => {
    return categories.flatMap((c) =>
      c.rates.map((r) => ({
        categoryId: c.id,
        categoryName: c.name,
        categoryActive: c.isActive,
        rate: r,
      }))
    );
  }, [categories]);

  const filtered = rows.filter((row) => {
    if (!includeInactive && (!row.categoryActive || !row.rate.isActive)) {
      return false;
    }

    return row.categoryName
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  const deleteRate = async (id: number) => {
    await apiFetch(`${import.meta.env.VITE_API_URL}/tax/rates/${id}`, {
      method: "DELETE",
    });
    loadTaxes();
  };

  const restoreRate = async (id: number) => {
    await apiFetch(
      `${import.meta.env.VITE_API_URL}/tax/rates/${id}/restore`,
      { method: "POST" }
    );
    loadTaxes();
  };

  if (loading) {
    return <div className="p-6 text-black">Loading taxes…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-[90%] space-y-6">

        {/* HEADER */}
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          Taxes List
        </div>

        {/* CONTROLS */}
        <div className="bg-gray-300 rounded-md p-6 space-y-4">
          
          {/* Checkbox */}
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
                className="grow bg-transparent focus:outline-none text-black"
                placeholder="Search tax category"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="text-black text-lg">🔍</span>
            </div>
          </div>
        </div>

        {/* TABLE HEADERS */}
        <div className="grid grid-cols-6 px-4 text-sm font-medium text-black">
          <span>Category</span>
          <span>Rate (%)</span>
          <span>Effective From</span>
          <span>Effective To</span>
          <span>Status</span>
          <span className="text-right pr-6">Actions</span>
        </div>

        {/* TAXES LIST */}
        <div className="space-y-3">
          {filtered.map((row) => (
            <div
              key={row.rate.id}
              className={`grid grid-cols-6 bg-gray-300 rounded-md px-4 py-3 items-center text-black ${
                !row.categoryActive || !row.rate.isActive ? "opacity-50" : ""
              }`}
            >
              <span>{row.categoryName}</span>
              <span>{(row.rate.ratePercent * 100).toFixed(2)}</span>
              <span>{new Date(row.rate.effectiveFrom).toLocaleString()}</span>
              <span>
                {row.rate.effectiveTo
                  ? new Date(row.rate.effectiveTo).toLocaleString()
                  : "—"}
              </span>
              <span>
                {row.rate.isActive ? "Active" : "Inactive"}
              </span>

              {/* ACTION BUTTONS */}  
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => navigate(`/taxes/${row.categoryId}/rates/${row.rate.id}/edit`)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Edit
                </button>

                {row.rate.isActive ? (
                  <button
                    onClick={() => deleteRate(row.rate.id)}
                    className="px-3 py-1 bg-red-400 hover:bg-red-500 text-black rounded"
                  >
                    Delete
                  </button>
                ) : (
                  <button
                    onClick={() => restoreRate(row.rate.id)}
                    className="px-3 py-1 bg-green-400 hover:bg-green-500 text-black rounded"
                  >
                    Restore
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-6">
          <button
            onClick={() => navigate("/taxes/create")}
            className="w-48 bg-gray-400 hover:bg-gray-500 rounded-md py-2 text-black"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
