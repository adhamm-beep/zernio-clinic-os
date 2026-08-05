import Link from "next/link";

type SettingsModule = {
  title: string;
  description: string;
  href: string;
};

const modules: SettingsModule[] = [
  {
    title: "Master Data",
    description:
      "Review clinics, branches, staff, rooms and services.",
    href: "/settings/master-data",
  },
  {
    title: "Services",
    description:
      "Manage clinic services, prices, categories and duration.",
    href: "/settings/services",
  },
  {
    title: "Clinic Context",
    description:
      "Review the active clinic and select the current branch.",
    href: "/settings/clinic-context",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">
          Settings
        </h1>

        <p className="mt-1 text-gray-500">
          Configure your clinic workspace and master data.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <article
            key={module.href}
            className="flex min-h-52 flex-col rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                {module.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                {module.description}
              </p>
            </div>

            <Link
              href={module.href}
              className="mt-6 inline-flex w-fit items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            >
              Open
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}