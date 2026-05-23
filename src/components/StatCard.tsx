interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'success' | 'error' | 'warning';
}

export function StatCard({ label, value, hint, tone = 'default' }: StatCardProps) {
  const toneClass = {
    default: 'text-[#e2e8f0]',
    success: 'text-[#22c55e]',
    error: 'text-[#ef4444]',
    warning: 'text-[#f59e0b]',
  }[tone];

  return (
    <div className="bg-[#111111] border border-[#1f1f1f] rounded-lg p-4">
      <div className="text-[10px] uppercase tracking-wider text-[#6b7280] mb-2">{label}</div>
      <div className={`text-2xl font-semibold tracking-tight ${toneClass}`}>{value}</div>
      {hint && <div className="text-[11px] text-[#6b7280] mt-1 font-light">{hint}</div>}
    </div>
  );
}
