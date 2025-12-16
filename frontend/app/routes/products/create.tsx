import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../api";

interface Variation {
  name: string;
  priceAdjustment: number;
  isActive: boolean;
}

export default function ProductCreate() {
  const navigate = useNavigate();

  const [taxCategories, setTaxCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    taxCategoryId: null as number | null,
    isActive: true,
  });
  const [variations, setVariations] = useState<Variation[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVariation, setNewVariation] = useState<Variation>({
    name: "",
    priceAdjustment: 0,
    isActive: true,
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await apiFetch(`${import.meta.env.VITE_API_URL}/tax/categories`);
        const json = await res.json();
        const data = Array.isArray(json.data) ? json.data : json.data?.data || [];
        setTaxCategories(data);
      } catch (err) {
        console.error("Failed to load tax categories", err);
      }
    }
    loadCategories();
  }, []);

  const handleAddVariation = () => {
    if (!newVariation.name.trim()) {
      alert("Variation name is required");
      return;
    }

    setVariations([...variations, { ...newVariation }]);
    setNewVariation({ name: "", priceAdjustment: 0, isActive: true });
    setShowAddForm(false);
  };

  const handleDeleteVariation = (index: number) => {
    if (!confirm("Delete this variation?")) return;
    setVariations(variations.filter((_, i) => i !== index));
  };

  const handleUpdateVariation = (index: number, updates: Partial<Variation>) => {
    setVariations(variations.map((v, i) => (i === index ? { ...v, ...updates } : v)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      name: form.name,
      price: form.price ? Number(form.price) : null,
      category: form.category || null,
      taxCategoryId: form.taxCategoryId,
      isActive: true,
      variations: variations,
    };

    try {
      const res = await apiFetch(`${import.meta.env.VITE_API_URL}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      const productId = json.data?.id ?? json.id;
      
      if (productId && variations.length > 0) {
        for (const variation of variations) {
          await apiFetch(`${import.meta.env.VITE_API_URL}/api/products/${productId}/variations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(variation),
          });
        }
      }

      navigate("/products");
    } catch (err: any) {
      setError("Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
        <div className="w-[90%] max-w-3xl space-y-6">

          {/* HEADER */}
          <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
            Create Product
          </div>

          {/* ERROR */}
          {error && (
              <div className="text-red-600 text-sm bg-red-200 p-2 rounded">
                {error}
              </div>
          )}

          {/* FORM */}
          <form
              onSubmit={handleSubmit}
              className="bg-gray-300 rounded-md p-6 space-y-6 text-black"
          >

            {/* NAME */}
            <div>
              <label className="block mb-1 text-sm">Name</label>
              <input
                  className="bg-gray-200 p-2 rounded w-full"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
              />
            </div>

            {/* PRICE */}
            <div>
              <label className="block mb-1 text-sm">Price</label>
              <input
                  type="number"
                  step="0.01"
                  className="bg-gray-200 p-2 rounded w-full"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>

            {/* CATEGORY */}
            <div>
              <label className="block mb-1 text-sm">Category</label>
              <input
                  className="bg-gray-200 p-2 rounded w-full"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>

            {/* TAX CATEGORY */}
            <div>
              <label className="block mb-1 text-sm">Tax Category</label>
              <select
                  className="bg-gray-200 p-2 rounded w-full"
                  value={form.taxCategoryId ?? ""}
                  onChange={(e) =>
                      setForm({
                        ...form,
                        taxCategoryId: e.target.value
                            ? Number(e.target.value)
                            : null,
                      })
                  }
              >
                <option value="">No Tax Category</option>

                {taxCategories.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                ))}
              </select>
            </div>

            {/* BUTTONS */}
            <div className="flex gap-4 pt-4">
              <button
                  type="submit"
                  disabled={loading}
                  className="bg-gray-400 hover:bg-gray-500 px-6 py-2 rounded-md text-black"
              >
                {loading ? "Saving…" : "Save"}
              </button>

              <button
                  type="button"
                  onClick={() => navigate("/products")}
                  className="bg-gray-400 hover:bg-gray-500 px-6 py-2 rounded-md text-black"
              >
                Cancel
              </button>
            </div>

          </form>

          {/* VARIATIONS SECTION */}
          <div className="bg-gray-300 rounded-md p-6 space-y-4 text-black">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Product Variations</h2>
              {!showAddForm && (
                  <button
                      type="button"
                      onClick={() => setShowAddForm(true)}
                      className="bg-gray-400 hover:bg-gray-500 px-4 py-2 rounded text-sm"
                  >
                    Add Variation
                  </button>
              )}
            </div>

            {/* Add New Variation Form */}
            {showAddForm && (
                <div className="bg-gray-200 p-4 rounded space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">New Variation</h3>
                    <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false);
                          setNewVariation({ name: "", priceAdjustment: 0, isActive: true });
                        }}
                        className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 text-xs">Name</label>
                      <input
                          className="bg-white p-2 rounded w-full text-sm"
                          placeholder="e.g. Almond Milk"
                          value={newVariation.name}
                          onChange={(e) =>
                              setNewVariation({ ...newVariation, name: e.target.value })
                          }
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-xs">Price Adjustment</label>
                      <input
                          type="number"
                          step="0.01"
                          className="bg-white p-2 rounded w-full text-sm"
                          placeholder="0.00"
                          value={newVariation.priceAdjustment}
                          onChange={(e) =>
                              setNewVariation({
                                ...newVariation,
                                priceAdjustment: Number(e.target.value),
                              })
                          }
                      />
                    </div>
                  </div>

                  <div>
                    <button
                        type="button"
                        onClick={handleAddVariation}
                        className="bg-gray-400 hover:bg-gray-500 px-4 py-2 rounded text-sm"
                    >
                      Save Variation
                    </button>
                  </div>
                </div>
            )}

            {/* Existing Variations */}
            <div className="space-y-2">
              {variations.length === 0 ? (
                  <p className="text-sm text-gray-600">No variations yet</p>
              ) : (
                  <div className="space-y-3">
                    {variations.map((variation, index) => (
                        <div
                            key={index}
                            className="bg-gray-200 p-3 rounded"
                        >
                          <div className="flex items-end gap-3">
                            <div className="flex-1">
                              <label className="block mb-1 text-xs">Name</label>
                              <input
                                  className="bg-white p-2 rounded w-full text-sm"
                                  value={variation.name}
                                  onChange={(e) =>
                                      handleUpdateVariation(index, {
                                        name: e.target.value,
                                      })
                                  }
                              />
                            </div>

                            <div className="flex-1">
                              <label className="block mb-1 text-xs">Price Adjustment</label>
                              <input
                                  type="number"
                                  step="0.01"
                                  className="bg-white p-2 rounded w-full text-sm"
                                  value={variation.priceAdjustment}
                                  onChange={(e) =>
                                      handleUpdateVariation(index, {
                                        priceAdjustment: Number(e.target.value),
                                      })
                                  }
                              />
                            </div>

                            <button
                                type="button"
                                onClick={() => handleDeleteVariation(index)}
                                className="bg-red-400 hover:bg-red-500 px-3 py-2 rounded text-sm text-white"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                    ))}
                  </div>
              )}
            </div>
          </div>

        </div>
      </div>
  );
}