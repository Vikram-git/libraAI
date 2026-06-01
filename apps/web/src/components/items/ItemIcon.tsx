import { Package, Laptop, BookOpen, Coffee, Lamp, Pen } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_STYLES: Record<string, { icon: typeof Package; gradient: string }> = {
  electronics: { icon: Laptop, gradient: "from-blue-500 to-indigo-600" },
  stationery: { icon: Pen, gradient: "from-amber-500 to-orange-600" },
  furniture: { icon: Lamp, gradient: "from-emerald-500 to-teal-600" },
  books: { icon: BookOpen, gradient: "from-purple-500 to-violet-600" },
  kitchen: { icon: Coffee, gradient: "from-rose-500 to-pink-600" },
  default: { icon: Package, gradient: "from-slate-500 to-slate-700" },
};

export function ItemIcon({
  category,
  className,
}: {
  category?: string | null;
  className?: string;
}) {
  const key = category?.toLowerCase() ?? "default";
  const style = CATEGORY_STYLES[key] ?? CATEGORY_STYLES.default;
  const Icon = style.icon;

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl bg-gradient-to-br text-white",
        style.gradient,
        className,
      )}
    >
      <Icon className="h-10 w-10 opacity-90" />
    </div>
  );
}
