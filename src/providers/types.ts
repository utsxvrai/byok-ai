export type ProviderId = "gemini";

export interface ChatRequest {
  prompt: string;
  model?: string;
}

export interface ChatResponse {
  text: string;
}


