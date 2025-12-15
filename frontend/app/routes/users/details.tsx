import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

type UserDetails = {
  id: string;
  email: string;
  name: string;
  surname: string;
  phoneNumber: string;
  role: string;
  lastLoginAt: string;
};

export default function UserDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem("access-token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/${id}`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (!res.ok) throw new Error("Failed to load user");

      const data = await res.json();
      setUser(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!user) return null;

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h2 className="text-xl font-medium">User Profile</h2>

      <div className="bg-gray-300 rounded-md p-4 space-y-2">
        <div><strong>Email:</strong> {user.email}</div>
        <div><strong>Name:</strong> {user.name} {user.surname}</div>
        <div><strong>Phone:</strong> {user.phoneNumber || "-"}</div>
        <div><strong>Role:</strong> {user.role}</div>
        <div>
          <strong>Last login:</strong>{" "}
          {new Date(user.lastLoginAt).toLocaleString()}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-300 px-4 py-2 rounded"
        >
          Back
        </button>

        {/* TODO: modify button*/}
      </div>
    </div>
  );
}
