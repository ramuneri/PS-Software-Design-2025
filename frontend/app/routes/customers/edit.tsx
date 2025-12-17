import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type Customer = {
  id: number;
  name?: string | null;
  surname?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive?: boolean;
};

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("access-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function CustomerEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    surname: "",
    email: "",
    phone: "",
    isActive: true,
  });

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/customers/${id}`,
          { headers: { ...authHeaders(), "X-Merchant-Id": "1" } }
        );

        if (res.status === 404) {
          setError("Customer not found");
          setCustomer(null);
          return;
        }

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || "Failed to load customer");
        }

        const json: any = await res.json();
        const data: Customer = json?.data ?? json;
        setCustomer(data);
        setForm({
          name: data.name ?? "",
          surname: data.surname ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          isActive: data.isActive !== false,
        });
      } catch (e: any) {
        setError(e?.message || "Failed to load customer");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    try {
      setSaving(true);
      setError(null);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/customers/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-Merchant-Id": "1",
            ...authHeaders(),
          },
          body: JSON.stringify({
            name: form.name.trim() || null,
            surname: form.surname.trim() || null,
            email: form.email.trim() || null,
            phone: form.phone.trim() || null,
            isActive: form.isActive,
          }),
        }
      );

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to update customer");
      }

      navigate(`/customers/${id}`);
    } catch (e: any) {
      setError(e?.message || "Failed to update customer");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-200 p-6 text-black flex justify-center">
        <div className="w-[90%] max-w-3xl bg-gray-300 rounded-md px-4 py-3 text-center">
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 p-6 text-black flex justify-center">
      <div className="w-[90%] max-w-3xl space-y-6">
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center font-medium">
          Edit Customer
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {customer && (
          <div className="bg-gray-300 rounded-md p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-800">Name</div>
                <input
                  className="w-full bg-gray-200 rounded-md px-3 py-2"
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  placeholder="First name"
                />
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-800">Surname</div>
                <input
                  className="w-full bg-gray-200 rounded-md px-3 py-2"
                  value={form.surname}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, surname: e.target.value }))
                  }
                  placeholder="Last name"
                />
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-800">Email</div>
                <input
                  className="w-full bg-gray-200 rounded-md px-3 py-2"
                  value={form.email}
                  onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                  placeholder="email@example.com"
                  type="email"
                />
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-800">Phone</div>
                <input
                  className="w-full bg-gray-200 rounded-md px-3 py-2"
                  value={form.phone}
                  onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                  placeholder="+370..."
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((s) => ({ ...s, isActive: e.target.checked }))
                }
              />
              <span>Active</span>
            </label>

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-gray-400 hover:bg-gray-500 px-6 py-2 rounded-md text-black disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/customers/${id}`)}
                className="flex-1 bg-gray-400 hover:bg-gray-500 px-6 py-2 rounded-md text-black"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

