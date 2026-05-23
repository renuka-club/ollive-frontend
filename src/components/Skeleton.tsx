export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-[#1f1f1f] rounded ${className}`} />;
}
