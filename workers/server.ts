import { handle } from "./handler.ts";

const listener = Deno.listen({ port: 8787 });

console.info(`Serving on http://localhost:8787/`);

for await (const conn of listener) {
	const httpConn = Deno.serveHttp(conn);
	for await (const event of httpConn) {
		try {
			const response = await handle(event.request);
			await event.respondWith(response);
		} catch (err) {
			await event.respondWith(
				new Response(JSON.stringify(err), { status: 500 }),
			);
		}
	}
}