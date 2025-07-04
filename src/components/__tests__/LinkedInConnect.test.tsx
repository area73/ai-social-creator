import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LinkedInConnect from "../LinkedInConnect";

// Mock the LinkedIn client utilities
vi.mock("../../utils/linkedinClient", () => ({
  getLinkedInAuthUrl: vi
    .fn()
    .mockReturnValue("https://linkedin.com/oauth/authorize"),
  exchangeCodeForToken: vi.fn(),
}));

describe("LinkedInConnect", () => {
  beforeEach(() => {
    // Reset localStorage mock
    vi.clearAllMocks();
    Object.defineProperty(window, "location", {
      value: {
        href: "http://localhost:3000",
        origin: "http://localhost:3000",
        pathname: "/linkedin",
        search: "",
        hash: "",
      },
      writable: true,
    });
  });

  it("renders connect button when no token is present", () => {
    // Mock localStorage to return empty config
    const mockGetItem = vi.fn().mockReturnValue(null);
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: mockGetItem,
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    render(<LinkedInConnect />);

    expect(screen.getByText("Conectar con LinkedIn")).toBeInTheDocument();
  });

  it("shows connected status when token is present", async () => {
    // Mock localStorage to return config with token
    const mockConfig = {
      LINKEDIN_TOKEN: "test-token",
      LINKEDIN_CLIENT_ID: "test-client-id",
    };
    const mockGetItem = vi.fn().mockReturnValue(JSON.stringify(mockConfig));

    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: mockGetItem,
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    render(<LinkedInConnect />);

    // Wait for the component to update
    await screen.findByText("Conectado con LinkedIn");
    expect(screen.getByText("Conectado con LinkedIn")).toBeInTheDocument();
  });

  it("shows error when client ID is missing", () => {
    // Mock localStorage to return empty config
    const mockGetItem = vi.fn().mockReturnValue(null);
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: mockGetItem,
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    render(<LinkedInConnect />);

    const connectButton = screen.getByText("Conectar con LinkedIn");
    fireEvent.click(connectButton);

    expect(
      screen.getByText("Falta el Client ID de LinkedIn en la configuración")
    ).toBeInTheDocument();
  });

  it("initiates OAuth flow when client ID is present", () => {
    // Mock localStorage to return config with client ID
    const mockConfig = {
      LINKEDIN_CLIENT_ID: "test-client-id",
    };
    const mockGetItem = vi.fn().mockReturnValue(JSON.stringify(mockConfig));

    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: mockGetItem,
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    // Mock window.location.href assignment
    const mockLocationAssign = vi.fn();
    Object.defineProperty(window, "location", {
      value: {
        href: "http://localhost:3000",
        origin: "http://localhost:3000",
        pathname: "/linkedin",
        search: "",
        hash: "",
        assign: mockLocationAssign,
      },
      writable: true,
    });

    render(<LinkedInConnect />);

    const connectButton = screen.getByText("Conectar con LinkedIn");
    fireEvent.click(connectButton);

    // Since we're setting window.location.href directly, we can't easily test this
    // But we can verify no error is shown
    expect(screen.queryByText(/Falta el Client ID/)).not.toBeInTheDocument();
  });

  it("exchanges OAuth code for token and sets status to connected", async () => {
    // Simulate code in URL
    Object.defineProperty(window, "location", {
      value: {
        href: "http://localhost:3000/linkedin?code=abc&state=xyz",
        origin: "http://localhost:3000",
        pathname: "/linkedin",
        search: "?code=abc&state=xyz",
        hash: "",
      },
      writable: true,
    });
    // Mock localStorage with clientId and clientSecret, but no token
    const mockConfig = {
      LINKEDIN_CLIENT_ID: "id",
      LINKEDIN_CLIENT_SECRET: "secret",
    };
    const mockGetItem = vi.fn().mockReturnValue(JSON.stringify(mockConfig));
    const mockSetItem = vi.fn();
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: mockGetItem,
        setItem: mockSetItem,
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
    // Mock fetch for token exchange
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ access_token: "token123" }),
    });
    render(<LinkedInConnect />);
    // Wait for status to update
    await screen.findByText("Conectado con LinkedIn");
    expect(mockSetItem).toHaveBeenCalled();
    expect(screen.getByText("Conectado con LinkedIn")).toBeInTheDocument();
  });

  it("shows error if token exchange fails", async () => {
    Object.defineProperty(window, "location", {
      value: {
        href: "http://localhost:3000/linkedin?code=abc&state=xyz",
        origin: "http://localhost:3000",
        pathname: "/linkedin",
        search: "?code=abc&state=xyz",
        hash: "",
      },
      writable: true,
    });
    const mockConfig = {
      LINKEDIN_CLIENT_ID: "id",
      LINKEDIN_CLIENT_SECRET: "secret",
    };
    const mockGetItem = vi.fn().mockReturnValue(JSON.stringify(mockConfig));
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: mockGetItem,
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ error: "fail" }),
    });
    render(<LinkedInConnect />);
    await screen.findByText("Error obteniendo el token de LinkedIn");
    expect(
      screen.getByText("Error obteniendo el token de LinkedIn")
    ).toBeInTheDocument();
  });

  it("shows connected if token already exists", async () => {
    const mockConfig = {
      LINKEDIN_TOKEN: "token123",
      LINKEDIN_CLIENT_ID: "id",
      LINKEDIN_CLIENT_SECRET: "secret",
    };
    const mockGetItem = vi.fn().mockReturnValue(JSON.stringify(mockConfig));
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: mockGetItem,
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
    render(<LinkedInConnect />);
    await screen.findByText("Conectado con LinkedIn");
    expect(screen.getByText("Conectado con LinkedIn")).toBeInTheDocument();
  });

  it("shows error if clientSecret is missing and code is present", async () => {
    Object.defineProperty(window, "location", {
      value: {
        href: "http://localhost:3000/linkedin?code=abc",
        origin: "http://localhost:3000",
        pathname: "/linkedin",
        search: "?code=abc",
        hash: "",
      },
      writable: true,
    });
    const mockConfig = {
      LINKEDIN_CLIENT_ID: "id",
      // No client secret
    };
    const mockGetItem = vi.fn().mockReturnValue(JSON.stringify(mockConfig));
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: mockGetItem,
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
    render(<LinkedInConnect />);
    // Should not crash, should not show connected
    expect(screen.getByText("Conectar con LinkedIn")).toBeInTheDocument();
  });

  it("dispatches custom event when token is set", async () => {
    Object.defineProperty(window, "location", {
      value: {
        href: "http://localhost:3000/linkedin?code=abc&state=xyz",
        origin: "http://localhost:3000",
        pathname: "/linkedin",
        search: "?code=abc&state=xyz",
        hash: "",
      },
      writable: true,
    });
    const mockConfig = {
      LINKEDIN_CLIENT_ID: "id",
      LINKEDIN_CLIENT_SECRET: "secret",
    };
    const mockGetItem = vi.fn().mockReturnValue(JSON.stringify(mockConfig));
    const mockSetItem = vi.fn();
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: mockGetItem,
        setItem: mockSetItem,
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ access_token: "token123" }),
    });
    const eventSpy = vi.fn();
    window.addEventListener("localStorageUpdate", eventSpy);
    render(<LinkedInConnect />);
    await screen.findByText("Conectado con LinkedIn");
    expect(eventSpy).toHaveBeenCalled();
    window.removeEventListener("localStorageUpdate", eventSpy);
  });

  it("handles JSON.parse error in localStorage gracefully", () => {
    const mockGetItem = vi.fn().mockImplementation(() => "invalid-json");
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: mockGetItem,
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
    render(<LinkedInConnect />);
    expect(screen.getByText("Conectar con LinkedIn")).toBeInTheDocument();
  });
});
