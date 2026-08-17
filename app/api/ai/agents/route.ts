import { z } from "zod";
import { authorizeAnyPermission } from "@/lib/security/authorization";
import {
  isTrustedBrowserRequest,
  rateLimit,
  readJsonWithLimit,
  RequestValidationError,
} from "@/lib/security/request";
const contextSchema = z.object({
  appointmentsToday: z.number().int().nonnegative(),
  pendingConfirmations: z.number().int().nonnegative(),
  pendingFollowUps: z.number().int().nonnegative(),
  completedTreatments: z.number().int().nonnegative(),
  activeCustomers: z.number().int().nonnegative(),
  revenueMonth: z.number().nonnegative(),
  outstanding: z.number().nonnegative(),
  activeCampaigns: z.number().int().nonnegative(),
  marketingLeads: z.number().int().nonnegative(),
  lowStockProducts: z.number().int().nonnegative(),
  staffPresentToday: z.number().int().nonnegative(),
  topServices: z
    .array(
      z.object({
        name: z.string().max(120),
        count: z.number().int().nonnegative(),
      }),
    )
    .max(5),
  topSources: z
    .array(
      z.object({
        name: z.string().max(80),
        count: z.number().int().nonnegative(),
      }),
    )
    .max(5),
});
const requestSchema = z.object({
  agent: z.enum(["reception", "doctor", "marketing", "finance", "ceo"]),
  question: z.string().trim().min(2).max(500),
  context: contextSchema,
});
const answerSchema = z.object({
  answer: z.string().min(1).max(1200),
  actions: z.array(z.string().min(1).max(220)).max(5),
  risks: z.array(z.string().min(1).max(220)).max(4),
  metricHighlights: z.array(z.string().min(1).max(160)).max(5),
});
type OA = {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
};
function text(r: OA) {
  return (
    r.output_text ??
    r.output
      ?.flatMap((x) => x.content ?? [])
      .find((x) => x.type === "output_text")?.text
  );
}
const roles = {
  reception:
    "You are a clinic reception operations agent. Focus on booking, confirmations, no-shows, and follow-ups.",
  doctor:
    "You are a clinical operations support agent. Discuss workflow, treatment history patterns, and stock readiness only. Never diagnose, prescribe, or recommend a specific treatment for a patient.",
  marketing:
    "You are a clinic marketing operations agent. Focus on campaigns, lead conversion, segmentation, attribution, and ROI.",
  finance:
    "You are a clinic finance operations agent. Focus on collections, outstanding balances, revenue trends, and follow-up priorities.",
  ceo: "You are an executive clinic operations agent. Synthesize performance across revenue, customers, staff, marketing, bookings, and inventory.",
} as const;
function localAnswer(
  agent: keyof typeof roles,
  c: z.infer<typeof contextSchema>,
): z.infer<typeof answerSchema> {
  const base = {
    reception: `يوجد اليوم ${c.appointmentsToday} موعد، منها ${c.pendingConfirmations} يحتاج تأكيدًا، مع ${c.pendingFollowUps} متابعة مفتوحة.`,
    doctor: `تم إكمال ${c.completedTreatments} جلسة هذا الشهر، ويوجد ${c.lowStockProducts} منتج عند حد إعادة الطلب.`,
    marketing: `يوجد ${c.marketingLeads} عميل محتمل و${c.activeCampaigns} حملة نشطة حاليًا.`,
    finance: `الإيراد المسجل هذا الشهر ${c.revenueMonth.toLocaleString()} ريال، والرصيد المستحق ${c.outstanding.toLocaleString()} ريال.`,
    ceo: `العيادة لديها اليوم ${c.appointmentsToday} موعد، وإيراد الشهر ${c.revenueMonth.toLocaleString()} ريال، و${c.marketingLeads} عميل محتمل.`,
  }[agent];
  const actions = {
    reception: [
      c.pendingConfirmations
        ? "ابدأ بتأكيد المواعيد غير المؤكدة."
        : "لا توجد تأكيدات معلقة؛ راجع مواعيد الغد.",
      c.pendingFollowUps
        ? "أغلق المتابعات المفتوحة حسب الأولوية."
        : "حافظ على جدول المتابعة الحالي.",
    ],
    doctor: [
      c.lowStockProducts
        ? "راجع المواد منخفضة المخزون قبل الجلسات."
        : "المخزون التشغيلي لا يظهر تنبيهًا حاليًا.",
      "راجع السجل الطبي والمادة المختارة قبل كل جلسة.",
    ],
    marketing: [
      c.marketingLeads
        ? "راجع العملاء المحتملين الجدد وحركهم للمرحلة التالية."
        : "ابدأ حملة صغيرة قابلة للقياس لجمع عملاء محتملين.",
      "سجل المصروف والتحويل لقياس ROI.",
    ],
    finance: [
      "راجع المدفوعات والتحصيل من صفحة التقارير.",
      c.outstanding
        ? "ابدأ متابعة الأرصدة المستحقة حسب القيمة والأقدمية."
        : "لا يظهر رصيد مستحق حاليًا.",
    ],
    ceo: [
      "راجع قائمة مهام الاستقبال لليوم.",
      "تابع الإيراد والتحويل والمخزون من التقارير.",
      "تأكد من حضور الفريق وتغطية المواعيد.",
    ],
  }[agent];
  return {
    answer: `${base} هذا تحليل تشغيلي محلي مبني على البيانات الحالية.`,
    actions,
    risks: [
      ...(c.pendingConfirmations
        ? ["وجود مواعيد غير مؤكدة قد يرفع احتمال عدم الحضور."]
        : []),
      ...(c.lowStockProducts
        ? ["انخفاض بعض المواد قد يؤثر على جاهزية الجلسات."]
        : []),
      ...(c.outstanding ? ["يوجد رصيد مالي مستحق يحتاج خطة تحصيل."] : []),
      ...(c.staffPresentToday === 0
        ? ["لم يتم تسجيل حضور موظفين اليوم في نظام HR."]
        : []),
    ].slice(0, 4),
    metricHighlights: [
      `${c.appointmentsToday} موعد اليوم`,
      `${c.revenueMonth.toLocaleString()} ريال هذا الشهر`,
      `${c.outstanding.toLocaleString()} ريال مستحق`,
      `${c.pendingFollowUps} متابعة مفتوحة`,
      `${c.lowStockProducts} تنبيه مخزون`,
    ],
  };
}
export async function POST(req: Request) {
  if (!isTrustedBrowserRequest(req)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const authorization = await authorizeAnyPermission(["ai.use"]);
  if (!authorization.allowed) {
    return Response.json({ error: authorization.error }, { status: authorization.status });
  }
  try {
    const limit = await rateLimit(`ai:agents:${authorization.userId}`, 30, 5 * 60_000);
    if (!limit.allowed) {
      return Response.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
      );
    }
  } catch {
    return Response.json({ error: "Security service is temporarily unavailable" }, { status: 503 });
  }
  let input: z.infer<typeof requestSchema>;
  try {
    input = requestSchema.parse(await readJsonWithLimit(req, 16_384));
  } catch (error) {
    const status = error instanceof RequestValidationError ? error.status : 400;
    return Response.json({ error: "Invalid agent request" }, { status });
  }
  const key = process.env.OPENAI_API_KEY;
  if (!key) return Response.json(localAnswer(input.agent, input.context));
  const controller = new AbortController(),
    timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.6-sol",
        store: false,
        reasoning: { effort: "low" },
        input: [
          {
            role: "system",
            content: `You are Panthera AI. ${roles[input.agent]} Use only the anonymous aggregate clinic metrics supplied. Answer in clear professional Arabic. Do not invent facts, expose personal data, promise outcomes, or perform actions. Distinguish observations from recommendations.`,
          },
          {
            role: "user",
            content: `Question: ${input.question}\nAnonymous clinic metrics: ${JSON.stringify(input.context)}`,
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "zernio_agent_answer",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                answer: { type: "string" },
                actions: {
                  type: "array",
                  items: { type: "string" },
                  maxItems: 5,
                },
                risks: {
                  type: "array",
                  items: { type: "string" },
                  maxItems: 4,
                },
                metricHighlights: {
                  type: "array",
                  items: { type: "string" },
                  maxItems: 5,
                },
              },
              required: ["answer", "actions", "risks", "metricHighlights"],
            },
          },
        },
        max_output_tokens: 1100,
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const e = (await response.json().catch(() => null)) as {
        error?: { code?: string; type?: string };
      } | null;
      const credits =
        e?.error?.code === "credit_balance_exhausted" ||
        e?.error?.type === "insufficient_quota";
      if (credits)
        return Response.json(localAnswer(input.agent, input.context));
      return Response.json(
        { error: "AI service is unavailable" },
        { status: 502 },
      );
    }
    const raw = (await response.json()) as OA,
      out = text(raw);
    if (!out) throw new Error("missing output");
    return Response.json(answerSchema.parse(JSON.parse(out)));
  } catch (e) {
    const timed = e instanceof Error && e.name === "AbortError";
    return Response.json(
      { error: timed ? "AI request timed out" : "AI response was invalid" },
      { status: timed ? 504 : 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
