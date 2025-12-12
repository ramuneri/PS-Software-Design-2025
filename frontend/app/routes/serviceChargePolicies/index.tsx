import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type ServiceChargePolicy = {
  id: number;
  merchantId: number;
  name: string;
  type: string;
  value: number | null;
  isActive: boolean;
  createdAt: string;
  serviceIds: number[];
  orderIds: number[];
};

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("access-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ServiceChargePoliciesPage() {
  const navigate = useNavigate();

  const [policies, setPolicies] = useState<ServiceChargePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeInactive, setIncludeInactive] = useState(false);

  const merchantId = 1; // temporary (later from auth)

  const loadPolicies = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/service-charge-policies?merchantId=${merchantId}&includeInactive=${includeInactive}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
        }
      );

      const data = await res.json();
      setPolicies(data);
    } catch {
      console.error("Failed to load service charge policies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, [includeInactive]);

  const deletePolicy = async (id: number) => {
    await fetch(
      `${import.meta.env.VITE_API_URL}/api/service-charge-policies/${id}`,
      {
        method: "DELETE",
        headers: authHeaders(),
      }
    );
    loadPolicies();
  };

  const restorePolicy = async (id: number) => {
    await fetch(
      `${import.meta.env.VITE_API_URL}/api/service-charge-policies/${id}/restore`,
      {
        method: "POST",
        headers: authHeaders(),
      }
    );
    loadPolicies();
  };

  if (loading) {
    return <div className="p-6 text-black">Loading service charge policies…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-[90%] mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          Service Charge Policies
        </div>

        {/* SHOW INACTIVE */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
          />
          <span className="text-black">Show inactive</span>
        </div>

        {/* TABLE HEADER */}
        <div className="grid grid-cols-6 px-4 text-sm font-medium text-black">
          <span>Name</span>
          <span>Type</span>
          <span>Value</span>
          <span>Services</span>
          <span>Orders</span>
          <span className="text-right">Actions</span>
        </div>

        {/* LIST */}
        <div className="space-y-3">
          {policies.map((p) => (
            <div
              key={p.id}
              className={`grid grid-cols-6 bg-gray-300 rounded-md px-4 py-3 items-center text-black ${
                !p.isActive ? "opacity-50" : ""
              }`}
            >
              <span>{p.name}</span>
              <span>{p.type}</span>
              <span>{p.value ?? "-"}</span>
              <span>{p.serviceIds.length}</span>
              <span>{p.orderIds.length}</span>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() =>
                    navigate(`/service-charge-policies/${p.id}/edit`)
                  }
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Edit
                </button>

                {p.isActive ? (
                  <button
                    onClick={() => deletePolicy(p.id)}
                    className="px-3 py-1 bg-red-400 hover:bg-red-500 text-black rounded"
                  >
                    Delete
                  </button>
                ) : (
                  <button
                    onClick={() => restorePolicy(p.id)}
                    className="px-3 py-1 bg-green-400 hover:bg-green-500 text-black rounded"
                  >
                    Restore
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CREATE */}
        <div className="pt-6">
          <button
            onClick={() => navigate("/service-charge-policies/create")}
            className="w-48 bg-gray-400 hover:bg-gray-500 rounded-md py-2 text-black"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
