// Cloudflare Worker:只轉發到 DeepSeek,不保存、不記錄任何內容
const UPSTREAM = "https://api.deepseek.com/chat/completions";
const ALLOWED_FIELDS = ["model", "messages", "max_tokens", "temperature", "thinking"];

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean);
    const okOrigin = allowed.includes(origin);
    const cors = {
      "Access-Control-Allow-Origin": okOrigin ? origin : "null",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Api-Key",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    };
    const reply = (status, obj) => new Response(JSON.stringify(obj), {
      status, headers: { ...cors, "Content-Type": "application/json" },
    });

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return reply(405, { error: "method not allowed" });
    if (!okOrigin) return reply(403, { error: "origin not allowed" });

    const key = request.headers.get("X-Api-Key") || "";
    if (key.length < 10 || key.length > 200) return reply(401, { error: "missing api key" });

    if (env.RATE_LIMITER) {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const { success } = await env.RATE_LIMITER.limit({ key: ip });
      if (!success) return reply(429, { error: "too many requests" });
    }

    const len = Number(request.headers.get("Content-Length") || 0);
    if (len > 200000) return reply(413, { error: "payload too large" });

    let body;
    try { body = JSON.parse(await request.text()); } catch { return reply(400, { error: "bad json" }); }

    const clean = {};
    for (const k of ALLOWED_FIELDS) if (k in body) clean[k] = body[k];
    if (!Array.isArray(clean.messages) || clean.messages.length === 0 || clean.messages.length > 4)
      return reply(400, { error: "bad messages" });
    const total = clean.messages.reduce((a, m) => a + String(m.content || "").length, 0);
    if (total > 60000) return reply(413, { error: "prompt too long" });
    clean.max_tokens = Math.min(Number(clean.max_tokens) || 1000, 8000);
    clean.stream = false;

    const upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
      body: JSON.stringify(clean),
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  },
};
