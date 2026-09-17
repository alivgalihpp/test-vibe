import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { env } from "./env";
import { routes } from "./routes";

const app = new Elysia()
  .use(cors())
  .get("/", () => ({
    message: "Welcome to Bun + ElysiaJS + Drizzle + MySQL API",
    status: "ok",
  }))
  .use(routes)
  .listen(env.PORT);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app;
export default app;
