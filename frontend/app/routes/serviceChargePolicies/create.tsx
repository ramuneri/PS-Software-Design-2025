import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../api";

type Service = {
  serviceId: number;
  name: string;
};

type Order = {
  id: number;
};

export default function ServiceChargePolicyCreate() {
  const navigate = useNavigate();

  const [services, setServices] = useState<Service[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [form, setForm] = useState({
    merchantId: 1, // TEMP — later from auth
    name: "",
    type: "Flat",
    value: 0,
    serviceIds: [] as number[],
    orderIds: [] as number[],
  });

  useEffect(() => {
    async function load() {
      const serviceRes = await apiFetch(
        `${import.meta.env.VITE_API_URL}/api/services`
      );
      const serviceJson = await serviceRes.json();
      setServices(Array.isArray(serviceJson.data) ? serviceJson.data : []);

      const orderRes = await apiFetch(
        `${import.meta.env.VITE_API_URL}/orders`
      );
      const orderJson = await orderRes.json();
      setOrders(Array.isArray(orderJson) ? orderJson : []);
    }

    load();
  }, []);

  const toggleId = (
    list: number[],
    id: number,
    key: "serviceIds" | "orderIds"
  ) => {
    setForm((f) => ({
      ...f,
      [key]: list.includes(id)
        ? list.filter((x) => x !== id)
        : [...list, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await apiFetch(
      `${import.meta.env.VITE_API_URL}/api/service-charge-policies`,
      {
        method: "POST",
        body: JSON.stringify(form),
      }
    );

    if (!res.ok) {
      alert("Failed to create service charge policy");
      return;
    }

    navigate("/service-charge-policies");
  };

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-[90%] max-w-3xl space-y-6">

        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          Create Service Charge Policy
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-300 rounded-md p-6 space-y-6 text-black"
        >
          {/* NAME */}
          <div>
            <label className="block mb-1 text-sm">Name</label>
            <input
              className="bg-gray-200 rounded-md p-2 w-full"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
          </div>

          {/* TYPE */}
          <div>
            <label className="block mb-1 text-sm">Type</label>
            <select
              className="bg-gray-200 rounded-md p-2 w-full"
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value })
              }
            >
              <option value="Flat">Flat</option>
              <option value="Percentage">Percentage</option>
            </select>
          </div>

          {/* VALUE */}
          <div>
            <label className="block mb-1 text-sm">Value</label>
            <input
              type="number"
              className="bg-gray-200 rounded-md p-2 w-full"
              value={form.value}
              onChange={(e) =>
                setForm({ ...form, value: Number(e.target.value) })
              }
            />
          </div>

          {/* SERVICES */}
          <div>
            <label className="block mb-2 text-sm font-medium">
              Applies to Services
            </label>
            <div className="bg-gray-200 rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
              {services.map((s) => (
                <label key={s.serviceId} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.serviceIds.includes(s.serviceId)}
                    onChange={() =>
                      toggleId(form.serviceIds, s.serviceId, "serviceIds")
                    }
                  />
                  <span>{s.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ORDERS */}
          <div>
            <label className="block mb-2 text-sm font-medium">
              Applies to Orders
            </label>
            <div className="bg-gray-200 rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
              {orders.map((o) => (
                <label key={o.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.orderIds.includes(o.id)}
                    onChange={() =>
                      toggleId(form.orderIds, o.id, "orderIds")
                    }
                  />
                  <span>Order #{o.id}</span>
                </label>
              ))}
            </div>
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
              onClick={() => navigate("/service-charge-policies")}
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
