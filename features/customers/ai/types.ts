export type AIProviderType =
  | "openai"
  | "claude"
  | "gemini"
  | "local";

export interface AIMessage {
  role:
    | "system"
    | "user"
    | "assistant";

  content: string;
}

export interface AIRequest {

  provider: AIProviderType;

  model: string;

  temperature?: number;

  maxTokens?: number;

  messages: AIMessage[];

}

export interface AIResponse {

  text: string;

  usage?: {

    promptTokens: number;

    completionTokens: number;

    totalTokens: number;

  };

}