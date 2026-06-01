import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Moon, Sun, LogOut, LayoutDashboard, MessageCircle, Library, Package, ShoppingCart } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";
import { useCartStore } from "@/stores/cart";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user, token, logout } = useAuthStore();
  const { theme, toggle } = useThemeStore();
  const navigate = useNavigate();

  const isAdmin = user?.role === "ADMIN" || user?.role === "LIBRARIAN";
  const cartCount = useCartStore((s) => s.items.length);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-card)]/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-indigo-600">
          <BookOpen className="h-6 w-6" />
          LibraAI
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/catalog" className="text-sm hover:text-indigo-600">
            Catalog
          </Link>
          <Link to="/items" className="flex items-center gap-1 text-sm hover:text-indigo-600">
            <Package className="h-4 w-4" />
            Items
          </Link>
          {token && (
            <>
              <Link to="/my-books" className="text-sm hover:text-indigo-600">
                My Books
              </Link>
              <Link to="/wishlist" className="text-sm hover:text-indigo-600">
                Wishlist
              </Link>
              <Link to="/chat" className="flex items-center gap-1 text-sm hover:text-indigo-600">
                <MessageCircle className="h-4 w-4" />
                AI Librarian
              </Link>
            </>
          )}
          {isAdmin && (
            <>
              <Link
                to="/admin"
                className="flex items-center gap-1 text-sm hover:text-indigo-600"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                to="/admin/books"
                className="flex items-center gap-1 text-sm hover:text-indigo-600"
              >
                <Library className="h-4 w-4" />
                Manage Books
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/cart" className="relative rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ShoppingCart className="h-5 w-5 text-slate-600" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
          <Button variant="ghost" size="sm" onClick={toggle} aria-label="Toggle theme">
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
          {token ? (
            <>
              <span className="hidden text-sm text-[var(--color-muted-foreground)] sm:inline">
                {user?.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
