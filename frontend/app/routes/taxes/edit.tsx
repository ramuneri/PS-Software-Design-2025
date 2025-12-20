import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { apiFetch } from "~/api";

export default function TaxEdit() {
  const { categoryId } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [rateId, setRateId] = useState<number | null>(null);
  const [rate, setRate] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    apiFetch(
      `${import.meta.env.VITE_API_URL}/tax/categories/${categoryId}?includeInactive=true`
    )
      .then((r) => r.json())
      .then((j) => {
        const cat = j.data ?? j;
        setName(cat.name);

        if (cat.rates?.length) {
          const r = cat.rates[0];
          setRateId(r.id);
          setRate(String(r.rate * 100));
          setFrom(r.effectiveFrom.slice(0, 16));
          setTo(r.effectiveTo?.slice(0, 16) ?? "");
        }
      });
  }, [categoryId]);

  const save = async () => {
    await apiFetch(
      `${import.meta.env.VITE_API_URL}/tax/categories/${categoryId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      }
    );

    if (rateId) {
      await apiFetch(
        `${import.meta.env.VITE_API_URL}/tax/rates/${rateId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taxCategoryId: Number(categoryId),
            rate: Number(rate) / 100,
            effectiveFrom: new Date(from).toISOString(),
            effectiveTo: to ? new Date(to).toISOString() : null,
          }),
        }
      );
    }

    navigate("/taxes");
  };

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center text-black">
      <div className="w-[90%] max-w-3xl space-y-6">

        {/* HEADER */}
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          Edit Tax
        </div>

        {/* FORM */}
        <div className="bg-gray-300 rounded-md p-6 space-y-5 ">

          {/* CATEGORY NAME */}
          <div>
            <label className="block mb-1 text-sm">Category</label>
            <input
              className="w-full bg-gray-200 rounded-md px-2 py-2 "
              placeholder="Category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* RATE */}
          <div>
            <label className="block mb-1 text-sm">Rate</label>
            <input
              className="w-full bg-gray-200 rounded-md px-2 py-2"
              placeholder="Rate (%)"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </div>

          {/* EFFECTIVE DATES */}
          <div>
            <label className="block mb-1 text-sm">From</label>
            <input
              type="datetime-local"
              className="bg-gray-200 rounded-md px-2 py-2 w-full"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">To</label>
            <input
              type="datetime-local"
              className="bg-gray-200 rounded-md px-2 py-2 w-full"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          {/* ACTIONS */}
          <div className="flex justify-center gap-4 pt-6">
            <button
              onClick={save}
              className="bg-gray-400 hover:bg-gray-500 px-6 py-2 rounded-md text-black"
            >
              Save
            </button>

            <button
              onClick={() => navigate("/taxes")}
              className="bg-gray-400 hover:bg-gray-500 px-6 py-2 rounded-md text-black"
            >
              Cancel
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
