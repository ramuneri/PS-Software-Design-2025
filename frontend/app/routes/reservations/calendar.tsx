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

const WORK_START_HOUR = 7;
const WORK_END_HOUR = 20;

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

  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 7);
    end.setHours(0, 0, 0, 0);
    return end;
  }, [weekStart]);

  const hours = useMemo(() => {
    const relevant = reservations.filter((r) => {
      const start = new Date(r.startTime);
      if (Number.isNaN(start.getTime())) return false;
      return start >= weekStart && start < weekEnd;
    });

    let minHour = WORK_START_HOUR;
    let maxHour = WORK_END_HOUR;

    relevant.forEach((r) => {
      const start = new Date(r.startTime);
      const end = new Date(r.endTime);

      if (!Number.isNaN(start.getTime())) {
        minHour = Math.min(minHour, start.getHours());
        maxHour = Math.max(maxHour, start.getHours() + 1);
      }

      if (!Number.isNaN(end.getTime())) {
        const endHour = end.getHours() + (end.getMinutes() > 0 ? 1 : 0);
        maxHour = Math.max(maxHour, endHour);
      }
    });

    minHour = Math.max(0, minHour);
    maxHour = Math.min(23, maxHour);

    return Array.from(
      { length: maxHour - minHour + 1 },
      (_, i) => minHour + i
    );
  }, [reservations, weekEnd, weekStart]);

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
      const list = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
      setReservations(list);
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
            <div key={day.toDateString()} className="p-3 text-center font-medium">
              {day.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
          ))}

          {hours.map((hour) => (
            <div key={hour} className="contents">
              <div className="p-3 text-sm">{hour}:00</div>

              {days.map((day) => {
                const matches = reservations.filter((r) => {
                  const start = new Date(r.startTime);
                  if (Number.isNaN(start.getTime())) return false;
                  const sameDay =
                    start.getFullYear() === day.getFullYear() &&
                    start.getMonth() === day.getMonth() &&
                    start.getDate() === day.getDate();
                  if (!sameDay) return false;
                  return start.getHours() === hour;
                });

                return (
                  <div
                    key={`${day.toDateString()}-${hour}`}
                    className="relative h-20 border-t border-gray-400"
                  >
                    {matches.map((r) => (
                      <div
                        key={r.id}
                        className="absolute inset-1 bg-gray-400 rounded-md p-2 text-xs"
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
