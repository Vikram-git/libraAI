import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { api, type Book } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { BookCover } from "@/components/books/BookCover";
import { motion } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
  books?: Book[];
  mode?: string;
}

const SUGGESTIONS = [
  "Suggest a Python book for beginners",
  "Indian classic novels",
  "What books are available on machine learning?",
  "Show my borrowed books",
  "Books similar to Harry Potter",
];

export function Chat() {
  const { token } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Welcome to LibraAI Librarian! I know our full catalog of Indian and international books. Ask me anything — recommendations, your borrows, or natural language searches.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const path = token ? "/api/ai/chat" : "/api/ai/chat/guest";
      const res = await api.post<{ reply: string; suggestedBooks: Book[]; mode?: string }>(
        path,
        { message: msg },
        token,
      );
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: res.reply,
          books: res.suggestedBooks,
          mode: res.mode,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-5xl flex-col px-4 py-6">
      <div className="mb-4 text-center">
        <h1 className="flex items-center justify-center gap-2 text-2xl font-bold">
          <Bot className="h-7 w-7 text-indigo-600" />
          AI Librarian
        </h1>
        <p className="text-sm text-slate-500">
          Smart assistant with catalog knowledge — works with or without OpenAI API key
        </p>
        {!token && (
          <p className="mt-1 text-sm">
            <Link to="/login" className="text-indigo-600 hover:underline">
              Login
            </Link>{" "}
            to ask about your borrowed books
          </p>
        )}
      </div>

      <div className="mb-3 flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => send(s)}
            className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  msg.role === "user" ? "bg-indigo-600 text-white" : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                }`}
              >
                {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={`max-w-[85%] ${msg.role === "user" ? "text-right" : ""}`}>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content.replace(/\*\*/g, "")}</p>
                  {msg.mode && msg.role === "assistant" && (
                    <span className="mt-2 flex items-center gap-1 text-xs opacity-60">
                      <Sparkles className="h-3 w-3" />
                      {msg.mode === "openai" ? "GPT-powered" : "Smart AI"}
                    </span>
                  )}
                </div>
                {msg.books && msg.books.length > 0 && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {msg.books.map((b) => (
                      <Link
                        key={b.id}
                        to={`/books/${b.id}`}
                        className="flex gap-3 rounded-xl border border-slate-200 bg-white p-2 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
                      >
                        <div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg">
                          <BookCover book={b} size="sm" className="!h-20" />
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="line-clamp-2 text-xs font-semibold">{b.title}</p>
                          <p className="text-xs text-slate-500">{b.author}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {loading && (
            <p className="text-center text-sm text-slate-400">AI Librarian is thinking...</p>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          className="flex gap-2 border-t border-slate-200 p-4 dark:border-slate-700"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about our library..."
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
          />
          <Button type="submit" size="lg" disabled={loading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
