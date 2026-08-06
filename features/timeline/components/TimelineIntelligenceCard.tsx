"use client";

import { useState } from "react";
import { Activity, Sparkles, TrendingDown, TrendingUp } from "lucide-react";

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
  const direction = recent.length >= previous.length ? "up" : "down";
  const summary = events.length === 0
    ? "No activity is recorded yet."
    : `${events.length} unified events are recorded. Activity in the last 30 days is ${direction === "up" ? "stable or increasing" : "lower than the previous period"}.`;
  const actions = [
    pendingFollowUps > 0 ? `Complete ${pendingFollowUps} pending follow-up${pendingFollowUps === 1 ? "" : "s"}.` : null,
    missed > 0 ? `Review ${missed} missed, cancelled, or unanswered interaction${missed === 1 ? "" : "s"}.` : null,
    recent.length === 0 && events.length > 0 ? "Consider a reactivation follow-up." : null,
  ].filter((item): item is string => Boolean(item));

  return (
    <div className="mt-6 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 to-cyan-50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-violet-600 p-2 text-white"><Sparkles className="h-5 w-5" /></span>
          <div>
            <h3 className="font-bold text-slate-950">Timeline AI</h3>
            <p className="text-xs text-slate-500">Private on-device activity analysis</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
          {direction === "up" ? <TrendingUp className="h-4 w-4 text-emerald-600" /> : <TrendingDown className="h-4 w-4 text-orange-600" />}
          {recent.length} events / 30 days
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
        <p className="mt-4 text-sm font-medium text-emerald-700">No immediate timeline action is required.</p>
      )}
    </div>
  );
}
