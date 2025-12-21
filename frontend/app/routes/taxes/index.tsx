import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { apiFetch } from "~/api";

type TaxRate = {
  id: number;
  rate: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive?: boolean;
};

type TaxCategory = {
  id: number;
  name: string;
  isActive?: boolean;
  rates?: TaxRate[];
};

export default function TaxesPage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<TaxCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const loadTaxes = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(
        `${import.meta.env.VITE_API_URL}/tax/categories?includeInactive=${showInactive}`
      );
      const json = await res.json();

      const data: TaxCategory[] = Array.isArray(json.data) ? json.data : [];

      setCategories([
        ...data.filter((c) => c.isActive !== false),
        ...data.filter((c) => c.isActive === false),
      ]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadTaxes();
  }, [showInactive]);

  const filtered = useMemo(() => {
    return categories.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [categories, search]);

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
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            Show inactive
          </label>

          {/* Search */}
          <div className="flex justify-center">
            <div className="flex items-center bg-gray-200 border border-gray-400 rounded-md w-full max-w-3xl px-4 py-3">
              <input
                type="text"
                className="grow bg-transparent focus:outline-none text-black"
                placeholder="Search tax category"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="text-black text-sm">⌕</span>
            </div>
          </div>
        </div>

        {/* TABLE HEADER */}
        <div className="grid grid-cols-5 px-4 text-sm font-medium text-black">
          <span>Category</span>
          <span>Rate</span>
          <span>From</span>
          <span>To</span>
          <span className="text-right pr-2">Actions</span>
        </div>

        {/* TAXES LIST */}
        <div className="space-y-3">
          {filtered.map((cat) =>
            (cat.rates ?? []).map((rate) => (
              <div
                key={rate.id}
                className={`grid grid-cols-5 bg-gray-300 rounded-md px-4 py-3 items-center text-black ${
                  cat.isActive === false || rate.isActive === false
                    ? "opacity-50"
                    : ""
                }`}
              >
                <span className="font-medium">{cat.name}</span>
                <span>{(rate.rate * 100).toFixed(2)}%</span>
                <span>
                  {new Date(rate.effectiveFrom).toLocaleDateString()}
                </span>
                <span>
                  {rate.effectiveTo
                    ? new Date(rate.effectiveTo).toLocaleDateString()
                    : "—"}
                </span>

                {/* ACTION BUTTONS */}
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => navigate(`/taxes/${cat.id}/rates/${rate.id}/edit`)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Edit
                  </button>

                  {rate.isActive !== false ? (
                    <button
                      onClick={async () => {
                        await apiFetch(
                          `${import.meta.env.VITE_API_URL}/tax/rates/${rate.id}`,
                          { method: "DELETE" }
                        );
                        loadTaxes();
                      }}
                      className="px-3 py-1 bg-red-400 hover:bg-red-500 text-black rounded"
                    >
                      Delete
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        await apiFetch(
                          `${import.meta.env.VITE_API_URL}/tax/rates/${rate.id}/restore`,
                          { method: "POST" }
                        );
                        loadTaxes();
                      }}
                      className="px-3 py-1 bg-green-400 hover:bg-green-500 text-black rounded"
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
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
