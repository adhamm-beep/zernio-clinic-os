import { useMemo } from "react";

import {
  buildCustomerInsights,
} from "../engine/buildCustomerInsights";

export function useCustomerInsights(
  data: {
    visits: number;

    completedTreatments: number;

    cancelledAppointments: number;

    noShows?: number;

    totalAppointments?: number;

    totalRevenue: number;

    treatmentValue?: number;

    outstandingBalance: number;
  }
) {
  return useMemo(
    () =>
      buildCustomerInsights(
        data
      ),
    [data]
  );
}
