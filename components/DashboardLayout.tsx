import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

type Props = {
  children: ReactNode;
};

export default function DashboardLayout({
  children,
}: Props) {
  return (
    <div className="panthera-app-shell flex min-h-screen">
      <Sidebar />
      <div className="hidden w-[72px] shrink-0 lg:block" aria-hidden="true" />

      <div className="panthera-content-stage min-w-0 flex-1 overflow-x-hidden">
        <Header />

        <main className="panthera-page mx-auto min-w-0 max-w-[1800px] p-3 md:p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
