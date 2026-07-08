import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export function ScoreCard({
  totalScore,
  grade,
}: {
  totalScore: number | null;
  grade: string | null;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">My Score</CardTitle>
        {grade && <Badge>{grade}</Badge>}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{totalScore ?? "-"}/100</div>
        <Progress value={totalScore ?? 0} className="mt-3" />
      </CardContent>
    </Card>
  );
}
