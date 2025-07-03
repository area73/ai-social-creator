import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url }) => {
  try {
    const accessToken = url.searchParams.get("accessToken");

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Access token is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Use the correct endpoint to get basic profile info
    const response = await fetch("https://api.linkedin.com/v2/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("LinkedIn profile error:", response.status, error);
      return new Response(
        JSON.stringify({
          error: "Failed to get profile",
          details: `Status: ${response.status}, Error: ${error}`,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const profile = await response.json();
    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("LinkedIn profile API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
