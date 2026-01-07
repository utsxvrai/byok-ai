import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ChatRequest, ChatResponse } from "./types";

export class GeminiProvider {
  private readonly client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async chat(input: ChatRequest): Promise<ChatResponse> {
    if (!input.prompt) {
      throw new Error("prompt is required");
    }

    const modelId = input.model || "gemini-1.5-flash";
    const model = this.client.getGenerativeModel({ model: modelId });
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: input.prompt }],
        },
      ],
    });

    const text = result.response.text();
    return { text: text ?? "" };
  }
}

