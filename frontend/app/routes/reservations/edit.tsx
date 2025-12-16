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

function clampHour(base: string, hour: number) {
  const d = base ? new Date(base) : new Date();
  d.setHours(hour, 0, 0, 0);
  return toDateTimeLocalValue(d);
}

export default function EditReservationPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [employees, setEmployees] = useState<User[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/api/reservations/${id}`, {
        headers: authHeaders(),
      }),
      fetch(`${import.meta.env.VITE_API_URL}/api/users?role=Employee`, {
        headers: authHeaders(),
      }),
    ])
      .then(async ([r, e]) => {
        const reservation = await r.json();
        setReservation(reservation);
        setEmployees(await e.json());
        setEmployeeId(reservation.employeeId ?? "");
        setStatus(reservation.status);
        setStartTime(
          toDateTimeLocalValue(new Date(reservation.startTime))
        );
      })
      .catch(() => setError("Failed to load reservation"));
  }, [id]);

const handleSave = async () => {
  if (status === "Completed") {
    setError("Completed reservations cannot be edited");
    return;
  }

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
          startTime: new Date(startTime).toISOString(),
          status,
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
        setError("Failed to update reservation.");
      }
      return;
    }

    navigate("/reservations");
  } catch {
    setError("Failed to update reservation.");
  } finally {
    setLoading(false);
  }
};


  if (!reservation) return <div>Loading…</div>;

  return (
    <div className="min-h-screen text-black bg-gray-200 p-6 flex justify-center">
      <div className="w-full max-w-2xl space-y-6">

        <div className="bg-gray-300 py-3 text-center font-medium">
          Edit Reservation
        </div>

        {error && <div className="text-red-600">{error}</div>}

        <div className="bg-gray-300 p-6 space-y-4">

          <div>{reservation.serviceName}</div>
          <div>{reservation.customerName}</div>

          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            disabled={status === "Completed"}
            className="w-full bg-gray-400 p-2 rounded"
          >
            <option value="">Employee</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name || e.email}
              </option>
            ))}
          </select>


            <input
                type="datetime-local"
                value={startTime}
                disabled={status === "Completed"}
                min={toDateTimeLocalValue(new Date())}
                onChange={(e) => setStartTime(e.target.value)}
                className={`w-full bg-gray-400 p-2 rounded ${
                    status === "Completed" ? "cursor-not-allowed opacity-60" : ""
                }`}
            />


          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-gray-400 p-2 rounded"
          >
            <option value="Booked">Booked</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="flex gap-4">
          <button onClick={handleSave} className="flex-1 bg-gray-300 py-2 rounded">
            Save
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
