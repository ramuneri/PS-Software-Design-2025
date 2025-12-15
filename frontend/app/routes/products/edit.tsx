import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../api";

export default function ProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [taxCategories, setTaxCategories] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState<any>(null);

  // Load product data
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

        // Backend returns ProductDto => rename ProductId → id
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

          {/* TAX CATEGORY — disabled for now */}
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
      </div>
    </div>
  );
}
