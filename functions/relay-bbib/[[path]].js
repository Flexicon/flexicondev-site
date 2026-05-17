// PostHog EU reverse proxy — https://posthog.com/docs/advanced/proxy/cloudflare
const API_HOST = "eu.i.posthog.com";
const ASSET_HOST = "eu-assets.i.posthog.com";

async function retrieveAsset(_request, pathname, ctx) {
	const cacheKey = new Request(`https://${ASSET_HOST}${pathname}`);
	let response = await caches.default.match(cacheKey);
	if (!response) {
		response = await fetch(`https://${ASSET_HOST}${pathname}`);
		ctx.waitUntil(caches.default.put(cacheKey, response.clone()));
	}
	return response;
}

async function forwardRequest(request, pathWithSearch) {
	const ip = request.headers.get("CF-Connecting-IP") || "";
	const originHeaders = new Headers(request.headers);
	originHeaders.delete("cookie");
	originHeaders.set("X-Forwarded-For", ip);
	const originRequest = new Request(`https://${API_HOST}${pathWithSearch}`, {
		method: request.method,
		headers: originHeaders,
		body:
			request.method !== "GET" && request.method !== "HEAD"
				? await request.arrayBuffer()
				: null,
		redirect: request.redirect,
	});
	return await fetch(originRequest);
}

export async function onRequest(ctx) {
	const { request, params } = ctx;
	const path = params.path ? "/" + params.path.join("/") : "/";
	const url = new URL(request.url);
	const pathWithParams = path + url.search;

	if (path.startsWith("/static/") || path.startsWith("/array/")) {
		return retrieveAsset(request, pathWithParams, ctx);
	}
	return forwardRequest(request, pathWithParams);
}
