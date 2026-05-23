import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState, KeyboardEvent, useCallback, DragEvent, ClipboardEvent } from 'react';
import { Plus, Send, Trash2, X, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  Conversation,
  ImageAttachment,
  Message,
  API_BASE_URL,
  createConversation,
  deleteConversation,
  getMessages,
} from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { MessageBubble, AssistantTyping } from '@/components/MessageBubble';
import { Skeleton } from '@/components/Skeleton';

export const Route = createFileRoute('/chat')({
  component: ChatPage,
});

function relTime(iso?: string) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function titleOf(c: Conversation) {
  const t = (c.title || '').trim();
  if (t) return t.slice(0, 40);
  return 'Untitled';
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const STREAMING_ID = '__streaming__';

function ChatPage() {
  const { conversations, refreshConversations, activeConversationId, setActiveConversationId } = useApp();
  const [loadingList, setLoadingList] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [input, setInput] = useState('');
  const [attachedImages, setAttachedImages] = useState<ImageAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [sending, setSending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refreshConversations().finally(() => setLoadingList(false));
  }, [refreshConversations]);

  useEffect(() => {
    if (!activeConversationId) { setMessages([]); return; }
    setLoadingMessages(true);
    getMessages(activeConversationId)
      .then((res) => setMessages(Array.isArray(res.data) ? res.data : []))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMessages(false));
  }, [activeConversationId]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, sending, scrollToBottom]);

  // Auto-grow textarea
  const autoGrow = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, []);
  useEffect(() => { autoGrow(); }, [input, autoGrow]);

  const active = conversations.find((c) => c.id === activeConversationId) || null;

  // ── Image handling ──────────────────────────────────────────
  async function processFiles(files: FileList | File[]) {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;
    if (attachedImages.length + imageFiles.length > 5) {
      toast.error('Maximum 5 images per message');
      return;
    }
    try {
      const newImages: ImageAttachment[] = await Promise.all(
        imageFiles.map(async (file) => ({
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          mimeType: file.type,
          data: await fileToBase64(file),
          name: file.name,
        }))
      );
      setAttachedImages(prev => [...prev, ...newImages]);
    } catch { toast.error('Failed to read image'); }
  }

  function removeImage(id: string) { setAttachedImages(prev => prev.filter(img => img.id !== id)); }

  function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageItems = Array.from(items).filter(item => item.type.startsWith('image/'));
    if (imageItems.length === 0) return;
    e.preventDefault();
    processFiles(imageItems.map(item => item.getAsFile()).filter(Boolean) as File[]);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) { e.preventDefault(); setIsDragging(true); }
  function handleDragLeave() { setIsDragging(false); }
  function handleDrop(e: DragEvent<HTMLDivElement>) { e.preventDefault(); setIsDragging(false); processFiles(e.dataTransfer.files); }

  // ── Conversation actions ──────────────────────────────────────
  async function handleNew() {
    try {
      const res = await createConversation();
      await refreshConversations();
      setActiveConversationId(res.data.id);
      setMessages([]);
      setAttachedImages([]);
    } catch {}
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this conversation?')) return;
    try {
      await deleteConversation(id);
      if (activeConversationId === id) { setActiveConversationId(null); setMessages([]); }
      await refreshConversations();
      toast.success('Conversation deleted');
    } catch {}
  }

  // ── SSE streaming send ──────────────────────────────────────
  async function handleSend() {
    const content = input.trim();
    if ((!content && attachedImages.length === 0) || sending) return;

    let convId = activeConversationId;
    if (!convId) {
      try {
        const res = await createConversation();
        convId = res.data.id;
        setActiveConversationId(convId);
        await refreshConversations();
      } catch { return; }
    }

    const imagesToSend = [...attachedImages];

    // Optimistic user message
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
      localImages: imagesToSend,
    };
    setMessages(prev => [...prev, optimistic]);
    setInput('');
    setAttachedImages([]);
    if (taRef.current) taRef.current.style.height = 'auto';
    setSending(true);
    scrollToBottom(false);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    // Prepare image parts (strip data URL prefix)
    const imageParts = imagesToSend.map(img => ({
      mimeType: img.mimeType,
      data: img.data.replace(/^data:[^;]+;base64,/, ''),
    }));

    try {
      const resp = await fetch(
        `${API_BASE_URL}/api/conversations/${convId}/messages/stream`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'user',
            content,
            images: imageParts.length > 0 ? imageParts : undefined,
          }),
          signal: ctrl.signal,
        }
      );

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error((errData as any)?.error?.message || 'Stream request failed');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamingStarted = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let event: any;
          try { event = JSON.parse(line.slice(6)); } catch { continue; }

          if (event.type === 'images') {
            // Replace localImages base64 with uploaded storage URLs
            setMessages(prev => prev.map(m =>
              m.id === optimistic.id
                ? { ...m, localImages: undefined, metadata: { images: event.urls } }
                : m
            ));
          } else if (event.type === 'chunk') {
            if (!streamingStarted) {
              // Insert streaming placeholder as a new AI message
              setMessages(prev => [...prev, {
                id: STREAMING_ID,
                role: 'assistant',
                content: '',
                created_at: new Date().toISOString(),
              }]);
              streamingStarted = true;
              setSending(false); // hide typing dots once streaming starts
            }
            // Append chunk to streaming message
            setMessages(prev =>
              prev.map(m => m.id === STREAMING_ID
                ? { ...m, content: m.content + event.content }
                : m
              )
            );
            scrollToBottom(false);
          } else if (event.type === 'done') {
            // Replace streaming placeholder with final persisted message
            const res = await getMessages(convId!);
            setMessages(Array.isArray(res.data) ? res.data : []);
            refreshConversations();
          } else if (event.type === 'error') {
            throw new Error(event.message);
          }
        }
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        toast.message('Request cancelled');
        // Remove streaming placeholder on cancel
        setMessages(prev => prev.filter(m => m.id !== STREAMING_ID));
      } else {
        toast.error(e?.message || 'Failed to send message');
        setMessages(prev => prev.filter(m => m.id !== STREAMING_ID));
      }
    } finally {
      setSending(false);
      abortRef.current = null;
      taRef.current?.focus();
    }
  }

  function handleCancel() { abortRef.current?.abort(); }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <div
      className={`flex h-screen min-w-0 overflow-hidden transition-all ${isDragging ? 'ring-2 ring-inset ring-[#3b82f6]/50' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-[#0a0a0a]/80 flex items-center justify-center pointer-events-none">
          <div className="border-2 border-dashed border-[#3b82f6] rounded-2xl p-10 text-center">
            <ImageIcon className="w-12 h-12 text-[#3b82f6] mx-auto mb-3" />
            <p className="text-[#3b82f6] font-semibold text-lg">Drop images here</p>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => { if (e.target.files) processFiles(e.target.files); e.target.value = ''; }} />

      {/* ── Sidebar ── */}
      <div className="hidden md:flex w-[260px] shrink-0 flex-col border-r border-[#1f1f1f]/50 bg-[#070707]">
        <div className="p-3 border-b border-[#1f1f1f]/50">
          <button onClick={handleNew}
            className="w-full flex items-center justify-center gap-2 text-sm px-3 py-2.5 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white transition-colors font-medium">
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="p-3 space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-xs text-[#6b7280] text-center mt-4">No conversations yet. Start one!</div>
          ) : conversations.map((c) => {
            const isActive = c.id === activeConversationId;
            return (
              <div key={c.id} onClick={() => setActiveConversationId(c.id)}
                className={`group cursor-pointer px-3 py-3 border-b border-[#1f1f1f]/30 transition-colors ${isActive ? 'bg-[#3b82f6]/10 border-l-2 border-l-[#3b82f6]' : 'hover:bg-[#111111]'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm truncate font-medium ${isActive ? 'text-white' : 'text-[#e2e8f0]'}`}>{titleOf(c)}</div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#6b7280]">
                      <span>{relTime(c.updated_at || c.created_at)}</span>
                      <span className="px-1.5 py-0.5 bg-[#1f1f1f] rounded-full">{c.message_count ?? 0} msgs</span>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                    className="opacity-0 group-hover:opacity-100 text-[#6b7280] hover:text-[#ef4444] transition-all p-1 rounded">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Chat window ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="h-14 border-b border-[#1f1f1f]/50 flex items-center px-4 gap-3 shrink-0 bg-[#070707]/80 backdrop-blur-sm">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-[#f8fafc] truncate">{active ? titleOf(active) : 'New Conversation'}</div>
            {activeConversationId && (
              <div className="text-[10px] text-[#4b5563] font-mono truncate">{activeConversationId}</div>
            )}
          </div>
          <button onClick={handleNew}
            className="md:hidden ml-auto text-xs px-3 py-1.5 border border-[#1f1f1f] rounded-lg bg-[#111111] hover:bg-[#1f1f1f] flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> New
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-5">
          {loadingMessages ? (
            <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-2/3" />)}</div>
          ) : messages.length === 0 && !sending ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
                <img src="/logo.png" alt="Ollive" className="w-10 h-10 object-contain" />
              </div>
              <div>
                <p className="text-[#f8fafc] font-semibold text-lg">Start a conversation</p>
                <p className="text-[#6b7280] text-sm mt-1">Ask anything — or paste/drag images to analyze</p>
              </div>
            </div>
          ) : (
            messages.map((m) => <MessageBubble key={m.id} m={m} />)
          )}
          {/* Only show typing dots BEFORE streaming starts */}
          {sending && <AssistantTyping />}
        </div>

        {/* Input area */}
        <div className="shrink-0 border-t border-[#1f1f1f]/50 bg-[#070707]/80 backdrop-blur-sm p-3 md:px-8 md:py-4">
          <div className="max-w-4xl mx-auto">
            {attachedImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {attachedImages.map(img => (
                  <div key={img.id} className="relative group rounded-xl overflow-hidden border border-[#2a2a2a] shadow-lg">
                    <img src={img.data} alt={img.name} className="w-20 h-20 object-cover" />
                    <button onClick={() => removeImage(img.id)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 items-end bg-[#111111] border border-[#2a2a2a] rounded-2xl px-3 py-2 focus-within:border-[#3b82f6] focus-within:shadow-[0_0_0_1px_rgba(59,130,246,0.2)] transition-all">
              <button onClick={() => fileInputRef.current?.click()} title="Attach image"
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-[#4b5563] hover:text-[#3b82f6] hover:bg-[#1f1f1f] transition-colors mb-0.5">
                <ImageIcon className="w-4 h-4" />
              </button>
              <textarea ref={taRef} value={input}
                onChange={(e) => { setInput(e.target.value); autoGrow(); }}
                onKeyDown={onKey} onPaste={handlePaste}
                placeholder="Message Ollive… paste or drag images, Enter to send"
                rows={1} disabled={sending}
                className="flex-1 resize-none bg-transparent text-sm text-[#e2e8f0] placeholder:text-[#4b5563] focus:outline-none min-h-[24px] max-h-[200px] py-1 leading-relaxed disabled:opacity-50"
                style={{ overflowY: 'hidden' }}
              />
              {(sending && abortRef.current) ? (
                <button onClick={handleCancel}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-[#f59e0b] hover:bg-[#d97706] text-white transition-colors mb-0.5">
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={handleSend} disabled={sending || (!input.trim() && attachedImages.length === 0)}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors mb-0.5">
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-center text-[10px] text-[#374151] mt-2">
              Ollive may make mistakes. All inferences are logged for analytics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
