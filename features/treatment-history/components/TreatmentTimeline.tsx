"use client";

import { useTreatmentHistory } from "../hooks/useTreatmentHistory";

type Props = {
  customerId: number;
};

export default function TreatmentTimeline({
  customerId,
}: Props) {
  const {
    data,
    isLoading,
  } = useTreatmentHistory(customerId);

  if (isLoading) {
    return (
      <div className="rounded-xl border p-6">
        Loading treatment history...
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="rounded-xl border p-6">
        No treatment history.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {data.map((session) => (
        <div
          key={session.id}
          className="rounded-2xl border bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">
              {session.doctorName}
            </h3>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">
              {session.status}
            </span>
          </div>

          <p className="mt-2 text-sm text-gray-500">
            {new Date(
              session.sessionDate
            ).toLocaleString()}
          </p>

          {session.notes && (
            <p className="mt-3">
              {session.notes}
            </p>
          )}

          <div className="mt-5 space-y-2">
            {session.items.map(
              (item) => (
                <div
                  key={item.id}
                  className="rounded-lg border bg-slate-50 p-3"
                >
                  <div className="font-medium">
                    {item.productName}
                  </div>

                  <div className="text-sm text-gray-600">
                    {item.quantity}{" "}
                    {item.unit}
                  </div>

                  {item.area && (
                    <div className="text-sm text-gray-500">
                      Area: {item.area}
                    </div>
                  )}

                  {item.notes && (
                    <div className="text-sm text-gray-500">
                      {item.notes}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
}