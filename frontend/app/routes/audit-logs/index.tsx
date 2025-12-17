import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type AuditLog = {
  id: number;
  action: string;
  performedByUserId: string | null;
  affectedUserId: string;
  description: string | null;
  createdAt: string;
};

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("access-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDateTime(dateString: string) {
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

function formatAction(action: string): string {
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function AuditLogsPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string>("");
  const [affectedUserIdFilter, setAffectedUserIdFilter] = useState<string>("");

  async function loadLogs() {
    try {
      setLoading(true);
      setError(null);

      const url = new URL(`${import.meta.env.VITE_API_URL}/api/audit-logs`);
      if (actionFilter) url.searchParams.set("action", actionFilter);
      if (affectedUserIdFilter) url.searchParams.set("affectedUserId", affectedUserIdFilter);

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
        throw new Error(txt || `Failed to load audit logs (${res.status})`);
      }

      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load audit logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, [actionFilter, affectedUserIdFilter]);

  return (
    <div className="bg-gray-200 flex flex-col text-black" style={{ height: "calc(100vh - 52px)" }}>
      <div className="p-6 flex-1 flex flex-col overflow-hidden space-y-6">
        <div className="bg-gray-300 rounded-md py-3 text-center font-medium">
          Audit Logs
        </div>

        <div className="bg-gray-300 rounded-md p-4 space-y-4">
          <div className="flex items-center gap-6">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-gray-200 rounded-md px-3 py-2"
            >
              <option value="">All Actions</option>
              <option value="USER_CREATED">User Created</option>
              <option value="USER_UPDATED">User Updated</option>
              <option value="USER_DEACTIVATED">User Deactivated</option>
              <option value="USER_RESTORED">User Restored</option>
              <option value="ROLE_CHANGED">Role Changed</option>
            </select>

            <input
              type="text"
              value={affectedUserIdFilter}
              onChange={(e) => setAffectedUserIdFilter(e.target.value)}
              className="bg-gray-200 rounded-md px-4 py-2"
              placeholder="Filter by user ID..."
            />

            <button
              onClick={loadLogs}
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

        <div className="bg-gray-300 rounded-md flex-1 overflow-hidden">
          <div className="grid grid-cols-12 px-6 py-4 font-medium border-b border-gray-400">
            <span className="col-span-2">Action</span>
            <span className="col-span-2">Performed By</span>
            <span className="col-span-2">Affected User</span>
            <span className="col-span-4">Description</span>
            <span className="col-span-2 text-right">Date</span>
          </div>

          <div className="p-4 space-y-3 overflow-y-auto">
            {loading && <div className="text-center py-8">Loading audit logs…</div>}

            {!loading && logs.length === 0 && (
              <div className="text-center py-8">No audit logs found</div>
            )}

            {!loading &&
              logs.map((log) => (
                <div
                  key={log.id}
                  className="grid grid-cols-12 px-6 py-4 bg-gray-200 rounded-md"
                >
                  <span className="col-span-2 font-medium">
                    {formatAction(log.action)}
                  </span>
                  <span className="col-span-2 text-sm">
                    {log.performedByUserId ? log.performedByUserId.substring(0, 8) + "..." : "System"}
                  </span>
                  <span className="col-span-2 text-sm">
                    {log.affectedUserId.substring(0, 8)}...
                  </span>
                  <span className="col-span-4 text-sm">
                    {log.description || "-"}
                  </span>
                  <span className="col-span-2 text-right text-sm">
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

