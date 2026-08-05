"use client";

import FollowUpTable from "@/features/follow-ups/components/FollowUpTable";
import { useFollowUps } from "@/features/follow-ups/hooks/useFollowUps";
import AddFollowUpDialog from "@/features/follow-ups/components/AddFollowUpDialog";

export default function FollowUpsPage() {
  const {
    data: followUps = [],
    isLoading,
    error,
  } = useFollowUps();

  const pendingCount = followUps.filter(
    (followUp) => followUp.status === "pending"
  ).length;

  const completedCount = followUps.filter(
    (followUp) => followUp.status === "completed"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Follow Ups
          </h1>

          <p className="mt-1 text-gray-500">
            {followUps.length} follow ups
          </p>
        </div>
<AddFollowUpDialog />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Total Follow Ups</p>
          <p className="mt-2 text-2xl font-bold">{followUps.length}</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="mt-2 text-2xl font-bold">{pendingCount}</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="mt-2 text-2xl font-bold">{completedCount}</p>
        </div>
      </div>

      {isLoading && (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          Loading follow ups...
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-50 p-6 text-red-700">
          {error instanceof Error
            ? error.message
            : "Failed to load follow ups."}
        </div>
      )}

      {!isLoading && !error && (
        <FollowUpTable followUps={followUps} />
      )}
    </div>
  );
}