import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type User = {
  id: string;
  email: string;
  name: string;
  surname?: string | null;
  phoneNumber?: string | null;
  role: string;
  lastLoginAt?: string | null;
};

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("access-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDateTime(dateString?: string | null) {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "-";
  return d
    .toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(",", "");
}

export default function UsersListPage() {
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [role, setRole] = useState<string>(""); // "", Employee, Customer

  async function loadUsers() {
    try {
      setLoading(true);
      setError(null);

      const url = new URL(`${import.meta.env.VITE_API_URL}/api/users`);
      if (role) url.searchParams.set("role", role);

      const res = await fetch(url.toString(), {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Failed to load users (${res.status})`);
      }

      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [role]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) =>
      `${u.email} ${u.name} ${u.surname ?? ""} ${u.phoneNumber ?? ""} ${u.role}`
        .toLowerCase()
        .includes(q)
    );
  }, [users, query]);

  return (
    <div className="bg-gray-200 flex flex-col text-black" style={{ height: "calc(100vh - 52px)" }}>
      <div className="p-6 flex-1 flex flex-col overflow-hidden space-y-6">

        {/* Header */}
        <div className="bg-gray-300 rounded-md py-3 text-center font-medium">
          User List
        </div>

        {/* Filters */}
        <div className="bg-gray-300 rounded-md p-4 space-y-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-gray-200 rounded-md px-4 py-2"
            placeholder="Search by email, name, phone, role…"
          />

          <div className="flex items-center gap-4">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="bg-gray-200 rounded-md px-3 py-2"
            >
              <option value="">All</option>
              <option value="Employee">Employee</option>
              <option value="Customer">Customer</option>
            </select>

            <button
              onClick={loadUsers}
              className="ml-auto bg-gray-200 hover:bg-gray-400 rounded-md px-4 py-2 font-medium"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-gray-300 rounded-md flex-1 overflow-hidden">
          <div className="grid grid-cols-12 px-6 py-4 font-medium border-b border-gray-400">
            <span className="col-span-3">Email</span>
            <span className="col-span-3">Name</span>
            <span className="col-span-2">Phone</span>
            <span className="col-span-2 text-center">Role</span>
            <span className="col-span-2 text-right">Last login</span>
          </div>

          <div className="p-4 space-y-3 overflow-y-auto">
            {loading && <div className="text-center py-8">Loading users…</div>}

            {!loading && filtered.length === 0 && (
              <div className="text-center py-8">No users found</div>
            )}

            {!loading &&
              filtered.map((u) => (
                <div
                  key={u.id}
                  onClick={() => navigate(`/users/${u.id}`)}
                  className="grid grid-cols-12 px-6 py-4 bg-gray-200 rounded-md cursor-pointer hover:bg-gray-400 transition"
                >
                  <span className="col-span-3">{u.email}</span>
                  <span className="col-span-3">
                    {u.surname ? `${u.name} ${u.surname}` : u.name}
                  </span>
                  <span className="col-span-2">{u.phoneNumber ?? "-"}</span>
                  <span className="col-span-2 text-center">{u.role}</span>
                  <span className="col-span-2 text-right">
                    {formatDateTime(u.lastLoginAt)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
