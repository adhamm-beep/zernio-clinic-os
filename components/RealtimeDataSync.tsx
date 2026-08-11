"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const queryPrefixesByTable: Record<string, readonly string[]> = {
  appointments: ["appointments", "billing-due", "calendar-events", "customers", "customer-360", "customer-timeline", "dashboard-stats", "clinic-analytics", "clinic-brain", "ai-agent-workspace"],
  customers: ["customers", "customer", "customer-360", "customer-timeline", "dashboard-stats", "clinic-analytics", "clinic-brain", "ai-agent-workspace"],
  follow_ups: ["follow-ups", "customer-360", "customer-timeline", "dashboard-stats", "clinic-brain", "ai-agent-workspace"],
  medical_records: ["medical-record", "customer-360", "customer-timeline"],
  payments: ["payments", "billing-due", "customer-360", "customer-timeline", "dashboard-stats", "clinic-analytics", "clinic-brain", "ai-agent-workspace"],
  treatments: ["treatments", "treatment-history", "customer-360", "customer-timeline", "dashboard-stats", "clinic-analytics", "clinic-brain", "ai-agent-workspace"],
  treatment_sessions: ["treatments", "treatment-history", "customer-360", "customer-timeline", "dashboard-stats", "clinic-analytics", "clinic-brain", "ai-agent-workspace"],
  treatment_items: ["treatments", "treatment-history", "customer-360", "customer-timeline", "inventory", "dashboard-stats", "clinic-analytics"],
  services: ["services", "master-data", "appointments", "calendar-events"],
  service_variants: ["services", "master-data"],
  service_variant_prices: ["services", "master-data"],
  staff: ["staff-hr", "master-data", "appointments", "calendar-events"],
  staff_services: ["staff-hr", "master-data", "services"],
  staff_rooms: ["staff-hr", "master-data", "appointments", "calendar-events"],
  staff_working_hours: ["staff-hr", "master-data", "appointments", "calendar-events"],
  rooms: ["master-data", "appointments", "calendar-events"],
  devices: ["master-data", "appointments", "calendar-events", "inventory"],
  inventory_products: ["inventory"],
  inventory_movements: ["inventory"],
  marketing_campaigns: ["marketing", "clinic-brain", "ai-agent-workspace"],
  marketing_leads: ["marketing", "clinic-brain", "ai-agent-workspace"],
  marketing_messages: ["marketing"],
  marketing_source_costs: ["marketing", "clinic-analytics"],
  enterprise_tasks: ["enterprise"],
  enterprise_notifications: ["enterprise", "staff-notifications"],
  enterprise_workflow_runs: ["enterprise"],
  patient_appointment_requests: ["patient-appointment-requests", "appointments", "calendar-events", "ai-agent-workspace"],
  patient_messages: ["patient-messages", "staff-notifications", "ai-agent-workspace"],
  patient_automation_suggestions: ["ai-agent-workspace", "patient-appointment-requests"],
};

export default function RealtimeDataSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("zernio-workspace-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        (payload) => {
          const prefixes = queryPrefixesByTable[payload.table] ?? [];
          for (const prefix of prefixes) {
            void queryClient.invalidateQueries({ queryKey: [prefix] });
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return null;
}
