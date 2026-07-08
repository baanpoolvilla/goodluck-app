"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Bold, List, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none min-h-40 focus:outline-none",
        "data-placeholder": placeholder ?? "",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-xl border focus-within:ring-2 focus-within:ring-ring/50">
      <div className="flex gap-1 border-b bg-muted/40 p-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("size-8", editor.isActive("bold") && "bg-accent")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("size-8", editor.isActive("bulletList") && "bg-accent")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("size-8", editor.isActive("link") && "bg-accent")}
          onClick={() => {
            const url = window.prompt("URL");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
        >
          <LinkIcon className="size-4" />
        </Button>
      </div>
      <EditorContent editor={editor} className="p-3" />
    </div>
  );
}
