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
  const [weekStart, setWeekStart] = useState(() =>
    getStartOfWeek(new Date())
  );
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 7);
    end.setHours(0, 0, 0, 0);
    return end;
  }, [weekStart]);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

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
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/reservations`,
          { headers: authHeaders() }
        );
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
          ? data.data
          : [];
        setReservations(list);
      } finally {
        setLoading(false);
      }
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


  /* Day */

  if (viewMode === "day" && selectedDay) {
    const dayReservations = reservations
      .filter((r) => {
        const start = new Date(r.startTime);
        return (
          start.getFullYear() === selectedDay.getFullYear() &&
          start.getMonth() === selectedDay.getMonth() &&
          start.getDate() === selectedDay.getDate()
        );
      })
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() -
          new Date(b.startTime).getTime()
      );

    return (
      <div className="text-black p-6 space-y-6 ">
        <div className="flex items-center gap-4 ">
          <button
            onClick={() => setViewMode("week")}
            className="bg-gray-400 hover:bg-gray-500 rounded-md py-3 px-4 text-center text-black font-medium"
          >
            ← Back to week
          </button>


          <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
            {selectedDay.toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        <div className="space-y-3">
          {dayReservations.length === 0 && (
            <div className="bg-gray-300 rounded-md p-4">
              No reservations for this day
            </div>
          )}

          {dayReservations.map((r) => {
            const start = new Date(r.startTime);
            const end = new Date(r.endTime);

            return (
              <div
                key={r.id}
                onClick={() => navigate(`/reservations/${r.id}/edit`)}
                className="bg-gray-300 rounded-md p-4 cursor-pointer hover:bg-gray-400"
              >
                <div className="flex justify-between">
                  <div className="font-medium">
                    {r.customerName ?? "Customer"}
                  </div>
                  <div className="text-sm opacity-80">
                    {start.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    –{" "}
                    {end.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                <div className="text-sm opacity-80">
                  {r.serviceName ?? "Service"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }


  /* Week */

  return (
    <div className="text-black p-6 space-y-6">
      <div className="flex items-center justify-center gap-4">
        <button onClick={prevWeek} className="px-3 py-1 bg-gray-300 rounded">
          ←
        </button>

        <div className="font-medium">
          {weekStart.toLocaleDateString()} –{" "}
          {new Date(weekStart.getTime() + 6 * 86400000).toLocaleDateString()}
        </div>

        <button onClick={nextWeek} className="px-3 py-1 bg-gray-300 rounded">
          →
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="grid grid-cols-8 bg-gray-300 rounded-md">
          <div />
          {days.map((day) => (
            <button
              key={day.toDateString()}
              onClick={() => {
                setSelectedDay(day);
                setViewMode("day");
              }}
              className="p-3 text-center font-medium hover:bg-gray-200"
            >
              {day.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </button>
          ))}

          {hours.map((hour) => (
            <div key={hour} className="contents">
              <div className="p-3 text-sm">{hour}:00</div>

              {days.map((day) => {
                const matches = reservations.filter((r) => {
                  const start = new Date(r.startTime);
                  return (
                    start.getHours() === hour &&
                    start.getFullYear() === day.getFullYear() &&
                    start.getMonth() === day.getMonth() &&
                    start.getDate() === day.getDate()
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
                        className="absolute inset-1 bg-gray-400 rounded-md p-2 text-xs cursor-pointer"
                        onClick={() =>
                          navigate(`/reservations/${r.id}/edit`)
                        }
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
