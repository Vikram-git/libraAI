import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Sparkles, Bot, BookOpen, Globe, Flag } from "lucide-react";
import { api, type Book } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { BookCard } from "@/components/books/BookCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface CuratedLists {
  indianAuthors: { title: string; subtitle: string; books: Book[] };
  internationalBestsellers: { title: string; subtitle: string; books: Book[] };
  techMustRead: { title: string; subtitle: string; books: Book[] };
}

export function Home() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: forYou } = useQuery({
    queryKey: ["recommendations", "for-you"],
    queryFn: () => api.get<Book[]>("/api/recommendations/for-you", token),
    enabled: !!token,
  });

  const { data: trending } = useQuery({
    queryKey: ["recommendations", "trending"],
    queryFn: () => api.get<Book[]>("/api/recommendations/trending"),
  });

  const { data: curated } = useQuery({
    queryKey: ["recommendations", "curated"],
    queryFn: () => api.get<CuratedLists>("/api/recommendations/curated"),
  });

  const heroBooks = (token ? forYou : trending)?.slice(0, 8) ?? [];

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-900 px-4 py-24 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggIGQ9Ik0zNiAzNGg0djJoLTR6bTAgNGg0djJoLTR6bTAtNGgtNHYtNGg0djR6bTAtNGgtNHYtNGg0djR6bTAtNGgtNHYtNGg0djR6bTAtNGg0djJoLTR6bTAtNGg0djJoLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative mx-auto max-w-5xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1 text-sm backdrop-blur">
              <Sparkles className="h-4 w-4" />
              AI-Powered Smart Library
            </span>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              LibraAI
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-indigo-100">
              35+ books from Indian & international authors. AI recommendations, semantic search, and your personal librarian.
            </p>
          </motion.div>

          <form
            className="mx-auto mt-10 flex max-w-2xl flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/catalog?q=${encodeURIComponent(search)}&ai=1`);
            }}
          >
            <Input
              placeholder='Try "Indian classic novels" or "Python for beginners"'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 flex-1 border-0 bg-white text-slate-900 shadow-lg"
            />
            <Button type="submit" size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50">
              <Search className="mr-2 h-5 w-5" />
              AI Search
            </Button>
          </form>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/catalog?region=indian">
              <Button variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                <Flag className="mr-2 h-4 w-4" />
                Indian Authors
              </Button>
            </Link>
            <Link to="/catalog?region=foreign">
              <Button variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                <Globe className="mr-2 h-4 w-4" />
                International
              </Button>
            </Link>
            <Link to="/chat">
              <Button variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                <Bot className="mr-2 h-4 w-4" />
                AI Librarian
              </Button>
            </Link>
            <Link to="/items">
              <Button variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                Items CRUD
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Sparkles, title: "AI Recommendations", desc: "Personalized for your taste", color: "text-purple-600" },
            { icon: Search, title: "Semantic Search", desc: "Search by meaning, not keywords", color: "text-indigo-600" },
            { icon: Bot, title: "AI Chatbot", desc: "24/7 librarian assistant", color: "text-violet-600" },
            { icon: BookOpen, title: "35+ Books", desc: "Indian & global catalog", color: "text-emerald-600" },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <Icon className={`mb-3 h-8 w-8 ${color}`} />
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-slate-500">{desc}</p>
            </div>
          ))}
        </div>

        <Section
          title={token ? "✨ Recommended For You" : "🔥 Trending Now"}
          subtitle="AI-curated picks based on popularity and diversity"
          books={heroBooks}
          badge="AI Pick"
        />

        {curated && (
          <>
            <Section
              title={`🇮🇳 ${curated.indianAuthors.title}`}
              subtitle={curated.indianAuthors.subtitle}
              books={curated.indianAuthors.books}
            />
            <Section
              title={`🌍 ${curated.internationalBestsellers.title}`}
              subtitle={curated.internationalBestsellers.subtitle}
              books={curated.internationalBestsellers.books}
            />
            <Section
              title={`💻 ${curated.techMustRead.title}`}
              subtitle={curated.techMustRead.subtitle}
              books={curated.techMustRead.books}
            />
          </>
        )}
      </section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  books,
  badge,
}: {
  title: string;
  subtitle: string;
  books: Book[];
  badge?: string;
}) {
  if (!books.length) return null;
  return (
    <div className="mb-14">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-slate-500">{subtitle}</p>
        </div>
        <Link to="/catalog">
          <Button variant="outline" size="sm">
            View all
          </Button>
        </Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {books.map((book) => (
          <BookCard key={book.id} book={book} badge={badge} />
        ))}
      </div>
    </div>
  );
}
