import { Link, useRouterState } from '@tanstack/react-router';
import { MessageSquare, List, BarChart3, Info } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

const nav = [
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/conversations', label: 'Conversations', icon: List },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/about', label: 'About', icon: Info },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex w-[240px] shrink-0 flex-col border-r border-[#1f1f1f]/50 bg-transparent h-screen sticky top-0">
      <div className="h-16 flex items-center px-4 border-b border-[#1f1f1f]/50 gap-3">
        <img src="/logo.png" alt="Ollive Logo" className="w-6 h-6 object-contain drop-shadow-lg" />
        <span className="text-[15px] font-bold tracking-[0.1em] uppercase text-[#f8fafc] drop-shadow-md">ollive</span>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
          <span className="text-[9px] uppercase tracking-[0.15em] text-[#3b82f6] font-semibold">live</span>
        </div>
      </div>

      <nav className="flex-1 py-4">
        {nav.map((item) => {
          const active = pathname === item.to || (item.to === '/chat' && pathname === '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm border-l-2 transition-colors ${
                active
                  ? 'border-[#3b82f6] text-white bg-[#111111]'
                  : 'border-transparent text-[#6b7280] hover:text-[#e2e8f0] hover:bg-[#111111]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#1f1f1f]">
        <div className="text-[10px] uppercase tracking-wider text-[#6b7280] mb-1">API</div>
        <div className="text-[11px] font-light text-[#6b7280] opacity-80 truncate" title={API_BASE_URL}>
          {API_BASE_URL}
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t border-[#1f1f1f] bg-[#0a0a0a]">
      {nav.map((item) => {
        const active = pathname === item.to || (item.to === '/chat' && pathname === '/');
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex-1 flex flex-col items-center gap-1 py-2 text-[10px] ${
              active ? 'text-white border-t-2 border-[#3b82f6]' : 'text-[#6b7280]'
            }`}
          >
            <Icon className="w-4 h-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
