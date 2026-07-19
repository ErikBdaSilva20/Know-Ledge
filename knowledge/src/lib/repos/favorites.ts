import { genId, getState, isoNow, mutate } from "../mockDb";
import type { Favorite } from "../types";

export const favoritesRepo = {
  async list(): Promise<Favorite[]> {
    return getState().favorites.slice();
  },
  async create(data: Omit<Favorite, "id" | "created_at">): Promise<Favorite> {
    const f: Favorite = { ...data, id: genId("fav"), created_at: isoNow() };
    mutate((s) => {
      s.favorites.push(f);
    });
    return f;
  },
  async update(): Promise<void> {},
  async remove(id: string): Promise<void> {
    mutate((s) => {
      s.favorites = s.favorites.filter((f) => f.id !== id);
    });
  },
};
