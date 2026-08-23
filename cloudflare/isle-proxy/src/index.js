/**
 * Isle's Cloudflare edge entry point.
 *
 * This Worker keeps Vercel as the application origin while exposing a
 * Cloudflare-served hostname. It deliberately does not force caching: Vercel
 * and Next.js remain authoritative for cache-control on pages and API routes.
 */

const ORIGIN = new URL("https://isle-phi.vercel.app");

const HOP_BY_HOP_HEADERS = [
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
];

function makeUpstreamRequest(request, incomingUrl) {
  const upstreamUrl = new URL(incomingUrl.pathname + incomingUrl.search, ORIGIN);
  const headers = new Headers(request.headers);

  for (const header of HOP_BY_HOP_HEADERS) headers.delete(header);
  headers.delete("host");
  headers.delete("cf-connecting-ip");
  headers.delete("x-forwarded-for");
  headers.set("x-forwarded-host", incomingUrl.host);
  headers.set("x-forwarded-proto", incomingUrl.protocol.slice(0, -1));

  const init = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
  }

  return new Request(upstreamUrl, init);
}

function rewriteSameOriginRedirect(responseHeaders, incomingUrl) {
  const location = responseHeaders.get("location");
  if (!location) return;

  try {
    const target = new URL(location, ORIGIN);
    if (target.origin !== ORIGIN.origin) return;

    target.protocol = incomingUrl.protocol;
    target.host = incomingUrl.host;
    responseHeaders.set("location", target.toString());
  } catch {
    // Leave malformed redirect values untouched and let the browser handle it.
  }
}

export default {
  async fetch(request) {
    const incomingUrl = new URL(request.url);
    const upstreamResponse = await fetch(makeUpstreamRequest(request, incomingUrl));
    const headers = new Headers(upstreamResponse.headers);

    rewriteSameOriginRedirect(headers, incomingUrl);
    headers.set("x-isle-proxy", "cloudflare");

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers,
    });
  },
};
