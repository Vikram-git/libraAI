import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartBook {
  id: string;
  title: string;
  author: string;
  priceInr: number;
  coverUrl?: string | null;
  isbn?: string | null;
}

interface CartState {
  items: CartBook[];
  addItem: (book: CartBook) => void;
  removeItem: (bookId: string) => void;
  updateQuantity: (bookId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (book) => {
        set((state) => {
          const existing = state.items.find((i) => i.id === book.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === book.id ? { ...i } : i,
              ),
            };
          }
          return { items: [...state.items, book] };
        });
      },
      removeItem: (bookId) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== bookId) })),
      updateQuantity: (bookId, quantity) => {
        if (quantity < 1) {
          get().removeItem(bookId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.id === bookId ? { ...i } : i,
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.length,
      totalPrice: () => get().items.reduce((sum, i) => sum + i.priceInr, 0),
    }),
    { name: "libraai-cart" },
  ),
);
