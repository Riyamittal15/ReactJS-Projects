const OLLAMA_URL = "http://localhost:11434/api/generate";
export const OLLAMA_MODEL = "llama3"; // change to mistral or gemma if needed

interface StreamOptions {
  json?: boolean;
  signal?: AbortSignal;
  onToken?: (token: string, fullText: string) => void;
}

/** Streams a completion from local Ollama (NDJSON) and resolves with the full text. */
export async function streamOllama(prompt: string, { json, signal, onToken }: StreamOptions = {}): Promise<string> {
  let res: Response;
  try {
    res = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: true, ...(json ? { format: "json" } : {}) }),
      signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new Error("Could not connect to local AI. Is Ollama running?");
  }
  if (!res.ok || !res.body) throw new Error(`Ollama error: ${res.statusText || res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  const handleLine = (line: string) => {
    if (!line.trim()) return;
    const chunk = JSON.parse(line);
    if (chunk.error) throw new Error(chunk.error);
    if (chunk.response) {
      full += chunk.response;
      onToken?.(chunk.response, full);
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    lines.forEach(handleLine);
  }
  handleLine(buffer);
  return full;
}

/** Asks Ollama for JSON output and parses it. */
export async function generateJSON<T = unknown>(prompt: string, signal?: AbortSignal): Promise<T> {
  const text = await streamOllama(prompt, { json: true, signal });
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("AI returned invalid JSON. Try again.");
  }
}
