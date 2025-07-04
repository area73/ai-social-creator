import type { APIRoute } from "astro";

// Pure helper
const buildProfileResponse = (profile: any) => JSON.stringify(profile);

const fetchProfile = async (accessToken: string) => {
  const response = await fetch("https://api.linkedin.com/v2/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    const error = await response.text();
    throw {
      status: 403,
      message: `Failed to get profile: Status: ${response.status}, Error: ${error}`,
    };
  }
  return response.json();
};

export const GET: APIRoute = async ({ url }) => {
  try {
    const accessToken = url.searchParams.get("accessToken");
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Access token is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    try {
      const profile = await fetchProfile(accessToken);
      return new Response(JSON.stringify(profile), {
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
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
