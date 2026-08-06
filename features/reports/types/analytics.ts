export type TrendPoint = { label: string; revenue: number; bookings: number };
export type RankedMetric = { name: string; count: number; revenue: number };
export type DoctorMetric = RankedMetric & { successRate: number; utilizationRate: number };
export type SourceMetric = { source: string; leads: number; converted: number; conversionRate: number; revenue: number; spend: number; costPerBooking: number | null; roi: number | null };

export type ClinicAnalytics = {
  revenue: {
    today: number;
    month: number;
    previousMonth: number;
    forecast: number;
    trendPercent: number;
    averagePayment: number;
  };
  booking: {
    total: number;
    completed: number;
    cancelled: number;
    noShows: number;
    completionRate: number;
    cancellationRate: number;
    noShowRate: number;
  };
  finance: {
    collected: number;
    refunded: number;
    outstanding: number;
    collectionRate: number;
    refundRate: number;
  };
  monthlyTrend: TrendPoint[];
  dailyTrend: TrendPoint[];
  doctors: DoctorMetric[];
  services: RankedMetric[];
  paymentMethods: Array<{ method: string; amount: number; count: number }>;
  marketing: {
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
    costPerBooking: number | null;
    spend: number;
    attributedRevenue: number;
    roi: number | null;
    sources: SourceMetric[];
  };
};
