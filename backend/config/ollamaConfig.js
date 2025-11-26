const getOllamaURL = () => {
  const localURL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
  const tailscaleIP = process.env.OLLAMA_TAILSCALE_IP;
  
  if (!tailscaleIP) {
    console.log('[Ollama Config] Using local URL:', localURL);
    return localURL;
  }
  
  const useRemote = process.env.USE_OLLAMA_REMOTE === 'true';
  
  if (useRemote && tailscaleIP) {
    const remoteURL = `http://${tailscaleIP}:11434`;
    console.log('[Ollama Config] Using Tailscale remote URL:', remoteURL);
    return remoteURL;
  }
  
  console.log('[Ollama Config] Using local URL:', localURL);
  return localURL;
};

export const OLLAMA_CONFIG = {
  url: getOllamaURL(),
  model: process.env.OLLAMA_MODEL_NAME || 'qwen2.5:3b'
};

export default OLLAMA_CONFIG;
