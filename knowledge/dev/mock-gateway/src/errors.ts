import type { ContentfulStatusCode } from "hono/utils/http-status";

// Provisional error envelope for the local harness — Story 5.1 will define
// the real one; this mirrors the shape closely enough to exercise Story
// 5.2's status-code expectations without depending on unstarted work.
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

export function errorBody(err: ApiError) {
  return { error: { code: err.code, message: err.message } };
}
