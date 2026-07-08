"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HubItemDialog } from "@/components/hub/hub-item-dialog";
import type { Database } from "@/lib/db/database.types";

type HubItem = Database["public"]["Tables"]["app_hub_items"]["Row"];

export function HubGrid({ items: initialItems, isAdmin }: { items: HubItem[]; isAdmin: boolean }) {
  const [items, setItems] = useState(initialItems);

  function upsert(item: HubItem) {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      return exists ? prev.map((i) => (i.id === item.id ? item : i)) : [...prev, item];
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("ลบ app นี้?")) return;
    const res = await fetch(`/api/hub/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("ลบไม่สำเร็จ");
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("ลบแล้ว");
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <HubItemDialog onSaved={upsert} renderTrigger={<Button />}>
          <Plus className="mr-2 size-4" />
          เพิ่ม App
        </HubItemDialog>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className={!item.is_active ? "opacity-50" : undefined}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                {item.name}
                {!item.is_active && <Badge variant="outline">ปิดใช้งาน</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
              <a
                href={item.redirect_url}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ size: "sm", className: "w-full" })}
              >
                เปิด
                <ExternalLink className="ml-2 size-3" />
              </a>
              {isAdmin && (
                <div className="flex gap-2">
                  <HubItemDialog
                    item={item}
                    onSaved={upsert}
                    renderTrigger={<Button variant="outline" size="sm" className="flex-1" />}
                  >
                    <Pencil className="mr-2 size-3" />
                    แก้ไข
                  </HubItemDialog>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
