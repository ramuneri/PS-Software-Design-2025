import { useEffect, useMemo, useState } from "react";
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

function toDateTimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function normalizeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];

  if (value && typeof value === "object" && "data" in value) {
    const maybeData = (value as { data?: unknown }).data;
    if (Array.isArray(maybeData)) return maybeData as T[];
  }

  return [];
}

export default function CreateReservationPage() {
  const navigate = useNavigate();

  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const filteredCustomers = useMemo(() => {
    const term = customerSearch.trim().toLowerCase();
    if (!term) return customers.slice(0, 5);
    return customers
      .filter((c) =>
        `${c.name ?? ""} ${c.email ?? ""}`.toLowerCase().includes(term)
      )
      .slice(0, 5);
  }, [customers, customerSearch]);

  const [employeesFiltered, setEmployeesFiltered] = useState<User[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");

  const [serviceId, setServiceId] = useState<number | "">("");
  const [employeeId, setEmployeeId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [note, setNote] = useState("");
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    surname: "",
    email: "",
    phone: "",
  });

  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim() && !newCustomer.email.trim()) {
      setError("Customer name or email is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Merchant-Id": "1",
          ...authHeaders(),
        },
        body: JSON.stringify({
          name: newCustomer.name.trim(),
          surname: newCustomer.surname.trim() || null,
          email: newCustomer.email.trim() || null,
          phone: newCustomer.phone.trim() || null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create customer");
      }

      const data = await res.json();
      const created = data.data ?? data;

      // Update local list and select
      setCustomers((prev) => [...prev, created]);
      setCustomerId(created.id);
      setShowNewCustomer(false);
      setNewCustomer({ name: "", surname: "", email: "", phone: "" });
    } catch (e: any) {
      setError(e?.message || "Failed to create customer");
    } finally {
      setLoading(false);
    }
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

        setServices(normalizeArray<Service>(await servicesRes.json()));
        const employeesData = normalizeArray<User>(await employeesRes.json());
        setEmployees(employeesData);
        setEmployeesFiltered(employeesData.slice(0, 5));
        setCustomers(normalizeArray<User>(await customersRes.json()));
      } catch {
        setError("Failed to load data");
      }
    };

    loadData();
  }, []);

  const handleCreate = async () => {
    if (!serviceId || !employeeId || !customerId || !startTime || !durationMinutes) {
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
            endTime: new Date(new Date(startTime).getTime() + durationMinutes * 60000).toISOString(),
            note: note.trim() || null,
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();

        if (text.includes("already has a reservation")) {
          setError("This employee is already booked at that time.");
        } else {
          setError(text || "Failed to create reservation.");
        }
        return;
      }

      // ✅ SUCCESS POPUP
      setSuccessMessage(
        "Reservation created successfully. SMS notification sent."
      );

      // ✅ DELAYED NAVIGATION
      setTimeout(() => {
        navigate("/reservations");
      }, 1500);
    } catch {
      setError("Failed to create reservation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-black bg-gray-200 p-6 flex justify-center">
      {/* ✅ SUCCESS TOAST */}
      {successMessage && (
        <div className="fixed top-6 right-6 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg z-50">
          {successMessage}
        </div>
      )}

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
          <div className="space-y-1">
            <div className="text-sm text-gray-800 font-medium">Service</div>
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
            {serviceId && (
              <div className="text-xs text-gray-700">
                Selected: {services.find((s) => s.serviceId === serviceId)?.name}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-sm text-gray-800 font-medium">Customer</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search customers..."
                className="flex-1 bg-gray-200 p-2 rounded"
              />
              <button
                type="button"
                onClick={() => setShowNewCustomer((v) => !v)}
                className="bg-gray-400 hover:bg-gray-500 px-3 py-2 rounded text-sm"
              >
                {showNewCustomer ? "Close" : "Add new"}
              </button>
            </div>

            {!showNewCustomer && (
              <div className="space-y-1">
                <div className="max-h-48 overflow-y-auto bg-gray-200 rounded border border-gray-300">
                  {filteredCustomers.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-600">No matches</div>
                  ) : (
                    filteredCustomers.map((c) => {
                      const label = c.name ?? c.email ?? "Customer";
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCustomerId(c.id)}
                          className={`w-full text-left px-3 py-2 text-sm ${
                            customerId === c.id ? "bg-gray-400" : "hover:bg-gray-300"
                          }`}
                        >
                          <div className="font-medium">{label}</div>
                          <div className="text-xs text-gray-700">{c.email ?? ""}</div>
                        </button>
                      );
                    })
                  )}
                </div>
                <div className="text-xs text-gray-600">Showing up to 5 results</div>
              </div>
            )}
            {customerId && (
              <div className="text-xs text-gray-700">
                Selected: {customers.find((c) => c.id === customerId)?.name ?? customers.find((c) => c.id === customerId)?.email}
              </div>
            )}
            {showNewCustomer && (
              <div className="space-y-2 bg-gray-200 p-3 rounded">
                <input
                  className="w-full bg-white p-2 rounded text-sm"
                  placeholder="Name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                />
                <input
                  className="w-full bg-white p-2 rounded text-sm"
                  placeholder="Surname"
                  value={newCustomer.surname}
                  onChange={(e) => setNewCustomer({ ...newCustomer, surname: e.target.value })}
                />
                <input
                  className="w-full bg-white p-2 rounded text-sm"
                  placeholder="Email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                />
                <input
                  className="w-full bg-white p-2 rounded text-sm"
                  placeholder="Phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                />
                <button
                  type="button"
                  onClick={handleCreateCustomer}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm"
                  disabled={loading}
                >
                  {loading ? "Saving…" : "Save customer"}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-sm text-gray-800 font-medium">Employee</div>
            <input
              type="text"
              value={employeeSearch}
              onChange={(e) => {
                const term = e.target.value;
                setEmployeeSearch(term);
                const lowered = term.trim().toLowerCase();
                if (!lowered) {
                  setEmployeesFiltered(employees.slice(0, 5));
                } else {
                  setEmployeesFiltered(
                    employees
                      .filter((emp) =>
                        `${emp.name ?? ""} ${emp.email ?? ""}`
                          .toLowerCase()
                          .includes(lowered)
                      )
                      .slice(0, 5)
                  );
                }
              }}
              placeholder="Search employees..."
              className="w-full bg-gray-200 p-2 rounded"
            />
            <div className="max-h-48 overflow-y-auto bg-gray-200 rounded border border-gray-300">
              {employeesFiltered.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-600">No matches</div>
              ) : (
                employeesFiltered.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setEmployeeId(e.id)}
                    className={`w-full text-left px-3 py-2 text-sm ${
                      employeeId === e.id ? "bg-gray-400" : "hover:bg-gray-300"
                    }`}
                  >
                    <div className="font-medium">{e.name ?? e.email}</div>
                    <div className="text-xs text-gray-700">{e.email}</div>
                  </button>
                ))
              )}
            </div>
            {employeeId && (
              <div className="text-xs text-gray-700">
                Selected: {employees.find((e) => e.id === employeeId)?.name ?? employees.find((e) => e.id === employeeId)?.email}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-sm text-gray-800 font-medium">Start time</div>
            <input
              type="datetime-local"
              value={startTime}
              min={toDateTimeLocalValue(new Date())}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-gray-400 p-2 rounded"
            />
          </div>

          <div className="space-y-1">
            <div className="text-sm text-gray-800 font-medium">Duration (minutes)</div>
            <input
              type="number"
              min={15}
              step={15}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full bg-gray-400 p-2 rounded"
              placeholder="Duration (minutes)"
            />
            {startTime && durationMinutes > 0 && (
              <div className="text-xs text-gray-700">
                Ends at:{" "}
                {new Date(new Date(startTime).getTime() + durationMinutes * 60000).toLocaleString()}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-sm text-gray-800 font-medium">Notes</div>
            <textarea
              placeholder="Notes"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-gray-400 p-2 rounded min-h-20"
            />
          </div>
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
