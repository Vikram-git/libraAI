import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Sparkles, ShoppingCart, Check } from "lucide-react";
import { useState } from "react";
import type { Book } from "@/lib/api";
import { BookCover } from "@/components/books/BookCover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/currency";
import { useCartStore } from "@/stores/cart";

interface BookCardProps {
  book: Book;
  onBorrow?: (id: string) => void;
  onWishlist?: (id: string) => void;
  showBorrow?: boolean;
  badge?: string;
}

export function BookCard({ book, onBorrow, onWishlist, showBorrow, badge }: BookCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const inCart = useCartStore((s) => s.items.some((i) => i.id === book.id));
  const [added, setAdded] = useState(false);
  const price = book.priceInr ?? 399;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: book.id,
      title: book.title,
      author: book.author,
      priceInr: price,
      coverUrl: book.coverUrl,
      isbn: book.isbn,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-xl dark:border-slate-700 dark:bg-slate-900"
    >
      <Link to={`/books/${book.id}`} className="relative block overflow-hidden">
        <BookCover book={book} size="md" className="aspect-[2/3] transition-transform duration-300 group-hover:scale-105" />
        {badge && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">
            <Sparkles className="h-3 w-3" />
            {badge}
          </span>
        )}
        {book.available === 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
            Unavailable
          </span>
        )}
      </Link>

      <div className="p-4">
        <Link to={`/books/${book.id}`}>
          <h3 className="line-clamp-2 font-semibold leading-snug text-slate-900 hover:text-indigo-600 dark:text-white">
            {book.title}
          </h3>
        </Link>
        <p className="mt-1 line-clamp-1 text-sm text-slate-500">{book.author}</p>

        <p className="mt-2 text-lg font-bold text-indigo-600">{formatINR(price)}</p>

        {book.category && (
          <span className="mt-2 inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
            {book.category.name}
          </span>
        )}

        <div className="mt-3 flex flex-col gap-2">
          <Button
            size="sm"
            className="w-full"
            variant={inCart || added ? "outline" : "default"}
            onClick={handleAddToCart}
          >
            {added ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Added!
              </>
            ) : inCart ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                In Cart
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </>
            )}
          </Button>

          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "text-xs font-medium",
                book.available > 0 ? "text-emerald-600" : "text-amber-600",
              )}
            >
              {book.available > 0 ? `${book.available} available` : "Reserve only"}
            </span>
            <div className="flex gap-1">
              {onWishlist && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onWishlist(book.id);
                  }}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                  aria-label="Add to wishlist"
                >
                  <Heart className="h-4 w-4" />
                </button>
              )}
              {showBorrow && book.available > 0 && onBorrow && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBorrow(book.id);
                  }}
                >
                  Borrow
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
