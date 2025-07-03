export const LINKEDIN_AUTH_URL =
  "https://www.linkedin.com/oauth/v2/authorization";
export const LINKEDIN_TOKEN_URL =
  "https://www.linkedin.com/oauth/v2/accessToken";
export const LINKEDIN_POST_URL = "https://api.linkedin.com/v2/ugcPosts";
export const LINKEDIN_PROFILE_URL = "https://api.linkedin.com/v2/people/~";

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
  scope = "openid profile r_events w_member_social email rw_events",
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
}: LinkedInPostParams): Promise<Response> => {
  const body = {
    author: authorUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: {
          text,
        },
        shareMediaCategory: "NONE",
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };
  return fetch(LINKEDIN_POST_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });
};
