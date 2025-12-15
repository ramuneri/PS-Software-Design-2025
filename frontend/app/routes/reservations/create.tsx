import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Service = {
  serviceId: number;
  name: string;
};

type User = {
  id: string;
  name: string | null;
  email: string;
};

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("access-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const WORK_START_HOUR = 7;
const WORK_END_HOUR = 20;

function toDateTimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function clampHour(base: string, hour: number) {
  const d = base ? new Date(base) : new Date();
  d.setHours(hour, 0, 0, 0);
  return toDateTimeLocalValue(d);
}


function normalizeArray<T>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

export default function CreateReservationPage() {
  const navigate = useNavigate();

  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);

  const [serviceId, setServiceId] = useState<number | "">("");
  const [employeeId, setEmployeeId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [startTime, setStartTime] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

        if (!servicesRes.ok || !employeesRes.ok || !customersRes.ok) {
          throw new Error();
        }

        const servicesJson = await servicesRes.json();
        const employeesJson = await employeesRes.json();
        const customersJson = await customersRes.json();

        setServices(normalizeArray<Service>(servicesJson));
        setEmployees(normalizeArray<User>(employeesJson));
        setCustomers(normalizeArray<User>(customersJson));
      } catch {
        setError("Failed to load data");
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
          startTime: new Date(startTime).toISOString(),
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();

      if (text.includes("already has a reservation")) {
        setError("This employee is already booked at that time.");
      } else if (text.includes("07:00")) {
        setError("Reservations are allowed only between 07:00 and 20:00.");
      } else {
        setError("Failed to create reservation.");
      }
      return;
    }

    navigate("/reservations");
  } catch {
    setError("Failed to create reservation.");
  } finally {
    setLoading(false);
  }
};



  return (
    <div className="min-h-screen text-black bg-gray-200 p-6 flex justify-center">
      <div className="w-full max-w-2xl space-y-6">

        <div className="bg-gray-300 py-3 text-center font-medium">
          Create Reservation
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded">
            {error}
          </div>
        )}

        <div className="bg-gray-300 p-6 space-y-4">

          <select
            value={serviceId}
            onChange={(e) => setServiceId(Number(e.target.value))}
            className="w-full bg-gray-400 p-2 rounded"
          >
            <option value="">Select service</option>
            {services.map((s) => (
              <option key={s.serviceId} value={s.serviceId}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full bg-gray-400 p-2 rounded"
          >
            <option value="">Select customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name ?? c.email}
              </option>
            ))}
          </select>

          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full bg-gray-400 p-2 rounded"
          >
            <option value="">Select employee</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name ?? e.email}
              </option>
            ))}
          </select>


          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            min={toDateTimeLocalValue(new Date())}
            className="w-full bg-gray-400 p-2 rounded"
          />

        </div>

        <div className="flex gap-4">
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 bg-gray-300 py-2 rounded"
          >
            {loading ? "Creating…" : "Create"}
          </button>

          <button
            onClick={() => navigate("/reservations")}
            className="flex-1 bg-gray-300 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
