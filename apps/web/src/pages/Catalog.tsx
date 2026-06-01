import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Search, Sparkles, Filter } from "lucide-react";
import { api, type Book } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { BookCard } from "@/components/books/BookCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const REGIONS = [
  { id: "", label: "All Books" },
  { id: "indian", label: "🇮🇳 Indian Authors" },
  { id: "foreign", label: "🌍 International" },
];

const CATEGORIES = [
  { slug: "", label: "All Categories" },
  { slug: "indian-literature", label: "Indian Literature" },
  { slug: "international-classics", label: "Classics" },
  { slug: "computer-science", label: "Computer Science" },
  { slug: "fiction", label: "Fiction" },
  { slug: "business", label: "Business" },
  { slug: "self-help", label: "Self Help" },
];

export function Catalog() {
  const [params, setParams] = useSearchParams();
  const initialQ = params.get("q") ?? "";
  const initialAi = params.get("ai") === "1";
  const initialRegion = params.get("region") ?? "";

  const [query, setQuery] = useState(initialQ);
  const [semantic, setSemantic] = useState(initialAi || !!initialQ);
  const [region, setRegion] = useState(initialRegion);
  const [category, setCategory] = useState(params.get("category") ?? "");
  const { token } = useAuthStore();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["books", query, semantic, region, category],
    queryFn: async () => {
      if (semantic && query.trim()) {
        const res = await api.get<{ results: Book[]; mode: string }>(
          `/api/books/search/semantic?q=${encodeURIComponent(query)}`,
        );
        return { books: res.results, mode: res.mode, total: res.results.length };
      }
      const qs = new URLSearchParams();
      if (query) qs.set("q", query);
      if (region) qs.set("region", region);
      if (category) qs.set("category", category);
      qs.set("limit", "48");
      const res = await api.get<{ books: Book[]; total: number }>(`/api/books?${qs}`);
      return { books: res.books, mode: "catalog", total: res.total };
    },
  });

  const borrow = useMutation({
    mutationFn: (bookId: string) => api.post("/api/borrows", { bookId }, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["borrows"] }),
  });

  const addWishlist = useMutation({
    mutationFn: async (bookId: string) => {
      const lists = await api.get<{ id: string }[]>("/api/wishlists", token);
      let listId = lists[0]?.id;
      if (!listId) {
        const created = await api.post<{ id: string }>("/api/wishlists", { name: "My Wishlist" }, token);
        listId = created.id;
      }
      return api.post(`/api/wishlists/${listId}/items`, { bookId }, token);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlists"] }),
  });

  function applyFilters() {
    const p: Record<string, string> = {};
    if (query) p.q = query;
    if (region) p.region = region;
    if (category) p.category = category;
    if (semantic) p.ai = "1";
    setParams(p);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Book Catalog</h1>
      <p className="mb-6 text-slate-500">
        {data?.total ?? 0} books — Indian & international authors with cover images
      </p>

      <div className="mb-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSemantic(true);
            applyFilters();
          }}
        >
          <Input
            placeholder="Search or ask naturally: 'books about startups'..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-[200px] flex-1"
          />
          <Button type="submit">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSemantic(true);
              applyFilters();
            }}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            AI Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          {REGIONS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                setRegion(r.id);
                setSemantic(false);
                setParams(r.id ? { region: r.id } : {});
              }}
              className={`rounded-full px-3 py-1 text-sm transition ${
                region === r.id
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setSemantic(false);
          }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
        >
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {data?.mode === "semantic" && (
        <p className="mb-4 flex items-center gap-2 text-sm text-indigo-600">
          <Sparkles className="h-4 w-4" />
          AI semantic search results
        </p>
      )}

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {data?.books?.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              showBorrow={!!token}
              onBorrow={(id) => borrow.mutate(id)}
              onWishlist={token ? (id) => addWishlist.mutate(id) : undefined}
            />
          ))}
        </div>
      )}

      {!isLoading && data?.books?.length === 0 && (
        <p className="py-12 text-center text-slate-500">No books found. Try a different search.</p>
      )}
    </div>
  );
}
