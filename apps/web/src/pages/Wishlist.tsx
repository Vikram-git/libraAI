import { useQuery } from "@tanstack/react-query";
import { api, type Book } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { BookCard } from "@/components/books/BookCard";
import { Link } from "react-router-dom";

interface WishlistData {
  id: string;
  name: string;
  items: Array<{ id: string; book: Book }>;
}

export function Wishlist() {
  const { token } = useAuthStore();

  const { data: wishlists, isLoading } = useQuery({
    queryKey: ["wishlists"],
    queryFn: () => api.get<WishlistData[]>("/api/wishlists", token),
    enabled: !!token,
  });

  if (!token) {
    return (
      <div className="px-4 py-16 text-center">
        <Link to="/login" className="text-indigo-600">
          Login
        </Link>{" "}
        to manage your wishlist.
      </div>
    );
  }

  const items = wishlists?.flatMap((w) => w.items) ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">My Wishlist</h1>
      {isLoading && <p>Loading...</p>}
      {items.length === 0 ? (
        <p className="text-[var(--color-muted-foreground)]">
          Your wishlist is empty. Browse the{" "}
          <Link to="/catalog" className="text-indigo-600">
            catalog
          </Link>{" "}
          to save books.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map(({ book }) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
