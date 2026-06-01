import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { api, type Book } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { BookCover } from "@/components/books/BookCover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { getBookCoverUrl } from "@/lib/covers";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface BookForm {
  title: string;
  author: string;
  isbn: string;
  description: string;
  coverUrl: string;
  publishedYear: string;
  totalCopies: string;
  categoryId: string;
}

const emptyForm: BookForm = {
  title: "",
  author: "",
  isbn: "",
  description: "",
  coverUrl: "",
  publishedYear: "",
  totalCopies: "3",
  categoryId: "",
};

export function ManageBooks() {
  const { token, user } = useAuthStore();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<BookForm>(emptyForm);

  const isStaff = user?.role === "ADMIN" || user?.role === "LIBRARIAN";

  const { data: booksData, isLoading } = useQuery({
    queryKey: ["admin-books", search],
    queryFn: () =>
      api.get<{ books: Book[]; total: number }>(
        `/api/books?q=${encodeURIComponent(search)}&limit=100`,
        token,
      ),
    enabled: !!token && isStaff,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<Category[]>("/api/categories"),
  });

  const createBook = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post<Book>("/api/books", body, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-books"] });
      qc.invalidateQueries({ queryKey: ["books"] });
      closeModal();
    },
  });

  const updateBook = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.patch<Book>(`/api/books/${id}`, body, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-books"] });
      qc.invalidateQueries({ queryKey: ["books"] });
      closeModal();
    },
  });

  const deleteBook = useMutation({
    mutationFn: (id: string) => api.delete(`/api/books/${id}`, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-books"] }),
  });

  function closeModal() {
    setModal(null);
    setEditId(null);
    setForm(emptyForm);
  }

  function openCreate() {
    setForm(emptyForm);
    setEditId(null);
    setModal("create");
  }

  function openEdit(book: Book & { category?: { id: string } }) {
    setEditId(book.id);
    setForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn ?? "",
      description: book.description ?? "",
      coverUrl: book.coverUrl ?? getBookCoverUrl(book) ?? "",
      publishedYear: "",
      totalCopies: String(book.totalCopies),
      categoryId: book.category?.id ?? "",
    });
    setModal("edit");
  }

  function submitForm(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      title: form.title,
      author: form.author,
      isbn: form.isbn || undefined,
      description: form.description || undefined,
      coverUrl: form.coverUrl || undefined,
      publishedYear: form.publishedYear ? Number(form.publishedYear) : undefined,
      totalCopies: Number(form.totalCopies) || 1,
      categoryId: form.categoryId || undefined,
    };
    if (modal === "edit" && editId) {
      updateBook.mutate({ id: editId, body });
    } else {
      createBook.mutate(body);
    }
  }

  if (!isStaff) {
    return (
      <div className="px-4 py-16 text-center">
        <p>Staff access required.</p>
        <Link to="/" className="text-indigo-600">
          Home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manage Books</h1>
          <p className="text-slate-500">Full CRUD — add, edit, delete catalog entries</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Book
        </Button>
      </div>

      <div className="mb-6 flex gap-2">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-10"
            placeholder="Search books to manage..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="p-4">Cover</th>
                <th className="p-4">Title</th>
                <th className="p-4">Author</th>
                <th className="p-4">ISBN</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {booksData?.books.map((book) => (
                <tr key={book.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="p-2">
                    <div className="h-16 w-12 overflow-hidden rounded">
                      <BookCover book={book} size="sm" className="!h-16" />
                    </div>
                  </td>
                  <td className="p-4 font-medium">{book.title}</td>
                  <td className="p-4 text-slate-500">{book.author}</td>
                  <td className="p-4 font-mono text-xs">{book.isbn ?? "—"}</td>
                  <td className="p-4">
                    {book.available}/{book.totalCopies}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(book)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Delete "${book.title}"?`)) {
                            deleteBook.mutate(book.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="p-4 text-sm text-slate-500">Total: {booksData?.total ?? 0} books</p>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
            <h2 className="mb-4 text-xl font-bold">
              {modal === "create" ? "Add New Book" : "Edit Book"}
            </h2>
            <form onSubmit={submitForm} className="space-y-3">
              <Input
                placeholder="Title *"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <Input
                placeholder="Author *"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                required
              />
              <Input
                placeholder="ISBN"
                value={form.isbn}
                onChange={(e) => setForm({ ...form, isbn: e.target.value })}
              />
              <Input
                placeholder="Cover URL"
                value={form.coverUrl}
                onChange={(e) => setForm({ ...form, coverUrl: e.target.value })}
              />
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-600 dark:bg-slate-800"
                rows={3}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="Published year"
                  value={form.publishedYear}
                  onChange={(e) => setForm({ ...form, publishedYear: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Total copies"
                  value={form.totalCopies}
                  onChange={(e) => setForm({ ...form, totalCopies: e.target.value })}
                  min={1}
                />
              </div>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              >
                <option value="">Select category</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={createBook.isPending || updateBook.isPending}>
                  {modal === "create" ? "Create" : "Save"}
                </Button>
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
