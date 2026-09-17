import { Elysia, t } from 'elysia';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export const userRoutes = new Elysia({ prefix: '/users' })
  .get('/', async () => {
    return await db.select().from(users);
  })
  .get('/:id', async ({ params: { id }, error }) => {
    const [user] = await db.select().from(users).where(eq(users.id, Number(id)));
    if (!user) return error(404, 'User not found');
    return user;
  }, {
    params: t.Object({ id: t.Numeric() })
  })
  .post('/', async ({ body, error }) => {
    try {
      const [result] = await db.insert(users).values(body);
      return { success: true, id: result.insertId };
    } catch (err: any) {
      return error(400, err.message || 'Failed to create user');
    }
  }, {
    body: t.Object({
      name: t.String(),
      email: t.String()
    })
  })
  .put('/:id', async ({ params: { id }, body, error }) => {
    try {
      await db.update(users).set(body).where(eq(users.id, Number(id)));
      return { success: true, message: 'User updated successfully' };
    } catch (err: any) {
      return error(400, err.message || 'Failed to update user');
    }
  }, {
    params: t.Object({ id: t.Numeric() }),
    body: t.Object({
      name: t.Optional(t.String()),
      email: t.Optional(t.String())
    })
  })
  .delete('/:id', async ({ params: { id } }) => {
    await db.delete(users).where(eq(users.id, Number(id)));
    return { success: true, message: 'User deleted successfully' };
  }, {
    params: t.Object({ id: t.Numeric() })
  });
