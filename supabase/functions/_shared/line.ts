const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

export async function pushLineMessage(lineUserId: string | null | undefined, text: string) {
  if (!lineUserId) {
    console.warn("[line] skip push — no line_user_id");
    return false;
  }

  const token = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");
  if (!token) {
    console.warn("[line] skip push — LINE_CHANNEL_ACCESS_TOKEN not set");
    return false;
  }

  const res = await fetch(LINE_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ to: lineUserId, messages: [{ type: "text", text }] }),
  });

  if (!res.ok) {
    console.error("[line] push failed", res.status, await res.text());
    return false;
  }
  return true;
}

export function taskReminderTemplate(title: string, deadline: string, assignedBy: string, taskUrl: string) {
  return `🔔 งาน "${title}" ถึง deadline พรุ่งนี้\n📅 กำหนดส่ง: ${deadline}\n👤 มอบหมายโดย: ${assignedBy}\n🔗 ดูรายละเอียด: ${taskUrl}`;
}

export function taskOverdueTemplate(title: string, daysLate: number, penalty: number, taskUrl: string) {
  return `⚠️ งาน "${title}" เลย deadline แล้ว!\n📅 เลย deadline: ${daysLate} วัน\n📉 ถูกหักคะแนน: -${penalty} คะแนน\n🔗 อัปเดตงาน: ${taskUrl}`;
}

export function dailyReportReminderTemplate(reportUrl: string) {
  return `📝 วันนี้ยังไม่ได้ลง Daily Report นะ\n⏰ ลงก่อน 20:30 ยังทัน!\n🔗 ลง Report: ${reportUrl}`;
}

export function monthlyGradeSummaryTemplate(
  month: string,
  taskScore: number,
  reportScore: number,
  totalScore: number,
  grade: string,
  gradeUrl: string
) {
  return `📊 สรุปคะแนนเดือน ${month}\n━━━━━━━━━━━━━━\n📋 Task: ${taskScore}/100\n📝 Report: ${reportScore}/100\n━━━━━━━━━━━━━━\n🏆 คะแนนรวม: ${totalScore}\n🎓 เกรด: ${grade}\n🔗 ดูรายละเอียด: ${gradeUrl}`;
}
