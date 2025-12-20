import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReservationsCalendar from "./calendar";


type Reservation = {
  id: number;
  employeeId: string | null;
  employeeName: string | null;
  customerId: string | null;
  customerName: string | null;
  serviceId: number | null;
  serviceName: string | null;
  status: string;
  startTime: string;
  endTime: string;
  bookedAt: string;
  isActive: boolean;
};

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("access-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ReservationsPage() {
  const navigate = useNavigate();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactiveOnly, setShowInactiveOnly] = useState(false);

  const loadReservations = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reservations?includeInactive=${showInactiveOnly}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to load reservations");
      }

      const data = await res.json();
      setReservations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, [showInactiveOnly]);

  const visibleReservations = showInactiveOnly
    ? reservations.filter((r) => !r.isActive)
    : reservations;

  const cancelReservation = async (id: number) => {
    await fetch(
      `${import.meta.env.VITE_API_URL}/api/reservations/${id}`,
      {
        method: "DELETE",
        headers: authHeaders(),
      }
    );
    loadReservations();
  };

  const restoreReservation = async (id: number) => {
    await fetch(
      `${import.meta.env.VITE_API_URL}/api/reservations/${id}/restore`,
      {
        method: "POST",
        headers: authHeaders(),
      }
    );
    loadReservations();
  };

  if (loading) {
    return <div className="p-6 text-black">Loading reservations…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-[95%] mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          Reservations Calendar
        </div>

        <div className="mt-10">
          <ReservationsCalendar />
        </div>

        {/* CREATE */}
        <div className="pt-6">
          <button
            onClick={() => navigate("/reservations/create")}
            className="w-48 bg-gray-400 hover:bg-gray-500 rounded-md py-2 text-black"
          >
            Create Reservation
          </button>
        </div>

        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          All Time Reservations
        </div>
        
        


        {/* SHOW INACTIVE */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={showInactiveOnly}
            onChange={(e) => setShowInactiveOnly(e.target.checked)}
          />
          <span className="text-black">Show inactive only</span>
        </div>


        {/* TABLE HEADER */}
        <div className="grid grid-cols-7 px-4 text-sm font-medium text-black">
          <span>Date</span>
          <span>Service</span>
          <span>Customer</span>
          <span>Employee</span>
          <span>Status</span>
          <span>Time</span>
          <span className="text-right">Actions</span>
        </div>

        {/* LIST */}
        <div className="space-y-3">
          {visibleReservations.map((r) => (
            <div
              key={r.id}
              className={`grid grid-cols-7 bg-gray-300 rounded-md px-4 py-3 items-center text-black ${
                !r.isActive ? "opacity-50" : ""
              }`}
            >
              <span>
                {new Date(r.startTime).toLocaleDateString()}
              </span>

              <span>{r.serviceName ?? "-"}</span>

              <span>{r.customerName ?? "-"}</span>

              <span>{r.employeeName ?? "-"}</span>

              <span>{r.status}</span>

              <span>
                {new Date(r.startTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {" – "}
                {new Date(r.endTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>

              {/* ACTIONS */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => navigate(`/reservations/${r.id}/edit`)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Edit
                </button>

                {r.isActive ? (
                  <button
                    onClick={() => cancelReservation(r.id)}
                    className="bg-red-400 hover:bg-red-500 px-3 py-1 rounded"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    onClick={() => restoreReservation(r.id)}
                    className="bg-green-400 hover:bg-green-500 px-3 py-1 rounded"
                  >
                    Restore
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
