import { useQuery } from "@tanstack/react-query";
import { BarChart3, BookOpen, Users, AlertTriangle, IndianRupee } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface Analytics {
  overview: {
    totalBooks: number;
    totalMembers: number;
    activeBorrows: number;
    overdueBorrows: number;
    finesCollected: number;
    pendingFines: number;
  };
  mostBorrowed: Array<{ book: { title: string; author: string }; count: number }>;
  borrowTrends: Array<{ month: string; count: number }>;
  categoryPopularity: Array<{ category: { name: string }; count: number }>;
  activeMembers: Array<{ user: { name: string }; activeBorrows: number }>;
}

export function AdminDashboard() {
  const { token, user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN" || user?.role === "LIBRARIAN";

  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => api.get<Analytics>("/api/analytics/dashboard", token),
    enabled: !!token && isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="px-4 py-16 text-center">
        <p>Admin access required.</p>
        <Link to="/" className="text-indigo-600">
          Go home
        </Link>
      </div>
    );
  }

  if (isLoading) return <p className="p-8">Loading analytics...</p>;

  const stats = [
    { label: "Total Books", value: data?.overview.totalBooks, icon: BookOpen },
    { label: "Members", value: data?.overview.totalMembers, icon: Users },
    { label: "Active Borrows", value: data?.overview.activeBorrows, icon: BarChart3 },
    { label: "Overdue", value: data?.overview.overdueBorrows, icon: AlertTriangle },
    { label: "Fines Collected", value: `₹${data?.overview.finesCollected}`, icon: IndianRupee },
    { label: "Pending Fines", value: `₹${data?.overview.pendingFines}`, icon: IndianRupee },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Analytics Dashboard</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="flex items-center gap-4">
            <div className="rounded-lg bg-indigo-100 p-3 dark:bg-indigo-900/40">
              <Icon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted-foreground)]">{label}</p>
              <p className="text-2xl font-bold">{value ?? 0}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Most Borrowed Books</h2>
          <ul className="space-y-2">
            {data?.mostBorrowed.map((item, i) => (
              <li key={i} className="flex justify-between text-sm">
                <span>{item.book?.title ?? "Unknown"}</span>
                <span className="text-[var(--color-muted-foreground)]">{item.count} borrows</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Category Popularity</h2>
          <ul className="space-y-2">
            {data?.categoryPopularity.map((item, i) => (
              <li key={i} className="flex justify-between text-sm">
                <span>{item.category?.name ?? "Uncategorized"}</span>
                <span className="text-[var(--color-muted-foreground)]">{item.count} books</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Borrow Trends (12 months)</h2>
          <div className="flex items-end gap-1 h-32">
            {data?.borrowTrends.map((t) => {
              const max = Math.max(...(data.borrowTrends.map((x) => x.count) || [1]));
              const height = max ? (t.count / max) * 100 : 0;
              return (
                <div key={t.month} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-indigo-500"
                    style={{ height: `${height}%`, minHeight: t.count ? 4 : 0 }}
                    title={`${t.month}: ${t.count}`}
                  />
                  <span className="text-[10px] text-[var(--color-muted-foreground)]">
                    {t.month.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Most Active Members</h2>
          <ul className="space-y-2">
            {data?.activeMembers.map((item, i) => (
              <li key={i} className="flex justify-between text-sm">
                <span>{item.user?.name ?? "Unknown"}</span>
                <span className="text-[var(--color-muted-foreground)]">
                  {item.activeBorrows} active
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
