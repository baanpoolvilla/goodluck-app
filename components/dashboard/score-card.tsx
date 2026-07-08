import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function ScoreCard({
  totalScore,
  grade,
}: {
  totalScore: number | null;
  grade: string | null;
}) {
  return (
    <Card className="overflow-hidden border-0 py-0 shadow-sm">
      <div className="gradient-primary p-4 text-white">
        <CardHeader className="flex-row items-center justify-between space-y-0 p-0">
          <CardTitle className="text-sm font-medium text-white/85">My Score</CardTitle>
          {grade && (
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">{grade}</span>
          )}
        </CardHeader>
        <CardContent className="mt-2 p-0">
          <div className="text-3xl font-bold">{totalScore ?? "-"}/100</div>
          <Progress
            value={totalScore ?? 0}
            className="mt-3 [&_[data-slot=progress-indicator]]:bg-white [&_[data-slot=progress-track]]:bg-white/20"
          />
        </CardContent>
      </div>
    </Card>
  );
}
