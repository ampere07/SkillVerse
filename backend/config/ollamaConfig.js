const remote = process.env.USE_OLLAMA_REMOTE === "true";

const baseUrl = remote
  ? `http://${process.env.OLLAMA_TAILSCALE_IP || "localhost"}:11434`
  : process.env.OLLAMA_API_URL || "http://localhost:11434";

export const OLLAMA_CONFIG = {
  // Local Ollama model, e.g. "qwen2.5-coder:7b"
  model: process.env.OLLAMA_MODEL_NAME || "qwen2.5-coder:7b",
  baseUrl,
  remote,
  maxRetries: 3,
  timeout: 180000,
};

export default OLLAMA_CONFIG;
