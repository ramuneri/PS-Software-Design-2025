import { useState } from "react";
import { Link } from "react-router";

export function meta() {
  return [{ title: "OMS" }];
}

export default function Home() {
  const [user, setUser] = useState<{ name: string } | null>({ name: "Manager" });
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col">

      {/* Main layout */}
      <div className="flex flex-1 p-6 space-x-6">
        {/* Sidebar */}
        <aside className="w-1/4 bg-gray-300 rounded-md p-4 space-y-3">
          <SidebarSection
            title="Orders"
            isActive={activeSection === "orders"}
            onToggle={() => toggleSection("orders")}
            links={[
              { name: "Create Order", path: "/orders" },
              { name: "Delete Order", path: "/orders" },
              { name: "Modify Order", path: "/orders" }
            ]}
          />
          <SidebarSection
            title="Inventory"
            isActive={activeSection === "inventory"}
            onToggle={() => toggleSection("inventory")}
            links={[
              { name: "Service List", path: "/inventory" },
              { name: "Product List", path: "/inventory" },
              { name: "Discount List", path: "/inventory" },
              { name: "Service Charge List", path: "/inventory" },
              { name: "Taxes List", path: "/inventory" },
              { name: "Payment List", path: "/inventory" },
              { name: "Giftcard List", path: "/inventory" },
            ]}

          />
          <SidebarSection
            title="Calendar"
            isActive={activeSection === "calendar"}
            onToggle={() => toggleSection("calendar")}
            links={[
              { name: "Reservations", path: "/calendar" },
              { name: "Customers", path: "/calendar" }
            ]}
          />
          <SidebarSection
            title="Statistics"
            isActive={activeSection === "statistics"}
            onToggle={() => toggleSection("statistics")}
            links={[{ name: "Reports", path: "/statistics" }]}
          />
          <SidebarSection
            title="Management"
            isActive={activeSection === "management"}
            onToggle={() => toggleSection("management")}
            links={[
              { name: "User List", path: "/users" },
              { name: "Merchant List & Management", path: "/merchants" },
            ]}
          />
        </aside>

        {/* Content */}
        <main className="flex-1 bg-gray-300 rounded-md p-6">
          <h2 className="text-black font-medium mb-4">Looking for something?</h2>
          <div className="flex mb-8">
            <input
              type="text"
              placeholder="Search..."
              className="flex-grow p-2 border border-black bg-white text-black rounded-l-md focus:outline-none"
            />
            <button className="bg-gray-400 px-4 text-black rounded-r-md hover:bg-gray-500">
              Search
            </button>
          </div>
          <p className="text-center text-black mt-10 text-sm">
            Try searching something!
          </p>
        </main>
      </div>
    </div>
  );
}

function SidebarSection({
  title,
  links,
  isActive,
  onToggle,
}: {
  title: string;
  links: { name: string; path: string }[];
  isActive: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full text-left bg-gray-400 p-2 rounded-md font-medium text-black hover:bg-gray-500"
      >
        {title}
      </button>
      {isActive && (
        <div className="mt-2 space-y-1 pl-4">
          {links.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="block bg-gray-200 p-2 rounded text-black hover:bg-gray-300"
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
