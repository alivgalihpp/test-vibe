import { Elysia } from "elysia";
import { userRoutes } from "./users";
import { usersRoute } from "./users-route";

export const routes = new Elysia().use(userRoutes).use(usersRoute);
export { userRoutes };
