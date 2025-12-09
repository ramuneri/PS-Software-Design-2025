import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../api";

export default function DiscountEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [target, setTarget] = useState("");

  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const res = await apiFetch(
        `${import.meta.env.VITE_API_URL}/api/discounts/${id}`
      );
      const discount = await res.json();

      const prodRes = await apiFetch(`${import.meta.env.VITE_API_URL}/api/products`);
      const prodJson = await prodRes.json();
      setProducts(Array.isArray(prodJson) ? prodJson : []);

      const servRes = await apiFetch(`${import.meta.env.VITE_API_URL}/api/services`);
      const servJson = await servRes.json();
      setServices(Array.isArray(servJson.data) ? servJson.data : []);

      if (discount.productId) setTarget(`product-${discount.productId}`);
      if (discount.serviceId) setTarget(`service-${discount.serviceId}`);

      const startsAt = discount.startsAt
        ? discount.startsAt.split("T")[0]
        : "";

      const endsAt = discount.endsAt
        ? discount.endsAt.split("T")[0]
        : "";

      setForm({
        ...discount,
        startsAt,
        endsAt
      });
    }

    load();
  }, [id]);


  useEffect(() => {
    if (!form) return;

    const [kind, rawId] = target.split("-");
    const id = Number(rawId);

    if (kind === "product") {
      setForm({ ...form, productId: id, serviceId: null });
    } else {
      setForm({ ...form, serviceId: id, productId: null });
    }
  }, [target]);

  if (!form)
    return <div className="min-h-screen bg-gray-200 p-6 text-black">Loading…</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...form,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    };

    await apiFetch(`${import.meta.env.VITE_API_URL}/api/discounts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    navigate("/discounts");
  };

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-[90%] max-w-3xl space-y-6">

        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          Edit Discount
        </div>

        <form 
          onSubmit={handleSubmit}
          className="bg-gray-300 rounded-md p-6 space-y-6 text-black"
        >

          {/* NAME */}
          <div>
            <label className="block mb-1 text-sm">Name</label>
            <input
              className="bg-gray-200 p-2 rounded-md w-full"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* CODE */}
          <div>
            <label className="block mb-1 text-sm">Code</label>
            <input
              className="bg-gray-200 p-2 rounded-md w-full"
              value={form.code ?? ""}
              onChange={e => setForm({ ...form, code: e.target.value })}
            />
          </div>

          {/* TARGET */}
          <div>
            <label className="block mb-1 text-sm">Target</label>
            <select
              className="bg-gray-200 p-2 rounded-md w-full"
              value={target}
              onChange={e => setTarget(e.target.value)}
            >
              <optgroup label="Products">
                {products.map(p => (
                  <option key={p.id} value={`product-${p.id}`}>
                    Product #{p.id} — {p.name}
                  </option>
                ))}
              </optgroup>

              <optgroup label="Services">
                {services.map(s => (
                  <option key={s.serviceId} value={`service-${s.serviceId}`}>
                    Service #{s.serviceId} — {s.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* SCOPE */}
          <div>
            <label className="block mb-1 text-sm">Scope</label>
            <select
              className="bg-gray-200 p-2 rounded-md w-full"
              value={form.scope ?? "item"}
              onChange={e => setForm({ ...form, scope: e.target.value })}
            >
              <option value="item">Item</option>
              <option value="order">Order</option>
            </select>
          </div>

          {/* TYPE */}
          <div>
            <label className="block mb-1 text-sm">Type</label>
            <select
              className="bg-gray-200 p-2 rounded-md w-full"
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </div>

          {/* VALUE */}
          <div>
            <label className="block mb-1 text-sm">Value</label>
            <input
              type="number"
              className="bg-gray-200 p-2 rounded-md w-full"
              value={form.value ?? 0}
              onChange={e => setForm({ ...form, value: Number(e.target.value) })}
            />
          </div>

          {/* DATES */}
          <div>
            <label className="block mb-1 text-sm">Start Date</label>
            <input
              type="date"
              className="bg-gray-200 p-2 rounded-md w-full"
              value={form.startsAt}
              onChange={e => setForm({ ...form, startsAt: e.target.value })}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">End Date</label>
            <input
              type="date"
              className="bg-gray-200 p-2 rounded-md w-full"
              value={form.endsAt}
              onChange={e => setForm({ ...form, endsAt: e.target.value })}
            />
          </div>

          {/* ACTIVE STATUS */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={e => setForm({ ...form, isActive: e.target.checked })}
            />
            <label>Active</label>
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
