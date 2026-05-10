const API_URL = import.meta.env.VITE_API_URL ?? "";

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = (await res.json()) as { success: boolean; data?: T; error?: string; message?: string };
  if (!res.ok) throw new Error(json.message ?? json.error ?? "Erreur serveur");
  return json.data as T;
}

export const api = {
  get: <T>(path: string, token?: string) => request<T>("GET", path, undefined, token),
  post: <T>(path: string, body: unknown, token?: string) => request<T>("POST", path, body, token),
  delete: <T>(path: string, token?: string) => request<T>("DELETE", path, undefined, token),
};
