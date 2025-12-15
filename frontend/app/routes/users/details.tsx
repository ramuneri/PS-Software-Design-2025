import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type User = {
  id: string;
  email: string;
  name: string;
  surname: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string;
};

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("access-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function UserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${id}`, {
          headers: authHeaders(),
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `Failed to load user (${res.status})`);
        }

        setUser(await res.json());
      } catch (e: any) {
        setError(e?.message ?? "Failed to load user");
      }
    }

    load();
  }, [id]);

  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!user) return <div className="p-6">Loading…</div>;

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center text-black">
      <div className="w-[90%] max-w-3xl space-y-6">
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center font-medium">
          User Details
        </div>

        {!user.isActive && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded">
            This user is inactive.
          </div>
        )}

        <div className="bg-gray-300 rounded-md p-6 space-y-2">
          <div><b>Email:</b> {user.email}</div>
          <div><b>Name:</b> {user.name}</div>
          <div><b>Surname:</b> {user.surname || "-"}</div>
          <div><b>Phone:</b> {user.phoneNumber || "-"}</div>
          <div><b>Role:</b> {user.role}</div>
          <div><b>Last login:</b> {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "-"}</div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => navigate("/users")}
            className="flex-1 bg-gray-300 hover:bg-gray-400 rounded-md py-3 font-medium"
          >
            Back
          </button>

          <button
            onClick={() => navigate(`/users/${user.id}/edit`)}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md py-3 font-medium"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
