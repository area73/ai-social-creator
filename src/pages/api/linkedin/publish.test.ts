import { POST } from "./publish";

global.fetch = vi.fn();

describe("LinkedIn publish API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const makeRequest = (body: any) =>
    ({ request: { json: async () => body } } as any);

  it("returns 400 if accessToken or text is missing", async () => {
    const res = await POST(makeRequest({ accessToken: null, text: "hi" }));
    expect(res.status).toBe(400);
    const body = await res.text();
    expect(body).toMatch(/required/);
  });

  it("returns error if userinfo call fails", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });
    const res = await POST(makeRequest({ accessToken: "abc", text: "hi" }));
    expect(res.status).toBe(400);
    const body = await res.text();
    expect(body).toMatch(/Failed to get user profile/);
    expect(body).toMatch(/Unauthorized/);
  });

  it("returns error if ugcPosts call fails", async () => {
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sub: "user123" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "UGC error",
      });
    const res = await POST(makeRequest({ accessToken: "abc", text: "hi" }));
    expect(res.status).toBe(400);
    const body = await res.text();
    expect(body).toMatch(/Failed to publish post/);
    expect(body).toMatch(/UGC error/);
  });

  it("returns success if post is published", async () => {
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sub: "user123" }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "post1" }) });
    const res = await POST(makeRequest({ accessToken: "abc", text: "hi" }));
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/success/);
    expect(body).toMatch(/post1/);
  });

  it("returns 500 on internal error", async () => {
    (fetch as any).mockRejectedValue(new Error("fail"));
    const res = await POST(makeRequest({ accessToken: "abc", text: "hi" }));
    expect(res.status).toBe(500);
    const body = await res.text();
    expect(body).toMatch(/Internal server error/);
  });
});
