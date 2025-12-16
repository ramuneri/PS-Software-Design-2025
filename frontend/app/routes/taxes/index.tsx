import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { apiFetch } from "~/api";

type TaxRate = {
  id: number;
  taxCategoryId: number;
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

export default function TaxesIndex() {
  const navigate = useNavigate();
  const [taxes, setTaxes] = useState<TaxCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState<{
    categoryId: number;
    rateId: number | null;
    name: string;
    rate: string;
    from: string;
    to: string;
  } | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`${import.meta.env.VITE_API_URL}/tax/categories?includeInactive=${showInactive}`);
        const json = await res.json();
        const data: TaxCategory[] = Array.isArray(json.data) ? json.data : json.data?.data || [];
        setTaxes(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load taxes");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [showInactive]);

  const groups = useMemo(() => {
    const filteredCats = taxes.filter((c) =>
      c.name.toLowerCase().includes(search.trim().toLowerCase())
    );

    return filteredCats
      .map((c) => {
        const categoryActive = c.isActive !== false;
        const rates = (c.rates ?? []).map((r) => ({
          ...r,
          displayRate: r.rate * 100,
          rateActive: r.isActive !== false,
        }));

        const shownRates = showInactive
          ? rates.filter((r) => r.rateActive === false)
          : rates.filter((r) => r.rateActive);

        const includeCategory = showInactive
          ? !categoryActive || shownRates.length > 0
          : categoryActive;

        return includeCategory
          ? {
              id: c.id,
              name: c.name,
              isActive: categoryActive,
              rates: shownRates,
            }
          : null;
      })
      .filter(Boolean) as Array<{ id: number; name: string; isActive: boolean; rates: Array<TaxRate & { displayRate: number; rateActive: boolean }> }>;
  }, [taxes, search, showInactive]);

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-[90%] max-w-5xl space-y-6">
        {/* HEADER */}
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          <div className="text-sm font-medium">Taxes List</div>
        </div>

        {/* SEARCH AREA */}
        <div className="bg-gray-300 rounded-md p-4 text-black space-y-4">
          <label className="flex items-center gap-2 text-black text-sm">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            Show inactive
          </label>

          <div className="flex justify-center">
            <div className="flex items-center bg-gray-200 border border-gray-400 rounded-md w-full max-w-3xl px-4 py-3">
              <input
                type="text"
                className="grow bg-transparent focus:outline-none text-black"
                placeholder="Search for specific item"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="text-black text-lg">🔍</span>
            </div>
          </div>

          <div className="flex justify-center">
            <button className="bg-gray-400 hover:bg-gray-500 px-6 py-2 rounded text-black">
              Search
            </button>
          </div>

          {loading && <div className="text-sm">Loading...</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}

          {!loading && !error && (
            <div className="space-y-4">
              {groups.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-gray-300 rounded-md p-4 text-black space-y-3 border border-gray-400 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium">{cat.name}</div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          cat.isActive ? "bg-green-200 text-green-800" : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {cat.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {cat.isActive ? (
                        <button
                          className="bg-red-400 hover:bg-red-500 text-white px-3 py-1 rounded text-xs"
                          onClick={async () => {
                            setLoading(true);
                            setError(null);
                            try {
                              await apiFetch(`${import.meta.env.VITE_API_URL}/tax/categories/${cat.id}`, {
                                method: "DELETE"
                              });
                              const res = await apiFetch(`${import.meta.env.VITE_API_URL}/tax/categories?includeInactive=${showInactive}`);
                              const json = await res.json();
                              const data: TaxCategory[] = Array.isArray(json.data) ? json.data : json.data?.data || [];
                              setTaxes(data);
                            } catch (err) {
                              console.error(err);
                              setError("Failed to delete category");
                            } finally {
                              setLoading(false);
                            }
                          }}
                        >
                          Delete
                        </button>
                      ) : (
                        <button
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
                          onClick={async () => {
                            setLoading(true);
                            setError(null);
                            try {
                              await apiFetch(`${import.meta.env.VITE_API_URL}/tax/categories/${cat.id}/restore`, {
                                method: "POST"
                              });
                              const res = await apiFetch(`${import.meta.env.VITE_API_URL}/tax/categories?includeInactive=${showInactive}`);
                              const json = await res.json();
                              const data: TaxCategory[] = Array.isArray(json.data) ? json.data : json.data?.data || [];
                              setTaxes(data);
                            } catch (err) {
                              console.error(err);
                              setError("Failed to restore category");
                            } finally {
                              setLoading(false);
                            }
                          }}
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-5 px-2 text-xs font-medium">
                    <span>Rate</span>
                    <span>Effective from</span>
                    <span>Effective until</span>
                    <span className="col-span-2 text-right pr-4">Actions</span>
                  </div>

                  <div className="space-y-2">
                    {cat.rates.length === 0 && (
                      <div className="text-sm text-black px-2 py-2 bg-gray-200 rounded-md">
                        No rates
                      </div>
                    )}
                    {cat.rates.map((r, idx) => (
                      <div
                        key={`${r.id}-${idx}`}
                        className="grid grid-cols-5 bg-gray-200 text-black rounded-md px-3 py-2 items-center"
                      >
                        <span>{`${r.displayRate}%`}</span>
                        <span>
                          {r.effectiveFrom
                            ? new Date(r.effectiveFrom).toLocaleString()
                            : "—"}
                        </span>
                        <span>
                          {r.effectiveTo
                            ? new Date(r.effectiveTo).toLocaleString()
                            : "—"}
                        </span>
                        <div className="col-span-2 flex justify-end gap-2 pr-2">
                          <button
                            className="bg-blue-400 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs"
                            onClick={() =>
                              setEditing({
                                categoryId: cat.id,
                                rateId: r.id,
                                name: cat.name,
                                rate: String(r.displayRate),
                                from: r.effectiveFrom ? r.effectiveFrom.slice(0, 16) : "",
                                to: r.effectiveTo ? r.effectiveTo.slice(0, 16) : "",
                              })
                            }
                          >
                            Edit
                          </button>
                          {r.rateActive === false ? (
                            <button
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
                              onClick={async () => {
                                setLoading(true);
                                setError(null);
                                try {
                                  await apiFetch(`${import.meta.env.VITE_API_URL}/tax/rates/${r.id}/restore`, {
                                    method: "POST"
                                  });
                                  const res = await apiFetch(`${import.meta.env.VITE_API_URL}/tax/categories?includeInactive=${showInactive}`);
                                  const json = await res.json();
                                  const data: TaxCategory[] = Array.isArray(json.data) ? json.data : json.data?.data || [];
                                  setTaxes(data);
                                } catch (err) {
                                  console.error(err);
                                  setError("Failed to restore rate");
                                } finally {
                                  setLoading(false);
                                }
                              }}
                            >
                              Restore
                            </button>
                          ) : (
                            <button
                              className="bg-red-400 hover:bg-red-500 text-white px-3 py-1 rounded text-xs"
                              onClick={async () => {
                                setLoading(true);
                                setError(null);
                                try {
                                  await apiFetch(`${import.meta.env.VITE_API_URL}/tax/rates/${r.id}`, {
                                    method: "DELETE"
                                  });
                                  const res = await apiFetch(`${import.meta.env.VITE_API_URL}/tax/categories?includeInactive=${showInactive}`);
                                  const json = await res.json();
                                  const data: TaxCategory[] = Array.isArray(json.data) ? json.data : json.data?.data || [];
                                  setTaxes(data);
                                } catch (err) {
                                  console.error(err);
                                  setError("Failed to delete rate");
                                } finally {
                                  setLoading(false);
                                }
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {groups.length === 0 && (
                <div className="py-4 px-3 text-sm text-black bg-gray-200 rounded-md">
                  No taxes found.
                </div>
              )}
            </div>
          )}

          {editing && (
            <div className="bg-gray-200 rounded-md p-4 space-y-3 border border-gray-400">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Name</label>
                  <input
                    className="w-full bg-gray-100 rounded px-2 py-2 border border-gray-300"
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Rate (percent)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-gray-100 rounded px-2 py-2 border border-gray-300"
                    value={editing.rate}
                    onChange={(e) => setEditing({ ...editing, rate: e.target.value })}
                    placeholder="e.g. 15"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Effective from</label>
                  <input
                    type="datetime-local"
                    className="w-full bg-gray-100 rounded px-2 py-2 border border-gray-300"
                    value={editing.from}
                    onChange={(e) => setEditing({ ...editing, from: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Effective until (optional)</label>
                  <input
                    type="datetime-local"
                    className="w-full bg-gray-100 rounded px-2 py-2 border border-gray-300"
                    value={editing.to}
                    onChange={(e) => setEditing({ ...editing, to: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="bg-gray-400 text-black text-sm px-4 py-2 rounded-md hover:bg-gray-500"
                  onClick={async () => {
                    if (!editing) return;
                    setLoading(true);
                    setError(null);
                    try {
                      // update category name
                      await apiFetch(`${import.meta.env.VITE_API_URL}/tax/categories/${editing.categoryId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: editing.name })
                      });

                      // update rate if exists
                      if (editing.rateId) {
                        const rateDecimal = editing.rate ? Number(editing.rate) / 100 : 0;
                        await apiFetch(`${import.meta.env.VITE_API_URL}/tax/rates/${editing.rateId}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            taxCategoryId: editing.categoryId,
                            rate: rateDecimal,
                            effectiveFrom: editing.from ? new Date(editing.from).toISOString() : new Date().toISOString(),
                            effectiveTo: editing.to ? new Date(editing.to).toISOString() : null
                          })
                        });
                      }

                      const res = await apiFetch(`${import.meta.env.VITE_API_URL}/tax/categories?includeInactive=${showInactive}`);
                      const json = await res.json();
                      const data: TaxCategory[] = Array.isArray(json.data) ? json.data : json.data?.data || [];
                      setTaxes(data);
                      setEditing(null);
                    } catch (err) {
                      console.error(err);
                      setError("Failed to update tax");
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="bg-gray-300 text-black text-sm px-4 py-2 rounded-md hover:bg-gray-400"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CREATE BUTTON */}
        <div className="pt-2 pb-6">
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
