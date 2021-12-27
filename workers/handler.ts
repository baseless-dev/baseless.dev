const moduleLike = new RegExp('^/x/([^/@]+)(@([^/]+))?/(.*)');

export async function handle(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const match = url.pathname.match(moduleLike);
	if (match) {
		const module = match[1];
		const tag = match[3];
		const pathname = match[4] ?? '';
		if (!tag) {
			url.pathname = `/x/${module}@main/${pathname}`;
			return Response.redirect(url.toString());
		}
		const response = await fetch(`https://raw.githubusercontent.com/baseless-dev/baseless/${tag}/${module}/${pathname}`);
		const source = await response.text();
		const transformed = source.replaceAll(/https:\/\/baseless.dev\/x\/([^\/]*)\//gi, `https://baseless.dev/x/$1@${tag}/`);
		return new Response(transformed, response);
	}
	return new Response(null, { status: 404 });
}