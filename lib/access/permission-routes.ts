export const PAGE_PERMISSION_GROUPS: Record<string, readonly string[]> = {
  "/dashboard": ["dashboard.view", "dashboard.finance.view", "dashboard.appointments_count.view", "dashboard.completed_patients_count.view", "dashboard.invoice_count.view", "dashboard.collections_total.view", "dashboard.invoiced_total.view", "dashboard.paid_total.view", "dashboard.remaining_total.view"],
  "/customers": ["customers.view", "customers.details.view", "customers.create", "customers.edit", "customers.deactivate", "customers.export", "customers.manage"],
  "/appointments": ["appointments.view", "appointments.create", "appointments.edit", "appointments.cancel", "appointments.patient_requests.manage", "appointments.manage", "calendar.view"],
  "/calendar": ["calendar.view"],
  "/follow-ups": ["followups.view"],
  "/treatments": ["treatments.view", "treatments.create", "treatments.edit", "treatments.complete", "treatments.manage", "medical.view", "medical.edit"],
  "/payments": ["payments.view", "payments.amounts.view", "payments.invoice_count.view", "payments.total.view", "payments.paid_total.view", "payments.remaining_total.view", "payments.create", "payments.refund", "payments.invoice.print", "payments.manage"],
  "/price-list": ["services.view", "services.manage"],
  "/inventory": ["inventory.view", "inventory.cost.view", "inventory.manage"],
  "/staff": ["staff.view", "staff.salary.view", "staff.manage", "staff.attendance.manage", "staff.schedule.manage"],
  "/marketing": ["marketing.view", "marketing.spend.view", "marketing.manage"],
  "/reports": ["reports.view", "reports.finance.view", "reports.doctor_revenue.view", "reports.export"],
  "/accounting": ["reports.finance.view"],
  "/patient-app": ["patient_app.analytics", "patient_app.identity.view"],
  "/ask-zernio": ["ai.view", "ai.use"],
  "/ai-agents": ["ai.view", "ai.use"],
  "/enterprise": ["enterprise.view", "enterprise.manage", "audit.view"],
  "/support": ["support.create", "support.manage"],
  "/settings/users": ["users.manage"],
  "/settings": ["settings.view", "settings.manage", "users.manage"],
  "/api/ai": ["ai.use"],
  "/api/payments": ["payments.manage"],
  "/api/admin/users": ["users.manage"],
};

export function permissionsForPath(pathname: string) {
  const prefix = Object.keys(PAGE_PERMISSION_GROUPS)
    .sort((left, right) => right.length - left.length)
    .find((candidate) => pathname === candidate || pathname.startsWith(`${candidate}/`));
  return prefix ? PAGE_PERMISSION_GROUPS[prefix] : null;
}
