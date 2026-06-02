"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Send, Trash2, Bot, User, ArrowLeft, BarChart3, Utensils, Pill, Dumbbell } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useFoodLogs } from "@/hooks/useFoodLog";
import { askCoach } from "@/lib/ai-service";

const suggestions = [
  { Icon: BarChart3, label: "Ma journée" },
  { Icon: Utensils, label: "Plan repas" },
  { Icon: Pill, label: "Suppléments" },
  { Icon: Dumbbell, label: "Exercices" },
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const { profile: dbProfile, calculatedMacros } = useProfile(userId);
  const { totals } = useFoodLogs(userId);

  const macros = calculatedMacros ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  const name = dbProfile?.name ?? "";
  const goal = dbProfile?.goal ?? "gain";
  const mode = dbProfile?.mode ?? "normal";

  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: `Salut **${name}** 👋 Je suis ton Coach FitAI. Pose-moi toutes tes questions sur la nutrition, l'entraînement, ou ta progression aujourd'hui !` },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  const send = async (text: string) => {
    if (!text.trim() || typing) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    try {
      const allMessages = [...messages, userMsg];
      const reply = await askCoach(allMessages, { name, goal, mode, target_kcal: macros.kcal, target_protein: macros.protein }, { kcal: totals.kcal, protein: totals.protein, carbs: totals.carbs, fat: totals.fat });
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Désolé, je n'arrive pas à contacter le serveur pour le moment. Vérifie que ta clé API DeepSeek est configurée dans .env.local et réessaie." }]);
    } finally { setTyping(false); }
  };

  const clear = () => {
    setMessages([{ role: "assistant", content: `Salut **${name}** 👋 Je suis ton Coach FitAI. Pose-moi toutes tes questions sur la nutrition, l'entraînement, ou ta progression aujourd'hui !` }]);
  };

  const renderContent = (content: string) => content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>");

  return (
    <AppShell header={
      <header className="sticky top-0 z-30 glass border-b border-border">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href="/" className="grid h-9 w-9 place-items-center rounded-full bg-surface-2"><ArrowLeft className="h-4 w-4" /></Link>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full grad-accent"><Sparkles className="h-3.5 w-3.5 text-background" /></span>
            <div>
              <p className="text-sm font-semibold leading-none">Coach FitAI</p>
              <p className="text-[10px]" style={{ color: "var(--accent)" }}>● En ligne</p>
            </div>
          </div>
          <button onClick={clear} className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </header>
    }>
      <div className="flex flex-col gap-3 pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <span className={`mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full ${msg.role === "assistant" ? "grad-accent text-background" : "bg-surface-2 text-foreground"}`}>
              {msg.role === "assistant" ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
            </span>
            <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
              style={msg.role === "assistant" ? { background: "var(--surface-2)", borderTopLeftRadius: 4 } : { background: "color-mix(in oklab, var(--accent) 10%, transparent)", border: "1px solid color-mix(in oklab, var(--accent) 25%, transparent)", borderTopRightRadius: 4 }}>
              <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }} />
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex gap-2">
            <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full grad-accent text-background"><Sparkles className="h-3.5 w-3.5" /></span>
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm px-4 py-3" style={{ background: "var(--surface-2)" }}>
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0.15s" }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0.3s" }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="-mx-4 mb-3 overflow-x-auto no-scrollbar px-4">
        <div className="flex gap-2">
          {suggestions.map((s) => (
            <button key={s.label} onClick={() => send(s.label)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface-1 px-3.5 py-2 text-xs font-medium text-muted-foreground hover:border-accent hover:text-accent transition">
              <s.Icon className="h-3.5 w-3.5" /> {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 -mx-4 mt-auto border-t border-border bg-background/80 px-4 py-3 backdrop-blur-lg safe-bottom">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface-1 px-4 py-2.5">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Pose ta question au coach..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          <button onClick={() => send(input)} disabled={!input.trim() || typing}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full grad-accent text-background disabled:opacity-40 transition">
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </AppShell>
  );
}
