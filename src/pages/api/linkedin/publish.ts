import type { APIRoute } from "astro";

// Pure helpers
const buildUgcPostBody = (userId: string, text: string) => ({
  author: `urn:li:person:${userId}`,
  lifecycleState: "PUBLISHED",
  specificContent: {
    "com.linkedin.ugc.ShareContent": {
      shareCommentary: { text },
      shareMediaCategory: "NONE",
    },
  },
  visibility: {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
  },
});

const getUserId = async (accessToken: string): Promise<string> => {
  const response = await fetch("https://api.linkedin.com/v2/userinfo", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const error = await response.text();
    throw { status: 400, message: `Failed to get user profile: ${error}` };
  }
  const userInfo = await response.json();
  return userInfo.sub;
};

const postUgc = async (accessToken: string, userId: string, text: string) => {
  const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildUgcPostBody(userId, text)),
  });
  return response;
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { accessToken, text } = await request.json();
    if (!accessToken || !text) {
      return new Response(
        JSON.stringify({ error: "Access token and text are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    try {
      const userId = await getUserId(accessToken);
      const ugcResponse = await postUgc(accessToken, userId, text);
      if (ugcResponse.ok) {
        const result = await ugcResponse.json();
        return new Response(JSON.stringify({ success: true, data: result }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      const ugcError = await ugcResponse.text();
      return new Response(
        JSON.stringify({
          error: "Failed to publish post",
          details: { status: ugcResponse.status, error: ugcError },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
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
