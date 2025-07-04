import { GET } from "./profile";

global.fetch = vi.fn();

describe("LinkedIn profile API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 if accessToken is missing", async () => {
    const url = new URL("http://localhost/api/profile");
    const res = await GET({ url } as any);
    expect(res.status).toBe(400);
    const body = await res.text();
    expect(body).toMatch(/Access token is required/);
  });

  it("returns error if LinkedIn returns error", async () => {
    const url = new URL("http://localhost/api/profile?accessToken=abc");
    (fetch as any).mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => "Forbidden",
    });
    const res = await GET({ url } as any);
    expect(res.status).toBe(403);
    const body = await res.text();
    expect(body).toMatch(/Failed to get profile/);
    expect(body).toMatch(/Forbidden/);
  });

  it("returns profile if LinkedIn returns ok", async () => {
    const url = new URL("http://localhost/api/profile?accessToken=abc");
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ id: "123", name: "Test" }),
    });
    const res = await GET({ url } as any);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/123/);
    expect(body).toMatch(/Test/);
  });

  it("returns 500 on internal error", async () => {
    const url = new URL("http://localhost/api/profile?accessToken=abc");
    (fetch as any).mockRejectedValue(new Error("fail"));
    const res = await GET({ url } as any);
    expect(res.status).toBe(500);
    const body = await res.text();
    expect(body).toMatch(/Internal server error/);
  });
});
