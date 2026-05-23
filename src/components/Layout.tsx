import { ReactNode } from 'react';
import { Sidebar, MobileNav } from './Sidebar';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-transparent text-[#e2e8f0]">
      <div className="backdrop-blur-md bg-[#0a0a0a]/80 z-10 border-r border-[#1f1f1f]/50">
        <Sidebar />
      </div>
      <main className="flex-1 min-w-0 pb-14 md:pb-0 relative z-0">{children}</main>
      <div className="md:hidden backdrop-blur-md bg-[#0a0a0a]/80 z-20 border-t border-[#1f1f1f]/50 fixed bottom-0 w-full">
        <MobileNav />
      </div>
    </div>
  );
}
