import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { accessToken, text } = await request.json();

    if (!accessToken || !text) {
      return new Response(
        JSON.stringify({ error: "Access token and text are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Try the modern sharing endpoint first
    const shareResponse = await fetch("https://api.linkedin.com/v2/shares", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: {
          contentEntities: [],
          title: text.substring(0, 100), // First 100 chars as title
        },
        distribution: {
          linkedInDistributionTarget: {},
        },
        text: {
          text: text,
        },
      }),
    });

    if (shareResponse.ok) {
      const result = await shareResponse.json();
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // If shares endpoint fails, try the UGC posts endpoint with a different approach
    const ugcResponse = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: "urn:li:person:~", // Use ~ to reference the current user
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: text,
            },
            shareMediaCategory: "NONE",
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      }),
    });

    if (ugcResponse.ok) {
      const result = await ugcResponse.json();
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // If both fail, return the error from the UGC endpoint
    const ugcError = await ugcResponse.text();
    console.error("LinkedIn UGC post error:", ugcResponse.status, ugcError);

    return new Response(
      JSON.stringify({
        error: "Failed to publish post",
        details: `Status: ${ugcResponse.status}, Error: ${ugcError}`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("LinkedIn publish API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
