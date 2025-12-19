import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../api";

type Service = {
  serviceId: number;
  name: string;
  durationMinutes: number;
  defaultPrice: number;
  isActive: boolean;
};

export default function ServicesPage() {
  const navigate = useNavigate();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);

  const loadServices = async () => {
    try {
      setLoading(true);

      const activeRes = await apiFetch(
        `${import.meta.env.VITE_API_URL}/api/services?active=true`
      );
      const activeJson = await activeRes.json();

      const inactiveRes = await apiFetch(
        `${import.meta.env.VITE_API_URL}/api/services?active=false`
      );
      const inactiveJson = await inactiveRes.json();

      const active = Array.isArray(activeJson.data)
        ? activeJson.data
        : [];

      const inactive = Array.isArray(inactiveJson.data)
        ? inactiveJson.data
        : [];

      setServices([...active, ...inactive]);
    } catch {
      console.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadServices();
  }, []);

  const deleteService = async (id: number) => {
    await apiFetch(
      `${import.meta.env.VITE_API_URL}/api/services/${id}`,
      { method: "DELETE" }
    );
    loadServices();
  };

  const restoreService = async (id: number) => {
    await apiFetch(
      `${import.meta.env.VITE_API_URL}/api/services/${id}/restore`,
      { method: "POST" }
    );
    loadServices();
  };

  const filteredServices = services.filter((s) => {
    if (!includeInactive && !s.isActive) return false;

    return s.name.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) {
    return <div className="p-6 text-black">Loading services…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-[90%] space-y-6">

        {/* HEADER */}
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          Service List
        </div>

        {/* CONTROLS */}
        <div className="bg-gray-300 rounded-md p-6 space-y-4">
          <label className="flex items-center gap-2 text-black text-sm">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            Show inactive
          </label>

          <div className="flex justify-center">
            <div className="flex items-center bg-gray-200 border border-gray-400 rounded-md w-full max-w-3xl px-4 py-3">
              <input
                type="text"
                className="grow bg-transparent focus:outline-none text-black"
                placeholder="Search for service"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="text-black text-lg">🔍</span>
            </div>
          </div>
        </div>

        {/* HEADERS */}
        <div className="grid grid-cols-4 px-4 text-sm font-medium text-black">
          <span>Name</span>
          <span>Duration</span>
          <span>Price</span>
          <span className="text-right pr-6">Actions</span>
        </div>

        {/* ROWS */}
        <div className="space-y-3">
          {filteredServices.map((service) => (
            <div
              key={service.serviceId}
              className={`grid grid-cols-4 bg-gray-300 text-black rounded-md px-4 py-3 items-center ${
                !service.isActive ? "opacity-50" : ""
              }`}
            >
              <span>{service.name}</span>

              <span>
                {service.durationMinutes >= 60
                  ? `${service.durationMinutes / 60}hr`
                  : `${service.durationMinutes}min`}
              </span>

              <span>{service.defaultPrice}</span>

              {/* ACTION BUTTONS */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() =>
                    navigate(`/services/${service.serviceId}/edit`)
                  }
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Edit
                </button>

                {service.isActive ? (
                  <button
                    onClick={() => deleteService(service.serviceId)}
                    className="px-3 py-1 bg-red-400 hover:bg-red-500 text-black rounded"
                  >
                    Delete
                  </button>
                ) : (
                  <button
                    onClick={() => restoreService(service.serviceId)}
                    className="px-3 py-1 bg-green-400 hover:bg-green-500 text-black rounded"
                  >
                    Restore
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-6">
          <button
            onClick={() => navigate("/services/create")}
            className="w-48 bg-gray-400 hover:bg-gray-500 rounded-md py-2 text-black"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
