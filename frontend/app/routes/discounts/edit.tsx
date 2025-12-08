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

  if (!form) return <div className="p-6 text-black">Loading…</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await apiFetch(
      `${import.meta.env.VITE_API_URL}/api/discounts/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(form),
      }
    );

    navigate("/discounts");
  };

  return (
    <div className="p-6 text-black">
      <h1 className="text-lg font-semibold mb-4">Edit Discount</h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          className="bg-gray-200 p-2 rounded w-full"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          className="bg-gray-200 p-2 rounded w-full"
          value={form.code ?? ""}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
        />

        <input
          className="bg-gray-200 p-2 rounded w-full"
          type="number"
          value={form.value ?? 0}
          onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
        />


        <div className="flex gap-4 pt-4">
        <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded text-white"
        >
            Save
        </button>

        <button
            type="button"
            onClick={() => navigate("/discounts")}
            className="bg-gray-400 hover:bg-gray-500 px-4 py-2 rounded text-black"
        >
            Cancel
        </button>
        </div>



      </form>
    </div>
  );
}
