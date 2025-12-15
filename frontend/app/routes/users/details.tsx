import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

type UserDetails = {
  id: string;
  email: string;
  name: string;
  surname: string;
  phoneNumber: string | null;
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
    async function loadUser() {
      try {
        const token = localStorage.getItem("access-token");
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/users/${id}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (!res.ok) throw new Error("Failed to load user");

        const data = await res.json();
        setUser(data);
      } catch (err: any) {
        setError(err.message ?? "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [id]);

  if (loading) {
    return <div className="p-6 text-black">Loading user…</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-[90%] max-w-3xl space-y-6">

        {/* HEADER */}
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          User Profile
        </div>

        {/* USER DETAILS */}
        <div className="bg-gray-300 rounded-md p-6 space-y-3 text-black">
          <div>
            <span className="font-medium">Email:</span> {user.email}
          </div>

          <div>
            <span className="font-medium">Name:</span>{" "}
            {user.name} {user.surname}
          </div>

          <div>
            <span className="font-medium">Phone:</span>{" "}
            {user.phoneNumber || "-"}
          </div>

          <div>
            <span className="font-medium">Role:</span> {user.role}
          </div>

          <div>
            <span className="font-medium">Last login:</span>{" "}
            {new Date(user.lastLoginAt).toLocaleString()}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate(`/users/${user.id}/edit`)}
            className="bg-gray-400 hover:bg-gray-500 px-6 py-2 rounded-md text-black"
          >
            Edit
          </button>

          <button
            onClick={() => navigate(-1)}
            className="bg-gray-400 hover:bg-gray-500 px-6 py-2 rounded-md text-black"
          >
            Back
          </button>
        </div>

      </div>
    </div>
  );
}
