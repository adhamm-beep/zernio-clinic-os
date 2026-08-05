import type { ReactNode } from "react";

import DashboardLayout from "@/components/DashboardLayout";
import { ClinicProvider } from "@/features/clinic/context/ClinicProvider";

export default function Layout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ClinicProvider>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </ClinicProvider>
  );
}