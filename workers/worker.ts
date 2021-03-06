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

const moduleLike = new RegExp("^/([xw])/([^/@]+)(@([^/]+))?/(.*)");

const MEDIA_TYPES: Record<string, string> = {
	".md": "text/markdown",
	".html": "text/html",
	".htm": "text/html",
	".json": "application/json",
	".map": "application/json",
	".txt": "text/plain",
	".ts": "text/typescript",
	".tsx": "text/tsx",
	".d.ts": "text/typescript",
	".js": "application/javascript",
	".jsx": "text/jsx",
	".gz": "application/gzip",
	".css": "text/css",
	".wasm": "application/wasm",
	".mjs": "application/javascript",
	".otf": "font/otf",
	".ttf": "font/ttf",
	".woff": "font/woff",
	".woff2": "font/woff2",
	".conf": "text/plain",
	".list": "text/plain",
	".log": "text/plain",
	".ini": "text/plain",
	".vtt": "text/vtt",
	".yaml": "text/yaml",
	".yml": "text/yaml",
	".mid": "audio/midi",
	".midi": "audio/midi",
	".mp3": "audio/mp3",
	".mp4a": "audio/mp4",
	".m4a": "audio/mp4",
	".ogg": "audio/ogg",
	".spx": "audio/ogg",
	".opus": "audio/ogg",
	".wav": "audio/wav",
	".webm": "audio/webm",
	".aac": "audio/x-aac",
	".flac": "audio/x-flac",
	".mp4": "video/mp4",
	".mp4v": "video/mp4",
	".mkv": "video/x-matroska",
	".mov": "video/quicktime",
	".svg": "image/svg+xml",
	".avif": "image/avif",
	".bmp": "image/bmp",
	".gif": "image/gif",
	".heic": "image/heic",
	".heif": "image/heif",
	".jpeg": "image/jpeg",
	".jpg": "image/jpeg",
	".png": "image/png",
	".tiff": "image/tiff",
	".psd": "image/vnd.adobe.photoshop",
	".ico": "image/vnd.microsoft.icon",
	".webp": "image/webp",
	".es": "application/ecmascript",
	".epub": "application/epub+zip",
	".jar": "application/java-archive",
	".war": "application/java-archive",
	".webmanifest": "application/manifest+json",
	".doc": "application/msword",
	".dot": "application/msword",
	".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	".dotx": "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
	".cjs": "application/node",
	".bin": "application/octet-stream",
	".pkg": "application/octet-stream",
	".dump": "application/octet-stream",
	".exe": "application/octet-stream",
	".deploy": "application/octet-stream",
	".img": "application/octet-stream",
	".msi": "application/octet-stream",
	".pdf": "application/pdf",
	".pgp": "application/pgp-encrypted",
	".asc": "application/pgp-signature",
	".sig": "application/pgp-signature",
	".ai": "application/postscript",
	".eps": "application/postscript",
	".ps": "application/postscript",
	".rdf": "application/rdf+xml",
	".rss": "application/rss+xml",
	".rtf": "application/rtf",
	".apk": "application/vnd.android.package-archive",
	".key": "application/vnd.apple.keynote",
	".numbers": "application/vnd.apple.keynote",
	".pages": "application/vnd.apple.pages",
	".geo": "application/vnd.dynageo",
	".gdoc": "application/vnd.google-apps.document",
	".gslides": "application/vnd.google-apps.presentation",
	".gsheet": "application/vnd.google-apps.spreadsheet",
	".kml": "application/vnd.google-earth.kml+xml",
	".mkz": "application/vnd.google-earth.kmz",
	".icc": "application/vnd.iccprofile",
	".icm": "application/vnd.iccprofile",
	".xls": "application/vnd.ms-excel",
	".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	".xlm": "application/vnd.ms-excel",
	".ppt": "application/vnd.ms-powerpoint",
	".pot": "application/vnd.ms-powerpoint",
	".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
	".potx": "application/vnd.openxmlformats-officedocument.presentationml.template",
	".xps": "application/vnd.ms-xpsdocument",
	".odc": "application/vnd.oasis.opendocument.chart",
	".odb": "application/vnd.oasis.opendocument.database",
	".odf": "application/vnd.oasis.opendocument.formula",
	".odg": "application/vnd.oasis.opendocument.graphics",
	".odp": "application/vnd.oasis.opendocument.presentation",
	".ods": "application/vnd.oasis.opendocument.spreadsheet",
	".odt": "application/vnd.oasis.opendocument.text",
	".rar": "application/vnd.rar",
	".unityweb": "application/vnd.unity",
	".dmg": "application/x-apple-diskimage",
	".bz": "application/x-bzip",
	".crx": "application/x-chrome-extension",
	".deb": "application/x-debian-package",
	".php": "application/x-httpd-php",
	".iso": "application/x-iso9660-image",
	".sh": "application/x-sh",
	".sql": "application/x-sql",
	".srt": "application/x-subrip",
	".xml": "application/xml",
	".zip": "application/zip",
};

export async function handle(
	request: Request,
	env: Record<string, any>,
	ctx: { waitUntil(p: PromiseLike<unknown>): void },
): Promise<Response> {
	const url = new URL(request.url);
	const cache = caches.default;

	let response = await cache.match(request);
	if (!response) {
		response = new Response(null, { status: 404 });
		const match = url.pathname.match(moduleLike);
		if (match) {
			const type = match[1];
			const module = match[2];
			const tag = match[4];
			const pathname = match[5] ?? "";
			const ext = "." + (pathname.split("/").pop() ?? "").split(".").slice(1).join(".");
			if (!tag) {
				url.pathname = `/${type}/${module}@latest/${pathname}`;
				response = Response.redirect(url.toString());
			} else {
				try {
					const contentType = MEDIA_TYPES[ext] ?? "application/octet-stream";
					const res = await fetch(
						`https://raw.githubusercontent.com/baseless-dev/baseless.dev/modules/${type}/${module}@${tag}/${pathname}`,
					);
					if (res.status === 200) {
						const source = await res.text();
						const transformed = source.replaceAll(
							/https:\/\/baseless.dev\/([xw])\/([^\/]*)\//gi,
							`https://baseless.dev/$1/$2@${tag}/`,
						);
						response = new Response(transformed, {
							status: 200,
							headers: { "Access-Control-Allow-Origin": "*", "Content-Type": contentType },
						});
					}
				} catch (_err) {
					response = new Response(null, { status: 500 });
				}
			}
		}
		ctx.waitUntil(cache.put(request, response.clone()));
	}

	return response;
}
