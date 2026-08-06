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
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="min-w-0 flex-1 overflow-x-hidden">
        <Header />

        <main className="min-w-0 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
