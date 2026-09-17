import { Elysia, t } from "elysia";
import { registerUser } from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      set.status = 400;
      const message = error.all?.length
        ? error.all.map((e) => e.summary).join("; ")
        : error.message;
      return { error: message };
    }
  })
  .post(
    "/",
    async ({ body, set }) => {
      try {
        await registerUser(body.name, body.email, body.password);
        set.status = 201;
        return { data: "OK" };
      } catch (error) {
        set.status = 400;
        return { error: (error as Error).message };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        email: t.String({ pattern: "^[^\\s@]+@[^\\s@]+$" }),
        password: t.String({ minLength: 1 }),
      }),
    }
  );