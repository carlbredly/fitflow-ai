import type { Response } from "express";

export function setupSSE(res: Response): Response {
  res.writeHead(200, {
    "Content-Type": "text/event-stream", "Cache-Control": "no-cache",
    Connection: "keep-alive", "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
  return res;
}

export async function pipeDeepSeekStream(
  stream: ReadableStream<Uint8Array>, res: Response,
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") { res.write("data: [DONE]\n\n"); continue; }
        try {
          const p = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
          const token = p.choices?.[0]?.delta?.content;
          if (token) res.write(`data: ${JSON.stringify({ token })}\n\n`);
        } catch { /* skip */ }
      }
    }
  } finally { res.end(); }
}
