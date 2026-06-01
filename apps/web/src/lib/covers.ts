import type { Book } from "@/lib/api";

const PLACEHOLDER_COLORS = [
  "from-indigo-500 to-purple-600",
  "from-rose-500 to-orange-500",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-yellow-600",
  "from-cyan-500 to-blue-600",
];

/** Multiple cover sources — try in order when one fails to load */
export function getBookCoverCandidates(
  book: Pick<Book, "isbn" | "coverUrl" | "title">,
): string[] {
  const isbn = book.isbn?.replace(/-/g, "");
  const candidates: string[] = [];

  if (book.coverUrl) candidates.push(book.coverUrl);

  if (isbn) {
    candidates.push(
      `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`,
      `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`,
      `https://covers.openlibrary.org/b/isbn/${isbn}-S.jpg?default=false`,
      `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
      `https://books.google.com/books/content?isbn=${isbn}&printsec=frontcover&img=1&zoom=1&source=gbs_api`,
    );
  }

  return [...new Set(candidates)];
}

export function getBookCoverUrl(book: Pick<Book, "isbn" | "coverUrl" | "title">): string | null {
  const candidates = getBookCoverCandidates(book);
  return candidates[0] ?? null;
}

export function getPlaceholderGradient(title: string) {
  const index = title.charCodeAt(0) % PLACEHOLDER_COLORS.length;
  return PLACEHOLDER_COLORS[index];
}

export function getInitials(title: string) {
  return title
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
