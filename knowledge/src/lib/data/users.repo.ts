import { getState } from "../mockDb";
import type { User } from "../types";

// Users are NOT a `/data/:table` entity — they come from Better-Auth
// (Importantdoc.md §B8). Mock mode resolves its single fixed user directly
// in session.tsx now; this repo has no current callers and no gateway
// branch — kept for whichever screen ends up needing a user list once
// Epic 3 wires a real listing endpoint.
export const usersRepo = {
  async list(): Promise<User[]> {
    return getState().users.slice();
  },
};
