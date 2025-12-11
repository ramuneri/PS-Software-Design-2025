import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../api";

export default function ServicesPage() {
  const navigate = useNavigate();

  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);



  useEffect(() => {
    async function load() {
      setLoading(true);

      const res = await apiFetch(
        `${import.meta.env.VITE_API_URL}/api/services?active=${!showInactive}`
      );
      const json = await res.json();


      setServices(Array.isArray(json.data) ? json.data : []);

      setLoading(false);
    }

    load();
  }, [showInactive]);


  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 text-black">
        Loading services…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-[90%] space-y-6">

        {/* HEADER */}
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          Service List
        </div>

        {/* SEARCH AREA */}
        <div className="bg-gray-300 rounded-md p-6 space-y-6">

          {/* Show inactive toggle */}
          <label className="flex items-center gap-2 text-black text-sm">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            Show inactive
          </label>

          {/* Search input */}
          <div className="flex justify-center">
            <div className="flex items-center bg-gray-200 border border-gray-400 rounded-md w-full max-w-3xl px-4 py-3">
              <input
                type="text"
                className="grow bg-transparent focus:outline-none text-black"
                placeholder="Search for specific item"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="text-black text-lg">🔍</span>
            </div>
          </div>

          <div className="flex justify-center">
            <button className="bg-gray-400 hover:bg-gray-500 px-6 py-2 rounded text-black">
              Search
            </button>
          </div>
        </div>

        {/* TABLE HEADERS */}
        <div className="grid grid-cols-4 px-4 text-sm font-medium text-black">
          <span>Name</span>
          <span>Duration</span>
          <span>Price</span>
          <span className="text-right pr-6">Actions</span>
        </div>

        {/* TABLE ROWS */}
        <div className="space-y-3">
          {filtered.map((service) => (
            <div
              key={service.serviceId}
              className="grid grid-cols-4 bg-gray-300 text-black rounded-md px-4 py-3 items-center"
            >
              <span>{service.name}</span>

              <span>
                {service.durationMinutes >= 60
                  ? `${service.durationMinutes / 60}hr`
                  : `${service.durationMinutes}min`}
              </span>

              <span>{service.defaultPrice}</span>

              {/* ACTION BUTTONS */}
              <div className="flex justify-end gap-2 pr-2">
                <button
                  onClick={() => {
                    console.log("NAV:", `/services/${service.serviceId}/edit`);
                    navigate(`/services/${service.serviceId}/edit`);
                  }}
                  className="bg-blue-400 hover:bg-blue-500 text-white px-3 py-1 rounded"
                >
                  Edit
                </button>

                {service.isActive ? (
                  <button
                    onClick={async () => {
                      await apiFetch(`${import.meta.env.VITE_API_URL}/api/services/${service.serviceId}`, {
                        method: "DELETE",
                      });
                      location.reload();
                    }}
                    className="bg-red-400 hover:bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      await apiFetch(
                        `${import.meta.env.VITE_API_URL}/api/services/${service.serviceId}/restore`,
                        { method: "POST" }
                      );
                      location.reload();
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Restore
                  </button>
                )}
              </div>



            </div>
          ))}
        </div>

        {/* CREATE BUTTON */}
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
