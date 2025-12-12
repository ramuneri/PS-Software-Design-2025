import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../../api";

type Service = {
  serviceId: number;
  name: string;
};

type Order = {
  id: number;
};

export default function ServiceChargePolicyEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [services, setServices] = useState<Service[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const policyRes = await apiFetch(
          `${import.meta.env.VITE_API_URL}/api/service-charge-policies/${id}`
        );

        if (!policyRes.ok) {
          throw new Error("Policy not found");
        }

        const policy = await policyRes.json();
        setForm(policy);

        try {
          const serviceRes = await apiFetch(
            `${import.meta.env.VITE_API_URL}/api/services`
          );
          const serviceJson = await serviceRes.json();
          setServices(
            Array.isArray(serviceJson.data) ? serviceJson.data : []
          );
        } catch {
          setServices([]);
        }

        try {
          const orderRes = await apiFetch(
            `${import.meta.env.VITE_API_URL}/orders`
          );
          const orderJson = await orderRes.json();
          setOrders(Array.isArray(orderJson) ? orderJson : []);
        } catch {
          // TODO??
          setOrders([]);
        }
      } catch (err: any) {
        setError(err.message ?? "Failed to load policy");
      }
    }

    load();
  }, [id]);

  if (error) {
    return (
      <div className="p-6 text-red-500">
        {error}
      </div>
    );
  }

  if (!form) {
    return <div className="p-6 text-black">Loading…</div>;
  }

  const toggleId = (
    list: number[],
    value: number,
    key: "serviceIds" | "orderIds"
  ) => {
    setForm((f: any) => ({
      ...f,
      [key]: list.includes(value)
        ? list.filter((x: number) => x !== value)
        : [...list, value],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await apiFetch(
      `${import.meta.env.VITE_API_URL}/api/service-charge-policies/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(form),
      }
    );

    navigate("/service-charge-policies");
  };

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-[90%] max-w-3xl space-y-6">

        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          Edit Service Charge Policy
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
              value={form.value ?? 0}
              onChange={(e) =>
                setForm({ ...form, value: Number(e.target.value) })
              }
            />
          </div>

          {/* SERVICES */}
          {services.length > 0 && (
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
          )}

          {/* ORDERS (optional) */}
          {orders.length > 0 && (
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
          )}

          {/* ACTIVE */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm({ ...form, isActive: e.target.checked })
              }
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
