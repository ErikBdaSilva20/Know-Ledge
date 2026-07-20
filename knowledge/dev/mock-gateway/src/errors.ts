import type { ContentfulStatusCode } from "hono/utils/http-status";

// Provisional error envelope for the local harness — mirrors Story 5.1 AC#1
// ({ error: { code, message, request_id } }), close enough to exercise
// Story 5.2's status-code expectations without depending on the real
// gateway's exact schema.
export class ApiError extends Error {
  constructor(
    public status: ContentfulStatusCode,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorBody(err: ApiError, requestId: string) {
  return { error: { code: err.code, message: err.message, request_id: requestId } };
}

interface PgError {
  code?: string;
  constraint?: string;
  detail?: string;
}

// Story 5.5 AC#1 — never let a raw Postgres error (constraint name, SQL
// fragment) reach the client. Only translate the constraint-violation codes
// that can actually happen given this schema (Story 2.1-2.4); anything else
// falls through to the generic 500 in index.ts, which logs it server-side.
export function translatePgError(err: unknown): ApiError | null {
  const pgErr = err as PgError;
  if (typeof pgErr?.code !== "string") return null;
  switch (pgErr.code) {
    case "23505": // unique_violation
      return new ApiError(409, "conflict", "This already exists.");
    case "23503": // foreign_key_violation
      return new ApiError(400, "invalid_reference", "Referenced record does not exist.");
    case "23514": // check_violation
      return new ApiError(400, "invalid_body", "Value violates a schema constraint.");
    default:
      return null;
  }
}
