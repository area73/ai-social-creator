import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChatWithAI from "../ChatWithAI";

vi.mock("../../utils/openaiClient", async () => {
  const actual = await vi.importActual<any>("../../utils/openaiClient");
  return {
    ...actual,
    sendMessageToOpenAI: vi.fn().mockResolvedValue({ content: "AI response" }),
  };
});

const mockApiKey = "test-api-key";
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

const setApiKey = () => {
  window.localStorage.setItem(
    "ai-social-creator-config",
    JSON.stringify({ OPENAI_API_KEY: mockApiKey })
  );
};

describe("ChatWithAI", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders and shows no API key warning", () => {
    render(<ChatWithAI />);
    expect(screen.getByText(/No se encontró la API Key/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Escribe tu pregunta/i)).toBeEnabled();
    expect(screen.getByRole("button", { name: /Enviar/i })).toBeDisabled();
  });

  it("renders and allows sending a message", async () => {
    setApiKey();
    render(<ChatWithAI />);
    const input = screen.getByPlaceholderText(/Escribe tu pregunta/i);
    fireEvent.change(input, { target: { value: "Hello AI" } });
    expect(input).toHaveValue("Hello AI");
    const button = screen.getByRole("button", { name: /Enviar/i });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(button).toBeDisabled();
    await waitFor(() => {
      expect(screen.getByText(/Tú:/)).toBeInTheDocument();
      expect(screen.getByText(/IA:/)).toBeInTheDocument();
    });
  });

  it("shows error if OpenAI call fails", async () => {
    setApiKey();
    const { sendMessageToOpenAI } = await import("../../utils/openaiClient");
    (sendMessageToOpenAI as any).mockRejectedValueOnce(new Error("fail"));
    render(<ChatWithAI />);
    const input = screen.getByPlaceholderText(/Escribe tu pregunta/i);
    fireEvent.change(input, { target: { value: "fail" } });
    fireEvent.click(screen.getByRole("button", { name: /Enviar/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/Error al conectar con OpenAI/i)
      ).toBeInTheDocument();
    });
  });

  it("disables send button when input is empty", () => {
    setApiKey();
    render(<ChatWithAI />);
    const button = screen.getByRole("button", { name: /Enviar/i });
    expect(button).toBeDisabled();
  });

  it("allows model selection", () => {
    setApiKey();
    render(<ChatWithAI />);
    const select = screen.getByLabelText(/Modelo/i);
    fireEvent.change(select, { target: { value: "gpt-4" } });
    expect(select).toHaveValue("gpt-4");
  });

  it("shows initial message when no conversation", () => {
    setApiKey();
    render(<ChatWithAI />);
    expect(screen.getByText(/Empieza la conversación/i)).toBeInTheDocument();
  });

  it("handles JSON.parse error in localStorage gracefully", () => {
    // Simula un error de parseo
    window.localStorage.setItem("ai-social-creator-config", "invalid-json");
    render(<ChatWithAI />);
    expect(screen.getByText(/No se encontró la API Key/i)).toBeInTheDocument();
  });
});
