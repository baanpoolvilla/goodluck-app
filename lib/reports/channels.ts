import { Cpu, Megaphone, Briefcase, SprayCan, type LucideIcon } from "lucide-react";
import { z } from "zod";
import type { ReportChannel } from "@/lib/db/database.types";

export interface ChannelMeta {
  value: ReportChannel;
  label: string;
  icon: LucideIcon;
}

export const REPORT_CHANNELS: ChannelMeta[] = [
  { value: "it", label: "IT", icon: Cpu },
  { value: "marketing", label: "Marketing", icon: Megaphone },
  { value: "admin", label: "Admin", icon: Briefcase },
  { value: "housekeeper", label: "Housekeeper", icon: SprayCan },
];

export const REPORT_CHANNEL_VALUES = REPORT_CHANNELS.map((c) => c.value) as [
  ReportChannel,
  ...ReportChannel[],
];

export const reportChannelSchema = z.enum(REPORT_CHANNEL_VALUES);

export function channelMeta(channel: ReportChannel): ChannelMeta {
  return REPORT_CHANNELS.find((c) => c.value === channel)!;
}

export function isReportChannel(value: string): value is ReportChannel {
  return (REPORT_CHANNEL_VALUES as readonly string[]).includes(value);
}
