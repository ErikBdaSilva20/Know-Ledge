import type { User } from "./types";

// Single place that decides how an owner/publisher name gets displayed:
// prefer the denormalized snapshot stamped at creation (owner_name /
// published_by_name — works with no backend change, see Explorer.tsx's
// `ownerName` for why it exists), fall back to the usersRepo-backed roster
// when it resolved (mock/dev-gateway today; real gateway once /api/users
// exists), and finally the caller's own placeholder (e.g. "—").
export function displayName(
  denormalized: string | null | undefined,
  userMap: Map<string, User>,
  userId: string,
): string | undefined {
  return denormalized ?? userMap.get(userId)?.name;
}
