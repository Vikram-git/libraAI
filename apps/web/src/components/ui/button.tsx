import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "default",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50",
        variant === "default" && "bg-indigo-600 text-white hover:bg-indigo-700",
        variant === "outline" &&
          "border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-muted)]",
        variant === "ghost" && "hover:bg-[var(--color-muted)]",
        variant === "destructive" && "bg-red-600 text-white hover:bg-red-700",
        size === "sm" && "h-8 px-3 text-sm",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-12 px-6",
        className,
      )}
      {...props}
    />
  );
}
