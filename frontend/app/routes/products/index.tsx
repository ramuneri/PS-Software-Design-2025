import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../api";

export default function ProductsPage() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  // ---------------------------
  // LOAD PRODUCTS
  // ---------------------------
  useEffect(() => {
    async function load() {
      setLoading(true);

      const res = await apiFetch(
        `${import.meta.env.VITE_API_URL}/api/products?active=${!showInactive}`
      );

      const json = await res.json();

      // In services you use json.data, but your products return array directly
      setProducts(Array.isArray(json) ? json : json.data ?? []);

      setLoading(false);
    }

    load();
  }, [showInactive]);

  // ---------------------------
  // FILTERING
  // ---------------------------
  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="p-6 text-black">Loading products…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-[90%] space-y-6">

        {/* HEADER */}
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          Product List
        </div>

        {/* SEARCH + FILTER */}
        <div className="bg-gray-300 rounded-md p-6 space-y-6">

          {/* Show inactive button */}
          <label className="flex items-center gap-2 text-black text-sm">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            Show inactive
          </label>

          {/* SEARCH INPUT */}
          <div className="flex justify-center">
            <div className="flex items-center bg-gray-200 border border-gray-400 rounded-md w-full max-w-3xl px-4 py-3">
              <input
                type="text"
                className="grow bg-transparent focus:outline-none text-black"
                placeholder="Search for a product"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="text-black text-lg">🔍</span>
            </div>
          </div>

          {/* Search button */}
          <div className="flex justify-center">
            <button className="bg-gray-400 hover:bg-gray-500 px-6 py-2 rounded text-black">
              Search
            </button>
          </div>

        </div>

        {/* TABLE HEADERS */}
        <div className="grid grid-cols-4 px-4 text-sm font-medium text-black">
          <span>Name</span>
          <span>Category</span>
          <span>Price</span>
          <span className="text-right pr-6">Actions</span>
        </div>

        {/* TABLE ROWS */}
        <div className="space-y-3">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="grid grid-cols-4 bg-gray-300 text-black rounded-md px-4 py-3 items-center"
            >
              {/* NAME */}
              <span>{product.name}</span>

              {/* CATEGORY */}
              <span>{product.category ?? "-"}</span>

              {/* PRICE */}
              <span>{product.price != null ? product.price : "-"}</span>

              {/* ACTION BUTTONS */}
              <div className="flex justify-end gap-2 pr-2">

                {/* EDIT BUTTON */}
                <button
                  onClick={() => navigate(`/products/${product.id}/edit`)}
                  className="bg-blue-400 hover:bg-blue-500 text-white px-3 py-1 rounded"
                >
                  Edit
                </button>

                {/* DELETE OR RESTORE */}
                {product.isActive ? (
                  /* DELETE BUTTON */
                  <button
                    onClick={async () => {
                      await apiFetch(
                        `${import.meta.env.VITE_API_URL}/api/products/${product.id}`,
                        { method: "DELETE" }
                      );
                      location.reload();
                    }}
                    className="bg-red-400 hover:bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                ) : (
                  /* RESTORE BUTTON */
                  <button
                    onClick={async () => {
                      await apiFetch(
                        `${import.meta.env.VITE_API_URL}/api/products/${product.id}/restore`,
                        { method: "POST" }
                      );
                      location.reload();
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
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
          <button
            onClick={() => navigate("/products/create")}
            className="w-48 bg-gray-400 hover:bg-gray-500 rounded-md py-2 text-black"
          >
            Create
          </button>
        </div>

      </div>
    </div>
  );
}
