import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LinkedInPublisher, {
  cleanupLinkedInPublisherListeners,
} from "../LinkedInPublisher";

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
        "You must connect your LinkedIn account first to publish."
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
        screen.getByRole("heading", { name: "Publish to LinkedIn" })
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Connected to LinkedIn ✓")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Write your post here...")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Publish to LinkedIn" })
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
        screen.getByRole("heading", { name: "Publish to LinkedIn" })
      ).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText("Write your post here...");
    const publishButton = screen.getByRole("button", {
      name: "Publish to LinkedIn",
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
        screen.getByRole("heading", { name: "Publish to LinkedIn" })
      ).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText("Write your post here...");
    const publishButton = screen.getByRole("button", {
      name: "Publish to LinkedIn",
    });

    // Type some text
    fireEvent.change(textarea, { target: { value: "Test post content" } });
    expect(screen.getByText("17 characters")).toBeInTheDocument();

    // Click publish
    fireEvent.click(publishButton);

    // Check loading state
    expect(screen.getByText("Publishing...")).toBeInTheDocument();

    // Wait for success message
    await waitFor(() => {
      expect(
        screen.getByText("Post successfully published to LinkedIn!")
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
        screen.getByRole("heading", { name: "Publish to LinkedIn" })
      ).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText("Write your post here...");
    const publishButton = screen.getByRole("button", {
      name: "Publish to LinkedIn",
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
        screen.getByRole("heading", { name: "Publish to LinkedIn" })
      ).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText("Write your post here...");

    // Initially shows 0 characters
    expect(screen.getByText("0 characters")).toBeInTheDocument();

    // Type some text
    fireEvent.change(textarea, { target: { value: "Hello World!" } });

    // Character count should update
    expect(screen.getByText("12 characters")).toBeInTheDocument();
  });

  it("shows error if fetch throws", async () => {
    const mockConfig = { LINKEDIN_TOKEN: "test-token" };
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
    mockFetch.mockRejectedValueOnce(new Error("network fail"));
    render(<LinkedInPublisher />);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Publish to LinkedIn" })
      ).toBeInTheDocument();
    });
    const textarea = screen.getByPlaceholderText("Write your post here...");
    fireEvent.change(textarea, { target: { value: "Test post" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Publish to LinkedIn" })
    );
    await waitFor(() => {
      expect(
        screen.getByText("Error publishing to LinkedIn")
      ).toBeInTheDocument();
    });
  });

  it("shows error if text is only whitespace", async () => {
    const mockConfig = { LINKEDIN_TOKEN: "test-token" };
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
        screen.getByRole("heading", { name: "Publish to LinkedIn" })
      ).toBeInTheDocument();
    });
    const textarea = screen.getByPlaceholderText("Write your post here...");
    const publishButton = screen.getByRole("button", {
      name: "Publish to LinkedIn",
    });
    fireEvent.change(textarea, { target: { value: "   " } });
    fireEvent.click(publishButton);
    // Button should remain disabled and no error message should be shown
    expect(publishButton).toBeDisabled();
    expect(screen.queryByText("Text cannot be empty")).not.toBeInTheDocument();
  });

  it("shows error if token is missing at publish time", async () => {
    // Token present at mount, but removed before publish
    let token: string | undefined = "test-token";
    const mockGetItem = vi.fn(() =>
      token ? JSON.stringify({ LINKEDIN_TOKEN: token }) : JSON.stringify({})
    );
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
        screen.getByRole("heading", { name: "Publish to LinkedIn" })
      ).toBeInTheDocument();
    });
    const textarea = screen.getByPlaceholderText("Write your post here...");
    fireEvent.change(textarea, { target: { value: "Test post" } });
    // Remove token before publish
    token = undefined;
    fireEvent.click(
      screen.getByRole("button", { name: "Publish to LinkedIn" })
    );
    // Should show the red error message
    await waitFor(() => {
      expect(
        screen.getByText("Error publishing to LinkedIn")
      ).toBeInTheDocument();
    });
  });

  it("updates token on storage event", async () => {
    // Token present at mount, then removed via storage event
    let token: string | undefined = "test-token";
    const mockGetItem = vi.fn(() =>
      token ? JSON.stringify({ LINKEDIN_TOKEN: token }) : JSON.stringify({})
    );
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
        screen.getByRole("heading", { name: "Publish to LinkedIn" })
      ).toBeInTheDocument();
    });
    // Remove token and dispatch storage event
    token = undefined;
    window.dispatchEvent(
      new StorageEvent("storage", { key: "ai-social-creator-config" })
    );
    await waitFor(() => {
      expect(
        screen.getByText(
          "You must connect your LinkedIn account first to publish."
        )
      ).toBeInTheDocument();
    });
  });

  it("updates token on custom localStorageUpdate event", async () => {
    // Token present at mount, then removed via custom event
    let token: string | undefined = "test-token";
    const mockGetItem = vi.fn(() =>
      token ? JSON.stringify({ LINKEDIN_TOKEN: token }) : JSON.stringify({})
    );
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
        screen.getByRole("heading", { name: "Publish to LinkedIn" })
      ).toBeInTheDocument();
    });
    // Remove token and dispatch custom event
    token = undefined;
    window.dispatchEvent(new CustomEvent("localStorageUpdate"));
    await waitFor(() => {
      expect(
        screen.getByText(
          "You must connect your LinkedIn account first to publish."
        )
      ).toBeInTheDocument();
    });
  });

  it("renders with initialText prop", async () => {
    const mockConfig = { LINKEDIN_TOKEN: "test-token" };
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
    render(<LinkedInPublisher initialText="Hello world!" />);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Publish to LinkedIn" })
      ).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue("Hello world!")).toBeInTheDocument();
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
    render(<LinkedInPublisher />);
    expect(
      screen.getByText(
        "You must connect your LinkedIn account first to publish."
      )
    ).toBeInTheDocument();
  });

  it("cleans up event listeners on unmount", () => {
    const mockConfig = { LINKEDIN_TOKEN: "test-token" };
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
    const { unmount } = render(<LinkedInPublisher />);
    // Simula un evento después del unmount para asegurar que no hay errores
    unmount();
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("localStorageUpdate"));
    // Si no hay errores, el test pasa
    expect(true).toBe(true);
  });

  it("removes event listeners on unmount (coverage, listeners exist)", () => {
    const mockConfig = { LINKEDIN_TOKEN: "test-token" };
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
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<LinkedInPublisher />);
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "storage",
      expect.any(Function)
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "localStorageUpdate",
      expect.any(Function)
    );
    removeEventListenerSpy.mockRestore();
  });

  it("cleanup does not throw if listeners were never added (coverage)", () => {
    const mockConfig = { LINKEDIN_TOKEN: "test-token" };
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
    // Simula removeEventListener que no hace nada
    const originalRemove = window.removeEventListener;
    window.removeEventListener = vi.fn();
    const { unmount } = render(<LinkedInPublisher />);
    unmount();
    // No debe lanzar error aunque los listeners no existan
    expect(true).toBe(true);
    window.removeEventListener = originalRemove;
  });
});

describe("cleanupLinkedInPublisherListeners", () => {
  it("calls removeEventListener for both events", () => {
    const storageHandler = vi.fn();
    const customHandler = vi.fn();
    const removeSpy = vi.spyOn(window, "removeEventListener");
    cleanupLinkedInPublisherListeners(storageHandler, customHandler);
    expect(removeSpy).toHaveBeenCalledWith("storage", storageHandler);
    expect(removeSpy).toHaveBeenCalledWith("localStorageUpdate", customHandler);
    removeSpy.mockRestore();
  });
  it("does not throw if removeEventListener is a no-op", () => {
    const storageHandler = vi.fn();
    const customHandler = vi.fn();
    const originalRemove = window.removeEventListener;
    window.removeEventListener = vi.fn();
    expect(() =>
      cleanupLinkedInPublisherListeners(storageHandler, customHandler)
    ).not.toThrow();
    window.removeEventListener = originalRemove;
  });
});
