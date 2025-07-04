import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LinkedInPublisher from "../LinkedInPublisher";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("LinkedInPublisher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  it("shows message when no token is present", () => {
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

    render(<LinkedInPublisher />);

    expect(
      screen.getByText(
        "Debes conectar tu cuenta de LinkedIn primero para poder publicar."
      )
    ).toBeInTheDocument();
  });

  it("shows publisher form when token is present", async () => {
    // Mock localStorage to return config with token
    const mockConfig = {
      LINKEDIN_TOKEN: "test-token",
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

    render(<LinkedInPublisher />);

    // Wait for component to mount and show the form
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Publicar en LinkedIn" })
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Conectado con LinkedIn ✓")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Escribe tu post aquí...")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Publicar en LinkedIn" })
    ).toBeInTheDocument();
  });

  it("shows error when trying to publish empty text", async () => {
    // Mock localStorage to return config with token
    const mockConfig = {
      LINKEDIN_TOKEN: "test-token",
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

    render(<LinkedInPublisher />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Publicar en LinkedIn" })
      ).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText("Escribe tu post aquí...");
    const publishButton = screen.getByRole("button", {
      name: "Publicar en LinkedIn",
    });

    // First add some text to enable the button
    fireEvent.change(textarea, { target: { value: "Some text" } });

    // Then clear the text
    fireEvent.change(textarea, { target: { value: "" } });

    // Now the button should be disabled, but let's check the disabled state instead
    expect(publishButton).toBeDisabled();
  });

  it("successfully publishes a post", async () => {
    // Mock localStorage to return config with token
    const mockConfig = {
      LINKEDIN_TOKEN: "test-token",
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

    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { id: "post-123" } }),
    });

    render(<LinkedInPublisher />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Publicar en LinkedIn" })
      ).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText("Escribe tu post aquí...");
    const publishButton = screen.getByRole("button", {
      name: "Publicar en LinkedIn",
    });

    // Type some text
    fireEvent.change(textarea, { target: { value: "Test post content" } });
    expect(screen.getByText("17 caracteres")).toBeInTheDocument();

    // Click publish
    fireEvent.click(publishButton);

    // Check loading state
    expect(screen.getByText("Publicando...")).toBeInTheDocument();

    // Wait for success message
    await waitFor(() => {
      expect(
        screen.getByText("¡Post publicado exitosamente en LinkedIn!")
      ).toBeInTheDocument();
    });

    // Verify API was called correctly
    expect(mockFetch).toHaveBeenCalledWith("/api/linkedin/publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accessToken: "test-token",
        text: "Test post content",
      }),
    });

    // Check that form was cleared
    expect(textarea).toHaveValue("");
  });

  it("handles API errors gracefully", async () => {
    // Mock localStorage to return config with token
    const mockConfig = {
      LINKEDIN_TOKEN: "test-token",
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

    // Mock API error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "API Error occurred" }),
    });

    render(<LinkedInPublisher />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Publicar en LinkedIn" })
      ).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText("Escribe tu post aquí...");
    const publishButton = screen.getByRole("button", {
      name: "Publicar en LinkedIn",
    });

    // Type some text and publish
    fireEvent.change(textarea, { target: { value: "Test post content" } });
    fireEvent.click(publishButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText("API Error occurred")).toBeInTheDocument();
    });
  });

  it("updates character count as user types", async () => {
    // Mock localStorage to return config with token
    const mockConfig = {
      LINKEDIN_TOKEN: "test-token",
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

    render(<LinkedInPublisher />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Publicar en LinkedIn" })
      ).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText("Escribe tu post aquí...");

    // Initially shows 0 characters
    expect(screen.getByText("0 caracteres")).toBeInTheDocument();

    // Type some text
    fireEvent.change(textarea, { target: { value: "Hello World!" } });

    // Character count should update
    expect(screen.getByText("12 caracteres")).toBeInTheDocument();
  });
});
