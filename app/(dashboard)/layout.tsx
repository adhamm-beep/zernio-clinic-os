import type { ReactNode } from "react";

import DashboardLayout from "@/components/DashboardLayout";
import { ClinicProvider } from "@/features/clinic/context/ClinicProvider";
import { DateRangeProvider } from "@/features/date-range/DateRangeProvider";

export default function Layout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ClinicProvider>
      <DateRangeProvider>
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </DateRangeProvider>
    </ClinicProvider>
  );
}
