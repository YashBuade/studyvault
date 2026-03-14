"use client";

import { useEffect, useRef } from "react";
import { Bold, Code, Heading1, Heading2, Italic, List, Quote } from "lucide-react";
import { Button } from "@/src/components/ui/button";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
  }, [value]);

  function exec(command: string, commandValue?: string) {
    document.execCommand(command, false, commandValue);
    if (ref.current) {
      onChange(ref.current.innerHTML);
    }
  }

  function handleInput() {
    if (ref.current) {
      onChange(ref.current.innerHTML);
    }
  }

  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[var(--panel)] shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:shadow-none dark:ring-1 dark:ring-slate-700">
      <div className="flex flex-wrap gap-2 border-b border-[rgb(var(--border))] p-2 dark:border-slate-700">
        <Button type="button" variant="secondary" onClick={() => exec("formatBlock", "h1")}>
          <Heading1 size={14} /> H1
        </Button>
        <Button type="button" variant="secondary" onClick={() => exec("formatBlock", "h2")}>
          <Heading2 size={14} /> H2
        </Button>
        <Button type="button" variant="secondary" onClick={() => exec("bold")}>
          <Bold size={14} /> Bold
        </Button>
        <Button type="button" variant="secondary" onClick={() => exec("italic")}>
          <Italic size={14} /> Italic
        </Button>
        <Button type="button" variant="secondary" onClick={() => exec("insertUnorderedList")}>
          <List size={14} /> List
        </Button>
        <Button type="button" variant="secondary" onClick={() => exec("formatBlock", "blockquote")}>
          <Quote size={14} /> Quote
        </Button>
        <Button type="button" variant="secondary" onClick={() => exec("formatBlock", "pre")}>
          <Code size={14} /> Code
        </Button>
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder}
        className="min-h-[180px] px-4 py-3 text-sm text-[var(--text)] outline-none dark:text-slate-100 [&:empty:before]:text-[var(--muted)] dark:[&:empty:before]:text-slate-500 [&:empty:before]:content-[attr(data-placeholder)]"
      />
    </div>
  );
}
