import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendLineMessage } from "@/lib/line/client";

interface LineEvent {
  type: string;
  source: { userId?: string };
  message?: { type: string; text?: string };
}

function verifySignature(rawBody: string, signature: string | null) {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret || !signature) return false;
  const hash = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
  return hash === signature;
}

/**
 * Account linking flow: user opens a DM with the bot and sends their
 * company email. We match it against public.users.email and store the
 * LINE user id so cron pushes can reach them (spec section 9.1).
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const { events } = JSON.parse(rawBody) as { events: LineEvent[] };
  const admin = createAdminClient();

  for (const event of events) {
    const lineUserId = event.source.userId;
    if (!lineUserId) continue;

    if (event.type === "message" && event.message?.type === "text") {
      const email = event.message.text?.trim().toLowerCase();
      if (!email || !email.includes("@")) continue;

      const { data: user } = await admin.from("users").select("id").eq("email", email).maybeSingle();

      if (!user) {
        await sendLineMessage(lineUserId, `ไม่พบบัญชีอีเมล ${email} ในระบบ กรุณาตรวจสอบและลองใหม่`);
        continue;
      }

      await admin.from("users").update({ line_user_id: lineUserId }).eq("id", user.id);
      await sendLineMessage(lineUserId, "เชื่อมต่อบัญชี LINE สำเร็จ! คุณจะได้รับการแจ้งเตือนจากระบบ Company Ops");
    }
  }

  return NextResponse.json({ ok: true });
}
