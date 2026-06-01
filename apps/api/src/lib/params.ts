import type { Request } from "express";
import { AppError } from "./errors.js";

/** Express 5 params can be string | string[] — normalize to string */
export function param(req: Request, key: string): string {
  const value = req.params[key];
  const id = Array.isArray(value) ? value[0] : value;
  if (!id) throw new AppError(400, `Missing route parameter: ${key}`);
  return id;
}
