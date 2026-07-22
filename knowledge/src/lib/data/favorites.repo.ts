import { db } from "./client";
import type { Favorite } from "../types";
import type { Database } from "./types.gen";

const table = db.table<Favorite>("favorites");

type FavoriteInsert = Database["public"]["Tables"]["favorites"]["Insert"];

export const favoritesRepo = {
  async list(): Promise<Favorite[]> {
    return table.list();
  },
  // owner_id is derived from the session by the gateway (Importantdoc.md §B5).
  async create(data: FavoriteInsert & { owner_id: string }): Promise<Favorite> {
    const { owner_id, ...rest } = data;
    return table.create(rest);
  },
  async remove(id: string): Promise<void> {
    await table.remove(id);
  },
};
