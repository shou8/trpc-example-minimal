/**
 * This is the client-side code that uses the inferred types from the server
 */
import {
  createTRPCClient,
  splitLink,
  unstable_httpBatchStreamLink,
  unstable_httpSubscriptionLink,
} from '@trpc/client';
import superjson from 'superjson';
import { EventSource } from "undici";

globalThis.EventSource = EventSource as any;

/**
 * We only import the `AppRouter` type from the server - this is not available at runtime
 */
import type { AppRouter } from '../server/index.js';

// Initialize the tRPC client
const trpc = createTRPCClient<AppRouter>({
  links: [
    splitLink({
      condition: (op) => op.type === 'subscription',
      true: unstable_httpSubscriptionLink({
        url: 'http://localhost:3000',
        transformer: superjson,
      }),
      false: unstable_httpBatchStreamLink({
        url: 'http://localhost:3000',
        transformer: superjson,
      }),
    }),
  ],
});

async function main() {
  // Call procedure functions

  // 💡 Tip, try to:
  // - hover any types below to see the inferred types
  // - Cmd/Ctrl+click on any function to jump to the definition
  // - Rename any variable and see it reflected across both frontend and backend

  const users = await trpc.user.list.query();
  //    ^?
  console.log('Users:', users);

  const createdUser = await trpc.user.create.mutate({ name: 'sachinraja' });
  //    ^?
  console.log('Created user:', createdUser);

  const user = await trpc.user.byId.query('1');
  //    ^?
  console.log('User 1:', user);

  /*
  const iterable = await trpc.examples.iterable.query({msg:"testtest"});
  console.log(iterable)

  for await (const i of iterable) {
    console.log('Iterable:', i);
  }
  */
 await Promise.all([
  trpc.user.byId.query('1'),
  trpc.user.byId.query('2'),
  trpc.user.byId.query('3'),
 ]);

  console.log("before sleep: ", new Date());
  const sleep = await trpc.sleep.query(1);
  console.log("after sleep: ", new Date());

  const stream = await trpc.split.query({ msg: "test" });
  const chars: string[] = [];
  for await (const c of stream) {
    console.log('char:', c);
    chars.push(c);
  }

  console.log('string: ', chars.join(""));

  trpc.timeline.subscribe(undefined, {
    onStarted: (opts) => console.log("start", opts),
    onData: (value) => console.log(value),
    onComplete: () => console.log("complete"),
    onError: (error) => console.log("error", error),
    onConnectionStateChange: (state) => console.log("connectionStateChange", state)
  });
}

void main();
