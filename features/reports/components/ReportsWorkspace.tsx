"use client";
import {BarChart3,Landmark} from "lucide-react";
import {Tabs,TabsContent,TabsList,TabsTrigger} from "@/components/ui/tabs";
import {useLocale} from "@/components/LocaleProvider";
import AccountingDashboard from "@/features/accounting/components/AccountingDashboard";
import ClinicAnalyticsDashboard from "./ClinicAnalyticsDashboard";
export default function ReportsWorkspace(){const {text}=useLocale();return <Tabs defaultValue="operations"><TabsList className="mb-5 h-auto rounded-2xl border bg-white p-2 shadow-sm"><TabsTrigger value="operations" className="px-5 py-3"><BarChart3/>{text("Clinic analytics","تحليلات العيادة")}</TabsTrigger><TabsTrigger value="accounting" className="px-5 py-3"><Landmark/>{text("Finance & accounting","المالية والمحاسبة")}</TabsTrigger></TabsList><TabsContent value="operations"><ClinicAnalyticsDashboard/></TabsContent><TabsContent value="accounting"><AccountingDashboard/></TabsContent></Tabs>}
