import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { userRoutes } from './routes';
import { env } from './env';

const app = new Elysia()
  .use(cors())
  .get('/', () => ({ message: 'Welcome to Bun + ElysiaJS + Drizzle + MySQL API' }))
  .use(userRoutes)
  .listen(env.PORT);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
