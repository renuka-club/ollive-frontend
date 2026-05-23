import { Message } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function fmtTime(iso?: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function MessageBubble({ m }: { m: Message }) {
  const isUser = m.role === 'user';
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col gap-1 ${isUser ? 'items-end max-w-[75%]' : 'items-start w-full max-w-[85%]'}`}>
        {/* Avatar label */}
        <span className="text-[10px] uppercase tracking-widest font-semibold text-[#6b7280] px-1">
          {isUser ? 'You' : 'Ollive'}
        </span>

        {/* Image previews — localImages = optimistic (base64), metadata.images = from DB (URL) */}
        {isUser && (() => {
          const dbImages = m.metadata?.images;
          const localImgs = m.localImages;
          // Show DB images if available (persisted), otherwise fall back to local base64
          const imagesToShow = dbImages && dbImages.length > 0
            ? dbImages.map((img, i) => ({ key: String(i), src: img.url, alt: `image-${i}` }))
            : localImgs && localImgs.length > 0
              ? localImgs.map(img => ({ key: img.id, src: img.data, alt: img.name }))
              : [];
          if (imagesToShow.length === 0) return null;
          return (
            <div className="flex flex-wrap gap-2 justify-end mb-1">
              {imagesToShow.map(img => (
                <div key={img.key} className="relative rounded-xl overflow-hidden border border-[#2a2a2a] shadow-lg">
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="max-w-[240px] max-h-[200px] object-contain bg-[#111] cursor-pointer"
                    onClick={() => window.open(img.src, '_blank')}
                  />
                </div>
              ))}
            </div>
          );
        })()}

        {/* Bubble */}
        {m.content && (
          <div
            className={`text-sm leading-relaxed rounded-2xl px-4 py-3 ${
              isUser
                ? 'bg-[#3b82f6] text-white rounded-br-sm'
                : 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#e2e8f0] rounded-bl-sm'
            }`}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap break-words">{m.content}</p>
            ) : (
              <div className="prose prose-sm prose-invert max-w-none break-words">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                    code: ({ inline, children, ...props }: any) =>
                      inline ? (
                        <code className="bg-[#0d0d0d] border border-[#2a2a2a] rounded px-1.5 py-0.5 text-[#3b82f6] text-xs font-mono" {...props}>
                          {children}
                        </code>
                      ) : (
                        <pre className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg p-3 overflow-x-auto my-2">
                          <code className="text-[#e2e8f0] text-xs font-mono" {...props}>{children}</code>
                        </pre>
                      ),
                    ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2 pl-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2 pl-2">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    h1: ({ children }) => <h1 className="text-base font-bold mb-2 text-[#f8fafc]">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-sm font-semibold mb-2 text-[#f8fafc]">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-medium mb-1 text-[#f8fafc]">{children}</h3>,
                    strong: ({ children }) => <strong className="font-semibold text-[#f8fafc]">{children}</strong>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-[#3b82f6] pl-3 my-2 text-[#9ca3af] italic">{children}</blockquote>
                    ),
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#3b82f6] underline hover:text-[#60a5fa]">
                        {children}
                      </a>
                    ),
                    hr: () => <hr className="border-[#2a2a2a] my-3" />,
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-2">
                        <table className="w-full text-xs border-collapse border border-[#2a2a2a]">{children}</table>
                      </div>
                    ),
                    th: ({ children }) => <th className="border border-[#2a2a2a] px-2 py-1 bg-[#111] text-left font-semibold">{children}</th>,
                    td: ({ children }) => <td className="border border-[#2a2a2a] px-2 py-1">{children}</td>,
                  }}
                >
                  {m.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-[#4b5563] px-1">{fmtTime(m.created_at)}</span>
      </div>
    </div>
  );
}

export function AssistantTyping() {
  return (
    <div className="flex justify-start w-full">
      <div className="flex flex-col gap-1 items-start max-w-[85%]">
        <span className="text-[10px] uppercase tracking-widest font-semibold text-[#6b7280] px-1">Ollive</span>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
