import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface Borrow {
  id: string;
  dueDate: string;
  status: string;
  book: { title: string; author: string; coverUrl?: string | null };
  fine?: { amount: number; paid: boolean } | null;
}

export function MyBooks() {
  const { token } = useAuthStore();

  const { data: borrows, isLoading } = useQuery({
    queryKey: ["borrows"],
    queryFn: () => api.get<Borrow[]>("/api/borrows/my", token),
    enabled: !!token,
  });

  if (!token) {
    return (
      <div className="px-4 py-16 text-center">
        <Link to="/login" className="text-indigo-600">
          Login
        </Link>{" "}
        to view your books.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">My Borrowed Books</h1>
      {isLoading && <p>Loading...</p>}
      <div className="space-y-4">
        {borrows?.filter((b) => b.status !== "RETURNED").map((borrow) => (
          <Card key={borrow.id} className="flex gap-4">
            <div className="h-20 w-14 shrink-0 overflow-hidden rounded bg-[var(--color-muted)]">
              {borrow.book.coverUrl ? (
                <img src={borrow.book.coverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">📚</div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{borrow.book.title}</h3>
              <p className="text-sm text-[var(--color-muted-foreground)]">{borrow.book.author}</p>
              <p className="mt-1 text-sm">
                Due: {new Date(borrow.dueDate).toLocaleDateString()}
                <span
                  className={`ml-2 rounded px-2 py-0.5 text-xs ${
                    borrow.status === "OVERDUE"
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {borrow.status}
                </span>
              </p>
              {borrow.fine && !borrow.fine.paid && (
                <p className="mt-1 text-sm text-red-600">Fine: ₹{borrow.fine.amount}</p>
              )}
            </div>
          </Card>
        ))}
        {borrows?.length === 0 && (
          <p className="text-[var(--color-muted-foreground)]">No active borrows.</p>
        )}
      </div>
    </div>
  );
}
