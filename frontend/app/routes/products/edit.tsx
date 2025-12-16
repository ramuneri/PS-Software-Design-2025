import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../api";

interface Variation {
  id?: number;
  name: string;
  priceAdjustment: number;
  isActive: boolean;
}

export default function ProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [taxCategories, setTaxCategories] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState<any>(null);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVariation, setNewVariation] = useState<Variation>({
    name: "",
    priceAdjustment: 0,
    isActive: true,
  });

  // Load product data and variations
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const res = await apiFetch(`${import.meta.env.VITE_API_URL}/api/products/${id}`);
        const json = await res.json();
        const product = json.data ?? json;

        if (!product || !product.id) {
          alert("Product not found.");
          navigate("/products");
          return;
        }

        setForm({
          id: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
          isActive: product.isActive,
          taxCategoryId: product.taxCategoryId ?? null,
        });

        const catRes = await apiFetch(`${import.meta.env.VITE_API_URL}/tax/categories`);
        const catJson = await catRes.json();
        const data = Array.isArray(catJson.data) ? catJson.data : catJson.data?.data || [];
        setTaxCategories(data);
        
        try {
          const varRes = await apiFetch(`${import.meta.env.VITE_API_URL}/api/products/${id}/variations`);
          const varJson = await varRes.json();
          const varData = Array.isArray(varJson.data) ? varJson.data : varJson.data?.data || [];
          setVariations(varData);
        } catch (err) {
          console.error("Failed to load variations", err);
        }

        setLoading(false);
      } catch (error) {
        console.error("Failed to load product", error);
        navigate("/products");
      }
    }

    load();
  }, [id, navigate]);

  if (loading || !form) {
    return (
        <div className="p-6 text-black">
          Loading product…
        </div>
    );
  }

  // Handle form submit (PATCH)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await apiFetch(`${import.meta.env.VITE_API_URL}/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        price: form.price,
        category: form.category,
        taxCategoryId: form.taxCategoryId,
        isActive: form.isActive,
      }),
    });

    navigate("/products");
  };

  // Add new variation
  const handleAddVariation = async () => {
    if (!newVariation.name.trim()) {
      alert("Variation name is required");
      return;
    }

    try {
      const res = await apiFetch(`${import.meta.env.VITE_API_URL}/api/products/${id}/variations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVariation),
      });
      const json = await res.json();
      const created = json.data ?? json;
      setVariations([...variations, created]);
    } catch (err) {
      console.error("Failed to add variation", err);
      alert("Failed to add variation");
    }
    
    setNewVariation({ name: "", priceAdjustment: 0, isActive: true });
    setShowAddForm(false);
  };

  // Delete variation
  const handleDeleteVariation = async (variationId: number) => {
    if (!confirm("Delete this variation?")) return;

    try {
      await apiFetch(`${import.meta.env.VITE_API_URL}/api/products/${id}/variations/${variationId}`, {
        method: "DELETE",
      });
      setVariations(variations.filter((v) => v.id !== variationId));
    } catch (err) {
      console.error("Failed to delete variation", err);
      alert("Failed to delete variation");
    }
  };

  // Update variation
  const handleUpdateVariation = async (variationId: number, updates: Partial<Variation>) => {
    try {
      const res = await apiFetch(`${import.meta.env.VITE_API_URL}/api/products/${id}/variations/${variationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      const updated = json.data ?? json;
      setVariations(variations.map((v) => (v.id === variationId ? updated : v)));
    } catch (err) {
      console.error("Failed to update variation", err);
    }
  };

  return (
      <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
        <div className="w-[90%] max-w-3xl space-y-6">

          {/* HEADER */}
          <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
            Edit Product
          </div>

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
                  value={form.price ?? ""}
                  onChange={(e) =>
                      setForm({ ...form, price: Number(e.target.value) })
                  }
              />
            </div>

            {/* CATEGORY */}
            <div>
              <label className="block mb-1 text-sm">Category</label>
              <input
                  className="bg-gray-200 p-2 rounded w-full"
                  value={form.category ?? ""}
                  onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                  }
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
                        taxCategoryId: e.target.value ? Number(e.target.value) : null,
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

            {/* ACTIVE STATUS */}
            <div>
              <label className="block mb-1 text-sm">Active Status</label>
              <select
                  className="bg-gray-200 p-2 rounded w-full"
                  value={form.isActive ? "true" : "false"}
                  onChange={(e) =>
                      setForm({ ...form, isActive: e.target.value === "true" })
                  }
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            {/* BUTTONS */}
            <div className="flex gap-4 pt-4">
              <button
                  type="submit"
                  className="bg-gray-400 hover:bg-gray-500 px-6 py-2 rounded-md text-black"
              >
                Save
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
                    {variations.map((variation) => (
                        <div
                            key={variation.id}
                            className="bg-gray-200 p-3 rounded"
                        >
                          <div className="flex items-end gap-3">
                            <div className="flex-1">
                              <label className="block mb-1 text-xs">Name</label>
                              <input
                                  className="bg-white p-2 rounded w-full text-sm"
                                  value={variation.name}
                                  onChange={(e) =>
                                      handleUpdateVariation(variation.id!, {
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
                                      handleUpdateVariation(variation.id!, {
                                        priceAdjustment: Number(e.target.value),
                                      })
                                  }
                              />
                            </div>

                            <button
                                type="button"
                                onClick={() => handleDeleteVariation(variation.id!)}
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