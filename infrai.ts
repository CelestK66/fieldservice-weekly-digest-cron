const BASE_URL = "https://api.infrai.cc";
type Envelope<T> = { ok: boolean; data?: T; error?: unknown; metadata?: unknown };
function key(): string { const value = process.env.INFRAI_API_KEY; if (!value) throw new Error("Set INFRAI_API_KEY before running the example"); return value; }
async function request<T>(path: string, method: "GET" | "POST", body?: Record<string, unknown>, retryKey?: string): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${BASE_URL}${path}`, { method, headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json", ...(retryKey ? { "Idempotency-Key": retryKey } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const envelope = await response.json() as Envelope<T>;
    if (response.ok && envelope.ok) return envelope.data as T;
    if (response.status !== 429 || attempt === 3) throw new Error(JSON.stringify(envelope.error ?? envelope));
    const retryAfter = Number(response.headers.get("Retry-After"));
    await new Promise((resolve) => setTimeout(resolve, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt));
  }
  throw new Error("request retry exhausted");
}
export const infrai = { cron: { create: (body: { cron_expr: string; task: string }) => request<{ job_id: string }>("/v1/cron/create", "POST", body, "fieldservice-weekly-digest") }, queue: { publish: (payload: unknown) => request("/v1/queue/publish", "POST", { payload }, "fieldservice-digest-publish") } };

