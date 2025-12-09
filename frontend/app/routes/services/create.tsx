import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../api";

export default function ServiceCreate() {
  const navigate = useNavigate();

  const [taxCategories, setTaxCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    defaultPrice: 0,
    durationMinutes: 0,
    taxCategoryId: null as number | null,
    isActive: true, // always true when creating
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch(
          `${import.meta.env.VITE_API_URL}/api/tax-categories`
        );
        const json = await res.json();

        setTaxCategories(Array.isArray(json.data) ? json.data : []);
      } catch (error) {
        console.error("Failed to load tax categories");
      }
    }

    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await apiFetch(`${import.meta.env.VITE_API_URL}/api/services`, {
      method: "POST",
      body: JSON.stringify(form),
    });

    navigate("/services");
  };

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-[90%] max-w-3xl space-y-6">

        {/* HEADER */}
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          Create Service
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
            <label className="block mb-1 text-sm">Default Price</label>
            <input
              type="number"
              className="bg-gray-200 p-2 rounded w-full"
              value={form.defaultPrice}
              onChange={(e) =>
                setForm({ ...form, defaultPrice: Number(e.target.value) })
              }
              required
            />
          </div>

          {/* DURATION */}
          <div>
            <label className="block mb-1 text-sm">Duration (minutes)</label>
            <input
              type="number"
              className="bg-gray-200 p-2 rounded w-full"
              value={form.durationMinutes}
              onChange={(e) =>
                setForm({ ...form, durationMinutes: Number(e.target.value) })
              }
              required
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block mb-1 text-sm">Description</label>
            <textarea
              className="bg-gray-200 p-2 rounded w-full"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
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
              className="bg-gray-400 hover:bg-gray-500 px-6 py-2 rounded-md text-black"
            >
              Create
            </button>

            <button
              type="button"
              onClick={() => navigate("/services")}
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
