import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Service = {
  serviceId: number;
  name: string;
};

type User = {
  id: string;
  name: string;
  email: string;
};

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("access-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function CreateReservationPage() {
  const navigate = useNavigate();

  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);

  const [serviceId, setServiceId] = useState<number | "">("");
  const [employeeId, setEmployeeId] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>("");
  const [startTime, setStartTime] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [servicesRes, employeesRes, customersRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/services`, {
            headers: authHeaders(),
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/users?role=Employee`, {
            headers: authHeaders(),
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/users?role=Customer`, {
            headers: authHeaders(),
          }),
        ]);
        
        const servicesJson = await servicesRes.json();
        const employeesJson = await employeesRes.json();
        const customersJson = await customersRes.json();

        setServices(Array.isArray(servicesJson) ? servicesJson : servicesJson.data ?? []);
        setEmployees(Array.isArray(employeesJson) ? employeesJson : employeesJson.data ?? []);
        setCustomers(Array.isArray(customersJson) ? customersJson : customersJson.data ?? []);

      } catch {
        setError("Failed to load reservation data");
      }
    };

    loadData();
  }, []);

  const handleCreate = async () => {
    if (!serviceId || !employeeId || !customerId || !startTime) {
      setError("All fields are required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reservations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({
            serviceId,
            employeeId,
            customerId,
            startTime,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to create reservation");
      }

      navigate("/reservations");
    } catch (err: any) {
      setError(err.message ?? "Error creating reservation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-full max-w-2xl space-y-6">

        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          Create Reservation
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-gray-300 rounded-md p-6 space-y-6">

          {/* SERVICE */}
          <div>
            <label className="block text-black font-medium mb-1">
              Service
            </label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(Number(e.target.value))}
              className="w-full bg-gray-400 rounded-md px-4 py-2"
            >
              <option value="">Select service</option>
              {services.map((s) => (
                <option key={s.serviceId} value={s.serviceId}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* CUSTOMER */}
          <div>
            <label className="block text-black font-medium mb-1">
              Customer
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full bg-gray-400 rounded-md px-4 py-2"
            >
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.email}
                </option>
              ))}
            </select>
          </div>

          {/* EMPLOYEE */}
          <div>
            <label className="block text-black font-medium mb-1">
              Employee
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full bg-gray-400 rounded-md px-4 py-2"
            >
              <option value="">Select employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name || e.email}
                </option>
              ))}
            </select>
          </div>

          {/* START TIME */}
          <div>
            <label className="block text-black font-medium mb-1">
              Start time
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-gray-400 rounded-md px-4 py-2"
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-4">
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 bg-gray-300 hover:bg-gray-400 rounded-md py-3 text-black font-medium"
          >
            {loading ? "Creating…" : "Create"}
          </button>

          <button
            onClick={() => navigate("/reservations")}
            className="flex-1 bg-gray-300 hover:bg-gray-400 rounded-md py-3 text-black font-medium"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
