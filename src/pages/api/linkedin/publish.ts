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

    // Try the shares endpoint first (doesn't require member URN)
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

    // If shares fails, try UGC posts with different author formats
    const ugcAttempts = [
      "urn:li:person:~", // Try the tilde approach
      "urn:li:member:~", // Try member with tilde
    ];

    for (const authorUrn of ugcAttempts) {
      const ugcResponse = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify({
          author: authorUrn,
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

      // Log the error but continue to next attempt
      const ugcError = await ugcResponse.text();
      console.log(
        `UGC attempt with ${authorUrn} failed:`,
        ugcResponse.status,
        ugcError
      );
    }

    // If all UGC attempts fail, try a simpler text-only post using shares
    const simpleShareResponse = await fetch(
      "https://api.linkedin.com/v2/shares",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: {
            contentEntities: [],
          },
          distribution: {
            linkedInDistributionTarget: {},
          },
          text: {
            text: text,
          },
        }),
      }
    );

    if (simpleShareResponse.ok) {
      const result = await simpleShareResponse.json();
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // If everything fails, return the error from the first shares attempt
    const shareError = await shareResponse.text();
    console.error(
      "All LinkedIn post attempts failed. Last error:",
      simpleShareResponse.status,
      await simpleShareResponse.text()
    );

    return new Response(
      JSON.stringify({
        error: "Failed to publish post",
        details: `Status: ${shareResponse.status}, Error: ${shareError}`,
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
