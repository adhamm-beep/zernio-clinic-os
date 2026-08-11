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
    <div className="flex min-h-screen bg-[#f7f8f7]">
      <Sidebar />

      <div className="min-w-0 flex-1 overflow-x-hidden">
        <Header />

        <main className="mx-auto min-w-0 max-w-[1600px] p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
