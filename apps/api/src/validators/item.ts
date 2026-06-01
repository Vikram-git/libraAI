import { z } from "zod";

export const createItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional(),
  price: z.number().min(0, "Price must be non-negative").optional(),
  quantity: z.number().int().min(0, "Quantity must be non-negative").optional(),
  category: z.string().max(100).optional(),
});

export const updateItemSchema = createItemSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required for update" },
);

export const listItemsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sortBy: z.enum(["name", "price", "quantity", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
