import { POST } from "./token";

global.fetch = vi.fn();

describe("LinkedIn token API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const makeRequest = (body: any) =>
    ({ request: { json: async () => body } } as any);

  it("returns error if LinkedIn returns error", async () => {
    (fetch as any).mockResolvedValue({ ok: false, status: 400 });
    const res = await POST(
      makeRequest({
        code: "c",
        clientId: "id",
        clientSecret: "sec",
        redirectUri: "uri",
      })
    );
    expect(res.status).toBe(400);
    const body = await res.text();
    expect(body).toMatch(/LinkedIn token error/);
  });

  it("returns token data if LinkedIn returns ok", async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: "tok" }),
    });
    const res = await POST(
      makeRequest({
        code: "c",
        clientId: "id",
        clientSecret: "sec",
        redirectUri: "uri",
      })
    );
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/access_token/);
  });

  it("returns 500 on internal error", async () => {
    (fetch as any).mockRejectedValue(new Error("fail"));
    const res = await POST(
      makeRequest({
        code: "c",
        clientId: "id",
        clientSecret: "sec",
        redirectUri: "uri",
      })
    );
    expect(res.status).toBe(500);
    const body = await res.text();
    expect(body).toMatch(/Server error/);
  });
});
