const moduleLike = new RegExp("^/x/([^/@]+)(@([^/]+))?/(.*)");
import "./workers.d.ts";

export async function handle(
  request: Request,
  // deno-lint-ignore no-explicit-any
  _env: Record<string, any>,
  ctx: { waitUntil(p: PromiseLike<unknown>): void },
): Promise<Response> {
  const url = new URL(request.url);
  const match = url.pathname.match(moduleLike);
  if (match) {
    const cache = caches.default;
    let response = await cache.match(request);
    if (!response) {
      const module = match[1];
      const tag = match[3];
      const pathname = match[4] ?? "";
      if (!tag) {
        url.pathname = `/x/${module}@main/${pathname}`;
        return Response.redirect(url.toString());
      }
      const res = await fetch(
        `https://raw.githubusercontent.com/baseless-dev/baseless/${tag}/${module}/${pathname}`,
      );
      const source = await res.text();
      const transformed = source.replaceAll(
        /https:\/\/baseless.dev\/x\/([^\/]*)\//gi,
        `https://baseless.dev/x/$1@${tag}/`,
      );
      response = new Response(transformed, response);
      ctx.waitUntil(cache.put(request, response.clone()));
    }
    return response;
  }
  return new Response(null, { status: 404 });
}
