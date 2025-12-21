import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type Reservation = {
  id: number;
  employeeId: string | null;
  customerName: string | null;
  serviceName: string | null;
  startTime: string;
  endTime?: string | null;
  note?: string | null;
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
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [note, setNote] = useState("");
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
        if (reservation.endTime) {
          const start = new Date(reservation.startTime).getTime();
          const end = new Date(reservation.endTime).getTime();
          const minutes = Math.max(1, Math.round((end - start) / 60000));
          setDurationMinutes(minutes);
        } else {
          setDurationMinutes(60);
        }
        setNote(reservation.note ?? "");
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
          endTime: new Date(new Date(startTime).getTime() + durationMinutes * 60000).toISOString(),
          note: note.trim(),
          status,
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();

      if (text.includes("already has a reservation")) {
        setError("This employee is already booked at that time.");
      } else {
        setError(text || "Failed to update reservation.");
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
      <div className="w-full max-w-3xl space-y-6">

        {/* HEADER */}
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          Edit Reservation
        </div>

        {error && <div className="text-red-600">{error}</div>}

        <div className="bg-gray-300 rounded-md p-4 space-y-2">

          <div className="space-y-1 ">
            <div className="block mb-1 text-sm">Service</div>
            <div className="bg-gray-200 p-2 rounded w-full">{reservation.serviceName}</div>
          </div>
          <div className="space-y-1">
            <div className="block mb-1 text-sm">Customer</div>
            <div className="bg-gray-200 p-2 rounded w-full">{reservation.customerName}</div>
          </div>
        </div>

        <div className="bg-gray-300 rounded-md p-4 space-y-2">
          <div className="space-y-1">
            <div className="block mb-1 text-sm">Employee</div>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              disabled={status === "Completed"}
              className="bg-gray-200 p-2 rounded w-full"
            >
              <option value="">Employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name || e.email}
                </option>
              ))}
            </select>
          </div>


          <div className="space-y-1">
            <div className="block mb-1 text-sm">Start time</div>
            <input
                type="datetime-local"
                value={startTime}
                disabled={status === "Completed"}
                min={toDateTimeLocalValue(new Date())}
                onChange={(e) => setStartTime(e.target.value)}
                className={`bg-gray-200 p-2 rounded w-full ${
                    status === "Completed" ? "cursor-not-allowed opacity-60" : ""
                }`}
            />
          </div>

          <div className="space-y-1">
            <div className="block mb-1 text-sm">Duration (minutes)</div>
            <input
              type="number"
              min={15}
              step={15}
              value={durationMinutes}
              disabled={status === "Completed"}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className={`bg-gray-200 p-2 rounded w-full ${
                  status === "Completed" ? "cursor-not-allowed opacity-60" : ""
              }`}
              placeholder="Duration (minutes)"
            />
            {startTime && durationMinutes > 0 && (
              <div className="text-xs text-gray-700">
                Ends at: {new Date(new Date(startTime).getTime() + durationMinutes * 60000).toLocaleString()}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="block mb-1 text-sm">Notes</div>
            <textarea
              placeholder="Notes"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={status === "Completed"}
              className={`bg-gray-200 p-2 rounded w-full ${
                  status === "Completed" ? "cursor-not-allowed opacity-60" : ""
              }`}
            />
          </div>
          
          <div>
            <label className="block mb-1 text-sm">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-gray-200 p-2 rounded w-full"
            >
              <option value="Booked">Booked</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleSave}
              className="bg-gray-400 hover:bg-gray-500 px-6 py-2 rounded-md text-black"
            >
              Save
            </button>

            <button
              onClick={() => navigate("/reservations")}
              className="bg-gray-400 hover:bg-gray-500 px-6 py-2 rounded-md text-black"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
