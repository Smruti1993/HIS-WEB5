/**
 * ChatMessage.tsx
 *
 * Renders individual user and assistant message bubbles.
 * Includes a zero-dependency markdown parser for:
 *   - Tables (| Col | Col |)
 *   - Lists (- item, * item, 1. item)
 *   - Bold (**text**)
 *   - Inline code (`code`)
 *   - Headings (### heading)
 */
import React from 'react';
import { Bot, User, Sparkles } from 'lucide-react';
import { ChatMessageItem } from './useChatApi';
import { ConfirmationCard } from './ConfirmationCard';

interface ChatMessageProps {
  message: ChatMessageItem;
  onConfirmAction?: (actionId: string) => Promise<{ success: boolean; message: string }>;
}

// ─── Inline Text Formatter (Bold, Code, Italics) ──────────────────────────────

function renderInlineText(text: string): React.ReactNode {
  // Split on inline code (`...`) first
  const codeParts = text.split(/(`[^`]+`)/g);

  return codeParts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={i}
          className="bg-slate-200/70 text-slate-800 px-1.5 py-0.5 rounded text-[11px] font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Split on bold (**...**)
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bPart, j) => {
      if (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length > 4) {
        return <strong key={`${i}-${j}`} className="font-semibold">{bPart.slice(2, -2)}</strong>;
      }
      return bPart;
    });
  });
}

// ─── Markdown Block Parser ───────────────────────────────────────────────────

function parseMarkdownBlocks(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    // Check for Table: Starts with | and has at least two columns
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith('|')) {
        tableLines.push(lines[index].trim());
        index++;
      }

      if (tableLines.length >= 2) {
        const headerRow = tableLines[0]
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());

        // Line 1 is usually the separator line (|---|---|)
        const bodyRows = tableLines.slice(2).map((r) =>
          r
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim())
        );

        nodes.push(
          <div key={`table-${index}`} className="my-2.5 overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-semibold">
                <tr>
                  {headerRow.map((h, hi) => (
                    <th key={hi} className="px-2.5 py-1.5 whitespace-nowrap">
                      {renderInlineText(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {bodyRows.map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-2.5 py-1.5 text-slate-700 whitespace-nowrap">
                        {renderInlineText(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // Check for bullet lists (- or * )
    if (/^\s*[-*]\s+/.test(line)) {
      const listItems: string[] = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        listItems.push(lines[index].replace(/^\s*[-*]\s+/, ''));
        index++;
      }

      nodes.push(
        <ul key={`ul-${index}`} className="my-1.5 ml-4 list-disc space-y-1 text-xs text-slate-700">
          {listItems.map((item, li) => (
            <li key={li}>{renderInlineText(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Check for numbered lists (1. , 2. )
    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems: string[] = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        listItems.push(lines[index].replace(/^\s*\d+\.\s+/, ''));
        index++;
      }

      nodes.push(
        <ol key={`ol-${index}`} className="my-1.5 ml-4 list-decimal space-y-1 text-xs text-slate-700">
          {listItems.map((item, li) => (
            <li key={li}>{renderInlineText(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Headings (###)
    if (line.startsWith('### ')) {
      nodes.push(
        <h4 key={`h3-${index}`} className="font-bold text-slate-800 text-xs mt-2 mb-1">
          {renderInlineText(line.slice(4))}
        </h4>
      );
      index++;
      continue;
    }

    // Normal paragraph line
    if (line.trim().length > 0) {
      nodes.push(
        <p key={`p-${index}`} className="my-1 text-xs text-slate-800 leading-relaxed">
          {renderInlineText(line)}
        </p>
      );
    }

    index++;
  }

  return nodes;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onConfirmAction }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2.5 my-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      )}

      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm ${
          isUser
            ? 'bg-blue-600 text-white rounded-tr-none'
            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <div className="markdown-content">
            {parseMarkdownBlocks(message.content)}

            {message.pendingAction && onConfirmAction && (
              <ConfirmationCard
                action={message.pendingAction}
                onConfirm={onConfirmAction}
              />
            )}
          </div>
        )}

        <div className={`text-[10px] mt-1 ${isUser ? 'text-blue-200 text-right' : 'text-slate-400'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
          <User className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  );
};

