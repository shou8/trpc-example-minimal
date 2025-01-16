import { initTRPC } from '@trpc/server';
import { NodeHTTPCreateContextFnOptions } from '@trpc/server/adapters/node-http';
import { IncomingMessage, ServerResponse } from 'node:http';
import superjson from "superjson";

const t = initTRPC.context<NodeHTTPCreateContextFnOptions<IncomingMessage, ServerResponse<IncomingMessage>>>().create({
  transformer: superjson,
  sse: {
    ping: {
      enabled: true,
      intervalMs: 10000,
    }
  }
});

export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;
