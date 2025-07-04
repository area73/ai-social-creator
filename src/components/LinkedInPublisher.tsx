import React, { useState, useEffect } from "react";

const CONFIG_KEY = "ai-social-creator-config";

function getConfig(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

interface LinkedInPublisherProps {
  initialText?: string;
}

// Pure helpers
function getConfigToken(): string | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    const config = JSON.parse(raw);
    return config["LINKEDIN_TOKEN"] || null;
  } catch {
    return null;
  }
}

function buildPublishBody(token: string, text: string) {
  return {
    accessToken: token,
    text,
  };
}

const LinkedInPublisher: React.FC<LinkedInPublisherProps> = ({
  initialText = "",
}) => {
  const [text, setText] = useState(initialText);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const updateToken = () => setToken(getConfigToken());
    updateToken();
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CONFIG_KEY) updateToken();
    };
    const handleCustomStorageChange = () => updateToken();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("localStorageUpdate", handleCustomStorageChange);
    return () => {
      cleanupLinkedInPublisherListeners(
        handleStorageChange,
        handleCustomStorageChange
      );
    };
  }, []);

  // Side effect: publicar post
  const handlePublish = async () => {
    if (!text.trim()) {
      setError("El texto no puede estar vacío");
      return;
    }
    if (!token) {
      setError("No hay token de LinkedIn. Conecta tu cuenta primero.");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const response = await fetch("/api/linkedin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPublishBody(token, text)),
      });
      const result = await response.json();
      if (response.ok) {
        setStatus("success");
        setText("");
      } else {
        console.error("LinkedIn post error:", result);
        setStatus("error");
        setError(result.error || "Error publicando en LinkedIn");
      }
    } catch (err) {
      console.error("Post error:", err);
      setStatus("error");
      setError("Error publicando en LinkedIn");
    }
  };

  if (!token) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-800">
          Debes conectar tu cuenta de LinkedIn primero para poder publicar.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Publicar en LinkedIn</h2>

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-blue-800">Conectado con LinkedIn ✓</p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Contenido del post:
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-32 p-3 border border-gray-300 rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Escribe tu post aquí..."
        />
        <p className="text-sm text-gray-500 mt-1">{text.length} caracteres</p>
      </div>

      <button
        onClick={handlePublish}
        disabled={status === "loading" || !text.trim()}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "loading" ? "Publicando..." : "Publicar en LinkedIn"}
      </button>

      {status === "success" && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800">
            ¡Post publicado exitosamente en LinkedIn!
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
};

export function cleanupLinkedInPublisherListeners(
  handleStorageChange: (e: StorageEvent) => void,
  handleCustomStorageChange: () => void
) {
  window.removeEventListener("storage", handleStorageChange);
  window.removeEventListener("localStorageUpdate", handleCustomStorageChange);
}

export default LinkedInPublisher;
