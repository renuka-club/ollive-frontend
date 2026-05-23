import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid,
} from 'recharts';
import { AnalyticsSummary, InferenceLog, getAnalyticsSummary, getLogs } from '@/lib/api';
import { StatCard } from '@/components/StatCard';
import { LogsTable } from '@/components/LogsTable';
import { Skeleton } from '@/components/Skeleton';

export const Route = createFileRoute('/analytics')({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [logs, setLogs] = useState<InferenceLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [s, l] = await Promise.allSettled([
          getAnalyticsSummary(),
          getLogs(200),
        ]);
        // getAnalyticsSummary returns {data: AnalyticsSummary} (backend wrapper)
        const summaryBody = s.status === 'fulfilled' ? s.value : null;
        setSummary((summaryBody as any)?.data ?? summaryBody ?? {});
        // getLogs returns {data: InferenceLog[]} (backend wrapper)
        const logsBody = l.status === 'fulfilled' ? l.value : null;
        const logsArr = (logsBody as any)?.data ?? logsBody;
        setLogs(Array.isArray(logsArr) ? logsArr : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const safeLogs = logs ?? [];

  const computed = useMemo(() => {
    const total = summary?.total_inferences ?? safeLogs.length;
    const avg = summary?.avg_latency_ms ??
      (safeLogs.length ? Math.round(safeLogs.reduce((a, l) => a + (l.latency_ms || 0), 0) / safeLogs.length) : 0);
    const tokens = summary?.total_tokens ?? safeLogs.reduce((a, l) => a + (l.total_tokens || 0), 0);
    const errors = safeLogs.filter((l) => l.status === 'error').length;
    const errRate = summary?.error_rate ?? (safeLogs.length ? (errors / safeLogs.length) * 100 : 0);
    return { total, avg, tokens, errRate };
  }, [summary, safeLogs]);

  const latencyData = useMemo(
    () => safeLogs.slice(0, 50).slice().reverse().map((l, i) => ({
      idx: i, latency: l.latency_ms, model: l.model, ts: l.created_at,
    })),
    [safeLogs]
  );

  const tokensByConv = useMemo(() => {
    const map = new Map<string, { prompt: number; completion: number; total: number }>();
    for (const l of safeLogs) {
      const k = l.conversation_id;
      if (!k) continue; // skip logs where conversation was deleted
      const cur = map.get(k) || { prompt: 0, completion: 0, total: 0 };
      cur.prompt += l.prompt_tokens || 0;
      cur.completion += l.completion_tokens || 0;
      cur.total += l.total_tokens || 0;
      map.set(k, cur);
    }
    return Array.from(map.entries())
      .map(([id, v]) => ({ id: (id ?? '').slice(0, 8), full: id ?? '', ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [safeLogs]);

  const statusDist = useMemo(() => {
    const success = safeLogs.filter((l) => l.status === 'success').length;
    const error = safeLogs.filter((l) => l.status === 'error').length;
    return [
      { name: 'success', value: success, fill: '#22c55e' },
      { name: 'error', value: error, fill: '#ef4444' },
    ];
  }, [safeLogs]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[#e2e8f0]">Analytics</h1>
        <p className="text-xs text-[#6b7280] mt-1">Live metrics across all logged inferences.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Inferences" value={computed.total.toLocaleString()} />
          <StatCard label="Avg Latency" value={`${Math.round(computed.avg)}ms`} />
          <StatCard label="Total Tokens" value={computed.tokens.toLocaleString()} />
          <StatCard
            label="Error Rate"
            value={`${computed.errRate.toFixed(1)}%`}
            tone={computed.errRate > 5 ? 'error' : 'default'}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-lg p-4">
          <div className="text-[10px] uppercase tracking-wider text-[#6b7280] mb-3">Latency Over Time</div>
          <div className="h-64">
            {latencyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#6b7280]">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latencyData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid stroke="#1f1f1f" vertical={false} />
                  <XAxis dataKey="idx" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={{ stroke: '#1f1f1f' }} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={{ stroke: '#1f1f1f' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#0a0a0a', border: '1px solid #1f1f1f', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                    labelStyle={{ color: '#6b7280' }}
                    formatter={(v: any, _n, item: any) => [`${v}ms · ${item?.payload?.model || ''}`, 'latency']}
                  />
                  <Line type="monotone" dataKey="latency" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-[#111111] border border-[#1f1f1f] rounded-lg p-4">
          <div className="text-[10px] uppercase tracking-wider text-[#6b7280] mb-3">Tokens per Conversation</div>
          <div className="h-64">
            {tokensByConv.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#6b7280]">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tokensByConv} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid stroke="#1f1f1f" vertical={false} />
                  <XAxis dataKey="id" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={{ stroke: '#1f1f1f' }} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={{ stroke: '#1f1f1f' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#0a0a0a', border: '1px solid #1f1f1f', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                    labelStyle={{ color: '#6b7280' }}
                    formatter={(_v: any, _n, item: any) => {
                      const p = item?.payload;
                      return [`${p?.total} (prompt ${p?.prompt} + completion ${p?.completion})`, 'tokens'];
                    }}
                  />
                  <Bar dataKey="total" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#111111] border border-[#1f1f1f] rounded-lg p-4">
        <div className="text-[10px] uppercase tracking-wider text-[#6b7280] mb-3">Status Distribution</div>
        {statusDist.every((s) => s.value === 0) ? (
          <div className="text-xs text-[#6b7280] py-6 text-center">No data</div>
        ) : (
          <div className="space-y-2">
            {statusDist.map((s) => {
              const total = statusDist.reduce((a, x) => a + x.value, 0) || 1;
              const pct = (s.value / total) * 100;
              return (
                <div key={s.name} className="flex items-center gap-3 text-xs">
                  <div className="w-20 uppercase tracking-wider text-[#6b7280]">{s.name}</div>
                  <div className="flex-1 h-2 bg-[#0a0a0a] rounded overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${pct}%`, background: s.fill }} />
                  </div>
                  <div className="w-24 text-right tabular-nums">{s.value} · {pct.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-[#111111] border border-[#1f1f1f] rounded-lg p-4">
        <div className="text-[10px] uppercase tracking-wider text-[#6b7280] mb-3">Recent Logs</div>
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : (
          <LogsTable logs={safeLogs.slice(0, 20)} />
        )}
      </div>
    </div>
  );
}
