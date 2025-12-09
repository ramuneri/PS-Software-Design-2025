import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../api";

export default function DiscountCreate() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [target, setTarget] = useState<string>("");

  const [form, setForm] = useState({
    name: "",
    code: "",
    scope: "item",
    type: "percentage",
    value: 0,
    productId: null as number | null,
    serviceId: null as number | null,
    startsAt: "",
    endsAt: "",
  });

  useEffect(() => {
    async function load() {
      const prodRes = await apiFetch(`${import.meta.env.VITE_API_URL}/api/products`);
      const prodJson = await prodRes.json();
      setProducts(Array.isArray(prodJson) ? prodJson : []);

      const serviceRes = await apiFetch(`${import.meta.env.VITE_API_URL}/api/services`);
      const serviceJson = await serviceRes.json();
      setServices(Array.isArray(serviceJson.data) ? serviceJson.data : []);

      if (Array.isArray(prodJson) && prodJson.length > 0) {
        setTarget(`product-${prodJson[0].id}`);
        setForm(f => ({ ...f, productId: prodJson[0].id }));
      } else if (serviceJson.data?.length > 0) {
        setTarget(`service-${serviceJson.data[0].serviceId}`);
        setForm(f => ({ ...f, serviceId: serviceJson.data[0].serviceId }));
      }
    }
    load();
  }, []);


  useEffect(() => {
    if (!target) return;

    const [kind, rawId] = target.split("-");
    const id = Number(rawId);

    if (kind === "product") {
      setForm(f => ({ ...f, productId: id, serviceId: null }));
    } else if (kind === "service") {
      setForm(f => ({ ...f, serviceId: id, productId: null }));
    }
  }, [target]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await apiFetch(`${import.meta.env.VITE_API_URL}/api/discounts`, {
      method: "POST",
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const err = await res.text();
      alert("Failed to create discount:\n" + err);
      return;
    }

    navigate("/discounts");
  };


  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-[90%] max-w-3xl space-y-6">

        {/* PAGE HEADER */}
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          Create Discount
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="bg-gray-300 rounded-md p-6 space-y-6 text-black">

          {/* NAME */}
          <div>
            <label className="block mb-1 text-sm">Name</label>
            <input
              className="bg-gray-200 rounded-md p-2 w-full"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* CODE */}
          <div>
            <label className="block mb-1 text-sm">Code</label>
            <input
              className="bg-gray-200 rounded-md p-2 w-full"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </div>

          {/* TARGET */}
          <div>
            <label className="block mb-1 text-sm">Target (Product or Service)</label>

            <select
              className="bg-gray-200 rounded-md p-2 w-full"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              {/* PRODUCTS */}
              {products.length > 0 && (
                <optgroup label="Products">
                  {products.map((p) => (
                    <option key={p.id} value={`product-${p.id}`}>
                      Product #{p.id} — {p.name}
                    </option>
                  ))}
                </optgroup>
              )}

              {/* SERVICES */}
              {services.length > 0 && (
                <optgroup label="Services">
                  {services.map((s) => (
                    <option key={s.serviceId} value={`service-${s.serviceId}`}>
                      Service #{s.serviceId} — {s.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* SCOPE */}
          <div>
            <label className="block mb-1 text-sm">Scope</label>
            <select
              className="bg-gray-200 rounded-md p-2 w-full"
              value={form.scope}
              onChange={(e) => setForm({ ...form, scope: e.target.value })}
            >
              <option value="item">Item</option>
              <option value="order">Order</option>
            </select>
          </div>

          {/* TYPE */}
          <div>
            <label className="block mb-1 text-sm">Type</label>
            <select
              className="bg-gray-200 rounded-md p-2 w-full"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>

          {/* VALUE */}
          <div>
            <label className="block mb-1 text-sm">Value</label>
            <input
              type="number"
              className="bg-gray-200 rounded-md p-2 w-full"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
            />
          </div>

          {/* DATES */}
          <div>
            <label className="block mb-1 text-sm">Start Date</label>
            <input
              type="date"
              className="bg-gray-200 rounded-md p-2 w-full"
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">End Date</label>
            <input
              type="date"
              className="bg-gray-200 rounded-md p-2 w-full"
              value={form.endsAt}
              onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
            />
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
