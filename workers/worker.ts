import { handle } from "./handler.ts";

export default {
	// deno-lint-ignore require-await no-explicit-any no-unused-vars
	async fetch(request: Request, env: Record<string, any>, ctx: { waitUntil(p: PromiseLike<unknown>): void }) {
		return handle(request);
	}
}