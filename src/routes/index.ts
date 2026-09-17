import { Elysia } from "elysia";
import { userRoutes } from "./users";

export const routes = new Elysia().use(userRoutes);
export { userRoutes };
