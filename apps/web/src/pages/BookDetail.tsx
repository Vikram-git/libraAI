import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, Sparkles, ShoppingCart, Check } from "lucide-react";
import { api, type Book } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { Button } from "@/components/ui/button";
import { BookCard } from "@/components/books/BookCard";
import { BookCover } from "@/components/books/BookCover";
import { formatINR } from "@/lib/currency";

export function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuthStore();
  const qc = useQueryClient();
  const addItem = useCartStore((s) => s.addItem);
  const inCart = useCartStore((s) => s.items.some((i) => i.id === id));
  const [added, setAdded] = useState(false);

  const { data: book, isLoading } = useQuery({
    queryKey: ["book", id],
    queryFn: () => api.get<Book>(`/api/books/${id}`),
    enabled: !!id,
  });

  const { data: related } = useQuery({
    queryKey: ["also-borrowed", id],
    queryFn: () => api.get<Book[]>(`/api/books/${id}/also-borrowed`),
    enabled: !!id,
  });

  const { data: recommendations } = useQuery({
    queryKey: ["recommendations", "for-you"],
    queryFn: () => api.get<Book[]>("/api/recommendations/for-you", token),
    enabled: !!token,
  });

  const borrow = useMutation({
    mutationFn: () => api.post("/api/borrows", { bookId: id }, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["borrows"] }),
  });

  const reserve = useMutation({
    mutationFn: () => api.post("/api/reservations", { bookId: id }, token),
  });

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!book) return <div className="p-8">Book not found</div>;

  const price = book.priceInr ?? 399;

  function handleAddToCart() {
    addItem({
      id: book!.id,
      title: book!.title,
      author: book!.author,
      priceInr: price,
      coverUrl: book!.coverUrl,
      isbn: book!.isbn,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
        <div className="overflow-hidden rounded-2xl shadow-xl">
          <BookCover book={book} size="lg" className="!h-auto min-h-[420px]" />
        </div>
        <div>
          {book.category && (
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
              {book.category.name}
            </span>
          )}
          <h1 className="mt-3 text-4xl font-bold">{book.title}</h1>
          <p className="mt-2 text-xl text-slate-500">by {book.author}</p>
          {book.isbn && <p className="mt-1 font-mono text-sm text-slate-400">ISBN: {book.isbn}</p>}

          <p className="mt-4 text-3xl font-bold text-indigo-600">{formatINR(price)}</p>
          <p className="text-sm text-slate-400">Price in Indian Rupees (INR)</p>

          <div className="mt-4 flex flex-wrap gap-3">
            <span
              className={`rounded-lg px-3 py-1 text-sm font-medium ${
                book.available > 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {book.available} of {book.totalCopies} copies available
            </span>
          </div>

          {book.description && (
            <p className="mt-6 leading-relaxed text-slate-600 dark:text-slate-300">{book.description}</p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={handleAddToCart} variant={inCart || added ? "outline" : "default"}>
              {added ? (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Added to Cart!
                </>
              ) : inCart ? (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  In Cart
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Add to Cart
                </>
              )}
            </Button>
            <Link to="/cart">
              <Button size="lg" variant="outline">
                View Cart
              </Button>
            </Link>
            {token && (
              <>
                {book.available > 0 ? (
                  <Button size="lg" variant="outline" onClick={() => borrow.mutate()} disabled={borrow.isPending}>
                    Borrow Free
                  </Button>
                ) : (
                  <Button size="lg" variant="outline" onClick={() => reserve.mutate()} disabled={reserve.isPending}>
                    Reserve
                  </Button>
                )}
                <Link to="/wishlist">
                  <Button size="lg" variant="ghost">
                    <Heart className="mr-2 h-4 w-4" />
                    Wishlist
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {related && related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            Readers also borrowed
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-4">
            {related.map((r) => (
              <BookCard key={r.id} book={{ ...r, available: r.available ?? 1, totalCopies: r.totalCopies ?? 1 }} />
            ))}
          </div>
        </section>
      )}

      {recommendations && recommendations.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-4 text-xl font-bold">You might also like</h2>
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-4">
            {recommendations
              .filter((b) => b.id !== id)
              .slice(0, 4)
              .map((b) => (
                <BookCard key={b.id} book={b} badge="For You" />
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
