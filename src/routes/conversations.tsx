import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { Search, Inbox, Play, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Conversation, deleteConversation, getConversations } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { Skeleton } from '@/components/Skeleton';
import { StatusBadge } from '@/components/LogsTable';

export const Route = createFileRoute('/conversations')({
  component: ConversationsPage,
});

const PAGE_SIZE = 20;

function fmt(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return '—'; }
}
function rel(iso?: string) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ConversationsPage() {
  const navigate = useNavigate();
  const { setActiveConversationId } = useApp();
  const [rows, setRows] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);

  async function load() {
    setLoading(true);
    try {
      const res = await getConversations();
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        (r.title || '').toLowerCase().includes(s) ||
        (r.id || '').toLowerCase().includes(s)
    );
  }, [rows, q]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  async function handleDelete(id: string) {
    if (!confirm('Delete this conversation?')) return;
    try { await deleteConversation(id); toast.success('Deleted'); load(); } catch {}
  }

  function resume(id: string) {
    setActiveConversationId(id);
    navigate({ to: '/chat' });
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-[#e2e8f0]">Conversations</h1>
        <p className="text-xs text-[#6b7280] mt-1">All recorded inference sessions.</p>
      </div>

      <div className="mb-4 relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(0); }}
          placeholder="Search by title or session ID…"
          className="w-full pl-9 pr-3 py-2 text-sm bg-[#0a0a0a] border border-[#1f1f1f] rounded text-[#e2e8f0] placeholder:text-[#6b7280] focus:outline-none focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6]"
        />
      </div>

      <div className="bg-[#111111] border border-[#1f1f1f] rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-[#6b7280]">
            <Inbox className="w-8 h-8 mb-3 opacity-60" />
            <div className="text-sm">No conversations recorded yet</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-[#6b7280] border-b border-[#1f1f1f]">
                  <th className="py-2.5 px-3 font-normal">Session ID</th>
                  <th className="py-2.5 px-3 font-normal">Title</th>
                  <th className="py-2.5 px-3 font-normal">Status</th>
                  <th className="py-2.5 px-3 font-normal text-right">Msgs</th>
                  <th className="py-2.5 px-3 font-normal">Started</th>
                  <th className="py-2.5 px-3 font-normal">Last Activity</th>
                  <th className="py-2.5 px-3 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => (
                  <tr key={r.id} className="border-b border-[#1f1f1f] hover:bg-[#0f0f0f]">
                    <td className="py-2.5 px-3 font-light opacity-70">{r.id.slice(0, 8)}…</td>
                    <td className="py-2.5 px-3 max-w-[300px] truncate">{r.title || 'Untitled'}</td>
                    <td className="py-2.5 px-3"><StatusBadge status={r.status || 'active'} /></td>
                    <td className="py-2.5 px-3 text-right">{r.message_count ?? 0}</td>
                    <td className="py-2.5 px-3 text-[#6b7280]">{fmt(r.created_at)}</td>
                    <td className="py-2.5 px-3 text-[#6b7280]">{rel(r.updated_at || r.created_at)}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() => resume(r.id)}
                          className="px-2 py-1 text-xs border border-[#1f1f1f] rounded bg-[#0a0a0a] hover:bg-[#1f1f1f] text-[#e2e8f0] inline-flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" /> Resume
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="px-2 py-1 text-xs border border-[#1f1f1f] rounded bg-[#0a0a0a] hover:bg-[#1f1f1f] text-[#ef4444] inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4 text-xs text-[#6b7280]">
          <div>Page {page + 1} of {pages} • {filtered.length} total</div>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-3 py-1.5 border border-[#1f1f1f] rounded bg-[#111111] hover:bg-[#1f1f1f] disabled:opacity-40"
            >Prev</button>
            <button
              disabled={page >= pages - 1}
              onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
              className="px-3 py-1.5 border border-[#1f1f1f] rounded bg-[#111111] hover:bg-[#1f1f1f] disabled:opacity-40"
            >Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
