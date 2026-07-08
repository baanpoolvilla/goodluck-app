// Generic push endpoint — internal callers (other Edge Functions, or the
// Next.js server) hit this instead of talking to the LINE API directly,
// so the channel token only ever lives in one place.
import { pushLineMessage } from "../_shared/line.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { lineUserId, message } = await req.json();

  if (!message) {
    return new Response(JSON.stringify({ error: "message is required" }), { status: 400 });
  }

  const ok = await pushLineMessage(lineUserId, message);
  return new Response(JSON.stringify({ sent: ok }), {
    status: ok ? 200 : 502,
    headers: { "Content-Type": "application/json" },
  });
});
