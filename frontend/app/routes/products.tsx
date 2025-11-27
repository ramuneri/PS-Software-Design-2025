import { useEffect, useState } from "react";

type Product = {
  productId: number;
  name: string;
  price: number | null;
  category: string | null;
  isActive: boolean;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  // Load all products
  const loadAllProducts = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("access-token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error(`Failed to load products (${res.status})`);

      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Search function
  const searchProducts = async () => {
    if (search.trim() === "") {
      await loadAllProducts();
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("access-token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/products/search?q=${encodeURIComponent(
          search
        )}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (!res.ok) throw new Error(`Search failed (${res.status})`);

      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Load once on page open
  useEffect(() => {
    loadAllProducts();
  }, []);

  if (loading) {
    return <div className="p-6 text-black">Loading products…</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-red-600">
        Failed to load products: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-full max-w-none space-y-6">

        {/* Header Bar */}
        <div className="bg-gray-300 rounded-md py-3 px-4 text-center text-black font-medium">
          Product List
        </div>

        {/* Search Section */}
        <div className="bg-gray-300 rounded-md p-6 space-y-6">
          <h2 className="text-center px-4 text-sm font-medium text-black">
            Search for specific item
          </h2>

          <div className="flex justify-center">
            <div className="flex items-center bg-gray-200 border border-gray-400 rounded-md w-full max-w-xl px-3 py-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Enter product name"
                className="grow bg-transparent focus:outline-none text-black"
              />
              <span className="text-black text-xl">⌕</span>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={searchProducts}
              className="bg-gray-400 hover:bg-gray-500 px-6 py-2 rounded text-black"
            >
              Search
            </button>
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-4 px-4 text-sm font-medium text-black">
          <span>ItemID</span>
          <span>Name</span>
          <span>Category</span>
          <span className="text-right">Price</span>
        </div>

        {/* Product Rows */}
        <div className="space-y-3">
          {products.map((p) => (
            <div
              key={p.productId}
              className="grid grid-cols-4 bg-gray-300 text-black rounded-md px-4 py-3"
            >
              <span>{p.productId}</span>
              <span>{p.name}</span>
              <span>{p.category ?? "-"}</span>
              <span className="text-right">
                {p.price != null ? `${p.price}$` : "-"}
              </span>
            </div>
          ))}
        </div>

        {/* Create Button */}
        <div className="pt-6">
          <button className="w-48 bg-gray-400 hover:bg-gray-500 rounded-md py-2 text-black">
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
