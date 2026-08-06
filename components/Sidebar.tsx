import Link from "next/link";

const menu = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "🏠",
  },
  {
    title: "Customers",
    href: "/customers",
    icon: "👥",
  },
  {
    title: "Appointments",
    href: "/appointments",
    icon: "📋",
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: "🗓️",
  },
  {
    title: "Treatments",
    href: "/treatments",
    icon: "💉",
  },
  {
    title: "Payments",
    href: "/payments",
    icon: "💰",
  },
  {
    title: "Price / Service List",
    href: "/price-list",
    icon: "﷼",
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: "📦",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: "⚙️",
  },
  {
    title: "Reports",
    href: "/reports",
    icon: "📊",
  },
];

export default function Sidebar() {
  return (
    <aside className="w-72 shrink-0 bg-slate-900 text-white">

      <div className="border-b border-slate-700 p-8">

        <h1 className="text-3xl font-bold">

          Zernio

        </h1>

        <p className="text-sm text-slate-400">

          Clinic Operating System

        </p>

      </div>

      <nav className="p-5 space-y-2">

        {menu.map((item) => (

          <Link

            key={item.title}

            href={item.href}

            className="flex items-center gap-3 rounded-xl px-4 py-4 transition hover:bg-slate-800"

          >

            <span className="text-xl">

              {item.icon}

            </span>

            <span>

              {item.title}

            </span>

          </Link>

        ))}

      </nav>

    </aside>
  );
}
