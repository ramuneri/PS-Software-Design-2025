import { useState } from "react";
import { Link } from "react-router-dom";

interface SidebarSectionProps {
  title: string;
  links: { name: string; path: string }[];
  isActive: boolean;
  onToggle: () => void;
}

function SidebarSection({ title, links, isActive, onToggle }: SidebarSectionProps) {
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

export default function Sidebar() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <aside className="w-1/4 bg-gray-300 rounded-md p-4 space-y-3">
      <SidebarSection
        title="Orders"
        isActive={activeSection === "orders"}
        onToggle={() => toggleSection("orders")}
        links={[
          { name: "View Orders", path: "/orders/view" },
          { name: "Create Order", path: "/orders/create" },
        ]}
      />
      
      <SidebarSection
        title="Inventory"
        isActive={activeSection === "inventory"}
        onToggle={() => toggleSection("inventory")}
        links={[
          { name: "Service List", path: "/services" },
          { name: "Product List", path: "/products" },
          { name: "Discount List", path: "/discounts" },
          { name: "Service Charge List", path: "/service-charge-policies" },
          { name: "Taxes List", path: "/taxes" },
          { name: "Payment List", path: "/payments" },
          { name: "Giftcard List", path: "/giftcards" },
        ]}
      />

      <SidebarSection
        title="Calendar"
        isActive={activeSection === "calendar"}
        onToggle={() => toggleSection("calendar")}
        links={[
          { name: "Reservations", path: "/reservations" },
          { name: "Customers", path: "/customers" },
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
        ]}
      />
    </aside>
  );
}
