import type {
  AIRequest,
  AIResponse,
} from "../types";

export class OpenAIProvider {

  async chat(
    request: AIRequest
  ): Promise<AIResponse> {

    const response =
      await fetch(
        "/api/ai/chat",
        {

          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            request
          ),

        }
      );

    if (!response.ok) {

      throw new Error(
        "AI request failed."
      );

    }

    return response.json();

  }

}