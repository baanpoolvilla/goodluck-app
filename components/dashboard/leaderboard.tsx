import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Entry {
  userId: string;
  fullName: string;
  totalScore: number;
  grade: string;
}

export function Leaderboard({ entries }: { entries: Entry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Leaderboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูล</p>}
        {entries.map((entry, i) => (
          <div key={entry.userId} className="flex items-center gap-3">
            <span className="w-5 text-sm font-medium text-muted-foreground">{i + 1}</span>
            <Avatar className="size-7">
              <AvatarFallback>{entry.fullName[0]}</AvatarFallback>
            </Avatar>
            <span className="flex-1 truncate text-sm">{entry.fullName}</span>
            <span className="text-sm font-medium">{entry.totalScore}</span>
            <span className="text-xs text-muted-foreground">{entry.grade}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
