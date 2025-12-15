import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type User = {
  id: string;
  email: string;
  name: string;
  surname?: string | null;
  phoneNumber?: string | null;
  role: "OWNER" | "MANAGER" | "EMPLOYEE" | string;
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

  // UI state (matches the mock)
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<string>(""); // "", OWNER, MANAGER, EMPLOYEE

  // paging (swagger supports limit/offset)
  const [limit] = useState(50);
  const [offset] = useState(0);

  async function loadUsers() {
    try {
      setLoading(true);
      setError(null);

      const url = new URL(`${import.meta.env.VITE_API_URL}/api/users`);
      if (role) url.searchParams.set("role", role || "Employee"); // TODO:fix this 
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("offset", String(offset));

      const res = await fetch(url.toString(), {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
          // If you need tenant override for super_admin, add:
          // "X-Merchant-Id": "<merchantId>",
        },
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Failed to load users (${res.status})`);
      }

      const json = await res.json();

      // Swagger: { data: User[] } :contentReference[oaicite:3]{index=3}
      const list: User[] = Array.isArray(json) ? json : (json.data ?? []);
      setUsers(list);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }


  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      const haystack = `${u.email} ${u.name} ${u.surname ?? ""} ${u.phoneNumber ?? ""} ${u.role}`
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [users, query]);

  const handleCreate = () => {
    // If you have a create/invite flow later, route to it.
    // For now you can add a stub page or disable.
    navigate("/users/create");
  };

  return (
    <div className="bg-gray-200 flex flex-col text-black" style={{ height: "calc(100vh - 52px)" }}>
      <div className="p-6 flex-1 flex flex-col overflow-hidden">
        <div className="space-y-6 flex-1 flex flex-col">

          {/* Header */}
          <div className="bg-gray-300 rounded-md py-3 px-4 text-center font-medium">
            User List
          </div>

          {/* Controls row */}
          <div className="bg-gray-300 rounded-md p-4 space-y-3">
            <div className="text-black font-medium">Search For specific item</div>

            <div className="flex gap-3 items-center">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-gray-200 rounded-md px-4 py-2"
                placeholder="Search by email, name, phone, role…"
              />

              <button
                onClick={() => {/* client-side search; no-op */}}
                className="bg-gray-200 hover:bg-gray-400 rounded-md px-4 py-2 font-medium"
              >
                Search
              </button>
            </div>

            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="font-medium">Role</span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="bg-gray-200 rounded-md px-3 py-2"
                >
                  <option value="">All</option>
                  {/* TODO:
                  <option value="Owner">Owner</option>
                  <option value="Manager">Manager</option> */}
                  <option value="Employee">Employee</option>
                </select>
              </div>


              <button
                onClick={loadUsers}
                className="ml-auto bg-gray-200 hover:bg-gray-400 rounded-md px-4 py-2 font-medium"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Table */}
          <div className="bg-gray-300 rounded-md flex-1 flex flex-col overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 text-black font-medium border-b border-gray-400">
              <span className="col-span-3">Email</span>
              <span className="col-span-3">Name</span>
              <span className="col-span-2">Phone number</span>
              <span className="col-span-2">Role</span>
              <span className="col-span-2 text-right">Last login at</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading && <div className=" text-center py-8">Loading users…</div>}

              {!loading && filtered.length === 0 && (
                <div className="text-black text-center py-8">No users found</div>
              )}

              <div className="space-y-3">
                {!loading &&
                  filtered.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => navigate(`/users/${u.id}`)}
                      className={`grid grid-cols-5 px-6 py-4 bg-gray-200 rounded-md cursor-pointer hover:bg-gray-400 transition`}
                    >
                      <span>{u.email}</span>
                      <span>{u.surname ? `${u.name} ${u.surname}` : u.name}</span>
                      <span>{u.phoneNumber ?? "-"}</span>
                      <span>{u.role}</span>
                      <span>
                        {formatDateTime(u.lastLoginAt)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Create */}
          <div className="w-64">
            <button
              onClick={handleCreate}
              className="w-full bg-gray-300 hover:bg-gray-400 rounded-md py-3 font-medium"
              disabled={loading}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
