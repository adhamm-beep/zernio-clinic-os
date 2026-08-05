export type AppointmentStatusBreakdown = {
  booked: number;
  confirmed: number;
  arrived: number;
  completed: number;
  cancelled: number;
  no_show: number;
};

export type RevenuePoint = {
  date: string;
  amount: number;
};

export type ServicePerformance = {
  serviceName: string;
  count: number;
  revenue: number;
};

export type DashboardStats = {
  totalCustomers: number;
  newCustomersToday: number;

  appointmentsToday: number;
  appointmentsThisMonth: number;
  appointmentStatus: AppointmentStatusBreakdown;

  revenueToday: number;
  revenueThisMonth: number;
  totalCollected: number;
  averagePayment: number;

  pendingFollowUps: number;
  overdueFollowUps: number;
  completedFollowUps: number;

  totalTreatments: number;
  completedTreatments: number;

  revenueLastSevenDays: RevenuePoint[];
  topServices: ServicePerformance[];
};