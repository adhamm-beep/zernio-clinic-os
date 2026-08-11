import type { QueryClient } from "@tanstack/react-query";

export async function invalidateCustomerWorkspace(
  queryClient: QueryClient,
  customerId?: number | string | null
): Promise<void> {
  const id = customerId === null || customerId === undefined
    ? null
    : String(customerId);

  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["customers"] }),
    queryClient.invalidateQueries({ queryKey: ["appointments"] }),
    queryClient.invalidateQueries({ queryKey: ["calendar-events"] }),
    queryClient.invalidateQueries({ queryKey: ["treatments"] }),
    queryClient.invalidateQueries({ queryKey: ["payments"] }),
    queryClient.invalidateQueries({ queryKey: ["follow-ups"] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
    queryClient.invalidateQueries({ queryKey: ["clinic-analytics"] }),
    queryClient.invalidateQueries({ queryKey: ["clinic-brain"] }),
    queryClient.invalidateQueries({ queryKey: ["ai-agent-workspace"] }),
    queryClient.invalidateQueries({
      queryKey: id ? ["customer-360", id] : ["customer-360"],
    }),
    queryClient.invalidateQueries({
      queryKey: id ? ["customer-timeline", Number(id)] : ["customer-timeline"],
    }),
    queryClient.invalidateQueries({
      queryKey: id ? ["treatment-history", Number(id)] : ["treatment-history"],
    }),
    queryClient.invalidateQueries({
      queryKey: id ? ["medical-record", Number(id)] : ["medical-record"],
    }),
  ]);
}
