import type { Request, Response, NextFunction } from "express";
import { AppError, handleError } from "../lib/errors.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return handleError(res, err);
  }
  return handleError(res, err);
}
