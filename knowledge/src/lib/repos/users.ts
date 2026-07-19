import { getState } from "../mockDb";
import type { User } from "../types";

export const usersRepo = {
  async list(): Promise<User[]> {
    return getState().users.slice();
  },
  async create(): Promise<User> {
    throw new Error("Users are managed by the auth backend");
  },
  async update(): Promise<void> {},
  async remove(): Promise<void> {},
};
