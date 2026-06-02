const BASE = "https://api.deepseek.com/v1/chat/completions";

function getApiKey(): string {
  return process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY || "";
}

export async function queryDeepSeek(
  systemPrompt: string,
  userPrompt: string,
  options?: { maxTokens?: number; model?: string },
): Promise<string> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getApiKey()}` },
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
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getApiKey()}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      max_tokens: options?.maxTokens ?? 1500,
      stream: false,
      messages: [{
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } },
          { type: "text", text: systemPrompt },
        ],
      }],
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek vision error: ${res.status}`);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}
