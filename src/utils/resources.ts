export const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export type OpenAIApiUrl = typeof OPENAI_API_URL;

export const OPENAI_MODELS = [
  "gpt-3.5-turbo",
  "gpt-3.5-turbo-16k",
  "gpt-4",
  "gpt-4-32k",
] as const;

export type OpenAIModel = (typeof OPENAI_MODELS)[number];
