import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { api, type Item, type ItemsListResponse } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ItemIcon } from "@/components/items/ItemIcon";
import { ItemForm, emptyItemForm, type ItemFormData } from "@/components/items/ItemForm";

const CATEGORIES = ["", "electronics", "stationery", "furniture", "books", "kitchen", "other"];

export function ItemsPage() {
  const { token } = useAuthStore();
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [form, setForm] = useState<ItemFormData>(emptyItemForm);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const limit = 12;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["items", page, search, category, sortBy],
    queryFn: () => {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy,
        sortOrder: "desc",
      });
      if (search) qs.set("q", search);
      if (category) qs.set("category", category);
      return api.get<ItemsListResponse>(`/api/items?${qs}`, token);
    },
  });

  const createItem = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post<Item>("/api/items", body, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      closeModal();
      showToast("success", "Item created successfully");
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const updateItem = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.put<Item>(`/api/items/${id}`, body, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      closeModal();
      showToast("success", "Item updated successfully");
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => api.delete(`/api/items/${id}`, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      showToast("success", "Item deleted");
    },
    onError: (e: Error) => showToast("error", e.message),
  });

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  function closeModal() {
    setModal(null);
    setEditItem(null);
    setForm(emptyItemForm);
    setFormError("");
  }

  function openCreate() {
    setForm(emptyItemForm);
    setEditItem(null);
    setModal("create");
  }

  function openEdit(item: Item) {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      quantity: String(item.quantity),
      category: item.category ?? "",
    });
    setModal("edit");
  }

  function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const body = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: parseFloat(form.price) || 0,
      quantity: parseInt(form.quantity, 10) || 0,
      category: form.category || undefined,
    };
    if (modal === "edit" && editItem) {
      updateItem.mutate({ id: editItem.id, body });
    } else {
      createItem.mutate(body);
    }
  }

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const totalValue = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed right-6 top-20 z-50 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
              toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <section className="bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Package className="h-8 w-8" />
                <span className="rounded-full bg-white/20 px-3 py-0.5 text-sm">REST CRUD</span>
              </div>
              <h1 className="text-3xl font-bold md:text-4xl">Items Inventory</h1>
              <p className="mt-2 text-emerald-100">
                Full CRUD — Create, Read, Update, Delete with filters & pagination
              </p>
            </div>
            <Button
              onClick={openCreate}
              className="bg-white text-emerald-700 hover:bg-emerald-50"
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Item
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Total Items", value: pagination?.total ?? 0 },
              { label: "This Page", value: items.length },
              { label: "Page", value: `${pagination?.page ?? 1} / ${pagination?.totalPages ?? 1}` },
              { label: "Page Value", value: `₹${totalValue.toFixed(0)}` },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs text-emerald-200">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Filters */}
        <Card className="mb-6 p-4">
          <form
            className="flex flex-wrap gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchInput);
              setPage(1);
            }}
          >
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-10"
                placeholder="Search items..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c ? c.charAt(0).toUpperCase() + c.slice(1) : "All Categories"}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
            >
              <option value="createdAt">Newest</option>
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="quantity">Quantity</option>
            </select>
            <Button type="submit">
              <Filter className="mr-2 h-4 w-4" />
              Search
            </Button>
            <div className="ml-auto flex gap-1">
              <button
                type="button"
                onClick={() => setView("grid")}
                className={`rounded-lg p-2 ${view === "grid" ? "bg-indigo-100 text-indigo-700" : "text-slate-400"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView("table")}
                className={`rounded-lg p-2 ${view === "table" ? "bg-indigo-100 text-indigo-700" : "text-slate-400"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </form>
        </Card>

        {/* Content */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : isError ? (
          <Card className="p-8 text-center text-red-600">
            Failed to load items. Is the API running on port 4000?
          </Card>
        ) : items.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-slate-500">No items found.</p>
            <Button className="mt-4" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Item
            </Button>
          </Card>
        ) : view === "grid" ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onEdit={() => openEdit(item)}
                onDelete={() => {
                  if (confirm(`Delete "${item.name}"?`)) deleteItem.mutate(item.id);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="p-4">Item</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Qty</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="p-4">
                      <Link to={`/items/${item.id}`} className="font-medium hover:text-indigo-600">
                        {item.name}
                      </Link>
                    </td>
                    <td className="p-4 capitalize text-slate-500">{item.category ?? "—"}</td>
                    <td className="p-4">₹{item.price.toFixed(2)}</td>
                    <td className="p-4">{item.quantity}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Delete "${item.name}"?`)) deleteItem.mutate(item.id);
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
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-h-[90vh] w-full max-w-md overflow-y-auto">
            <h2 className="mb-4 text-xl font-bold">
              {modal === "create" ? "Add New Item" : "Edit Item"}
            </h2>
            <ItemForm
              form={form}
              onChange={setForm}
              onSubmit={submitForm}
              onCancel={closeModal}
              submitLabel={modal === "create" ? "Create Item" : "Save Changes"}
              loading={createItem.isPending || updateItem.isPending}
              error={formError}
            />
          </Card>
        </div>
      )}
    </div>
  );
}

function ItemCard({
  item,
  onEdit,
  onDelete,
}: {
  item: Item;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
    >
      <Link to={`/items/${item.id}`}>
        <ItemIcon category={item.category} className="h-36 w-full rounded-none" />
      </Link>
      <div className="p-4">
        <Link to={`/items/${item.id}`}>
          <h3 className="font-semibold hover:text-indigo-600">{item.name}</h3>
        </Link>
        {item.description && (
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-emerald-600">₹{item.price.toFixed(2)}</p>
            <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
          </div>
          {item.category && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize dark:bg-slate-800">
              {item.category}
            </span>
          )}
        </div>
        <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
            <Pencil className="mr-1 h-3 w-3" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
