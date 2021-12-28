import { handle } from "./handler.ts";

export default {
  // deno-lint-ignore require-await
  async fetch(
    request: Request,
    // deno-lint-ignore no-explicit-any
    env: Record<string, any>,
    ctx: { waitUntil(p: PromiseLike<unknown>): void },
  ) {
    return handle(request, env, ctx);
  },
};
