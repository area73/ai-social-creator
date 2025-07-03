const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_API_URL = "https://api.linkedin.com";
const LINKEDIN_POST_URL = "https://api.linkedin.com/v2/ugcPosts";
export const LINKEDIN_PROFILE_URL = "https://api.linkedin.com/v2/me";

export interface LinkedInAuthParams {
  clientId: string;
  redirectUri: string;
  state: string;
  scope?: string;
}

export const getLinkedInAuthUrl = ({
  clientId,
  redirectUri,
  state,
  scope = "w_member_social",
}: LinkedInAuthParams): string => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope,
  });
  return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
};

export interface LinkedInTokenParams {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
}

export interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
}

export const exchangeCodeForToken = async ({
  clientId,
  clientSecret,
  redirectUri,
  code,
}: LinkedInTokenParams): Promise<LinkedInTokenResponse> => {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });
  const response = await fetch(LINKEDIN_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!response.ok) {
    throw new Error(`LinkedIn token error: ${response.statusText}`);
  }
  return response.json();
};

export interface LinkedInProfile {
  id: string;
  firstName: {
    localized: Record<string, string>;
  };
  lastName: {
    localized: Record<string, string>;
  };
}

export const getLinkedInProfile = async (
  accessToken: string
): Promise<LinkedInProfile> => {
  const response = await fetch(LINKEDIN_PROFILE_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`LinkedIn profile error: ${response.statusText}`);
  }
  return response.json();
};

export interface LinkedInPostParams {
  accessToken: string;
  authorUrn: string; // e.g. "urn:li:person:xxxx"
  text: string;
}

export const postToLinkedIn = async ({
  accessToken,
  authorUrn,
  text,
}: {
  accessToken: string;
  authorUrn: string;
  text: string;
}): Promise<Response> => {
  // If using generic URN, get the actual user URN
  let actualAuthorUrn = authorUrn;
  if (authorUrn === "urn:li:person:CURRENT_USER") {
    try {
      const profileResponse = await fetch(`${LINKEDIN_API_URL}/v2/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        actualAuthorUrn = `urn:li:person:${profile.id}`;
      } else {
        // If we can't get the profile, try with a different approach
        // Use the simplified sharing endpoint
        return fetch(`${LINKEDIN_API_URL}/v2/shares`, {
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
      }
    } catch (error) {
      console.error("Error getting profile for URN:", error);
      // Fall back to simplified sharing
      return fetch(`${LINKEDIN_API_URL}/v2/shares`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: {
            contentEntities: [],
            title: text.substring(0, 100),
          },
          distribution: {
            linkedInDistributionTarget: {},
          },
          text: {
            text: text,
          },
        }),
      });
    }
  }

  return fetch(`${LINKEDIN_API_URL}/v2/ugcPosts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      author: actualAuthorUrn,
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
};
