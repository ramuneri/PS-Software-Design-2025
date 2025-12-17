import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type User = {
  id: string;
  email: string;
  name: string;
  surname?: string | null;
  phoneNumber?: string | null;
  role: string;
  isActive: boolean;
};

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("access-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/users/${id}`, {
      headers: authHeaders(),
    })
      .then((r) => r.json())
      .then(setUser)
      .catch(() => setError("Failed to load user"));
  }, [id]);

  async function handleSave() {
    if (!user) return;

    try {
      setSaving(true);
      setError(null);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          name: user.name,
          surname: user.surname,
          phoneNumber: user.phoneNumber,
          role: user.role,
        }),
      });

      if (!res.ok) throw new Error("Failed to update user");

      navigate(`/users/${id}`);
    } catch (e: any) {
      setError(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!id) return;

    if (!confirm("Are you sure you want to deactivate this user?")) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/${id}`,
        {
          method: "DELETE",
          headers: authHeaders(),
        }
      );

      if (!res.ok) throw new Error();

      navigate("/users");
    } catch {
      setError("Failed to deactivate user");
    }
  }

  async function handleRestore() {
    if (!id) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/${id}/restore`,
        {
          method: "POST",
          headers: authHeaders(),
        }
      );

      if (!res.ok) throw new Error();

      navigate(`/users/${id}`);
    } catch {
      setError("Failed to restore user");
    }
  }



  if (!user) return <div className="p-6">Loading…</div>;

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center text-black">
      <div className="w-[90%] max-w-3xl space-y-6">

        {/* HEADER */}
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          Edit User
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="text-red-600 text-center font-medium">
            {error}
          </div>
        )}

        {/* FORM */}
        <div className="bg-gray-300 rounded-md p-6 space-y-4 ">
          <input
            value={user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
            className="w-full bg-gray-200 rounded-md px-4 py-2 "
            placeholder="Name"
          />

          <input
            value={user.surname ?? ""}
            onChange={(e) => setUser({ ...user, surname: e.target.value })}
            className="w-full bg-gray-200 rounded-md px-4 py-2 "
            placeholder="Surname"
          />

          <input
            value={user.phoneNumber ?? ""}
            onChange={(e) => setUser({ ...user, phoneNumber: e.target.value })}
            className="w-full bg-gray-200 rounded-md px-4 py-2"
            placeholder="Phone number"
          />

          <select
            value={user.role}
            onChange={(e) => setUser({ ...user, role: e.target.value })}
            className="w-full bg-gray-200 rounded-md px-4 py-2"
          >
            <option value="Owner">Owner</option>
            <option value="Employee">Employee</option>
            <option value="Customer">Customer</option>
          </select>

          {/* ACTION BUTTONS */}
          <div className="flex gap-4 justify-center pt-6 text-black">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-gray-400 hover:bg-gray-500 px-6 py-2 rounded-md"
            >
              {saving ? "Saving..." : "Save"}
            </button>

            <button
              onClick={() => navigate(-1)}
              className="bg-gray-400 hover:bg-gray-500 px-6 py-2 rounded-md"
            >
              Cancel
            </button>
          </div>

          {/* DEACTIVATE */}
          <div className="pt-6 border-t border-gray-400 flex justify-center">
            {user.isActive ? (
              <button
                onClick={handleDeactivate}
                className="bg-red-400 hover:bg-red-500 px-6 py-2 rounded-md"
              >
                Deactivate user
              </button>
            ) : (
              <button
                onClick={handleRestore}
                className="bg-green-400 hover:bg-green-500 px-6 py-2 rounded-md"
              >
                Restore user
              </button>
            )}
          </div>


        </div>

      </div>
    </div>
  );
}
