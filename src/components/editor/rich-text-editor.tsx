"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { Button } from "@/components/ui/button";

export function RichTextEditor() {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link,
      Image,
      Placeholder.configure({
        placeholder: "Write with clarity, context, and verified sourcing...",
      }),
    ],
    content:
      "<p>Lead with a sharp nut graf, then build out the verified detail, citations, and regional impact.</p>",
    immediatelyRender: false,
  });

  return (
    <div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-4">
      <div className="mb-4 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => editor?.chain().focus().toggleBold().run()}>
          Bold
        </Button>
        <Button size="sm" variant="outline" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </Button>
        <Button size="sm" variant="outline" onClick={() => editor?.chain().focus().toggleBulletList().run()}>
          Bullets
        </Button>
      </div>
      <EditorContent editor={editor} className="prose max-w-none min-h-[320px]" />
    </div>
  );
}
