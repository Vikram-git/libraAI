import { Router } from "express";

const router = Router();

/** Open Library ISBN lookup for barcode scanner auto-fill */
router.get("/:isbn", async (req, res, next) => {
  try {
    const isbn = req.params.isbn.replace(/-/g, "");
    const response = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
    );
    const data = (await response.json()) as Record<
      string,
      {
        title?: string;
        authors?: Array<{ name: string }>;
        publishers?: Array<{ name: string }>;
        publish_date?: string;
        covers?: number[];
        description?: string | { value: string };
      }
    >;

    const key = `ISBN:${isbn}`;
    const book = data[key];
    if (!book) {
      return res.status(404).json({ error: "ISBN not found" });
    }

    const description =
      typeof book.description === "string"
        ? book.description
        : book.description?.value;

    res.json({
      title: book.title,
      author: book.authors?.map((a) => a.name).join(", ") ?? "Unknown",
      publishedYear: book.publish_date ? parseInt(book.publish_date, 10) : undefined,
      coverUrl: book.covers?.[0]
        ? `https://covers.openlibrary.org/b/id/${book.covers[0]}-L.jpg`
        : undefined,
      description,
      isbn,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
