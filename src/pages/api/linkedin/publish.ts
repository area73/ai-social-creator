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

    // First, get the user ID as shown in the article
    const userInfoResponse = await fetch(
      "https://api.linkedin.com/v2/userinfo",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      const error = await userInfoResponse.text();
      console.error("Failed to get user info:", userInfoResponse.status, error);
      return new Response(
        JSON.stringify({
          error: "Failed to get user profile",
          details: error,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const userInfo = await userInfoResponse.json();
    const userId = userInfo.sub; // The user ID is in the 'sub' field

    console.log("User info:", userInfo);

    // Now publish the post using the exact format from the article
    const ugcResponse = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        author: `urn:li:person:${userId}`, // Use the exact format from the article
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: text,
            },
            shareMediaCategory: "NONE", // For text-only posts
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      }),
    });

    if (ugcResponse.ok) {
      const result = await ugcResponse.json();
      return new Response(JSON.stringify({ success: true, data: result }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get detailed error for debugging
    const ugcError = await ugcResponse.text();
    console.error("UGC API error:", ugcResponse.status, ugcError);

    return new Response(
      JSON.stringify({
        error: "Failed to publish post",
        details: {
          status: ugcResponse.status,
          error: ugcError,
        },
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
