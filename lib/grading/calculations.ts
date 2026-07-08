/**
 * Pure TS mirror of the penalty/grade math in
 * supabase/migrations/0005_grading_functions.sql — used by the UI to
 * preview numbers and by unit tests to pin the formula down. The SQL
 * function is the source of truth for what actually gets persisted.
 */

export interface TaskPenaltyInput {
  daysLate: number;
  penaltyPerDayLate: number;
  gradeWeight: number;
  maxPenaltyPerItem: number;
}

export function calculateTaskPenalty({
  daysLate,
  penaltyPerDayLate,
  gradeWeight,
  maxPenaltyPerItem,
}: TaskPenaltyInput): number {
  return Math.min(daysLate * penaltyPerDayLate * gradeWeight, maxPenaltyPerItem);
}

export interface ReportPenaltyInput {
  missed: boolean;
  penaltyPerMissed: number;
}

export function calculateReportPenalty({ missed, penaltyPerMissed }: ReportPenaltyInput): number {
  return missed ? penaltyPerMissed : penaltyPerMissed * 0.5;
}

export type Grade = "A" | "B" | "C" | "D" | "F";

export function scoreToGrade(totalScore: number): Grade {
  if (totalScore >= 90) return "A";
  if (totalScore >= 80) return "B";
  if (totalScore >= 70) return "C";
  if (totalScore >= 60) return "D";
  return "F";
}

export interface TotalScoreInput {
  taskScore: number;
  reportScore: number;
  taskWeightPercent: number;
  reportWeightPercent: number;
}

export function calculateTotalScore({
  taskScore,
  reportScore,
  taskWeightPercent,
  reportWeightPercent,
}: TotalScoreInput): number {
  return (
    (taskScore * taskWeightPercent) / 100 + (reportScore * reportWeightPercent) / 100
  );
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}
