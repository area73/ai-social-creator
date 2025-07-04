import { OPENAI_API_URL, OPENAI_MODELS } from "../resources";

describe("resources", () => {
  it("should export the correct OpenAI API URL", () => {
    expect(OPENAI_API_URL).toBe("https://api.openai.com/v1/chat/completions");
  });

  it("should export the correct OpenAI models", () => {
    expect(OPENAI_MODELS).toEqual([
      "gpt-3.5-turbo",
      "gpt-3.5-turbo-16k",
      "gpt-4",
      "gpt-4-32k",
    ]);
  });

  it("should have the correct type for OpenAIModel", () => {
    type Model = (typeof OPENAI_MODELS)[number];
    const model: Model = "gpt-3.5-turbo";
    expect(model).toBe("gpt-3.5-turbo");
  });
});
