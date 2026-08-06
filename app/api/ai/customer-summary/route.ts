import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const insightsSchema = z.object({
  visits: z.number().int().nonnegative(),
  completedTreatments: z.number().int().nonnegative(),
  cancelledAppointments: z.number().int().nonnegative(),
  noShows: z.number().int().nonnegative(),
  totalAppointments: z.number().int().nonnegative(),
  totalRevenue: z.number().nonnegative(),
  treatmentValue: z.number().nonnegative(),
  outstandingBalance: z.number().nonnegative(),
  averageSpend: z.number().nonnegative(),
  noShowRate: z.number().min(0).max(1),
  lifetimeValue: z.number().nonnegative(),
  vip: z.boolean(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
  healthScore: z.number().min(0).max(100),
  recommendedAction: z.string().max(120),
});

const aiSummarySchema = z.object({
  summary: z.string().min(1).max(700),
  recommendations: z.array(z.string().min(1).max(220)).min(1).max(4),
  risks: z.array(z.string().min(1).max(180)).max(3),
  opportunities: z.array(z.string().min(1).max(180)).max(3),
});

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

function readOutputText(response: OpenAIResponse) {
  if (response.output_text) return response.output_text;

  return response.output
    ?.flatMap((item) => item.content ?? [])
    .find((content) => content.type === "output_text")?.text;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims?.sub) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "AI is not configured" }, { status: 503 });
  }

  let insights: z.infer<typeof insightsSchema>;
  try {
    insights = insightsSchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid customer insights" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.6-sol",
        store: false,
        reasoning: { effort: "low" },
        input: [
          {
            role: "system",
            content:
              "You are Zernio Clinic AI. Analyze only the anonymous aggregate metrics supplied. Write in clear professional Arabic. Do not diagnose, prescribe, invent patient facts, or claim certainty. Return valid JSON matching the requested schema.",
          },
          {
            role: "user",
            content: `Create a concise operational customer summary from these anonymous metrics:\n${JSON.stringify(insights)}`,
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "customer_ai_summary",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                summary: { type: "string" },
                recommendations: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 1,
                  maxItems: 4,
                },
                risks: {
                  type: "array",
                  items: { type: "string" },
                  maxItems: 3,
                },
                opportunities: {
                  type: "array",
                  items: { type: "string" },
                  maxItems: 3,
                },
              },
              required: ["summary", "recommendations", "risks", "opportunities"],
            },
          },
        },
        max_output_tokens: 700,
      }),
      signal: controller.signal,
    });

    if (!openAIResponse.ok) {
      const errorBody = (await openAIResponse.json().catch(() => null)) as
        | { error?: { code?: string; type?: string } }
        | null;
      console.error("OpenAI customer summary failed", {
        status: openAIResponse.status,
        code: errorBody?.error?.code,
        type: errorBody?.error?.type,
      });
      const creditsRequired =
        errorBody?.error?.code === "credit_balance_exhausted" ||
        errorBody?.error?.type === "insufficient_quota";

      return Response.json(
        {
          error: creditsRequired ? "OpenAI credits are required" : "AI service is unavailable",
          code: creditsRequired ? "AI_CREDITS_REQUIRED" : "AI_UNAVAILABLE",
        },
        { status: creditsRequired ? 402 : 502 }
      );
    }

    const result = (await openAIResponse.json()) as OpenAIResponse;
    const outputText = readOutputText(result);
    if (!outputText) throw new Error("OpenAI response did not contain output text");

    const summary = aiSummarySchema.parse(JSON.parse(outputText));
    return Response.json(summary);
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError";
    console.error("Customer AI summary error", isTimeout ? "timeout" : "invalid_response");
    return Response.json(
      { error: isTimeout ? "AI request timed out" : "AI response was invalid" },
      { status: isTimeout ? 504 : 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
