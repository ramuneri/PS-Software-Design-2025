import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../components/homeSidebar";
import { Link, useNavigate } from "react-router";

export function meta() {
  return [{ title: "OMS" }];
}

type GlobalShortcut = {
  id: string;
  label: string;
  description: string;
  keywords: string[];
  to: string;
};

const globalShortcuts: GlobalShortcut[] = [
  {
    id: "orders-create",
    label: "Create order",
    description: "Start a new order",
    keywords: ["order", "create", "new"],
    to: "/orders/create",
  },
  {
    id: "orders-cancel",
    label: "Delete/Cancel order",
    description: "Cancel an open order",
    keywords: ["order", "delete", "cancel", "void"],
    to: "/orders/view",
  },
  {
    id: "orders-modify",
    label: "Modify order",
    description: "Edit an existing order",
    keywords: ["order", "modify", "edit", "update"],
    to: "/orders/view",
  },
  {
    id: "orders-list",
    label: "Orders (list)",
    description: "View orders",
    keywords: ["order", "orders", "list", "view"],
    to: "/orders/view",
  },
  {
    id: "orders-stats",
    label: "Order statistics",
    description: "View reports and statistics",
    keywords: ["order", "statistics", "stats", "report", "reports"],
    to: "/statistics",
  },
];

function matchShortcut(shortcut: GlobalShortcut, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  if (shortcut.label.toLowerCase().includes(q)) return true;
  if (shortcut.description.toLowerCase().includes(q)) return true;
  return shortcut.keywords.some((k) => k.includes(q));
}

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string } | null>({ name: "Manager" });

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return globalShortcuts.filter((s) => matchShortcut(s, q)).slice(0, 8);
  }, [query]);

  const showResults = query.trim().length > 0;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function navigateTo(to: string) {
    navigate(to);
    setQuery("");
    setActiveIndex(0);
  }

  function handleSearch() {
    if (results.length === 0) return;
    navigateTo(results[0].to);
  }

  return (
    <div className="h-[calc(100vh-60px)] bg-gray-200 flex flex-col overflow-hidden">
      <div className="flex flex-1 p-6 space-x-6">

        <Sidebar />

        {/* Content area on the right */}
        <main className="flex-1 bg-gray-300 rounded-md p-6">
          <h2 className="text-black font-medium mb-4">Looking for something?</h2>

          {/* Search field */}
          <div className="relative mb-8">
            <div className="flex">
            <input
              type="text"
              ref={inputRef}
              placeholder="Search… (try 'order')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (!showResults) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveIndex((idx) =>
                    Math.min(idx + 1, Math.max(results.length - 1, 0))
                  );
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveIndex((idx) => Math.max(idx - 1, 0));
                  return;
                }
                if (e.key === "Enter") {
                  e.preventDefault();
                  const choice = results[activeIndex] ?? results[0];
                  if (choice) navigateTo(choice.to);
                  return;
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setQuery("");
                  inputRef.current?.blur();
                }
              }}
              className="grow p-2 border border-black bg-white text-black rounded-l-md focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSearch}
              className="bg-gray-400 px-4 text-black rounded-r-md hover:bg-gray-500"
            >
              Search
            </button>
            </div>

            {showResults && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-black rounded-md shadow z-10 overflow-hidden">
                {results.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-700">
                    No results
                  </div>
                ) : (
                  results.map((r, idx) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => navigateTo(r.to)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-200 ${
                        idx === activeIndex ? "bg-gray-200" : ""
                      }`}
                    >
                      <div className="font-medium text-black">{r.label}</div>
                      <div className="text-xs text-gray-700">{r.description}</div>
                    </button>
                  ))
                )}
              </div>
            )}
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
