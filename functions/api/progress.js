// Single-user progress store for the 5K tracker, backed by KV (env.PROGRESS).
const KEY = "ggb5k-progress";
const MAX_BYTES = 10_000; // saved state is well under 1 KB; reject anything absurd

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export async function onRequestGet({ env }) {
  const value = await env.PROGRESS.get(KEY);
  return json(value ? JSON.parse(value) : null);
}

export async function onRequestPost({ request, env }) {
  const text = await request.text();
  if (text.length > MAX_BYTES) return json({ error: "Payload too large" }, 413);

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  if (!data || typeof data !== "object" || !Array.isArray(data.checks)) {
    return json({ error: "Expected {checks, crossChecks, raceChecked}" }, 400);
  }

  await env.PROGRESS.put(KEY, JSON.stringify(data));
  return json({ ok: true });
}
