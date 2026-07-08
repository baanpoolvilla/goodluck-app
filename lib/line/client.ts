const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

/**
 * Sends a LINE push message. Silently no-ops (logs + returns false) when
 * the user has no line_user_id, matching the "fallback when no
 * line_user_id" requirement in spec section 16.2.F — callers should not
 * have to special-case missing LINE linkage.
 */
export async function sendLineMessage(lineUserId: string | null, text: string): Promise<boolean> {
  if (!lineUserId) {
    console.warn("[line] skip push — user has no line_user_id");
    return false;
  }

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    console.warn("[line] skip push — LINE_CHANNEL_ACCESS_TOKEN is not set");
    return false;
  }

  const res = await fetch(LINE_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: "text", text }],
    }),
  });

  if (!res.ok) {
    console.error("[line] push failed", res.status, await res.text());
    return false;
  }

  return true;
}
