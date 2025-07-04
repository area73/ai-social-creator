import type { OpenAIModel, OpenAIApiUrl } from "./resources";

export interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenAIResponse {
  content: string;
}

export const sendMessageToOpenAI = async (
  messages: OpenAIMessage[],
  apiKey: string,
  apiUrl: OpenAIApiUrl,
  model: OpenAIModel
): Promise<OpenAIResponse> => {
  // Pure helper to build request body
  const buildRequestBody = (model: OpenAIModel, messages: OpenAIMessage[]) => ({
    model,
    messages,
  });

  // Side effect: fetch OpenAI
  const fetchOpenAI = async () => {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(buildRequestBody(model, messages)),
    });
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }
    return response.json();
  };

  // Pure helper to extract content
  const extractContent = (data: any): string =>
    data.choices?.[0]?.message?.content ?? "";

  const data = await fetchOpenAI();
  return { content: extractContent(data) };
};
