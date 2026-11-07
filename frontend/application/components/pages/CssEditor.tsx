"use client";

import React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { css } from "@codemirror/lang-css";

interface CssEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  placeholder?: string;
}

export default function CssEditor({
  value,
  onChange,
  height = "240px",
  placeholder = "/* Enter custom CSS targeting elements... */",
}: CssEditorProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/80 bg-zinc-900 text-sm shadow-inner backdrop-blur-xl transition focus-within:border-zinc-400">
      <CodeMirror
        value={value}
        height={height}
        theme="dark"
        extensions={[css()]}
        onChange={onChange}
        placeholder={placeholder}
        basicSetup={{
          lineNumbers: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          foldGutter: true,
          highlightActiveLine: true,
        }}
      />
    </div>
  );
}