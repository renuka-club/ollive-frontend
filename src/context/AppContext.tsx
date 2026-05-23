import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Conversation, getConversations } from '@/lib/api';

interface AppContextValue {
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  conversations: Conversation[];
  setConversations: (c: Conversation[]) => void;
  refreshConversations: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const refreshConversations = useCallback(async () => {
    try {
      const res = await getConversations();
      setConversations(Array.isArray(res.data) ? res.data : []);
    } catch {
      // toast handled in interceptor
    }
  }, []);

  return (
    <AppContext.Provider
      value={{ activeConversationId, setActiveConversationId, conversations, setConversations, refreshConversations }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
