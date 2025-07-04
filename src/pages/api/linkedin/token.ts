import type { APIRoute } from "astro";

// Pure helper
const buildTokenParams = (
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
) =>
  new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

const fetchToken = async (params: URLSearchParams) => {
  const response = await fetch(
    "https://www.linkedin.com/oauth/v2/accessToken",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    }
  );
  if (!response.ok) {
    throw { status: 400, message: "LinkedIn token error" };
  }
  return response.json();
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { code, clientId, clientSecret, redirectUri } = await request.json();
    try {
      const params = buildTokenParams(
        code,
        clientId,
        clientSecret,
        redirectUri
      );
      const data = await fetchToken(params);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      if (err && typeof err === "object" && "status" in err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: err.status,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
