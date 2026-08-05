import type { LucideIcon } from "lucide-react";

type DashboardStatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  alert?: boolean;
};

export default function DashboardStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  alert = false,
}: DashboardStatCardProps) {
  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        alert ? "border-red-200" : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <p
            className={`mt-2 text-3xl font-bold ${
              alert ? "text-red-600" : "text-gray-950"
            }`}
          >
            {value}
          </p>

          {subtitle && (
            <p className="mt-2 text-xs text-gray-500">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            alert
              ? "bg-red-50 text-red-600"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}