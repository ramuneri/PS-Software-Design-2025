import { useEffect, useState } from "react";

type Discount = {
  id: number;
  productId: number | null;
  serviceId: number | null;
  name: string;
  code: string | null;
  scope: string | null;
  type: string | null;
  value: number | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
};


function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("access-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}


export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeInactive, setIncludeInactive] = useState(false);

  const loadDiscounts = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/discounts?includeInactive=${includeInactive}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
        }
      );

      const data = await res.json();
      setDiscounts(data);
    } catch {
      console.error("Failed to load discounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscounts();
  }, [includeInactive]);


  const deleteDiscount = async (id: number) => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/discounts/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    loadDiscounts();
  };


  const restoreDiscount = async (id: number) => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/discounts/${id}/restore`, {
      method: "POST",
      headers: authHeaders(),
    });
    loadDiscounts();
  };


  if (loading) {
    return <div className="p-6 text-black">Loading discounts…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-[90%] mx-auto space-y-6">

        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          Discount List
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
          />
          <span className="text-black">Show inactive</span>
        </div>

        <div className="grid grid-cols-8 px-4 text-sm font-medium text-black">
          <span>Name</span>
          <span>Code</span>
          <span>Target</span>
          <span>Scope</span>
          <span>Value</span>
          <span>Starts</span>
          <span>Ends</span>
          <span className="text-right">Actions</span>
        </div>

        <div className="space-y-3">
          {discounts.map((discount) => (
            <div
              key={discount.id}
              className={`grid grid-cols-8 bg-gray-300 text-black rounded-md px-4 py-3 items-center ${
                !discount.isActive ? "opacity-50" : ""
              }`}
            >
              <span>{discount.name}</span>
              <span>{discount.code || "-"}</span>
              <span>
                {discount.productId
                  ? `Product #${discount.productId}`
                  : discount.serviceId
                  ? `Service #${discount.serviceId}`
                  : "-"}
              </span>
              <span>{discount.scope}</span>
              <span>{discount.value ?? "-"}</span>
              <span>
                {discount.startsAt
                  ? new Date(discount.startsAt).toLocaleDateString()
                  : "-"}
              </span>
              <span>
                {discount.endsAt
                  ? new Date(discount.endsAt).toLocaleDateString()
                  : "-"}
              </span>

              <div className="flex gap-2 justify-end">
                <button
                  className="px-3 py-1 bg-blue-400 hover:bg-blue-500 text-black rounded"
                  onClick={() => {
                    /* TODO: navigate to edit page */
                  }}
                >
                  Edit
                </button>

                {discount.isActive ? (
                  <button
                    className="px-3 py-1 bg-red-400 hover:bg-red-500 text-black rounded"
                    onClick={() => deleteDiscount(discount.id)}
                  >
                    Delete
                  </button>
                ) : (
                  <button
                    className="px-3 py-1 bg-green-400 hover:bg-green-500 text-black rounded"
                    onClick={() => restoreDiscount(discount.id)}
                  >
                    Restore
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CREATE BUTTON */}
        <div className="pt-6">
          <button className="w-48 bg-gray-400 hover:bg-gray-500 rounded-md py-2 text-black">
            Create Discount
          </button>
        </div>
      </div>
    </div>
  );
}
