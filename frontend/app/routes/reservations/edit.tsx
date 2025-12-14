import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type Reservation = {
  id: number;
  employeeId: string | null;
  customerName: string | null;
  serviceName: string | null;
  startTime: string;
  status: string;
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

function toDateTimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function EditReservationPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [employees, setEmployees] = useState<User[]>([]);

  const [employeeId, setEmployeeId] = useState("");
  const [startTime, setStartTime] = useState(""); // LOCAL datetime-local string
  const [status, setStatus] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [reservationRes, employeesRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/reservations/${id}`, {
            headers: authHeaders(),
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/users?role=Employee`, {
            headers: authHeaders(),
          }),
        ]);

        if (!reservationRes.ok) throw new Error();

        const reservationJson: Reservation = await reservationRes.json();
        const employeesJson: User[] = await employeesRes.json();

        setReservation(reservationJson);
        setEmployees(employeesJson);
        setEmployeeId(reservationJson.employeeId ?? "");
        setStatus(reservationJson.status);

        const date = new Date(reservationJson.startTime);
        setStartTime(toDateTimeLocalValue(date));
      } catch {
        setError("Failed to load reservation data");
      }
    };

    loadData();
  }, [id]);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reservations/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({
            employeeId: employeeId || null,
            // LOCAL datetime → ISO UTC
            startTime: new Date(startTime).toISOString(),
            status,
          }),
        }
      );

      if (!res.ok) throw new Error();

      navigate("/reservations");
    } catch {
      setError("Failed to update reservation");
    } finally {
      setLoading(false);
    }
  };

  if (!reservation) {
    return <div className="p-6 text-black">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center font-medium">
          Edit Reservation
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-gray-300 rounded-md p-6 space-y-6">
          <div>
            <label className="block font-medium mb-1">Service</label>
            <div className="bg-gray-400 px-4 py-2 rounded">
              {reservation.serviceName}
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Customer</label>
            <div className="bg-gray-400 px-4 py-2 rounded">
              {reservation.customerName}
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Employee</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full bg-gray-400 px-4 py-2 rounded"
            >
              <option value="">Select employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name || e.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Start time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-gray-400 px-4 py-2 rounded"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-gray-400 px-4 py-2 rounded"
            >
              <option value="Booked">Booked</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-gray-300 hover:bg-gray-400 rounded-md py-3 font-medium"
          >
            {loading ? "Saving…" : "Save"}
          </button>

          <button
            onClick={() => navigate("/reservations")}
            className="flex-1 bg-gray-300 hover:bg-gray-400 rounded-md py-3 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
