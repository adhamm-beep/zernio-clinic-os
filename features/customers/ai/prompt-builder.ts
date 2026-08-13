import type {
  CustomerMemory,
} from "./customer-memory";

export function
buildSummaryPrompt(
  memory: CustomerMemory
) {

  return `

You are Panthera Clinic AI.

Patient Summary

${memory.summary}

Tags:

${memory.tags.join("\n")}

Risks:

${memory.risks.join("\n")}

Timeline:

${memory.timeline.join("\n")}

Recommend the next action.

Maximum five bullet points.

`;

}
