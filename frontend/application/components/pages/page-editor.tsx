"use client";

import {
  useEditor,
  EditorContent,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";

type PageEditorProps = {
  initialContent: string;
  onChange: (content: string) => void;
};

export default function PageEditor({
  initialContent,
  onChange,
}: PageEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],

    content: initialContent,

    immediatelyRender: false,

    editorProps: {
      attributes: {
        class:
          "tiptap page-editor-content min-h-[320px] w-full cursor-text bg-white/30 p-5 outline-none",
      },
    },

    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-white/70 bg-white/40 text-sm text-zinc-500 backdrop-blur-xl">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/55 shadow-[0_12px_35px_rgba(31,38,135,0.06)] backdrop-blur-2xl">
      <div className="flex flex-wrap items-center gap-1 border-b border-white/70 bg-white/40 p-2">
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleBold().run()
          }
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
            editor.isActive("bold")
              ? "bg-zinc-900 text-white"
              : "text-zinc-700 hover:bg-white/70"
          }`}
        >
          B
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleItalic().run()
          }
          className={`rounded-lg px-3 py-1.5 text-sm italic transition ${
            editor.isActive("italic")
              ? "bg-zinc-900 text-white"
              : "text-zinc-700 hover:bg-white/70"
          }`}
        >
          I
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleStrike().run()
          }
          className={`rounded-lg px-3 py-1.5 text-sm line-through transition ${
            editor.isActive("strike")
              ? "bg-zinc-900 text-white"
              : "text-zinc-700 hover:bg-white/70"
          }`}
        >
          S
        </button>

        <div className="mx-1 h-6 w-px bg-zinc-300/70" />

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({ level: 1 })
              .run()
          }
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
            editor.isActive("heading", { level: 1 })
              ? "bg-zinc-900 text-white"
              : "text-zinc-700 hover:bg-white/70"
          }`}
        >
          H1
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({ level: 2 })
              .run()
          }
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
            editor.isActive("heading", { level: 2 })
              ? "bg-zinc-900 text-white"
              : "text-zinc-700 hover:bg-white/70"
          }`}
        >
          H2
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({ level: 3 })
              .run()
          }
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
            editor.isActive("heading", { level: 3 })
              ? "bg-zinc-900 text-white"
              : "text-zinc-700 hover:bg-white/70"
          }`}
        >
          H3
        </button>

        <div className="mx-1 h-6 w-px bg-zinc-300/70" />

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .setTextAlign("left")
              .run()
          }
          className={`rounded-lg px-2.5 py-1.5 text-sm transition ${
            editor.isActive({ textAlign: "left" })
              ? "bg-zinc-900 text-white"
              : "text-zinc-700 hover:bg-white/70"
          }`}
          title="Align left"
        >
          Left
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .setTextAlign("center")
              .run()
          }
          className={`rounded-lg px-2.5 py-1.5 text-sm transition ${
            editor.isActive({ textAlign: "center" })
              ? "bg-zinc-900 text-white"
              : "text-zinc-700 hover:bg-white/70"
          }`}
          title="Align center"
        >
          Center
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .setTextAlign("right")
              .run()
          }
          className={`rounded-lg px-2.5 py-1.5 text-sm transition ${
            editor.isActive({ textAlign: "right" })
              ? "bg-zinc-900 text-white"
              : "text-zinc-700 hover:bg-white/70"
          }`}
          title="Align right"
        >
          Right
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .setTextAlign("justify")
              .run()
          }
          className={`rounded-lg px-2.5 py-1.5 text-sm transition ${
            editor.isActive({ textAlign: "justify" })
              ? "bg-zinc-900 text-white"
              : "text-zinc-700 hover:bg-white/70"
          }`}
          title="Justify"
        >
          Justify
        </button>

        <div className="mx-1 h-6 w-px bg-zinc-300/70" />

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBulletList()
              .run()
          }
          className={`rounded-lg px-3 py-1.5 text-sm transition ${
            editor.isActive("bulletList")
              ? "bg-zinc-900 text-white"
              : "text-zinc-700 hover:bg-white/70"
          }`}
        >
          • List
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleOrderedList()
              .run()
          }
          className={`rounded-lg px-3 py-1.5 text-sm transition ${
            editor.isActive("orderedList")
              ? "bg-zinc-900 text-white"
              : "text-zinc-700 hover:bg-white/70"
          }`}
        >
          1. List
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBlockquote()
              .run()
          }
          className={`rounded-lg px-3 py-1.5 text-sm transition ${
            editor.isActive("blockquote")
              ? "bg-zinc-900 text-white"
              : "text-zinc-700 hover:bg-white/70"
          }`}
        >
          Quote
        </button>

        <div className="mx-1 h-6 w-px bg-zinc-300/70" />

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().undo().run()
          }
          disabled={!editor.can().undo()}
          className="rounded-lg px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Undo
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().redo().run()
          }
          disabled={!editor.can().redo()}
          className="rounded-lg px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Redo
        </button>
      </div>

      <div className="min-h-[320px] bg-white/30">
        <EditorContent
          editor={editor}
        />
      </div>
    </div>
  );
}