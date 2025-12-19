import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../api";

type Product = {
  id: number;
  name: string;
  category: string | null;
  price: number | null;
  isActive: boolean;
};

export default function ProductsPage() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);

      const activeRes = await apiFetch(
        `${import.meta.env.VITE_API_URL}/api/products?active=true`
      );
      const activeJson = await activeRes.json();

      const inactiveRes = await apiFetch(
        `${import.meta.env.VITE_API_URL}/api/products?active=false`
      );
      const inactiveJson = await inactiveRes.json();

      const active = Array.isArray(activeJson.data)
        ? activeJson.data
        : Array.isArray(activeJson)
        ? activeJson
        : [];

      const inactive = Array.isArray(inactiveJson.data)
        ? inactiveJson.data
        : Array.isArray(inactiveJson)
        ? inactiveJson
        : [];

      setProducts([...active, ...inactive]);
    } catch {
      console.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadProducts();
  }, []);

  const deleteProduct = async (id: number) => {
    await apiFetch(
      `${import.meta.env.VITE_API_URL}/api/products/${id}`,
      { method: "DELETE" }
    );
    loadProducts();
  };

  const restoreProduct = async (id: number) => {
    await apiFetch(
      `${import.meta.env.VITE_API_URL}/api/products/${id}/restore`,
      { method: "POST" }
    );
    loadProducts();
  };

  const filteredProducts = products.filter((p) => {
    if (!includeInactive && !p.isActive) return false;

    return p.name?.toLowerCase().includes(search.toLowerCase());
  });

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

        {/* CONTROLS */}
        <div className="bg-gray-300 rounded-md p-6 space-y-4">

          {/* Checkbox */}
          <label className="flex items-center gap-2 text-black text-sm">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            Show inactive
          </label>

          {/* Search */}
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
        </div>

        {/* TABLE HEADERS */}
        <div className="grid grid-cols-4 px-4 text-sm font-medium text-black">
          <span>Name</span>
          <span>Category</span>
          <span>Price</span>
          <span className="text-right pr-6">Actions</span>
        </div>

        {/* PRODUCT LIST */}
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`grid grid-cols-4 bg-gray-300 text-black rounded-md px-4 py-3 items-center ${
                !product.isActive ? "opacity-50" : ""
              }`}
            >
              <span>{product.name}</span>
              <span>{product.category ?? "-"}</span>
              <span>{product.price ?? "-"}</span>

              {/* ACTION BUTTONS */}
              <div className="flex justify-end gap-2 pr-2">
                <button
                  onClick={() => navigate(`/products/${product.id}/edit`)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Edit
                </button>

                {product.isActive ? (
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="px-3 py-1 bg-red-400 hover:bg-red-500 text-black rounded"
                  >
                    Delete
                  </button>
                ) : (
                  <button
                    onClick={() => restoreProduct(product.id)}
                    className="px-3 py-1 bg-green-400 hover:bg-green-500 text-black rounded"
                  >
                    Restore
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

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
