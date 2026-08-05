"use client";

import type { FollowUp } from "../types/follow-up";

type FollowUpTableProps = {
  followUps: FollowUp[];
};

function formatDateTime(value: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusClasses(status: string) {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-700";
    case "in_progress":
      return "bg-blue-100 text-blue-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    case "no_answer":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function FollowUpTable({
  followUps,
}: FollowUpTableProps) {
  if (followUps.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center text-gray-500">
        No follow ups found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
      <table className="w-full min-w-[1150px]">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-5 py-4 text-left">Scheduled</th>
            <th className="px-5 py-4 text-left">Customer</th>
            <th className="px-5 py-4 text-left">Phone</th>
            <th className="px-5 py-4 text-left">Channel</th>
            <th className="px-5 py-4 text-left">Type</th>
            <th className="px-5 py-4 text-left">Assigned To</th>
            <th className="px-5 py-4 text-left">Outcome</th>
            <th className="px-5 py-4 text-left">Status</th>
          </tr>
        </thead>

        <tbody>
          {followUps.map((followUp) => {
            const customerName =
              `${followUp.customers?.first_name ?? ""} ${
                followUp.customers?.last_name ?? ""
              }`.trim() || "Unknown customer";

            return (
              <tr
                key={followUp.id}
                className="border-t hover:bg-slate-50"
              >
                <td className="px-5 py-4">
                  {formatDateTime(followUp.scheduled_at)}
                </td>

                <td className="px-5 py-4 font-medium">
                  {customerName}
                </td>

                <td className="px-5 py-4">
                  {followUp.customers?.phone || "Not available"}
                </td>

                <td className="px-5 py-4 capitalize">
                  {followUp.channel.replaceAll("_", " ")}
                </td>

                <td className="px-5 py-4">
                  {followUp.follow_up_type || "Not available"}
                </td>

                <td className="px-5 py-4">
                  {followUp.assigned_to || "Not assigned"}
                </td>

                <td className="px-5 py-4">
                  {followUp.outcome || "—"}
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusClasses(
                      followUp.status
                    )}`}
                  >
                    {followUp.status.replaceAll("_", " ")}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}