"use client";
import { useState, type FormEvent } from "react";
import {
  Bot,
  Goal,
  Megaphone,
  MessageCircle,
  RefreshCw,
  Send,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import SaudiMoney from "@/components/SaudiMoney";
import { Input } from "@/components/ui/input";
import { useClinic } from "@/features/clinic/hooks/useClinic";
import { useMasterData } from "@/features/appointments/hooks/useMasterData";
import { usePermissionAccess } from "@/features/users/hooks/usePermissionAccess";
import {
  addCampaign,
  addLead,
  addMessage,
  saveSourceCost,
  updateCampaign,
  updateLead,
} from "../api/marketing.api";
import { useMarketing } from "../hooks/useMarketing";
const channels = [
  "whatsapp",
  "instagram",
  "tiktok",
  "google",
  "sms",
  "email",
  "other",
];
function money(n: number) {
  return <SaudiMoney value={n} />;
}
function aiReply(name: string, service: string, status: string) {
  const hello = name ? `Hello ${name},` : "Hello,";
  if (status === "new")
    return `${hello} thank you for contacting Panthera Clinics about ${service || "our services"}. Would you like us to help you choose a suitable appointment?`;
  if (status === "booked")
    return `${hello} your appointment request is received. Our team will confirm the time and send the preparation details shortly.`;
  return `${hello} we are following up regarding ${service || "your inquiry"}. Reply here and our team will assist you.`;
}
export default function MarketingDashboard() {
  const access = usePermissionAccess();
  const canManage = access.can("marketing.manage");
  const canViewSpend = access.can("marketing.spend.view", "marketing.manage");
  const { clinic, selectedBranch, isLoading: cl } = useClinic();
  const c = clinic?.id ?? 0,
    b = selectedBranch?.id ?? 0;
  const { data, isLoading, error, refetch, isFetching } = useMarketing(c, b);
  const { data: master } = useMasterData();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [draft, setDraft] = useState("");
  async function run(fn: () => Promise<unknown>, ok: string) {
    if (!canManage) {
      setMsg("هذا الإجراء غير متوفر لك حسب صلاحيات حسابك.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      await fn();
      await qc.invalidateQueries({ queryKey: ["marketing", c, b] });
      setMsg(ok);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Operation failed");
    } finally {
      setBusy(false);
    }
  }
  async function campaign(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      el = e.currentTarget;
    await run(
      () =>
        addCampaign({
          clinic_id: c,
          branch_id: b,
          name: String(f.get("name")),
          channel: String(f.get("channel")),
          status: "active",
          objective: String(f.get("objective") || "") || null,
          budget: Number(f.get("budget") || 0),
          spend: Number(f.get("spend") || 0),
          start_date: String(f.get("start") || "") || null,
          end_date: String(f.get("end") || "") || null,
          audience_segment: String(f.get("segment") || "") || null,
          offer_text: String(f.get("offer") || "") || null,
        }),
      "Campaign created.",
    );
    el.reset();
  }
  async function lead(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      el = e.currentTarget;
    await run(
      () =>
        addLead({
          clinic_id: c,
          branch_id: b,
          campaign_id: Number(f.get("campaign")) || null,
          source: String(f.get("source")),
          full_name: String(f.get("name") || "") || null,
          phone: String(f.get("phone") || "") || null,
          email: String(f.get("email") || "") || null,
          status: "new",
          interested_service: String(f.get("service") || "") || null,
          notes: String(f.get("notes") || "") || null,
        }),
      "Lead added.",
    );
    el.reset();
  }
  async function message(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      el = e.currentTarget;
    await run(
      () =>
        addMessage({
          clinic_id: c,
          branch_id: b,
          campaign_id: Number(f.get("campaign")) || null,
          lead_id: Number(f.get("lead")) || null,
          channel: String(f.get("channel")),
          recipient: String(f.get("recipient") || "") || null,
          message_text: String(f.get("text")),
          ai_generated: Boolean(f.get("ai")),
          status: "queued",
          scheduled_at: new Date().toISOString(),
        }),
      "Message added to the send queue.",
    );
    el.reset();
    setDraft("");
  }
  async function cost(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await run(
      () =>
        saveSourceCost({
          clinic_id: c,
          branch_id: b,
          source: String(f.get("source")),
          period_month: `${String(f.get("month"))}-01`,
          spend: Number(f.get("spend") || 0),
          impressions: Number(f.get("impressions") || 0),
          clicks: Number(f.get("clicks") || 0),
        }),
      "Source cost saved.",
    );
  }
  if (cl || isLoading)
    return (
      <div className="rounded-2xl bg-white p-12 text-center">
        جارٍ تحميل مركز التسويق...
      </div>
    );
  if (!c || !b)
    return (
      <div className="rounded-2xl bg-amber-50 p-6">
        اختر العيادة والفرع أولًا.
      </div>
    );
  if (error || !data)
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <strong>تعذر تحميل مركز التسويق.</strong>
        <p>{error instanceof Error ? error.message : "Run Phase 7 SQL."}</p>
      </div>
    );
  const converted = data.leads.filter((x) =>
      ["booked", "converted"].includes(x.status),
    ).length,
    totalSpend = canViewSpend
      ? data.campaigns.reduce((s, x) => s + Number(x.spend), 0) +
        data.costs.reduce((s, x) => s + Number(x.spend), 0)
      : 0,
    active = data.campaigns.filter((x) => x.status === "active").length,
    queued = data.messages.filter((x) => x.status === "queued").length;
  return (
    <div className="space-y-7" dir="rtl">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-fuchsia-700">
            PANTHERA MARKETING
          </p>
          <h1 className="mt-1 text-3xl font-black">مركز التسويق</h1>
          <p className="mt-2 text-slate-500">
            الحملات والعملاء المحتملون ومصادر الإحالة والمتابعة والرسائل في
            مساحة واحدة.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={isFetching ? "animate-spin" : ""} />
          تحديث
        </Button>
      </header>
      {msg && (
        <div className="rounded-xl border border-fuchsia-200 bg-fuchsia-50 p-4 text-sm font-medium">
          {msg}
        </div>
      )}
      <nav className="sticky top-3 z-20 flex gap-2 overflow-x-auto rounded-2xl border bg-white/95 p-2 shadow-sm">
        {[
          ["نظرة عامة", "overview"],
          ["الحملات", "campaigns"],
          ["العملاء المحتملون", "leads"],
          ["الرسائل", "messages"],
          ...(canViewSpend ? [["مصادر الإحالة", "attribution"]] : []),
        ].map(([l, id]) => (
          <a
            key={id}
            href={`#${id}`}
            className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold hover:bg-slate-950 hover:text-white"
          >
            {l}
          </a>
        ))}
      </nav>
      <section
        id="overview"
        className="scroll-mt-24 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {[
          ["الحملات النشطة", active, Megaphone],
          ["العملاء المحتملون", data.leads.length, UserPlus],
          ["تم الحجز / التحويل", converted, Goal],
          ["الرسائل في الانتظار", queued, Send],
        ].map(([l, v, I]) => {
          const Icon = I as typeof Megaphone;
          return (
            <article
              key={String(l)}
              className="rounded-2xl bg-slate-950 p-5 text-white"
            >
              <Icon className="text-fuchsia-300" />
              <p className="mt-4 text-sm text-slate-400">{String(l)}</p>
              <p className="text-3xl font-bold">{String(v)}</p>
            </article>
          );
        })}
      </section>
      <section
        id="campaigns"
        className="scroll-mt-24 grid gap-6 xl:grid-cols-[1fr_1.6fr]"
      >
        {canManage && (
          <form
            onSubmit={campaign}
            className="space-y-3 rounded-2xl border bg-white p-6"
          >
            <h2 className="flex gap-2 text-lg font-bold">
              <Megaphone />
              حملة جديدة
            </h2>
            <Input name="name" required placeholder="اسم الحملة" />
            <select
              name="channel"
              className="h-10 w-full rounded-md border px-3"
            >
              {channels.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <Input name="objective" placeholder="هدف الحملة" />
            <Input name="segment" placeholder="الشريحة المستهدفة" />
            <Input name="offer" placeholder="العرض أو الرسالة" />
            <div className="grid grid-cols-2 gap-3">
              {canViewSpend && (
                <Input
                  name="budget"
                  type="number"
                  min="0"
                  placeholder="الميزانية"
                />
              )}
              {canViewSpend && (
                <Input
                  name="spend"
                  type="number"
                  min="0"
                  placeholder="الإنفاق الفعلي"
                />
              )}
              <Input name="start" type="date" />
              <Input name="end" type="date" />
            </div>
            <Button disabled={busy}>إنشاء الحملة</Button>
          </form>
        )}
        <div className="rounded-2xl border bg-white p-6">
          <h2 className="text-lg font-bold">أداء الحملات</h2>
          <div className="mt-4 space-y-3">
            {data.campaigns.map((x) => {
              const leads = data.leads.filter((l) => l.campaign_id === x.id),
                wins = leads.filter((l) =>
                  ["booked", "converted"].includes(l.status),
                ).length;
              return (
                <div key={x.id} className="rounded-xl bg-slate-50 p-4">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <p className="font-semibold">{x.name}</p>
                      <p className="text-xs capitalize text-slate-500">
                        {x.channel} · {x.status} · {leads.length} leads · {wins}{" "}
                        conversions
                      </p>
                    </div>
                    {canViewSpend && (
                      <div className="text-right">
                        <strong>{money(x.spend)}</strong>
                        <p className="text-xs text-slate-500">spent</p>
                      </div>
                    )}
                  </div>
                  {canManage && x.status === "active" && (
                    <Button
                      className="mt-3"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void run(
                          () => updateCampaign(x.id, { status: "paused" }),
                          "Campaign paused.",
                        )
                      }
                    >
                      إيقاف مؤقت
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section
        id="leads"
        className="scroll-mt-24 grid gap-6 xl:grid-cols-[1fr_1.6fr]"
      >
        {canManage && (
          <form
            onSubmit={lead}
            className="space-y-3 rounded-2xl border bg-white p-6"
          >
            <h2 className="flex gap-2 text-lg font-bold">
              <UserPlus />
              إضافة عميل محتمل
            </h2>
            <Input name="name" placeholder="الاسم الكامل" />
            <Input name="phone" placeholder="رقم الهاتف" />
            <Input name="email" type="email" placeholder="البريد الإلكتروني" />
            <select
              name="source"
              className="h-10 w-full rounded-md border px-3"
            >
              {channels.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <select
              name="campaign"
              className="h-10 w-full rounded-md border px-3"
            >
              <option value="">الحملة</option>
              {data.campaigns.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
            <select
              name="service"
              className="h-10 w-full rounded-md border px-3"
            >
              <option value="">الخدمة المطلوبة</option>
              {master?.services
                .filter((x) => x.is_active)
                .map((x) => (
                  <option key={x.id}>{x.name}</option>
                ))}
            </select>
            <Input name="notes" placeholder="ملاحظات" />
            <Button disabled={busy}>إضافة العميل المحتمل</Button>
          </form>
        )}
        <div className="rounded-2xl border bg-white p-6">
          <h2 className="text-lg font-bold">مسار العملاء المحتملين</h2>
          <div className="mt-4 space-y-3">
            {data.leads.map((x) => (
              <div
                key={x.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"
              >
                <div>
                  <p className="font-semibold">
                    {x.full_name || x.phone || "Unnamed lead"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {x.source} · {x.interested_service || "General inquiry"} ·{" "}
                    {x.campaign?.name || "Organic"}
                  </p>
                </div>
                {canManage && (
                  <select
                    value={x.status}
                    onChange={(e) =>
                      void run(
                        () => updateLead(x.id, { status: e.target.value }),
                        "Lead updated.",
                      )
                    }
                    className="h-9 rounded-md border px-3 text-sm"
                  >
                    <option>new</option>
                    <option>contacted</option>
                    <option>qualified</option>
                    <option>booked</option>
                    <option>converted</option>
                    <option>lost</option>
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section
        id="messages"
        className="scroll-mt-24 grid gap-6 xl:grid-cols-[1fr_1.6fr]"
      >
        {canManage && (
          <form
            onSubmit={message}
            className="space-y-3 rounded-2xl border bg-white p-6"
          >
            <h2 className="flex gap-2 text-lg font-bold">
              <MessageCircle />
              الرسائل والمتابعة
            </h2>
            <select
              name="lead"
              className="h-10 w-full rounded-md border px-3"
              onChange={(e) => {
                const l = data.leads.find(
                  (x) => x.id === Number(e.target.value),
                );
                if (l)
                  setDraft(
                    aiReply(
                      l.full_name || "",
                      l.interested_service || "",
                      l.status,
                    ),
                  );
              }}
            >
              <option value="">العميل المحتمل</option>
              {data.leads.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.full_name || x.phone}
                </option>
              ))}
            </select>
            <select
              name="campaign"
              className="h-10 w-full rounded-md border px-3"
            >
              <option value="">الحملة</option>
              {data.campaigns.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
            <select
              name="channel"
              className="h-10 w-full rounded-md border px-3"
            >
              {channels.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <Input name="recipient" placeholder="رقم الهاتف أو الحساب" />
            <textarea
              name="text"
              required
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={5}
              className="w-full rounded-md border p-3"
              placeholder="نص الرسالة"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                name="ai"
                type="checkbox"
                checked={Boolean(draft)}
                readOnly
              />
              مسودة بمساعدة الذكاء الاصطناعي
            </label>
            <Button disabled={busy}>إضافة إلى قائمة الإرسال</Button>
          </form>
        )}
        <div className="rounded-2xl border bg-white p-6">
          <h2 className="flex gap-2 text-lg font-bold">
            <Bot />
            قائمة الرسائل
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            جاهزة للربط الرسمي مع واتساب أو منصة الإرسال، ولا تُرسل دون الموصل
            المعتمد.
          </p>
          <div className="mt-4 space-y-3">
            {data.messages.map((x) => (
              <div key={x.id} className="rounded-xl bg-slate-50 p-4">
                <div className="flex justify-between">
                  <strong className="capitalize">{x.channel}</strong>
                  <span className="text-xs">{x.status}</span>
                </div>
                <p className="mt-2 text-sm">{x.message_text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {canViewSpend && (
        <section
          id="attribution"
          className="scroll-mt-24 grid gap-6 xl:grid-cols-[1fr_1.6fr]"
        >
          {canManage && (
            <form
              onSubmit={cost}
              className="space-y-3 rounded-2xl border bg-white p-6"
            >
              <h2 className="flex gap-2 text-lg font-bold">
                <TrendingUp />
                تكلفة مصدر الإحالة
              </h2>
              <select
                name="source"
                className="h-10 w-full rounded-md border px-3"
              >
                {channels.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
              <Input name="month" type="month" required />
              <Input name="spend" type="number" min="0" placeholder="الإنفاق" />
              <Input
                name="impressions"
                type="number"
                min="0"
                placeholder="مرات الظهور"
              />
              <Input
                name="clicks"
                type="number"
                min="0"
                placeholder="النقرات"
              />
              <Button disabled={busy}>حفظ التكلفة</Button>
            </form>
          )}
          <div className="rounded-2xl bg-slate-950 p-6 text-white">
            <h2 className="text-lg font-bold">ملخص مصادر الإحالة</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-slate-400">إجمالي الإنفاق</p>
                <strong className="text-2xl">{money(totalSpend)}</strong>
              </div>
              <div>
                <p className="text-sm text-slate-400">تكلفة العميل المحتمل</p>
                <strong className="text-2xl">
                  {data.leads.length
                    ? money(totalSpend / data.leads.length)
                    : "—"}
                </strong>
              </div>
              <div>
                <p className="text-sm text-slate-400">تكلفة الحجز</p>
                <strong className="text-2xl">
                  {converted ? money(totalSpend / converted) : "—"}
                </strong>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
