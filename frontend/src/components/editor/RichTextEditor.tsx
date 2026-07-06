import { useEffect, useRef } from 'react';
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  RemoveFormatting,
  Underline,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const toolbarButtons = [
  { icon: Bold, command: 'bold', label: 'Bold' },
  { icon: Italic, command: 'italic', label: 'Italic' },
  { icon: Underline, command: 'underline', label: 'Underline' },
  { icon: Heading2, command: 'formatBlock', value: 'h2', label: 'Heading 2' },
  { icon: Heading3, command: 'formatBlock', value: 'h3', label: 'Heading 3' },
  { icon: Quote, command: 'formatBlock', value: 'blockquote', label: 'Quote' },
  { icon: List, command: 'insertUnorderedList', label: 'Bullet list' },
  { icon: ListOrdered, command: 'insertOrderedList', label: 'Ordered list' },
] as const;

export default function RichTextEditor({
  label,
  placeholder = 'Write here...',
  value,
  onChange,
  className,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const syncValue = () => {
    if (!editorRef.current) return;
    onChange(editorRef.current.innerHTML);
  };

  const runCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    syncValue();
  };

  const insertLink = () => {
    const url = window.prompt('URL du lien');
    if (!url) return;
    runCommand('createLink', url);
  };

  const clearFormatting = () => {
    runCommand('removeFormat');
    runCommand('formatBlock', 'p');
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label ? <p className="text-sm font-medium">{label}</p> : null}
      <div className="rounded-lg border bg-background">
        <div className="flex flex-wrap gap-2 border-b p-2">
          {toolbarButtons.map((button) => (
            <Button
              key={`${button.command}-${button.label}`}
              type="button"
              variant="ghost"
              size="icon"
              title={button.label}
              onClick={() => runCommand(button.command, button.value)}
            >
              <button.icon className="h-4 w-4" />
            </Button>
          ))}
          <Button type="button" variant="ghost" size="icon" title="Insert link" onClick={insertLink}>
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" title="Clear formatting" onClick={clearFormatting}>
            <RemoveFormatting className="h-4 w-4" />
          </Button>
        </div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncValue}
          onBlur={syncValue}
          data-placeholder={placeholder}
          className="prose min-h-[220px] max-w-none p-4 outline-none before:pointer-events-none before:text-muted-foreground empty:before:content-[attr(data-placeholder)]"
        />
      </div>
    </div>
  );
}
