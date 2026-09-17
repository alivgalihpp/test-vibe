import { Elysia, t } from "elysia";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

export const userRoutes = new Elysia({ prefix: "/users" })
  // GET /users — list semua user
  .get("/", async ({ set }) => {
    try {
      const allUsers = await db.select().from(users);
      return {
        success: true,
        data: allUsers,
      };
    } catch (error: any) {
      set.status = 500;
      return {
        success: false,
        message: "Failed to fetch users",
        error: error?.message,
      };
    }
  })

  // GET /users/:id — detail user
  .get(
    "/:id",
    async ({ params: { id }, set }) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, id))
          .limit(1);

        if (!user) {
          set.status = 404;
          return {
            success: false,
            message: `User with id ${id} not found`,
          };
        }

        return {
          success: true,
          data: user,
        };
      } catch (error: any) {
        set.status = 500;
        return {
          success: false,
          message: "Failed to fetch user",
          error: error?.message,
        };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
    }
  )

  // POST /users — buat user baru
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const { name, email, password } = body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db
          .insert(users)
          .values({ name, email, password: hashedPassword });
        set.status = 201;
        return {
          success: true,
          message: "User created successfully",
          data: {
            id: result.insertId,
            name,
            email,
          },
        };
      } catch (error: any) {
        set.status = 400;
        return {
          success: false,
          message: "Failed to create user",
          error: error?.message,
        };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 1 }),
      }),
    }
  )

  // PUT /users/:id — update user
  .put(
    "/:id",
    async ({ params: { id }, body, set }) => {
      try {
        const [existing] = await db
          .select()
          .from(users)
          .where(eq(users.id, id))
          .limit(1);

        if (!existing) {
          set.status = 404;
          return {
            success: false,
            message: `User with id ${id} not found`,
          };
        }

        await db.update(users).set(body).where(eq(users.id, id));

        const [updatedUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, id))
          .limit(1);

        return {
          success: true,
          message: "User updated successfully",
          data: updatedUser,
        };
      } catch (error: any) {
        set.status = 400;
        return {
          success: false,
          message: "Failed to update user",
          error: error?.message,
        };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        email: t.Optional(t.String({ format: "email" })),
      }),
    }
  )

  // DELETE /users/:id — hapus user
  .delete(
    "/:id",
    async ({ params: { id }, set }) => {
      try {
        const [existing] = await db
          .select()
          .from(users)
          .where(eq(users.id, id))
          .limit(1);

        if (!existing) {
          set.status = 404;
          return {
            success: false,
            message: `User with id ${id} not found`,
          };
        }

        await db.delete(users).where(eq(users.id, id));

        return {
          success: true,
          message: "User deleted successfully",
        };
      } catch (error: any) {
        set.status = 500;
        return {
          success: false,
          message: "Failed to delete user",
          error: error?.message,
        };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
    }
  );
