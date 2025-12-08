import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../api";

export default function DiscountEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const res = await apiFetch(
        `${import.meta.env.VITE_API_URL}/api/discounts/${id}`
      );
      const data = await res.json();
      setForm(data);
    }
    load();
  }, [id]);

  if (!form)
    return (
      <div className="min-h-screen bg-gray-200 p-6 text-black">
        Loading…
      </div>
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await apiFetch(`${import.meta.env.VITE_API_URL}/api/discounts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(form),
    });

    navigate("/discounts");
  };

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-[90%] max-w-3xl space-y-6">

        {/* HEADER BAR */}
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          Edit Discount
        </div>

        {/* FORM PANEL */}
        <form
          onSubmit={handleSubmit}
          className="bg-gray-300 rounded-md p-6 space-y-6 text-black"
        >

          {/* NAME */}
          <div>
            <label className="block mb-1 text-sm">Name</label>
            <input
              className="bg-gray-200 p-2 rounded-md w-full focus:outline-none"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* CODE */}
          <div>
            <label className="block mb-1 text-sm">Code</label>
            <input
              className="bg-gray-200 p-2 rounded-md w-full focus:outline-none"
              value={form.code ?? ""}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </div>

          {/* VALUE */}
          <div>
            <label className="block mb-1 text-sm">Value</label>
            <input
              type="number"
              className="bg-gray-200 p-2 rounded-md w-full focus:outline-none"
              value={form.value ?? 0}
              onChange={(e) =>
                setForm({ ...form, value: Number(e.target.value) })
              }
            />
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
              onClick={() => navigate("/discounts")}
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
