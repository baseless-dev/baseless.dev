import "./workers.d.ts";

export default {
	// deno-lint-ignore require-await
	async fetch(
		request: Request,
		// deno-lint-ignore no-explicit-any
		env: Record<string, any>,
		ctx: { waitUntil(p: PromiseLike<unknown>): void },
	) {
		try {
			return handle(request, env, ctx);
		} catch (_err) {
			return new Response(_err.toString(), { status: 500 });
		}
	},
};

const moduleLike = new RegExp("^/x/([^/@]+)(@([^/]+))?/(.*)");

export async function handle(
	request: Request,
	env: Record<string, any>,
	ctx: { waitUntil(p: PromiseLike<unknown>): void },
): Promise<Response> {
	const url = new URL(request.url);
	const cache = caches.default;
	const kv: KVNamespace = env.BASELESS_STORAGE;

	let response = await cache.match(request);
	if (!response) {
		const match = url.pathname.match(moduleLike);
		if (match) {
			const module = match[1];
			const tag = match[3];
			const pathname = match[4] ?? "";
			if (!tag) {
				url.pathname = `/x/${module}@main/${pathname}`;
				response = Response.redirect(url.toString());
			} else {
				try {
					const entry = await kv.get(`${module}@${tag}/${pathname}`, "stream");
					if (!entry) {
						throw new Error("Hun");
					}
					response = new Response(entry, { status: 200 });
				} catch (err) {
					response = new Response(null, { status: 404 });
				}
			}
		} else {
			response = new Response(null, { status: 404 });
		}
		ctx.waitUntil(cache.put(request, response.clone()));
	}

	return response;
}
