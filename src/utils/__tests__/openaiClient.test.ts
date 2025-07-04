import { sendMessageToOpenAI } from "../openaiClient";
import { OPENAI_API_URL, OPENAI_MODELS } from "../resources";

global.fetch = vi.fn();

describe("sendMessageToOpenAI", () => {
  const apiKey = "test-key";
  const model = OPENAI_MODELS[0];
  const messages = [
    { role: "user" as const, content: "Hello" },
    { role: "assistant" as const, content: "Hi!" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends a message and returns the AI response", async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "AI reply" } }] }),
    });
    const res = await sendMessageToOpenAI(
      messages,
      apiKey,
      OPENAI_API_URL,
      model
    );
    expect(res).toEqual({ content: "AI reply" });
    expect(fetch).toHaveBeenCalledWith(
      OPENAI_API_URL,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: `Bearer ${apiKey}` }),
      })
    );
  });

  it("throws if response is not ok", async () => {
    (fetch as any).mockResolvedValue({ ok: false, statusText: "Bad Request" });
    await expect(
      sendMessageToOpenAI(messages, apiKey, OPENAI_API_URL, model)
    ).rejects.toThrow("OpenAI API error: Bad Request");
  });

  it("returns empty content if choices missing", async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    const res = await sendMessageToOpenAI(
      messages,
      apiKey,
      OPENAI_API_URL,
      model
    );
    expect(res).toEqual({ content: "" });
  });
});
