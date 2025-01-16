/**
 * This a minimal tRPC server
 */
import { createHTTPServer } from '@trpc/server/adapters/standalone';
//import { observable } from '@trpc/server/observable';
import { z } from 'zod';
import { db } from './db.js';
import { middleware, publicProcedure, router } from './trpc.js';
import { pino } from "pino";
import { pinoHttp } from "pino-http";
import { EventEmitter, on } from "events";

const logger = pino({});
const httpLogger = pinoHttp({ logger });

const logMiddleware = middleware(({ ctx, next }) => {
  httpLogger(ctx.req,ctx.res);
  return next({ctx});
})

const procedure = publicProcedure.use(logMiddleware);

const emitter = new EventEmitter();

const appRouter = router({
  user: {
    list: procedure.query(async () => {
      const users = await db.user.findMany();
      return users;
    }),
    byId: procedure.input(z.string()).query(async (opts) => {
      const { input } = opts;
      const user = await db.user.findById(input);
      return user;
    }),
    create: procedure
      .input(z.object({ name: z.string() }))
      .mutation(async (opts) => {
        const { input } = opts;
        const user = await db.user.create(input);
        return user;
      }),
  },
  split: procedure
    .input(z.object({msg: z.string().optional()}))
    .query(async function* (req) {
      for (const char of req.input.msg?.split("") ?? []) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        yield char;
      };
  }),
  sleep: procedure.input(z.number()).query(async (req) => {
    await new Promise((resolve) => setTimeout(resolve, 1000 * req.input));
    return req.input;
  }),
  post: procedure.input(z.string()).mutation(async (req) => {
    emitter.emit("post", req.input);
  }),
  timeline: procedure.subscription(async function* (req) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    for await (const [data] of on(emitter, "post", { signal: req.signal })) {
      const post = data as string;
      yield post;
    }
  }),
  timer: procedure.input(z.number()).subscription(async function* (req) {
    for await (const _ of Array(req.input)) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      yield new Date();
    }
  }),
});

// Export type router type signature, this is used by the client.
export type AppRouter = typeof appRouter;

const server = createHTTPServer({
  createContext: (ctx) => ctx,
  router: appRouter,
});

server.listen(3000);
