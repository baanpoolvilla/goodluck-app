// Message templates — spec section 9.2.

export function taskReminderTemplate(args: {
  title: string;
  deadline: string;
  assignedBy: string;
  taskUrl: string;
}) {
  return `🔔 งาน "${args.title}" ถึง deadline พรุ่งนี้
📅 กำหนดส่ง: ${args.deadline}
👤 มอบหมายโดย: ${args.assignedBy}
🔗 ดูรายละเอียด: ${args.taskUrl}`;
}

export function taskOverdueTemplate(args: {
  title: string;
  daysLate: number;
  penalty: number;
  taskUrl: string;
}) {
  return `⚠️ งาน "${args.title}" เลย deadline แล้ว!
📅 เลย deadline: ${args.daysLate} วัน
📉 ถูกหักคะแนน: -${args.penalty} คะแนน
🔗 อัปเดตงาน: ${args.taskUrl}`;
}

export function dailyReportReminderTemplate(args: { reportUrl: string }) {
  return `📝 วันนี้ยังไม่ได้ลง Daily Report นะ
⏰ ลงก่อน 20:30 ยังทัน!
🔗 ลง Report: ${args.reportUrl}`;
}

export function monthlyGradeSummaryTemplate(args: {
  month: string;
  taskScore: number;
  reportScore: number;
  totalScore: number;
  grade: string;
  gradeUrl: string;
}) {
  return `📊 สรุปคะแนนเดือน ${args.month}
━━━━━━━━━━━━━━
📋 Task: ${args.taskScore}/100
📝 Report: ${args.reportScore}/100
━━━━━━━━━━━━━━
🏆 คะแนนรวม: ${args.totalScore}
🎓 เกรด: ${args.grade}
🔗 ดูรายละเอียด: ${args.gradeUrl}`;
}
