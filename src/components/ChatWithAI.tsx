import React, { useState } from "react";
import { sendMessageToOpenAI } from "../utils/openaiClient";
import { OPENAI_API_URL, OPENAI_MODELS } from "../utils/resources";
import type { OpenAIMessage, OpenAIResponse } from "../utils/openaiClient";
import type { OpenAIModel } from "../utils/resources";

const getOpenAIApiKey = (): string | null => {
  try {
    const config = localStorage.getItem("ai-social-creator-config");
    if (!config) return null;
    const parsed = JSON.parse(config);
    return parsed["OPENAI_API_KEY"] || null;
  } catch {
    return null;
  }
};

const DEFAULT_MODEL: OpenAIModel = "gpt-3.5-turbo";

const ChatWithAI: React.FC = () => {
  const [messages, setMessages] = useState<OpenAIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<OpenAIModel>(DEFAULT_MODEL);

  const apiKey = getOpenAIApiKey();

  const handleSend = async () => {
    if (!input.trim() || !apiKey) return;
    setLoading(true);
    setError(null);
    const userMessage: OpenAIMessage = { role: "user", content: input };
    const newMessages: OpenAIMessage[] = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    try {
      const response: OpenAIResponse = await sendMessageToOpenAI(
        newMessages,
        apiKey,
        OPENAI_API_URL,
        model
      );
      const aiMessage: OpenAIMessage = {
        role: "assistant",
        content: response.content,
      };
      setMessages([...newMessages, aiMessage]);
    } catch (err) {
      setError("Error al conectar con OpenAI");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto p-4 bg-white rounded shadow">
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Modelo:</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value as OpenAIModel)}
          className="border rounded px-2 py-1"
        >
          {OPENAI_MODELS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div className="h-64 overflow-y-auto border rounded p-2 mb-2 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-gray-400">Empieza la conversación...</div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={msg.role === "user" ? "text-right" : "text-left"}
          >
            <span
              className={
                msg.role === "user" ? "text-blue-600" : "text-fuchsia-600"
              }
            >
              <b>{msg.role === "user" ? "Tú" : "IA"}:</b> {msg.content}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 border rounded px-2 py-1"
          placeholder="Escribe tu pregunta..."
          disabled={loading}
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 text-white px-4 py-1 rounded disabled:opacity-50"
          disabled={loading || !input.trim() || !apiKey}
        >
          {loading ? "Enviando..." : "Enviar"}
        </button>
      </div>
      {!apiKey && (
        <div className="text-red-500 mt-2">
          No se encontró la API Key de OpenAI. Configúrala primero.
        </div>
      )}
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </div>
  );
};

export default ChatWithAI;
