import React, { useEffect, useState } from "react";
import {
  getLinkedInAuthUrl,
  exchangeCodeForToken,
} from "../utils/linkedinClient";

const CONFIG_KEY = "ai-social-creator-config";

function getConfig(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setConfigValue(key: string, value: string) {
  const config = getConfig();
  config[key] = value;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));

  // Dispatch custom event to notify other components
  window.dispatchEvent(
    new CustomEvent("localStorageUpdate", {
      detail: { key, value },
    })
  );
}

const LinkedInConnect: React.FC = () => {
  const [status, setStatus] = useState<
    "idle" | "connecting" | "connected" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [redirectUri, setRedirectUri] = useState<string>("");
  const config = getConfig();
  const clientId = config["LINKEDIN_CLIENT_ID"];
  const clientSecret = config["LINKEDIN_CLIENT_SECRET"];
  const token = config["LINKEDIN_TOKEN"];

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRedirectUri(`${window.location.origin}/linkedin`);
    }
  }, []);

  useEffect(() => {
    if (!redirectUri) return;
    // Detect code in URL after redirect
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    if (code && clientId && clientSecret && !token) {
      setStatus("connecting");

      // Use our API endpoint instead of direct LinkedIn call
      fetch("/api/linkedin/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          clientId,
          clientSecret,
          redirectUri,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            throw new Error(data.error);
          }
          setConfigValue("LINKEDIN_TOKEN", data.access_token);
          setStatus("connected");
          // Clean URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        })
        .catch((err) => {
          setError("Error obteniendo el token de LinkedIn");
          setStatus("error");
        });
    } else if (token) {
      setStatus("connected");
    }
  }, [clientId, clientSecret, token, redirectUri]);

  const handleConnect = () => {
    if (!clientId) {
      setError("Falta el Client ID de LinkedIn en la configuración");
      return;
    }
    const uri =
      typeof window !== "undefined" ? `${window.location.origin}/linkedin` : "";
    const authUrl = getLinkedInAuthUrl({
      clientId,
      redirectUri: uri,
      state: Math.random().toString(36).slice(2),
    });
    window.location.href = authUrl;
  };

  return (
    <div className="my-4">
      {status === "connected" ? (
        <div className="text-green-600 font-semibold">
          Conectado con LinkedIn
        </div>
      ) : (
        <button
          className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800"
          onClick={handleConnect}
        >
          Conectar con LinkedIn
        </button>
      )}
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </div>
  );
};

export default LinkedInConnect;
