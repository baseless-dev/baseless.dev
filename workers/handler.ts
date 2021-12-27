const GITHUB_TOKEN = "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";

export async function handle(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const pathname = url.pathname.replace(/^\//, '');
	try {
		const response = await fetch(`https://api.github.com/graphql`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${GITHUB_TOKEN}`
			},
			body: JSON.stringify({
				query: `query { 
					repository(owner:"baseless-dev", name:"baseless") {
						object(expression:"HEAD:${pathname}") {
							... on Blob {
								text
							}
						}
					}
				}`
			})
		});
		const json = await response.json();
		if (json?.data?.repository?.object?.text) {
			return new Response(json?.data?.repository?.object?.text, { status: 200 });
		}
		return new Response(null, { status: 404 });
	} catch (_err) {
		console.error(_err);
		return new Response(null, { status: 404 });
	}
}