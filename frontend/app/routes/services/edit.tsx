import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../api";

export default function ServiceEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [taxCategories, setTaxCategories] = useState<any[]>([]);
  const [form, setForm] = useState<any>(null);

  // Load service + tax categories
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        // Load service data
        const res = await apiFetch(
          `${import.meta.env.VITE_API_URL}/api/services/${id}`
        );
        const json = await res.json();

        if (!json.data) {
          alert("Service not found.");
          navigate("/services");
          return;
        }

        setForm(json.data);

        // TODO when implemented (Load tax categories)
        // const taxRes = await apiFetch(
        //   `${import.meta.env.VITE_API_URL}/api/tax-categories`
        // );
        // const taxJson = await taxRes.json();

        // setTaxCategories(Array.isArray(taxJson.data) ? taxJson.data : []);

        setLoading(false);
      } catch (error) {
        console.error("Failed to load service");
        navigate("/services");
      }
    }

    load();
  }, [id, navigate]);

  if (loading || !form) {
    return (
      <div className="p-6 text-black">
        Loading service…
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await apiFetch(`${import.meta.env.VITE_API_URL}/api/services/${id}`, {
      method: "PATCH",
      body: JSON.stringify(form),
    });

    navigate("/services");
  };

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-[90%] max-w-3xl space-y-6">

        {/* HEADER */}
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          Edit Service
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

          {/* TODO TAX CATEGORY */}
          {/* <div>
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
          </div> */}

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
