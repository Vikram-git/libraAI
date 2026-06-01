import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface ItemFormData {
  name: string;
  description: string;
  price: string;
  quantity: string;
  category: string;
}

export const emptyItemForm: ItemFormData = {
  name: "",
  description: "",
  price: "",
  quantity: "0",
  category: "",
};

const CATEGORIES = [
  "",
  "electronics",
  "stationery",
  "furniture",
  "books",
  "kitchen",
  "other",
];

interface ItemFormProps {
  form: ItemFormData;
  onChange: (form: ItemFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitLabel: string;
  loading?: boolean;
  error?: string;
}

export function ItemForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  loading,
  error,
}: ItemFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Name *</label>
        <Input
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          placeholder="Item name"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          placeholder="Optional description"
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Price (₹) *</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => onChange({ ...form, price: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Quantity *</label>
          <Input
            type="number"
            min="0"
            value={form.quantity}
            onChange={(e) => onChange({ ...form, quantity: e.target.value })}
            required
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Category</label>
        <select
          value={form.category}
          onChange={(e) => onChange({ ...form, category: e.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c ? c.charAt(0).toUpperCase() + c.slice(1) : "Select category"}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
