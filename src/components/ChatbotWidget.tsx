import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { findAnswer, NO_ANSWER_REPLY, type KnowledgeDoc, type KnowledgeEntry } from "@/lib/chatbot-match";

type ChatMessage = { id: number; from: "bot" | "user"; text: string };

const WELCOME = "Hi, I am the Peculiar Youth assistant. Ask me anything about the church.";

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: 0, from: "bot", text: WELCOME }]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[] | null>(null);
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  // Load the knowledge base the first time the window is opened.
  useEffect(() => {
    if (!open || knowledge) return;
    (async () => {
      const [qa, kd] = await Promise.all([
        supabase.from("chatbot_knowledge").select("id, question, answer, keywords, category"),
        supabase.from("knowledge_documents").select("id, file_name, extracted_text, category"),
      ]);
      setKnowledge(qa.data ?? []);
      setDocs(kd.data ?? []);
    })();
  }, [open, knowledge]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || thinking) return;

    setMessages((m) => [...m, { id: nextId.current++, from: "user", text: question }]);
    setInput("");
    setThinking(true);

    let entries = knowledge;
    let documents = docs;
    if (!entries) {
      const [qa, kd] = await Promise.all([
        supabase.from("chatbot_knowledge").select("id, question, answer, keywords, category"),
        supabase.from("knowledge_documents").select("id, file_name, extracted_text, category"),
      ]);
      entries = qa.data ?? [];
      documents = kd.data ?? [];
      setKnowledge(entries);
      setDocs(documents);
    }

    const match = findAnswer(question, entries, documents);
    if (match.kind === "none") {
      await supabase.from("unanswered_questions").insert({
        question_text: question,
        asked_at: new Date().toISOString(),
        status: "pending",
      });
      setMessages((m) => [...m, { id: nextId.current++, from: "bot", text: NO_ANSWER_REPLY }]);
    } else {
      setMessages((m) => [...m, { id: nextId.current++, from: "bot", text: match.answer }]);
    }
    setThinking(false);
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open the Peculiar Youth assistant"
          className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-brand text-brand-foreground shadow-lg transition hover:scale-105 hover:opacity-95"
        >
          <MessageCircle className="h-6 w-6" aria-hidden="true" />
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Peculiar Youth assistant"
          className="fixed bottom-5 right-5 z-50 flex h-[min(560px,80vh)] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        >
          <header className="flex items-center gap-3 border-b border-border bg-brand px-4 py-3 text-brand-foreground">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-foreground/15 font-display text-base font-bold">
              P
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-bold">Peculiar Youth Assistant</div>
              <div className="text-[11px] opacity-80">Usually answers instantly</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-md p-1 hover:bg-brand-foreground/15">
              <X className="h-4 w-4" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m) => (
              <div key={m.id} className={m.from === "user" ? "flex justify-end" : "flex justify-start"}>
                <p
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    m.from === "user"
                      ? "rounded-br-sm bg-brand text-brand-foreground"
                      : "rounded-bl-sm bg-muted text-foreground"
                  }`}
                >
                  {m.text}
                </p>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <span className="inline-flex items-center gap-2 rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Typing…
                </span>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="border-t border-border p-3">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question…"
                aria-label="Your question"
                maxLength={300}
                className="min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/50"
              />
              <button
                type="submit"
                disabled={!input.trim() || thinking}
                aria-label="Send message"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
              Powered by Peculiar Youth
            </p>
          </form>
        </div>
      )}
    </>
  );
}
