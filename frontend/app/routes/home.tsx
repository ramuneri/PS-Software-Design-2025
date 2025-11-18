import { useState } from "react";
import Sidebar from "../components/homeSidebar";
import { Link } from "react-router-dom";

export function meta() {
  return [{ title: "OMS" }];
}

export default function Home() {
  const [user, setUser] = useState<{ name: string } | null>({ name: "Manager" });

  return (
    <div className="h-[calc(100vh-60px)] bg-gray-200 flex flex-col overflow-hidden">
      <div className="flex flex-1 p-6 space-x-6">

        <Sidebar />

        {/* Content area on the right */}
        <main className="flex-1 bg-gray-300 rounded-md p-6">
          <h2 className="text-black font-medium mb-4">Looking for something?</h2>

          {/* Search field */}
          <div className="flex mb-8">
            <input
              type="text"
              placeholder="Search..."
              className="grow p-2 border border-black bg-white text-black rounded-l-md focus:outline-none"
            />
            <button className="bg-gray-400 px-4 text-black rounded-r-md hover:bg-gray-500">
              Search
            </button>
          </div>

          <p className="text-center text-black mt-10 text-sm">
            Try searching something!
          </p>

          <div className="mt-10 text-center">
            <Link
              to="/debug"
              className="inline-block bg-gray-400 text-black px-4 py-2 rounded hover:bg-gray-500 transition-colors"
            >
              Go to Debug Page
            </Link>
          </div>

        </main>
      </div>
    </div>
  );
}
