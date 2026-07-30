import React from 'react';

/**
 * Parses inline markdown formatting: **bold**, *italic*, `code`
 */
function parseInlineMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];

  const regex = /(\*\*(.*?)\*\*|__(.*?)__|`([^`]+)`|\*(.*?)\*|_(.*?)_)/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.substring(lastIndex, match.index));
    }

    const fullMatch = match[0];
    if (fullMatch.startsWith('**') || fullMatch.startsWith('__')) {
      const content = match[2] ?? match[3] ?? '';
      elements.push(
        <strong key={match.index} style={{ fontWeight: 700, color: 'inherit' }}>
          {parseInlineMarkdown(content)}
        </strong>,
      );
    } else if (fullMatch.startsWith('`')) {
      const content = match[4] ?? '';
      elements.push(
        <code
          key={match.index}
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.9em',
          }}
        >
          {content}
        </code>,
      );
    } else if (fullMatch.startsWith('*') || fullMatch.startsWith('_')) {
      const content = match[5] ?? match[6] ?? '';
      elements.push(
        <em key={match.index} style={{ fontStyle: 'italic' }}>
          {parseInlineMarkdown(content)}
        </em>,
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex));
  }

  return elements;
}

/**
 * Normalizes inline text by ensuring numbered items (1:, 1., 2:, 2., etc.)
 * and bullet points (- , • ) start on their own separate lines.
 */
function normalizeLineBreaks(text: string): string {
  if (!text) return '';

  let res = text;

  // 1. Insert newline before numbered items mid-text (e.g. "text 2. item" or "text 2: item")
  res = res.replace(
    /([^\n])\s+([0-9٠-٩]+[:\.\)])(?=\s+([^\d\n]|$))/g,
    '$1\n$2',
  );

  // 2. Insert newline before colons followed by inline dash bullet e.g. ": - " -> ":\n- "
  res = res.replace(/([^\n])\s*:\s+-\s+/g, ':\n- ');

  // 3. Insert newline before inline dash bullets mid-text
  res = res.replace(
    /([^\n])\s+-\s+(\*\*|[A-Za-z\u0600-\u06FF])/g,
    '$1\n- $2',
  );

  return res;
}

interface FormattedMessageProps {
  content: string;
  style?: React.CSSProperties;
  className?: string;
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ content, style, className }) => {
  if (!content) return null;

  const normalizedContent = normalizeLineBreaks(content);

  // Separate code blocks ``` ... ``` from plain text
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks: Array<{ type: 'text' | 'code'; content: string; lang?: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(normalizedContent)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: 'text', content: normalizedContent.substring(lastIndex, match.index) });
    }
    blocks.push({ type: 'code', lang: match[1] || '', content: match[2] });
    lastIndex = codeBlockRegex.lastIndex;
  }
  if (lastIndex < normalizedContent.length) {
    blocks.push({ type: 'text', content: normalizedContent.substring(lastIndex) });
  }

  return (
    <div
      dir="auto"
      className={className}
      style={{
        lineHeight: '1.6',
        wordBreak: 'break-word',
        textAlign: 'start',
        ...style,
      }}
    >
      {blocks.map((block, blockIdx) => {
        if (block.type === 'code') {
          return (
            <pre
              key={blockIdx}
              dir="ltr"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '12px',
                borderRadius: '8px',
                margin: '8px 0',
                overflowX: 'auto',
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#6ee7b7',
              }}
            >
              <code>{block.content}</code>
            </pre>
          );
        }

        const lines = block.content.split('\n');
        const renderedElements: React.ReactNode[] = [];
        let currentListItems: React.ReactNode[] = [];

        const flushList = (keyPrefix: string) => {
          if (currentListItems.length > 0) {
            renderedElements.push(
              <ul
                key={`ul-${keyPrefix}`}
                style={{
                  margin: '8px 0',
                  paddingLeft: 0,
                  paddingRight: 0,
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                {currentListItems}
              </ul>,
            );
            currentListItems = [];
          }
        };

        lines.forEach((line, lineIdx) => {
          const trimmed = line.trim();

          const bulletMatch = line.match(/^(\s*)([-*•])\s+(.*)/);
          const numberMatch = line.match(/^(\s*)([0-9٠-٩]+[:\.\)])\s*(.*)/);
          const headerMatch = line.match(/^(#{1,6})\s+(.*)/);

          if (bulletMatch) {
            const itemText = bulletMatch[3] || '';
            currentListItems.push(
              <li
                key={lineIdx}
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'baseline',
                  margin: '2px 0',
                }}
              >
                <span
                  style={{
                    color: 'var(--accent-primary, #818cf8)',
                    fontWeight: 'bold',
                    userSelect: 'none',
                    fontSize: '1.1em',
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  •
                </span>
                <span style={{ flex: 1 }}>{parseInlineMarkdown(itemText)}</span>
              </li>,
            );
          } else if (numberMatch) {
            const num = numberMatch[2];
            const itemText = numberMatch[3] || '';
            currentListItems.push(
              <li
                key={lineIdx}
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'baseline',
                  margin: '4px 0',
                }}
              >
                <span
                  style={{
                    color: 'var(--accent-cyan, #38bdf8)',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    fontSize: '0.95em',
                    flexShrink: 0,
                  }}
                >
                  {num}
                </span>
                <span style={{ flex: 1 }}>{parseInlineMarkdown(itemText)}</span>
              </li>,
            );
          } else {
            flushList(`${lineIdx}`);

            if (headerMatch) {
              const level = headerMatch[1].length;
              const title = headerMatch[2] || '';
              const fontSize = level === 1 ? '1.3em' : level === 2 ? '1.15em' : '1.05em';
              renderedElements.push(
                <div
                  key={lineIdx}
                  style={{
                    fontWeight: 800,
                    fontSize,
                    margin: '10px 0 4px 0',
                    color: 'var(--text-primary, #ffffff)',
                  }}
                >
                  {parseInlineMarkdown(title)}
                </div>,
              );
            } else if (trimmed === '') {
              renderedElements.push(<div key={lineIdx} style={{ height: '8px' }} />);
            } else {
              renderedElements.push(
                <div key={lineIdx} style={{ margin: '4px 0' }}>
                  {parseInlineMarkdown(line || '')}
                </div>,
              );
            }
          }
        });

        flushList('end');

        return <React.Fragment key={blockIdx}>{renderedElements}</React.Fragment>;
      })}
    </div>
  );
};
