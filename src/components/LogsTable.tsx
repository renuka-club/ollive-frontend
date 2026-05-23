import { InferenceLog } from '@/lib/api';

function fmt(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString(); } catch { return '—'; }
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    success: 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30',
    completed: 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30',
    error: 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30',
    cancelled: 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30',
    active: 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/30',
  };
  const cls = map[status] || 'bg-[#1f1f1f] text-[#6b7280] border-[#1f1f1f]';
  return (
    <span className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider border rounded ${cls}`}>
      {status}
    </span>
  );
}

export function LogsTable({ logs }: { logs: InferenceLog[] }) {
  if (logs.length === 0) {
    return <div className="text-sm text-[#6b7280] p-6 text-center">No logs yet.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-[#6b7280] border-b border-[#1f1f1f]">
            <th className="py-2 px-3 font-normal">Timestamp</th>
            <th className="py-2 px-3 font-normal">Conversation</th>
            <th className="py-2 px-3 font-normal">Model</th>
            <th className="py-2 px-3 font-normal">Provider</th>
            <th className="py-2 px-3 font-normal text-right">Latency</th>
            <th className="py-2 px-3 font-normal text-right">In</th>
            <th className="py-2 px-3 font-normal text-right">Out</th>
            <th className="py-2 px-3 font-normal">Status</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id} className="border-b border-[#1f1f1f] hover:bg-[#0f0f0f]">
              <td className="py-2 px-3 text-[#6b7280] font-light">{fmt(l.created_at)}</td>
              <td className="py-2 px-3 font-light opacity-70">{(l.conversation_id || '').slice(0, 8)}…</td>
              <td className="py-2 px-3">{l.model}</td>
              <td className="py-2 px-3 text-[#6b7280]">{l.provider}</td>
              <td className="py-2 px-3 text-right">{l.latency_ms}ms</td>
              <td className="py-2 px-3 text-right">{l.prompt_tokens}</td>
              <td className="py-2 px-3 text-right">{l.completion_tokens}</td>
              <td className="py-2 px-3"><StatusBadge status={l.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
