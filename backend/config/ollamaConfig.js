const getOllamaURL = () => {
  // Priority: Kaggle > Tailscale > Local
  const kaggleURL = process.env.KAGGLE_NGROK_URL;
  const localURL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
  const tailscaleIP = process.env.OLLAMA_TAILSCALE_IP;
  
  // Use Kaggle if configured
  if (kaggleURL) {
    console.log('[Ollama Config] Using Kaggle ngrok URL:', kaggleURL);
    return kaggleURL;
  }
  
  // Fall back to Tailscale if configured
  const useRemote = process.env.USE_OLLAMA_REMOTE === 'true';
  if (useRemote && tailscaleIP) {
    const remoteURL = `http://${tailscaleIP}:11434`;
    console.log('[Ollama Config] Using Tailscale remote URL:', remoteURL);
    return remoteURL;
  }
  
  // Default to local
  console.log('[Ollama Config] Using local URL:', localURL);
  return localURL;
};

export const OLLAMA_CONFIG = {
  url: getOllamaURL(),
  model: process.env.OLLAMA_MODEL_NAME || 'qwen2.5:7b',
  timeout: 180000, // 3 minutes for Kaggle
  maxRetries: 3
};

export default OLLAMA_CONFIG;
