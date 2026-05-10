export class AppError extends Error {
  constructor(msg: string, public statusCode = 500, public code = "INTERNAL_ERROR") { super(msg); }
}
export class NotFoundError extends AppError { constructor(r: string) { super(`${r} non trouvé`, 404, "NOT_FOUND"); } }
export class ValidationError extends AppError { constructor(m: string) { super(m, 400, "VALIDATION_ERROR"); } }
export class UnauthorizedError extends AppError { constructor(m = "Non authentifié") { super(m, 401, "UNAUTHORIZED"); } }
