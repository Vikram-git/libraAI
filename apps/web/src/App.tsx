import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Home } from "@/pages/Home";
import { Catalog } from "@/pages/Catalog";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { Chat } from "@/pages/Chat";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { MyBooks } from "@/pages/MyBooks";
import { Wishlist } from "@/pages/Wishlist";
import { Cart } from "@/pages/Cart";
import { BookDetail } from "@/pages/BookDetail";
import { ManageBooks } from "@/pages/ManageBooks";
import { ItemsPage } from "@/pages/items/ItemsPage";
import { ItemDetailPage } from "@/pages/items/ItemDetailPage";
import { FloatingChat } from "@/components/chat/FloatingChat";
import { useEffect } from "react";
import { useThemeStore } from "@/stores/theme";

const queryClient = new QueryClient();

function ThemeInit() {
  const theme = useThemeStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeInit />
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/books/:id" element={<BookDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/books" element={<ManageBooks />} />
            <Route path="/my-books" element={<MyBooks />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/items" element={<ItemsPage />} />
            <Route path="/items/:id" element={<ItemDetailPage />} />
          </Routes>
        </main>
        <FloatingChat />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
