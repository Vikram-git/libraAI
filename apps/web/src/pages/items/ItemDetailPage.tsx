import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { api, type Item } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ItemIcon } from "@/components/items/ItemIcon";
import { ItemForm, emptyItemForm, type ItemFormData } from "@/components/items/ItemForm";

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ItemFormData>(emptyItemForm);
  const [formError, setFormError] = useState("");

  const { data: item, isLoading, error } = useQuery({
    queryKey: ["item", id],
    queryFn: () => api.get<Item>(`/api/items/${id}`),
    enabled: !!id,
  });

  const updateItem = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.put<Item>(`/api/items/${id}`, body, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["item", id] });
      qc.invalidateQueries({ queryKey: ["items"] });
      setEditing(false);
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const deleteItem = useMutation({
    mutationFn: () => api.delete(`/api/items/${id}`, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      navigate("/items");
    },
  });

  function startEdit() {
    if (!item) return;
    setForm({
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      quantity: String(item.quantity),
      category: item.category ?? "",
    });
    setEditing(true);
  }

  function submitForm(e: React.FormEvent) {
    e.preventDefault();
    updateItem.mutate({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: parseFloat(form.price) || 0,
      quantity: parseInt(form.quantity, 10) || 0,
      category: form.category || undefined,
    });
  }

  if (isLoading) {
    return <div className="p-8 text-center">Loading item...</div>;
  }

  if (error || !item) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <p className="text-red-600">Item not found (404)</p>
        <Link to="/items">
          <Button className="mt-4">Back to Items</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          to="/items"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Items
        </Link>

        {editing ? (
          <Card className="p-6">
            <h1 className="mb-4 text-xl font-bold">Edit Item</h1>
            <ItemForm
              form={form}
              onChange={setForm}
              onSubmit={submitForm}
              onCancel={() => setEditing(false)}
              submitLabel="Save Changes"
              loading={updateItem.isPending}
              error={formError}
            />
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <ItemIcon category={item.category} className="h-48 w-full rounded-none" />
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  {item.category && (
                    <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-medium capitalize text-emerald-700">
                      {item.category}
                    </span>
                  )}
                  <h1 className="mt-2 text-3xl font-bold">{item.name}</h1>
                  {item.description && (
                    <p className="mt-3 text-slate-600 dark:text-slate-300">{item.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-emerald-600">₹{item.price.toFixed(2)}</p>
                  <p className="text-sm text-slate-500">{item.quantity} in stock</p>
                </div>
              </div>

              <dl className="mt-6 grid gap-3 border-t border-slate-100 pt-6 text-sm dark:border-slate-800 sm:grid-cols-2">
                <div>
                  <dt className="text-slate-400">Item ID</dt>
                  <dd className="font-mono text-xs">{item.id}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Total Value</dt>
                  <dd className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Created</dt>
                  <dd>{new Date(item.createdAt).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Updated</dt>
                  <dd>{new Date(item.updatedAt).toLocaleString()}</dd>
                </div>
              </dl>

              <div className="mt-6 flex gap-3">
                <Button onClick={startEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm(`Delete "${item.name}"?`)) deleteItem.mutate();
                  }}
                  disabled={deleteItem.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
