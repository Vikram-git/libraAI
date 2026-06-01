import { useState, useMemo } from "react";
import {
  getBookCoverCandidates,
  getPlaceholderGradient,
  getInitials,
} from "@/lib/covers";
import type { Book } from "@/lib/api";
import { cn } from "@/lib/utils";

interface BookCoverProps {
  book: Pick<Book, "id" | "title" | "isbn" | "coverUrl" | "author">;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-32",
  md: "h-48",
  lg: "h-72",
};

export function BookCover({ book, className, size = "md" }: BookCoverProps) {
  const candidates = useMemo(() => getBookCoverCandidates(book), [book]);
  const [srcIndex, setSrcIndex] = useState(0);

  const currentUrl = candidates[srcIndex];
  const exhausted = srcIndex >= candidates.length;

  if (currentUrl && !exhausted) {
    return (
      <img
        key={`${book.id}-${srcIndex}`}
        src={currentUrl}
        alt={book.title}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setSrcIndex((i) => i + 1)}
        className={cn("w-full object-cover bg-slate-100", sizes[size], className)}
      />
    );
  }

  const gradient = getPlaceholderGradient(book.title);
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center bg-gradient-to-br p-4 text-white",
        gradient,
        sizes[size],
        className,
      )}
    >
      <span className="text-3xl font-bold opacity-90">{getInitials(book.title)}</span>
      <span className="mt-2 line-clamp-2 text-center text-xs font-medium opacity-80">
        {book.author}
      </span>
    </div>
  );
}
