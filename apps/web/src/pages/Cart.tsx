import { Link } from "react-router-dom";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { BookCover } from "@/components/books/BookCover";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatINR } from "@/lib/currency";

export function Cart() {
  const { items, removeItem, clearCart, totalPrice } = useCartStore();
  const total = totalPrice();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-slate-300" />
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-slate-500">Browse our catalog and add books to cart.</p>
        <Link to="/catalog">
          <Button className="mt-6">Browse Books</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <Button variant="outline" size="sm" onClick={clearCart}>
          Clear cart
        </Button>
      </div>

      <div className="space-y-4">
        {items.map((book) => (
          <Card key={book.id} className="flex gap-4 p-4">
            <div className="h-28 w-20 shrink-0 overflow-hidden rounded-lg">
              <BookCover
                book={{
                  id: book.id,
                  title: book.title,
                  author: book.author,
                  isbn: book.isbn,
                  coverUrl: book.coverUrl,
                }}
                size="sm"
                className="!h-28"
              />
            </div>
            <div className="flex flex-1 flex-col justify-between sm:flex-row sm:items-center">
              <div>
                <Link to={`/books/${book.id}`} className="font-semibold hover:text-indigo-600">
                  {book.title}
                </Link>
                <p className="text-sm text-slate-500">{book.author}</p>
              </div>
              <div className="mt-2 flex items-center gap-4 sm:mt-0">
                <p className="text-lg font-bold text-indigo-600">{formatINR(book.priceInr)}</p>
                <button
                  type="button"
                  onClick={() => removeItem(book.id)}
                  className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-8 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-500">{items.length} book(s)</p>
            <p className="text-2xl font-bold">{formatINR(total)}</p>
            <p className="text-xs text-slate-400">Prices in INR · Library purchase / borrow fees</p>
          </div>
          <Button size="lg" className="gap-2">
            Proceed to Checkout
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">
          Or{" "}
          <Link to="/catalog" className="text-indigo-600 hover:underline">
            continue shopping
          </Link>
        </p>
      </Card>
    </div>
  );
}
