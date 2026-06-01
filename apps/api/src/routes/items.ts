import { Router, type Request, type Response, type NextFunction } from "express";
import { ZodError, type z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { authenticate, type AuthRequest } from "../lib/auth.js";
import {
  createItemSchema,
  updateItemSchema,
  listItemsQuerySchema,
} from "../validators/item.js";

const router = Router();
const REQUIRE_AUTH = process.env.ITEMS_REQUIRE_AUTH === "true";

function validateBody<T>(schema: { parse: (data: unknown) => T }) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        next(new AppError(400, e.errors.map((x) => x.message).join(", ")));
      } else {
        next(e);
      }
    }
  };
}

function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!REQUIRE_AUTH) return next();
  return authenticate(req, res, next);
}

/** GET /items — list with pagination & filters */
router.get("/", async (req, res, next) => {
  try {
    const query = listItemsQuerySchema.parse(req.query);
    const { page, limit, q, category, minPrice, maxPrice, sortBy, sortOrder } = query;

    const where = {
      ...(q
        ? {
            OR: [{ name: { contains: q } }, { description: { contains: q } }],
          }
        : {}),
      ...(category ? { category } : {}),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            price: {
              ...(minPrice !== undefined ? { gte: minPrice } : {}),
              ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.item.count({ where }),
    ]);

    res.status(200).json({
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    if (e instanceof ZodError) {
      return next(new AppError(400, e.errors.map((x) => x.message).join(", ")));
    }
    next(e);
  }
});

/** POST /items — create */
router.post(
  "/",
  requireAuth,
  validateBody(createItemSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const data = req.body as z.infer<typeof createItemSchema>;
      const item = await prisma.item.create({
        data: {
          name: data.name,
          description: data.description,
          price: data.price ?? 0,
          quantity: data.quantity ?? 0,
          category: data.category,
          userId: req.user?.userId,
        },
      });
      res.status(201).json(item);
    } catch (e) {
      next(e);
    }
  },
);

/** GET /items/:id */
router.get("/:id", async (req, res, next) => {
  try {
    const item = await prisma.item.findUnique({ where: { id: req.params.id } });
    if (!item) throw new AppError(404, "Item not found");
    res.status(200).json(item);
  } catch (e) {
    next(e);
  }
});

/** PUT /items/:id */
router.put(
  "/:id",
  requireAuth,
  validateBody(updateItemSchema),
  async (req, res, next) => {
    try {
      const existing = await prisma.item.findUnique({ where: { id: req.params.id } });
      if (!existing) throw new AppError(404, "Item not found");

      const item = await prisma.item.update({
        where: { id: req.params.id },
        data: req.body,
      });
      res.status(200).json(item);
    } catch (e) {
      next(e);
    }
  },
);

/** DELETE /items/:id */
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const existing = await prisma.item.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, "Item not found");

    await prisma.item.delete({ where: { id: req.params.id } });
    res.status(200).json({ message: "Item deleted successfully", id: req.params.id });
  } catch (e) {
    next(e);
  }
});

export default router;
