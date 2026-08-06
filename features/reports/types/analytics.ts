export type TrendPoint = { label: string; revenue: number; bookings: number };
export type RankedMetric = { name: string; count: number; revenue: number };

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
  };
  monthlyTrend: TrendPoint[];
  doctors: RankedMetric[];
  services: RankedMetric[];
  paymentMethods: Array<{ method: string; amount: number; count: number }>;
};
