"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareText, Search, Send } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/components/LocaleProvider";
import { useClinic } from "@/features/clinic/hooks/useClinic";
import { usePermissionAccess } from "@/features/users/hooks/usePermissionAccess";
import {
  getPatientMessages,
  markPatientThreadRead,
  replyToPatient,
  type PatientMessage,
} from "../api/messages.api";

const categories: Record<string, [string, string]> = {
  general: ["General", "عام"],
  booking: ["Booking", "الحجز"],
  payment: ["Payment", "الدفع"],
  aftercare: ["Aftercare", "ما بعد العلاج"],
  medical: ["Medical", "طبي"],
  complaint: ["Complaint", "شكوى"],
};

export default function PatientInbox({
  initialCustomerId = null,
}: {
  initialCustomerId?: number | null;
}) {
  const { clinic, selectedBranch } = useClinic();
  const { isArabic, text } = useLocale();
  const access = usePermissionAccess();
  const clinicId = clinic?.id ?? 0;
  const branchId = selectedBranch?.id ?? 0;
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<number | null>(initialCustomerId);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("general");

  const query = useQuery({
    queryKey: ["patient-messages", clinicId, branchId],
    queryFn: () => getPatientMessages(clinicId, branchId),
    enabled: clinicId > 0 && branchId > 0,
  });

  const canReply = access.can("messages.reply", "messages.manage");
  const threads = useMemo(() => {
    const grouped = new Map<number, PatientMessage[]>();
    for (const message of query.data ?? []) {
      const existing = grouped.get(message.customer_id) ?? [];
      existing.push(message);
      grouped.set(message.customer_id, existing);
    }
    const needle = search.trim().toLowerCase();
    return [...grouped.entries()]
      .map(([customerId, messages]) => ({
        customerId,
        messages,
        last: messages[messages.length - 1],
        unread: messages.filter(
          (item) => item.sender_type === "patient" && !item.is_read,
        ).length,
      }))
      .filter((thread) => {
        const customer = thread.last.customer;
        return (
          !needle ||
          `${customer?.first_name ?? ""} ${customer?.last_name ?? ""} ${customer?.phone ?? ""} ${customer?.customer_code ?? ""}`
            .toLowerCase()
            .includes(needle)
        );
      })
      .sort((a, b) => b.last.created_at.localeCompare(a.last.created_at));
  }, [query.data, search]);

  const active = threads.find((item) => item.customerId === selected) ?? threads[0];

  useEffect(() => {
    if (!active?.customerId || !active.unread) return;
    void markPatientThreadRead(active.customerId).then(() =>
      queryClient.invalidateQueries({ queryKey: ["patient-messages"] }),
    );
  }, [active?.customerId, active?.unread, queryClient]);

  const reply = useMutation({
    mutationFn: (message: string) =>
      replyToPatient(
        active!.customerId,
        message,
        category,
        active?.last.appointment_id,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["patient-messages"] });
      toast.success(text("Reply sent to the patient", "تم إرسال الرد للمريض"));
    },
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const message = String(new FormData(form).get("message") || "").trim();
    if (!message) return;
    await reply.mutateAsync(message);
    form.reset();
  }

  if (
    !access.isLoading &&
    !access.can("messages.view", "messages.reply", "messages.manage")
  ) {
    return (
      <div className="rounded-2xl bg-amber-50 p-6 text-amber-800">
        {text("Patient messages are not available to you.", "الرسائل غير متاحة لك.")}
      </div>
    );
  }

  return (
    <main className="space-y-5" dir={isArabic ? "rtl" : "ltr"}>
      <section className="rounded-[28px] bg-[#516e84] p-6 text-white">
        <p className="text-xs font-black tracking-[.2em] text-cyan-200">PANTHERA INBOX</p>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-black">
          <MessageSquareText />
          {text("Patient messages", "رسائل المرضى")}
        </h1>
        <p className="mt-2 text-sm text-slate-100">
          {text(
            "Patient-app messages and replies are linked to each patient's record and appointment.",
            "كل رسائل تطبيق المريض والردود مرتبطة بملف المريض وموعده.",
          )}
        </p>
      </section>

      <section className="grid min-h-[620px] overflow-hidden rounded-2xl border bg-white shadow-sm lg:grid-cols-[340px_1fr]">
        <aside className={isArabic ? "border-l" : "border-r"}>
          <label className="m-3 flex items-center gap-2 rounded-xl border px-3">
            <Search className="size-4 text-slate-400" />
            <input
              className="h-11 w-full outline-none"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={text("Search patients", "ابحث عن مريض")}
            />
          </label>
          <div className="max-h-[550px] overflow-y-auto">
            {threads.map((thread) => (
              <button
                type="button"
                key={thread.customerId}
                onClick={() => setSelected(thread.customerId)}
                className={`w-full border-t p-4 text-start ${active?.customerId === thread.customerId ? "bg-cyan-50" : "hover:bg-slate-50"}`}
              >
                <div className="flex justify-between gap-2">
                  <b>{thread.last.customer?.first_name} {thread.last.customer?.last_name}</b>
                  {thread.unread > 0 && (
                    <span className="grid size-6 place-items-center rounded-full bg-rose-600 text-xs text-white">
                      {thread.unread}
                    </span>
                  )}
                </div>
                <p className="truncate text-sm text-slate-500">{thread.last.message}</p>
                <span className="text-xs text-slate-400" dir="ltr">
                  {new Date(thread.last.created_at).toLocaleString(
                    isArabic ? "ar-SA-u-nu-latn" : "en-SA",
                  )}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          {active ? (
            <>
              <header className="border-b p-4">
                <b>{active.last.customer?.first_name} {active.last.customer?.last_name}</b>
                <span className="block text-xs text-slate-500">
                  {active.last.customer?.customer_code} · {active.last.customer?.phone}
                </span>
              </header>
              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
                {active.messages.map((message) => {
                  const patient = message.sender_type === "patient";
                  return (
                    <div
                      key={message.id}
                      className={`max-w-[85%] rounded-2xl p-3 ${patient ? "ms-auto border bg-white" : "me-auto bg-cyan-700 text-white"}`}
                    >
                      <p>{message.message}</p>
                      <span className={`mt-1 block text-xs ${patient ? "text-slate-400" : "text-cyan-100"}`}>
                        {patient
                          ? text("Patient", "المريض")
                          : message.sender?.staff_name || text("System", "النظام")}
                        {" · "}{(categories[message.category] ?? [message.category, message.category])[isArabic ? 1 : 0]}
                        {" · "}{new Date(message.created_at).toLocaleString(isArabic ? "ar-SA-u-nu-latn" : "en-SA")}
                      </span>
                    </div>
                  );
                })}
              </div>
              {canReply && (
                <form onSubmit={submit} className="grid gap-2 border-t p-3 sm:grid-cols-[160px_1fr_auto]">
                  <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border px-3">
                    {Object.entries(categories).map(([key, labels]) => (
                      <option key={key} value={key}>{labels[isArabic ? 1 : 0]}</option>
                    ))}
                  </select>
                  <input name="message" required maxLength={2000} className="h-11 rounded-xl border px-3 outline-none" placeholder={text("Write a reply", "اكتب ردك للمريض")} />
                  <button disabled={reply.isPending} className="rounded-xl bg-cyan-600 px-5 font-bold text-white disabled:opacity-50">
                    <Send className="me-2 inline size-4" />{text("Send", "إرسال")}
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="grid flex-1 place-items-center text-slate-500">
              {text("No messages yet.", "لا توجد رسائل بعد.")}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
