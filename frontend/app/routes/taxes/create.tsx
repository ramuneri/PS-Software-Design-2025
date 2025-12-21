import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { apiFetch } from "~/api";

type TaxCategory = {
  id: number;
  name: string;
};

export default function TaxCreate() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<TaxCategory[]>([]);
  const [useExisting, setUseExisting] = useState(true);
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    apiFetch(`${import.meta.env.VITE_API_URL}/tax/categories`)
      .then((r) => r.json())
      .then((j) =>
        setCategories(Array.isArray(j.data) ? j.data : j.data?.data || [])
      );
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    let id = categoryId;

    if (!useExisting) {
      const res = await apiFetch(
        `${import.meta.env.VITE_API_URL}/tax/categories`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        }
      );
      const json = await res.json();
      id = json.data?.id ?? json.id;
    }

    if (!id) return;

    await apiFetch(
      `${import.meta.env.VITE_API_URL}/tax/categories/${id}/rates`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rate: Number(rate) / 100,
          effectiveFrom: from
            ? new Date(from).toISOString()
            : new Date().toISOString(),
          effectiveTo: to ? new Date(to).toISOString() : null,
        }),
      }
    );

    navigate("/taxes");
  };

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-[90%] max-w-3xl space-y-6">

        {/* HEADER */}
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          Create Tax
        </div>

        {/* FORM */}
        <form
          onSubmit={submit}
          className="bg-gray-300 rounded-md p-6 space-y-6 text-black"
        >
          {/* CATEGORY MODE */}
          <div className="space-y-2 text-black">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={useExisting}
                onChange={() => setUseExisting(true)}
              />
              Use existing category
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={!useExisting}
                onChange={() => setUseExisting(false)}
              />
              Create new category
            </label>
          </div>

          {/* CATEGORY INPUT */}
          {useExisting ? (
            <select
              className="w-full bg-gray-200 rounded-md px-4 py-2"
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId(Number(e.target.value))}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="w-full bg-gray-200 rounded-md px-4 py-2"
              placeholder="Category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}

          {/* RATE */}
          <div>
            <label className="block mb-1 text-sm ">Rate</label>
            <input
              className="bg-gray-200 p-2 rounded w-full"

              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">From</label>
            <input
              type="datetime-local"
              className="bg-gray-200 rounded-md px-4 py-2 w-full"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block mb-1 text-sm">Rate</label>
            <input
              type="datetime-local"
              className="bg-gray-200 rounded-md px-4 py-2 w-full"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          {/* ACTIONS */}
          <div className="flex justify-center gap-4 pt-4">
            <button
              type="submit"
              className="bg-gray-400 hover:bg-gray-500 px-6 py-2 rounded-md text-black"
            >
              Create
            </button>

            <button
              type="button"
              onClick={() => navigate("/taxes")}
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
