import { OpenAIProvider } from "../providers/openai.provider";

import { buildCustomerContext } from "../customer-context";

import type {
  AIRequest,
  AIResponse,
} from "../types";

import type {
  CustomerInsights,
} from "../../engine/buildCustomerInsights";

export class CustomerAIService {

  private provider: OpenAIProvider;

  constructor() {
    this.provider =
      new OpenAIProvider();
  }

  async summary(
    prompt: string
  ): Promise<AIResponse> {

    const request: AIRequest = {

      provider:
        "openai",

      model:
        "gpt-5.6-sol",

      temperature:
        0.2,

      maxTokens:
        700,

      messages: [

        {

          role:
            "system",

          content:
            "You are Panthera Clinic AI Assistant. Always answer as a senior clinic consultant.",

        },

        {

          role:
            "user",

          content:
            prompt,

        },

      ],

    };

    return this.provider.chat(
      request
    );

  }

  async summaryFromInsights(
    insights: CustomerInsights
  ): Promise<AIResponse> {

    const context =
      buildCustomerContext(
        insights
      );

    return this.summary(
      context.prompt
    );

  }

  async ask(
    question: string
  ): Promise<AIResponse> {

    return this.summary(
      question
    );

  }

  async recommendTreatment(
    insights: CustomerInsights
  ): Promise<AIResponse> {

    const context =
      buildCustomerContext(
        insights
      );

    const prompt = `

${context.prompt}

Recommend the next treatment.

Explain why.

Suggest Upsell.

Suggest Cross Sell.

Maximum five bullet points.

`;

    return this.summary(
      prompt
    );

  }

  async evaluateRisk(
    insights: CustomerInsights
  ): Promise<AIResponse> {

    const context =
      buildCustomerContext(
        insights
      );

    const prompt = `

${context.prompt}

Estimate

No Show Risk

Payment Risk

Churn Risk

Health Score

Return JSON.

`;

    return this.summary(
      prompt
    );

  }

}

export const customerAI =
  new CustomerAIService();
