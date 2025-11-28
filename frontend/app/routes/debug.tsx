import { useState } from "react";

export default function DebugPage() {
  const API = "http://localhost:7035";

  const [merchant, setMerchant] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [service, setService] = useState<any>(null);
  const [testUser, setTestUser] = useState<any>(null);

  const fetchMerchant = async () => {
    const res = await fetch(`${API}/api/debug/merchant`);
    setMerchant(await res.json());
  };

  const fetchProduct = async () => {
    const res = await fetch(`${API}/api/debug/product`);
    setProduct(await res.json());
  };

  const fetchService = async () => {
    const res = await fetch(`${API}/api/debug/service`);
    setService(await res.json());
  };

  const fetchTestUser = async () => {
    const res = await fetch(`${API}/api/debug/test-user`);
    setTestUser(await res.json());
  };

  return (
    <div className="min-h-screen bg-gray-200 p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-gray-300 p-8 rounded-md">
        <h1 className="text-black text-lg font-medium mb-6 text-center">Debug Panel</h1>

        {/* Buttons */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <button
            onClick={fetchMerchant}
            className="bg-gray-400 text-black font-medium py-2 px-6 rounded-md hover:bg-gray-500 transition-colors"
          >
            Load Merchant
          </button>

          <button
            onClick={fetchProduct}
            className="bg-gray-400 text-black font-medium py-2 px-6 rounded-md hover:bg-gray-500 transition-colors"
          >
            Load Product
          </button>

          <button
            onClick={fetchService}
            className="bg-gray-400 text-black font-medium py-2 px-6 rounded-md hover:bg-gray-500 transition-colors"
          >
            Load Service
          </button>

          <button
            onClick={fetchTestUser}
            className="bg-gray-400 text-black font-medium py-2 px-6 rounded-md hover:bg-gray-500 transition-colors"
          >
            Load Test User
          </button>
        </div>

        {/* Output blocks */}
        <div className="space-y-6">
          {merchant && (
            <div className="p-4 bg-gray-200 border border-black rounded-md">
              <h2 className="text-black font-medium mb-2">Merchant</h2>
              <pre className="text-black text-sm whitespace-pre-wrap">
                {JSON.stringify(merchant, null, 2)}
              </pre>
            </div>
          )}

          {product && (
            <div className="p-4 bg-gray-200 border border-black rounded-md">
              <h2 className="text-black font-medium mb-2">Product</h2>
              <pre className="text-black text-sm whitespace-pre-wrap">
                {JSON.stringify(product, null, 2)}
              </pre>
            </div>
          )}

          {service && (
            <div className="p-4 bg-gray-200 border border-black rounded-md">
              <h2 className="text-black font-medium mb-2">Service</h2>
              <pre className="text-black text-sm whitespace-pre-wrap">
                {JSON.stringify(service, null, 2)}
              </pre>
            </div>
          )}

          {testUser && (
            <div className="p-4 bg-gray-200 border border-black rounded-md">
              <h2 className="text-black font-medium mb-2">Test Employee User</h2>
              <pre className="text-black text-sm whitespace-pre-wrap">
                {JSON.stringify(testUser, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
