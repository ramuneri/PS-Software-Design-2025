import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type Customer = {
  id: number;
  name?: string | null;
  surname?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive?: boolean;
};

type Reservation = {
  id: number;
  customerId?: string | null;
  customerEmail?: string | null;
  employeeName?: string | null;
  serviceName?: string | null;
  status?: string | null;
  startTime?: string | null;
};

type DataResponse<T> = { data: T };

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("access-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
}

function formatTime(dateStr?: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      // fetch customer
      const custRes = await fetch(
        `${import.meta.env.VITE_API_URL}/api/customers/${id}`,
        { headers: { ...authHeaders(), "X-Merchant-Id": "1" } }
      );
      if (custRes.status === 404) {
        setError("Customer not found");
        setCustomer(null);
        setReservations([]);
        setLoading(false);
        return;
      }
      if (custRes.status === 401) {
        localStorage.removeItem("access-token");
        navigate("/login");
        return;
      }
      if (!custRes.ok) {
        const txt = await custRes.text();
        throw new Error(txt || "Failed to load customer");
      }

      const custJson: DataResponse<Customer> | Customer = await custRes.json();
      const loadedCustomer = (custJson as any).data ?? (custJson as Customer);
      setCustomer(loadedCustomer);

      // fetch reservations (services only)
      const resRes = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reservations?includeInactive=true`,
        { headers: authHeaders() }
      );
      if (resRes.ok) {
        const resJson: Reservation[] | DataResponse<Reservation[]> =
          await resRes.json();
        const resList = Array.isArray(resJson)
          ? resJson
          : Array.isArray((resJson as any).data)
          ? (resJson as any).data
          : [];
        setReservations(resList);
      } else {
        setReservations([]);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load customer");
      setCustomer(null);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm("Deactivate this customer?")) return;
    try {
      setSaving(true);
      setError(null);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/customers/${id}`,
        {
          method: "DELETE",
          headers: { ...authHeaders(), "X-Merchant-Id": "1" },
        }
      );
      if (res.status === 401) {
        localStorage.removeItem("access-token");
        navigate("/login");
        return;
      }
      if (!res.ok && res.status !== 204) {
        const txt = await res.text();
        throw new Error(txt || "Failed to delete customer");
      }
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to delete customer");
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async () => {
    if (!id) return;
    try {
      setSaving(true);
      setError(null);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/customers/${id}/restore`,
        {
          method: "POST",
          headers: { ...authHeaders(), "X-Merchant-Id": "1" },
        }
      );
      if (res.status === 401) {
        localStorage.removeItem("access-token");
        navigate("/login");
        return;
      }
      if (!res.ok && res.status !== 204) {
        const txt = await res.text();
        throw new Error(txt || "Failed to restore customer");
      }
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to restore customer");
    } finally {
      setSaving(false);
    }
  };

  const reservationsForCustomer = useMemo(() => {
    if (!customer) return [];
    const cid = customer.id?.toString();
    const email = customer.email?.trim().toLowerCase();

    return reservations.filter((r) => {
      const sameId = cid && (r.customerId ?? "") === cid;
      const sameEmail =
        email && (r.customerEmail ?? "").toLowerCase() === email;
      return sameId || sameEmail;
    });
  }, [customer, reservations]);

  const pastReservations = useMemo(() => {
    const now = new Date();
    return reservationsForCustomer
      .filter((r) => new Date(r.startTime ?? 0) < now)
      .sort((a, b) => new Date(b.startTime ?? 0).getTime() - new Date(a.startTime ?? 0).getTime());
  }, [reservationsForCustomer]);

  const upcomingReservations = useMemo(() => {
    const now = new Date();
    return reservationsForCustomer
      .filter((r) => new Date(r.startTime ?? 0) >= now)
      .sort((a, b) => new Date(a.startTime ?? 0).getTime() - new Date(b.startTime ?? 0).getTime());
  }, [reservationsForCustomer]);

  const displayName = customer
    ? [customer.name, customer.surname].filter(Boolean).join(" ") || customer.email || "Customer"
    : "Customer";
  const isActive = customer?.isActive !== false;

  return (
    <div className="min-h-screen bg-gray-200 text-black p-6 flex justify-center">
      <div className="w-[90%] max-w-5xl space-y-6">
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center font-medium">
          Customer Detail
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading && (
          <div className="bg-gray-300 rounded-md px-4 py-3 text-center">Loading…</div>
        )}

        {!loading && customer && (
          <>
            <div className="bg-gray-300 rounded-md p-6 flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-gray-400 flex items-center justify-center text-2xl font-semibold">
                {displayName[0]?.toUpperCase() ?? "C"}
              </div>
              <div className="flex-1 space-y-1">
                <div className="text-xl font-semibold">{displayName}</div>
                <div className="text-gray-700">{customer.phone || "No phone"}</div>
                <div className="text-gray-700">{customer.email || "No email"}</div>
                <div className="text-sm text-gray-700">
                  Status: {isActive ? "Active" : "Inactive"}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/customers/${customer.id}/edit`)}
                  disabled={saving}
                  className="bg-gray-400 hover:bg-gray-500 text-black px-4 py-2 rounded disabled:opacity-60"
                >
                  Edit
                </button>
                {isActive ? (
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-60"
                  >
                    Delete
                  </button>
                ) : (
                  <button
                    onClick={handleRestore}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-60"
                  >
                    Restore
                  </button>
                )}
              </div>
            </div>

            <div className="bg-gray-300 rounded-md p-4">
              <div className="text-lg font-semibold mb-3">Past Reservations</div>
              {pastReservations.length === 0 ? (
                <div className="text-sm text-gray-700">No past reservations.</div>
              ) : (
                <div className="space-y-2">
                  {pastReservations.map((r) => (
                    <div key={r.id} className="grid grid-cols-4 bg-gray-200 rounded px-3 py-2 text-sm">
                      <span>#{r.id}</span>
                      <span>{formatDate(r.startTime)}</span>
                      <span>{r.status ?? "—"}</span>
                      <span className="text-right">{r.serviceName ?? "Service"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-300 rounded-md p-4">
              <div className="text-lg font-semibold mb-3">Upcoming Reservations</div>
              {upcomingReservations.length === 0 ? (
                <div className="text-sm text-gray-700">No upcoming reservations.</div>
              ) : (
                <div className="space-y-2">
                  {upcomingReservations.map((r) => (
                    <div key={r.id} className="grid grid-cols-5 bg-gray-200 rounded px-3 py-2 text-sm items-center">
                      <span>{formatDate(r.startTime)}</span>
                      <span>{formatTime(r.startTime)}</span>
                      <span>{r.employeeName ?? "Employee"}</span>
                      <span>{r.serviceName ?? "Service"}</span>
                      <button
                        onClick={() => navigate(`/reservations/${r.id}/edit`)}
                        className="text-blue-700 hover:underline text-right"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
