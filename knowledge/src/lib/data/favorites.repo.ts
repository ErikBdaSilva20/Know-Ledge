import { db } from "./client";
import { isGatewayMode } from "./dataSource";
import { genId, getState, isoNow, mutate } from "../mockDb";
import type { Favorite } from "../types";

const table = db.table<Favorite>("favorites");

export const favoritesRepo = {
  async list(): Promise<Favorite[]> {
    if (isGatewayMode()) return table.list();
    return getState().favorites.slice();
  },
  async create(data: Omit<Favorite, "id" | "created_at">): Promise<Favorite> {
    if (isGatewayMode()) {
      const { owner_id, ...rest } = data;
      return table.create(rest);
    }
    const f: Favorite = { ...data, id: genId("fav"), created_at: isoNow() };
    mutate((s) => {
      s.favorites.push(f);
    });
    return f;
  },
  async remove(id: string): Promise<void> {
    if (isGatewayMode()) {
      await table.remove(id);
      return;
    }
    mutate((s) => {
      s.favorites = s.favorites.filter((f) => f.id !== id);
    });
  },
};
