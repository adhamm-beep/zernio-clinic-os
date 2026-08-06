import {
  buildCustomerMemory,
} from "./customer-memory";

import {
  buildSummaryPrompt,
} from "./prompt-builder";

import type {
  CustomerInsights,
} from "../engine/buildCustomerInsights";

export function
buildCustomerContext(
  insights: CustomerInsights
) {

  const memory =
    buildCustomerMemory(
      insights
    );

  const prompt =
    buildSummaryPrompt(
      memory
    );

  return {

    memory,

    prompt,

  };

}