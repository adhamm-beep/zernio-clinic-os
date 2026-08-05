export const queryKeys = {
  customers: {
    all: ["customers"] as const,
    detail: (customerId: string | number) =>
      ["customers", String(customerId)] as const,
    customer360: (customerId: string | number) =>
      ["customer-360", String(customerId)] as const,
  },

  appointments: {
    all: ["appointments"] as const,
  },

  treatments: {
    all: ["treatments"] as const,
  },

  payments: {
    all: ["payments"] as const,
  },

  followUps: {
    all: ["follow-ups"] as const,
  },

  services: {
    all: ["services"] as const,
  },

  dashboard: {
    stats: ["dashboard-stats"] as const,
  },

  masterData: {
    all: ["master-data"] as const,
    doctors: ["master-data", "doctors"] as const,
    branches: ["master-data", "branches"] as const,
    rooms: ["master-data", "rooms"] as const,
    services: ["master-data", "services"] as const,
  },
} as const;