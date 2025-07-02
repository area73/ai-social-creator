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
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  return { content };
};
