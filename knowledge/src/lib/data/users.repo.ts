import { getState } from "../mockDb";
import type { User } from "../types";

// Users are NOT a `/data/:table` entity — they come from Better-Auth
// (Importantdoc.md §B8). This repo only backs the mock role switcher
// (LoginPage/RoleSwitcher) until Epic 3 wires `auth.me()`/`auth.signIn`
// for real (Story 1.4 AC#6, Story 1.6 AC#4) — it has no gateway branch.
export const usersRepo = {
  async list(): Promise<User[]> {
    return getState().users.slice();
  },
};
