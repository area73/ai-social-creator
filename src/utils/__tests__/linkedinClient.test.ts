import { describe, it, expect, vi } from "vitest";
import {
  getLinkedInAuthUrl,
  exchangeCodeForToken,
  getLinkedInProfile,
  postToLinkedIn,
} from "../linkedinClient";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("linkedinClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  describe("getLinkedInAuthUrl", () => {
    it("generates correct auth URL with default scope", () => {
      const params = {
        clientId: "test-client-id",
        redirectUri: "http://localhost:3000/linkedin",
        state: "test-state",
      };

      const authUrl = getLinkedInAuthUrl(params);

      expect(authUrl).toContain(
        "https://www.linkedin.com/oauth/v2/authorization"
      );
      expect(authUrl).toContain("client_id=test-client-id");
      expect(authUrl).toContain(
        "redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Flinkedin"
      );
      expect(authUrl).toContain("state=test-state");
      expect(authUrl).toContain("scope=w_member_social+openid+email");
      expect(authUrl).toContain("response_type=code");
    });

    it("generates correct auth URL with custom scope", () => {
      const params = {
        clientId: "test-client-id",
        redirectUri: "http://localhost:3000/linkedin",
        state: "test-state",
        scope: "custom-scope",
      };

      const authUrl = getLinkedInAuthUrl(params);

      expect(authUrl).toContain("scope=custom-scope");
    });
  });

  describe("exchangeCodeForToken", () => {
    it("successfully exchanges code for token", async () => {
      const mockResponse = {
        access_token: "test-access-token",
        expires_in: 3600,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const params = {
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
        redirectUri: "http://localhost:3000/linkedin",
        code: "test-code",
      };

      const result = await exchangeCodeForToken(params);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://www.linkedin.com/oauth/v2/accessToken",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: "grant_type=authorization_code&code=test-code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Flinkedin&client_id=test-client-id&client_secret=test-client-secret",
        }
      );
    });

    it("throws error when API request fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Unauthorized",
      });

      const params = {
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
        redirectUri: "http://localhost:3000/linkedin",
        code: "invalid-code",
      };

      await expect(exchangeCodeForToken(params)).rejects.toThrow(
        "LinkedIn token error: Unauthorized"
      );
    });
  });

  describe("getLinkedInProfile", () => {
    it("successfully fetches profile", async () => {
      const mockProfile = {
        id: "test-user-id",
        firstName: {
          localized: { en_US: "John" },
        },
        lastName: {
          localized: { en_US: "Doe" },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      });

      const result = await getLinkedInProfile("test-access-token");

      expect(result).toEqual(mockProfile);
      expect(mockFetch).toHaveBeenCalledWith("https://api.linkedin.com/v2/me", {
        headers: {
          Authorization: "Bearer test-access-token",
          "Content-Type": "application/json",
        },
      });
    });

    it("throws error when profile request fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Forbidden",
      });

      await expect(getLinkedInProfile("invalid-token")).rejects.toThrow(
        "LinkedIn profile error: Forbidden"
      );
    });
  });

  describe("postToLinkedIn", () => {
    it("successfully posts with specific author URN", async () => {
      const mockResponse = { id: "post-123" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const params = {
        accessToken: "test-access-token",
        authorUrn: "urn:li:person:12345",
        text: "Test post content",
      };

      const result = await postToLinkedIn(params);

      expect(result.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.linkedin.com/v2/ugcPosts",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer test-access-token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            author: "urn:li:person:12345",
            lifecycleState: "PUBLISHED",
            specificContent: {
              "com.linkedin.ugc.ShareContent": {
                shareCommentary: {
                  text: "Test post content",
                },
                shareMediaCategory: "NONE",
              },
            },
            visibility: {
              "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
            },
          }),
        }
      );
    });

    it("handles generic URN by fetching profile first", async () => {
      const mockProfile = { id: "user-123" };
      const mockPostResponse = { id: "post-456" };

      // Mock profile fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      });

      // Mock post creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPostResponse,
      });

      const params = {
        accessToken: "test-access-token",
        authorUrn: "urn:li:person:CURRENT_USER",
        text: "Test post content",
      };

      const result = await postToLinkedIn(params);

      expect(result.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // First call should be to get profile
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        "https://api.linkedin.com/v2/me",
        {
          headers: {
            Authorization: "Bearer test-access-token",
          },
        }
      );

      // Second call should be to create post with resolved URN
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        "https://api.linkedin.com/v2/ugcPosts",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer test-access-token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            author: "urn:li:person:user-123",
            lifecycleState: "PUBLISHED",
            specificContent: {
              "com.linkedin.ugc.ShareContent": {
                shareCommentary: {
                  text: "Test post content",
                },
                shareMediaCategory: "NONE",
              },
            },
            visibility: {
              "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
            },
          }),
        }
      );
    });

    it("falls back to shares API when profile fetch fails", async () => {
      const mockSharesResponse = { id: "share-789" };

      // Mock profile fetch failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Forbidden",
      });

      // Mock shares API success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSharesResponse,
      });

      const params = {
        accessToken: "test-access-token",
        authorUrn: "urn:li:person:CURRENT_USER",
        text: "Test post content",
      };

      const result = await postToLinkedIn(params);

      expect(result.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Second call should be to shares API
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        "https://api.linkedin.com/v2/shares",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer test-access-token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: {
              contentEntities: [],
              title: "Test post content",
            },
            distribution: {
              linkedInDistributionTarget: {},
            },
            text: {
              text: "Test post content",
            },
          }),
        }
      );
    });

    it("falls back to shares API if profile fetch throws", async () => {
      // Mock profile fetch throws
      mockFetch.mockRejectedValueOnce(new Error("network fail"));
      // Mock shares API success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "share-999" }),
      });
      const params = {
        accessToken: "test-access-token",
        authorUrn: "urn:li:person:CURRENT_USER",
        text: "Test post content",
      };
      const result = await postToLinkedIn(params);
      expect(result.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      // Second call should be to shares API
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        "https://api.linkedin.com/v2/shares",
        expect.objectContaining({ method: "POST" })
      );
    });
  });
});
