const API_BASE = import.meta.env.VITE_API_URL ?? "";

type RequestOptions = RequestInit & { token?: string | null };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? "Request failed");
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: "GET", token }),

  post: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body), token }),

  patch: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body), token }),

  put: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body), token }),

  delete: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: "DELETE", token }),
};

export interface Item {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  quantity: number;
  category?: string | null;
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ItemsListResponse {
  items: Item[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "MEMBER" | "LIBRARIAN" | "ADMIN";
  readingGoal?: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string | null;
  description?: string | null;
  coverUrl?: string | null;
  priceInr?: number;
  available: number;
  totalCopies: number;
  category?: { name: string; slug: string } | null;
}
