import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Customer = {
  id: number;
  name?: string | null;
  surname?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive?: boolean;
};

type DataResponse<T> = { data: T };

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("access-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function CustomersListPage() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    surname: "",
    email: "",
    phone: "",
    isActive: true,
  });

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        includeInactive: String(includeInactive),
        limit: "200",
      });
      if (query.trim()) params.set("q", query.trim());

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/customers?${params}`,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Merchant-Id": "1",
            ...authHeaders(),
          },
        }
      );

      if (res.status === 401) {
        localStorage.removeItem("access-token");
        navigate("/login");
        return;
      }

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Failed to load customers (${res.status})`);
      }

      const data: any = await res.json();
      const list = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
      setCustomers(list);
    } catch (e: any) {
      setError(e?.message || "Failed to load customers");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [includeInactive]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      `${c.name ?? ""} ${c.surname ?? ""} ${c.email ?? ""} ${c.phone ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [customers, query]);

  const handleCreate = async () => {
    const name = newCustomer.name.trim();
    const surname = newCustomer.surname.trim();
    const email = newCustomer.email.trim();
    const phone = newCustomer.phone.trim();

    if (!name && !email) {
      setCreateError("Name or email is required");
      return;
    }

    try {
      setCreating(true);
      setCreateError(null);
      setCreateSuccess(null);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Merchant-Id": "1",
          ...authHeaders(),
        },
        body: JSON.stringify({
          name: name || null,
          surname: surname || null,
          email: email || null,
          phone: phone || null,
          isActive: newCustomer.isActive,
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to create customer");
      }

      const data: any = await res.json();
      const created = data?.data ?? data;

      setCustomers((prev) => [created, ...prev]);
      setCreateSuccess("Customer created");
      setNewCustomer({
        name: "",
        surname: "",
        email: "",
        phone: "",
        isActive: true,
      });
    } catch (e: any) {
      setCreateError(e?.message || "Failed to create customer");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 p-6 text-black flex justify-center">
      <div className="w-[90%] max-w-5xl space-y-6">
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center font-medium">
          Customers
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {(createError || createSuccess) && (
          <div
            className={`px-4 py-3 rounded ${
              createError
                ? "bg-red-100 border border-red-400 text-red-700"
                : "bg-green-100 border border-green-400 text-green-700"
            }`}
          >
            {createError || createSuccess}
          </div>
        )}

        <div className="bg-gray-300 rounded-md p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-800">Name</div>
              <input
                value={newCustomer.name}
                onChange={(e) =>
                  setNewCustomer((s) => ({ ...s, name: e.target.value }))
                }
                className="w-full bg-gray-200 rounded-md px-3 py-2"
                placeholder="First name"
              />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-800">Surname</div>
              <input
                value={newCustomer.surname}
                onChange={(e) =>
                  setNewCustomer((s) => ({ ...s, surname: e.target.value }))
                }
                className="w-full bg-gray-200 rounded-md px-3 py-2"
                placeholder="Last name"
              />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-800">Email</div>
              <input
                value={newCustomer.email}
                onChange={(e) =>
                  setNewCustomer((s) => ({ ...s, email: e.target.value }))
                }
                className="w-full bg-gray-200 rounded-md px-3 py-2"
                placeholder="email@example.com"
                type="email"
              />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-800">Phone</div>
              <input
                value={newCustomer.phone}
                onChange={(e) =>
                  setNewCustomer((s) => ({ ...s, phone: e.target.value }))
                }
                className="w-full bg-gray-200 rounded-md px-3 py-2"
                placeholder="+370..."
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={newCustomer.isActive}
              onChange={(e) =>
                setNewCustomer((s) => ({ ...s, isActive: e.target.checked }))
              }
            />
            <span>Active</span>
          </label>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded disabled:opacity-60"
            >
              {creating ? "Creating..." : "Create customer"}
            </button>
          </div>
        </div>

        <div className="bg-gray-300 rounded-md p-4 space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, phone…"
              className="flex-1 bg-gray-200 rounded-md px-3 py-2"
            />
            <button
              type="button"
              onClick={loadCustomers}
              className="bg-gray-400 hover:bg-gray-500 text-black px-4 py-2 rounded"
            >
              Refresh
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            <span>Show inactive</span>
          </label>
        </div>

        <div className="bg-gray-300 rounded-md overflow-hidden">
          <div className="grid grid-cols-4 px-4 py-3 font-medium text-sm border-b border-gray-400">
            <span>Name</span>
            <span>Email</span>
            <span>Phone</span>
            <span className="text-right">Status</span>
          </div>
          <div className="p-4 space-y-2">
            {loading && <div className="text-center">Loading customers…</div>}
            {!loading && filtered.length === 0 && (
              <div className="text-center text-gray-700">No customers found</div>
            )}
            {!loading &&
              filtered.map((c) => {
                const name = [c.name, c.surname].filter(Boolean).join(" ") || c.email || "Customer";
                return (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/customers/${c.id}`)}
                    className="grid grid-cols-4 bg-gray-200 rounded px-4 py-3 text-sm cursor-pointer hover:bg-gray-400 transition-colors"
                  >
                    <span className="font-medium">{name}</span>
                    <span>{c.email || "-"}</span>
                    <span>{c.phone || "-"}</span>
                    <span className="text-right">{c.isActive === false ? "Inactive" : "Active"}</span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
