import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Reservation = {
  id: number;
  startTime: string;
  endTime: string;
  customerName: string | null;
  serviceName: string | null;
};

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("access-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function ReservationsCalendar() {
  const navigate = useNavigate();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [weekStart, setWeekStart] = useState(() => getStartOfWeek(new Date()));
  const [loading, setLoading] = useState(true);

  const hours = useMemo(
    () => Array.from({ length: 12 }, (_, i) => 8 + i), // 08–19
    []
  );

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
      }),
    [weekStart]
  );

  useEffect(() => {
    async function loadReservations() {
      setLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reservations`,
        { headers: authHeaders() }
      );
      const data = await res.json();
      setReservations(data);
      setLoading(false);
    }

    loadReservations();
  }, [weekStart]);

  const prevWeek = () =>
    setWeekStart((d) => new Date(d.getTime() - 7 * 86400000));

  const nextWeek = () =>
    setWeekStart((d) => new Date(d.getTime() + 7 * 86400000));

  if (loading) {
    return <div className="p-6 text-black">Loading calendar…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-200 p-6 space-y-6">

      {/* WEEK NAVIGATION */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={prevWeek}
          className="px-3 py-1 bg-gray-300 hover:bg-gray-400 rounded-md"
        >
          ←
        </button>

        <div className="text-black font-medium">
          {weekStart.toLocaleDateString()} –{" "}
          {new Date(weekStart.getTime() + 6 * 86400000).toLocaleDateString()}
        </div>

        <button
          onClick={nextWeek}
          className="px-3 py-1 bg-gray-300 hover:bg-gray-400 rounded-md"
        >
          →
        </button>
      </div>

      {/* CALENDAR */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-8 bg-gray-300 rounded-md">

          {/* HEADER ROW */}
          <div />
          {days.map((day) => (
            <div
              key={day.toDateString()}
              className="p-3 text-center font-medium text-black"
            >
              {day.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
          ))}

          {/* TIME SLOTS */}
          {hours.map((hour) => (
            <div key={hour} className="contents">
              <div className="p-3 text-sm text-black">
                {hour}:00
              </div>

              {days.map((day) => {
                const matches = reservations.filter((r) => {
                  const start = new Date(r.startTime);
                  return (
                    start.getHours() === hour &&
                    start.toDateString() === day.toDateString()
                  );
                });

                return (
                  <div
                    key={`${day.toDateString()}-${hour}`}
                    className="relative h-20 border-t border-gray-400"
                  >
                    {matches.map((r) => (
                      <div
                        key={r.id}
                        className="absolute inset-1 bg-gray-400 rounded-md p-2 text-xs text-black"
                      >
                        <div className="font-medium">
                          {r.customerName ?? "Customer"}
                        </div>
                        <div className="opacity-80">
                          {r.serviceName ?? "Service"}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
