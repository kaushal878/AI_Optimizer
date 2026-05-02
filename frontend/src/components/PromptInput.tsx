import Editor, { type OnMount } from '@monaco-editor/react'
import { ClipboardPaste, Eraser, Upload, FileText } from 'lucide-react'
import { useRef, useState } from 'react'
import { cn } from '../lib/cn'

interface PromptInputProps {
  value: string
  onChange: (next: string) => void
  theme: 'dark' | 'light'
}

export function PromptInput({ value, onChange, theme }: PromptInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [language, setLanguage] = useState<'markdown' | 'plaintext'>('markdown')

  const handleMount: OnMount = (editor, monaco) => {
    monaco.editor.defineTheme('po-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0b1020',
        'editorGutter.background': '#0b1020',
      },
    })
    monaco.editor.setTheme(theme === 'dark' ? 'po-dark' : 'vs')
    editor.focus()
  }

  const handleFile = async (file: File) => {
    if (!file) return
    if (file.size > 1024 * 1024) {
      alert('Files larger than 1 MB are not supported.')
      return
    }
    if (file.name.endsWith('.pdf')) {
      alert(
        'PDF parsing is intentionally lightweight in this build — paste the text or use a .txt/.md file.'
      )
      return
    }
    const text = await file.text()
    onChange(text)
  }

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) onChange(text)
    } catch {
      alert('Clipboard access denied. Use Ctrl+V instead.')
    }
  }

  return (
    <section className="surface flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-brand-500" />
          <h2 className="text-sm font-semibold">Original prompt</h2>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'markdown' | 'plaintext')}
            className="text-xs bg-transparent rounded px-1.5 py-0.5 ring-1 ring-slate-200 dark:ring-slate-700"
          >
            <option value="markdown">Markdown</option>
            <option value="plaintext">Plain text</option>
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button className="btn-ghost py-1 px-2 text-xs" onClick={paste} title="Paste">
            <ClipboardPaste className="size-3.5" />
            <span className="hidden sm:inline">Paste</span>
          </button>
          <button
            className="btn-ghost py-1 px-2 text-xs"
            onClick={() => fileInputRef.current?.click()}
            title="Upload .txt or .md"
          >
            <Upload className="size-3.5" />
            <span className="hidden sm:inline">Upload</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.markdown,.text"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
              e.target.value = ''
            }}
          />
          <button
            className={cn('btn-ghost py-1 px-2 text-xs', !value && 'opacity-40')}
            disabled={!value}
            onClick={() => onChange('')}
            title="Clear"
          >
            <Eraser className="size-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-[280px] rounded-b-2xl overflow-hidden">
        <Editor
          height="100%"
          language={language}
          value={value}
          onChange={(v) => onChange(v ?? '')}
          theme={theme === 'dark' ? 'po-dark' : 'vs'}
          onMount={handleMount}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: 'none',
            lineNumbers: 'off',
            folding: false,
            tabSize: 2,
          }}
        />
      </div>
    </section>
  )
}
