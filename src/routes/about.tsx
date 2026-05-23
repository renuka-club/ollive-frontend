import { createFileRoute } from '@tanstack/react-router';
import { Activity, Database, Cpu, Zap, Github, Mail, ArrowRight } from 'lucide-react';

export const Route = createFileRoute('/about')({
  component: AboutComponent,
});

const STACK = [
  { label: 'Frontend', items: ['React 19', 'TanStack Router', 'Tailwind CSS v4', 'Recharts'] },
  { label: 'Backend', items: ['Node.js', 'Express', 'TypeScript', 'tsx / nodemon'] },
  { label: 'AI / LLM', items: ['Google Gemini 2.5 Flash', 'SSE Streaming', 'Multimodal (vision)'] },
  { label: 'Data', items: ['Supabase (PostgreSQL)', 'Supabase Storage', 'JSONB metadata'] },
];

const FEATURES = [
  {
    icon: Zap,
    title: 'Real-time SSE Streaming',
    desc: 'Token-by-token response streaming — no waiting for the full reply. Cancel mid-stream at any time.',
  },
  {
    icon: Activity,
    title: 'Inference Logging SDK',
    desc: 'Every LLM call is wrapped and logged: model, latency, token usage, timestamps, input/output previews.',
  },
  {
    icon: Database,
    title: 'Structured Storage',
    desc: 'conversations, messages, and inference_logs stored in Postgres with FK integrity and JSONB metadata.',
  },
  {
    icon: Cpu,
    title: 'Analytics Dashboard',
    desc: 'Live charts for latency over time, tokens per conversation, error rate, and throughput.',
  },
];

const CHECKLIST = [
  ['Multi-turn conversations with context', true],
  ['LLM SDK wrapper (model, latency, tokens, timestamps)', true],
  ['Ingestion pipeline with validation', true],
  ['Structured DB schema', true],
  ['Streaming responses (SSE)', true],
  ['Latency + Tokens + Errors dashboards', true],
  ['Cancel / List / Resume conversations', true],
  ['Image upload & multimodal (vision)', true],
  ['Multi-provider support (OpenAI, Anthropic)', false],
  ['Docker Compose one-command setup', false],
  ['PII redaction', false],
] as const;

function AboutComponent() {
  return (
    <div className="p-6 max-w-4xl mx-auto w-full space-y-8">

      {/* Header */}
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-[#111] border border-[#2a2a2a] flex items-center justify-center shadow-2xl">
          <img src="/logo.png" alt="Ollive" className="w-10 h-10 object-contain" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#f8fafc]">Ollive</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">LLM Inference Logging &amp; Analytics — built for <span className="text-[#3b82f6]">work@ollive.ai</span></p>
        </div>
      </div>

      {/* Overview */}
      <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-6">
        <h2 className="text-base font-semibold text-[#f8fafc] mb-3">What is this?</h2>
        <p className="text-sm text-[#9ca3af] leading-relaxed">
          Ollive is a full-stack inference logging system built around Google Gemini. Every LLM call passes
          through a lightweight SDK wrapper that captures model, provider, latency, token usage, timestamps,
          and input/output previews — then asynchronously ships them to an ingestion pipeline that validates,
          parses, and persists the data to Supabase. The dashboard gives you live visibility into your AI
          application's performance without touching your core inference logic.
        </p>
        <div className="flex gap-3 mt-4 flex-wrap">
          <a
            href="https://github.com/your-handle/ollive"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-xs px-3 py-2 bg-[#1f1f1f] hover:bg-[#2a2a2a] border border-[#2a2a2a] rounded-lg text-[#e2e8f0] transition-colors"
          >
            <Github className="w-3.5 h-3.5" /> View on GitHub <ArrowRight className="w-3 h-3 opacity-50" />
          </a>
          <a
            href="mailto:work@ollive.ai"
            className="inline-flex items-center gap-2 text-xs px-3 py-2 bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 border border-[#3b82f6]/30 rounded-lg text-[#3b82f6] transition-colors"
          >
            <Mail className="w-3.5 h-3.5" /> work@ollive.ai
          </a>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5 flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-[#3b82f6]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#f8fafc] mb-1">{f.title}</div>
                <div className="text-xs text-[#9ca3af] leading-relaxed">{f.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tech Stack */}
      <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-6">
        <h2 className="text-sm font-semibold tracking-wider text-[#3b82f6] uppercase mb-4">Tech Stack</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STACK.map((group) => (
            <div key={group.label}>
              <div className="text-[10px] uppercase tracking-wider text-[#4b5563] mb-2">{group.label}</div>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <div key={item} className="text-xs text-[#e2e8f0] bg-[#1a1a1a] rounded px-2 py-1">{item}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-6">
        <h2 className="text-sm font-semibold tracking-wider text-[#3b82f6] uppercase mb-4">Requirements Coverage</h2>
        <div className="space-y-2">
          {CHECKLIST.map(([label, done]) => (
            <div key={String(label)} className="flex items-center gap-3 text-xs">
              <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${done ? 'bg-[#22c55e]/15 text-[#22c55e]' : 'bg-[#1f1f1f] text-[#4b5563]'}`}>
                {done ? '✓' : '–'}
              </span>
              <span className={done ? 'text-[#e2e8f0]' : 'text-[#4b5563]'}>{String(label)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture Summary */}
      <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-6">
        <h2 className="text-sm font-semibold tracking-wider text-[#3b82f6] uppercase mb-4">Architecture</h2>
        <div className="font-mono text-[11px] text-[#6b7280] leading-6 whitespace-pre-wrap">
{`User ──→ React UI (SSE stream)
          │
          ▼
   Express Backend
   ┌──────────────────────────────┐
   │  POST /messages/stream       │
   │  1. Insert user message      │
   │  2. Upload images → Storage  │
   │  3. callGeminiStream()       │
   │     └─ SSE chunks → browser │
   │  4. Insert assistant message │
   │  5. ingestLog() [async]      │
   └──────────────────────────────┘
          │
          ▼
   Supabase (PostgreSQL)
   conversations │ messages │ inference_logs
   + Storage bucket (chat-images)`}
        </div>
      </div>

      <div className="text-center text-[10px] text-[#374151] pb-4">
        Ollive v1.0.0 &mdash; Built by Sai Charan &middot; Submission for work@ollive.ai
      </div>
    </div>
  );
}
