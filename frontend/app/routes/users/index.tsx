import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type UserRow = {
  id: string;
  email: string;
  name: string;
  phoneNumber?: string | null;
  role: string;
  isActive: boolean;
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

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [role, setRole] = useState<string>("");
  const [includeInactive, setIncludeInactive] = useState(false);

  // Get current user info to check permissions
  const getCurrentUser = () => {
    const userJson = localStorage.getItem("user");
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  };

  const currentUser = getCurrentUser();
  const canManageUsers = currentUser && (currentUser.isSuperAdmin || currentUser.role === "Owner");
  
  // Invite creation state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Employee");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [createdInviteLink, setCreatedInviteLink] = useState<string | null>(null);

  async function loadUsers() {
    try {
      setLoading(true);
      setError(null);

      const url = new URL(`${import.meta.env.VITE_API_URL}/api/users`);
      if (role) url.searchParams.set("role", role);
      url.searchParams.set("includeInactive", includeInactive ? "true" : "false");

      const res = await fetch(url.toString(), {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
      });


      if (res.status === 401) {
        localStorage.removeItem("access-token");
        navigate("/login");
        return;
      }

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
  }, [role, includeInactive]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) =>
      `${u.email} ${u.name} ${u.phoneNumber ?? ""} ${u.role}`
        .toLowerCase()
        .includes(q)
    );
  }, [users, query]);

  async function handleDeactivate(userId: string) {
    if (!confirm("Are you sure you want to deactivate this user?")) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/${userId}`,
        {
          method: "DELETE",
          headers: authHeaders(),
        }
      );

      if (res.status === 401) {
        localStorage.removeItem("access-token");
        navigate("/login");
        return;
      }

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to deactivate user");
      }

      await loadUsers();
    } catch (e: any) {
      setError(e?.message ?? "Failed to deactivate user");
    }
  }

  async function handleRestore(userId: string) {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/${userId}/restore`,
        {
          method: "POST",
          headers: authHeaders(),
        }
      );

      if (res.status === 401) {
        localStorage.removeItem("access-token");
        navigate("/login");
        return;
      }

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to restore user");
      }

      await loadUsers();
    } catch (e: any) {
      setError(e?.message ?? "Failed to restore user");
    }
  }

  async function handleCreateInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError(null);
    setCreatedInviteLink(null);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/invites`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({
            email: inviteEmail.trim(),
            role: inviteRole,
          }),
        }
      );

      if (res.status === 401) {
        localStorage.removeItem("access-token");
        navigate("/login");
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Failed to create invite" }));
        throw new Error(errorData.message || `Failed to create invite (${res.status})`);
      }

      const data = await res.json();
      setCreatedInviteLink(data.inviteLink);
      setInviteEmail("");
    } catch (e: any) {
      setInviteError(e?.message ?? "Failed to create invite");
    } finally {
      setInviteLoading(false);
    }
  }

  function copyInviteLink() {
    if (createdInviteLink) {
      navigator.clipboard.writeText(createdInviteLink);
      alert("Invite link copied to clipboard!");
    }
  }

  function closeInviteModal() {
    setShowInviteModal(false);
    setInviteEmail("");
    setInviteRole("Employee");
    setInviteError(null);
    setCreatedInviteLink(null);
  }

  return (
    <div className="bg-gray-200 flex flex-col text-black" style={{ height: "calc(100vh - 52px)" }}>
      <div className="p-6 flex-1 flex flex-col overflow-hidden space-y-6">

        <div className="bg-gray-300 rounded-md py-3 text-center font-medium">
          User List
        </div>

        <div className="bg-gray-300 rounded-md p-4 space-y-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-gray-200 rounded-md px-4 py-2"
            placeholder="Search by email, name, phone, role…"
          />

          <div className="flex items-center gap-6">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="bg-gray-200 rounded-md px-3 py-2"
            >
              <option value="">All</option>
              <option value="Owner">Owner</option>
              <option value="Employee">Employee</option>
              <option value="Customer">Customer</option>
            </select>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
              />
              <span>Show inactive</span>
            </label>

            <button
              onClick={loadUsers}
              className="ml-auto bg-gray-200 hover:bg-gray-400 rounded-md px-4 py-2 font-medium"
            >
              Refresh
            </button>

            {canManageUsers && (
              <>
                <button
                  onClick={() => navigate("/audit-logs")}
                  className="bg-gray-200 hover:bg-gray-400 rounded-md px-4 py-2 font-medium"
                >
                  Audit Logs
                </button>

                <button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-gray-200 hover:bg-gray-400 rounded-md px-4 py-2 font-medium"
                >
                  Add User
                </button>
              </>
            )}
         
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-gray-300 rounded-md flex-1 overflow-hidden">
          <div className="grid grid-cols-12 px-6 py-4 font-medium border-b border-gray-400">
            <span className="col-span-3">Email</span>
            <span className="col-span-2">Name</span>
            <span className="col-span-2">Phone</span>
            <span className="col-span-1 text-center">Role</span>
            <span className="col-span-2 text-right">Last login</span>
            <span className="col-span-2 text-right">Actions</span>
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
                  className={`grid grid-cols-12 px-6 py-4 bg-gray-200 rounded-md ${
                    !u.isActive ? "opacity-50" : ""
                  }`}
                >
                  <span
                    className="col-span-3 cursor-pointer hover:underline"
                    onClick={() => navigate(`/users/${u.id}`)}
                  >
                    {u.email}
                  </span>
                  <span
                    className="col-span-2 cursor-pointer hover:underline"
                    onClick={() => navigate(`/users/${u.id}`)}
                  >
                    {u.name}
                  </span>
                  <span className="col-span-2">{u.phoneNumber ?? "-"}</span>
                  <span className="col-span-1 text-center">{u.role}</span>
                  <span className="col-span-2 text-right">
                    {formatDateTime(u.lastLoginAt)}
                  </span>
                  <span className="col-span-2 text-right flex gap-2 justify-end">
                    {canManageUsers && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/users/${u.id}/edit`);
                          }}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        {u.isActive ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeactivate(u.id);
                            }}
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestore(u.id);
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Restore
                          </button>
                        )}
                      </>
                    )}
                    {!canManageUsers && <span className="text-sm text-gray-500">-</span>}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Invite Creation Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/40">
          <div className="bg-gray-300 rounded-md w-[500px] max-w-[90vw] p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-black">Create Invite</h2>
              <button
                onClick={closeInviteModal}
                className="text-gray-600 hover:text-black text-xl"
              >
                ×
              </button>
            </div>

            {createdInviteLink ? (
              <div className="space-y-4">
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  Invite created successfully!
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Invite Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={createdInviteLink}
                      readOnly
                      className="flex-1 bg-gray-200 rounded-md px-4 py-2 text-sm"
                    />
                    <button
                      onClick={copyInviteLink}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <button
                  onClick={closeInviteModal}
                  className="w-full bg-gray-400 hover:bg-gray-500 text-black font-medium py-2 rounded-md"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="space-y-4">
                {inviteError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                    {inviteError}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="invite-email"
                    className="block text-sm font-medium text-black mb-2"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="invite-email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    className="w-full bg-gray-200 rounded-md px-4 py-2 border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="invite-role"
                    className="block text-sm font-medium text-black mb-2"
                  >
                    Role
                  </label>
                  <select
                    id="invite-role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    required
                    className="w-full bg-gray-200 rounded-md px-4 py-2 border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Customer">Customer</option>
                    <option value="Owner">Owner</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeInviteModal}
                    className="flex-1 bg-gray-400 hover:bg-gray-500 text-black font-medium py-2 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2 rounded-md"
                  >
                    {inviteLoading ? "Creating..." : "Create Invite"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
