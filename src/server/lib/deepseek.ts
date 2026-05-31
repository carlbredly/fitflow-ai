import { ENV } from "../config/env.js";

const BASE = "https://api.deepseek.com/v1/chat/completions";

export async function queryDeepSeek(
  systemPrompt: string,
  userPrompt: string,
  options?: { maxTokens?: number; model?: string },
): Promise<string> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: options?.model ?? "deepseek-chat",
      max_tokens: options?.maxTokens ?? 1500,
      stream: false,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek error: ${res.status}`);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}

export async function queryDeepSeekVision(
  systemPrompt: string,
  base64Image: string,
  mimeType: string,
  options?: { maxTokens?: number },
): Promise<string> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      max_tokens: options?.maxTokens ?? 1500,
      stream: false,
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } },
            { type: "text", text: systemPrompt },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek vision error: ${res.status}`);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}

export async function streamDeepSeek(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat", max_tokens: 1000, stream: true,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    }),
  });
  if (!res.ok || !res.body) throw new Error(`DeepSeek stream error: ${res.status}`);
  return res.body;
}
