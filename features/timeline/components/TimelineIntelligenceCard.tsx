"use client";

import { useState } from "react";
import { Activity, CalendarCheck2, Sparkles, TrendingDown, TrendingUp } from "lucide-react";

import type { TimelineEvent } from "../types/timeline";

type Props = { events: TimelineEvent[] };

export default function TimelineIntelligenceCard({ events }: Props) {
  const [now] = useState(() => Date.now());
  const day = 86_400_000;
  const recent = events.filter((event) => now - new Date(event.date).getTime() <= 30 * day);
  const previous = events.filter((event) => {
    const age = now - new Date(event.date).getTime();
    return age > 30 * day && age <= 60 * day;
  });
  const missed = events.filter((event) =>
    ["cancelled", "no_show", "no_answer"].includes(event.status ?? "")
  ).length;
  const pendingFollowUps = events.filter(
    (event) => event.type === "follow_up" && ["pending", "in_progress"].includes(event.status ?? "")
  ).length;
  const completedTreatments = events.filter((event) => event.type === "treatment" && event.status === "completed").length;
  const paidEvents = events.filter((event) => event.type === "payment" && ["paid", "completed"].includes(event.status ?? "")).length;
  const latestEvent = events.reduce<TimelineEvent | null>((latest, event) => {
    if (!latest || new Date(event.date).getTime() > new Date(latest.date).getTime()) return event;
    return latest;
  }, null);
  const direction = recent.length >= previous.length ? "up" : "down";
  const summary = events.length === 0
    ? "لا يوجد نشاط مسجل حتى الآن."
    : `تم تسجيل ${events.length} حدثًا موحدًا خلال رحلة الرعاية. النشاط خلال آخر 30 يومًا ${direction === "up" ? "مستقر أو متزايد" : "أقل من الفترة السابقة"}. اكتمل ${completedTreatments} علاج وأُغلقت ${paidEvents} عملية دفع.`;
  const actions = [
    pendingFollowUps > 0 ? `أكمل ${pendingFollowUps} متابعة معلقة.` : null,
    missed > 0 ? `راجع ${missed} تفاعلًا فائتًا أو ملغيًا أو دون إجابة.` : null,
    recent.length === 0 && events.length > 0 ? "يُنصح بمتابعة لإعادة تنشيط المريض." : null,
    latestEvent ? `آخر نقطة تواصل مسجلة: ${latestEvent.title}.` : null,
  ].filter((item): item is string => Boolean(item));

  return (
    <div className="mt-6 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 to-cyan-50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-violet-600 p-2 text-white"><Sparkles className="h-5 w-5" /></span>
          <div>
            <h3 className="font-bold text-slate-950">ذكاء الخط الزمني</h3>
            <p className="text-xs text-slate-500">تحليل خاص للنشاط داخل النظام</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
          {direction === "up" ? <TrendingUp className="h-4 w-4 text-emerald-600" /> : <TrendingDown className="h-4 w-4 text-orange-600" />}
          {recent.length} حدثًا / 30 يومًا
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-700">{summary}</p>
      {actions.length > 0 ? (
        <ul className="mt-4 grid gap-2 md:grid-cols-2">
          {actions.map((action) => (
            <li key={action} className="flex gap-2 rounded-xl bg-white/80 p-3 text-sm text-slate-700">
              <Activity className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />{action}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm font-medium text-emerald-700">لا يوجد إجراء فوري مطلوب.</p>
      )}
      {events.length > 0 && (
        <div className="mt-4 flex gap-3 rounded-xl border border-violet-100 bg-white p-4 text-sm text-slate-700">
          <CalendarCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
          <p><span className="font-semibold">ملاحظة ذكية للسجل:</span> {missed > 0 ? "أكد الموعد التالي واستخدم تذكيرًا لأن النظام رصد تفاعلات فائتة." : "رحلة المريض منتظمة؛ حافظ على وضوح موعد العلاج أو المتابعة التالية."}</p>
        </div>
      )}
    </div>
  );
}
