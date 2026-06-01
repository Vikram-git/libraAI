import { useState } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { Link } from "react-router-dom";
import { api, type Book } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
  books?: Book[];
}

export function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm LibraAI 🤖 Ask about Indian authors, programming books, your borrows, or get personalized picks!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { token } = useAuthStore();

  async function send() {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);

    try {
      const path = token ? "/api/ai/chat" : "/api/ai/chat/guest";
      const res = await api.post<{ reply: string; suggestedBooks: Book[] }>(path, { message: text }, token);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: res.reply, books: res.suggestedBooks },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "I'm having trouble connecting. Try the full chat page or browse our catalog!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 flex h-[min(520px,70vh)] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <span className="font-semibold">AI Librarian</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-white/20">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content.replace(/\*\*/g, "")}</p>
                    {msg.books && msg.books.length > 0 && (
                      <ul className="mt-2 space-y-1 border-t border-slate-200 pt-2 dark:border-slate-600">
                        {msg.books.slice(0, 3).map((b) => (
                          <li key={b.id}>
                            <Link
                              to={`/books/${b.id}`}
                              className="text-indigo-600 hover:underline dark:text-indigo-400"
                              onClick={() => setOpen(false)}
                            >
                              {b.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <p className="text-xs text-slate-400">Thinking...</p>
              )}
            </div>

            <form
              className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-700"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about books..."
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
              />
              <Button type="submit" size="sm" disabled={loading}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transition-transform hover:scale-110"
        aria-label="Open AI chat"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}
