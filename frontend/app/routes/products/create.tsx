import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../api";

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
    };

    try {
      await apiFetch(`${import.meta.env.VITE_API_URL}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

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
      </div>
    </div>
  );
}
