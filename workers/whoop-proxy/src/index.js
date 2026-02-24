// Cloudflare Worker — Whoop OAuth + API Proxy
// Handles token exchange, refresh, AND proxies Whoop API calls
// so the browser never talks to api.prod.whoop.com directly (CORS).
//
// Deploy:
//   cd workers/whoop-proxy
//   npx wrangler login
//   npx wrangler secret put WHOOP_CLIENT_SECRET
//   npx wrangler deploy
//
// Environment variables (set via wrangler.toml or `wrangler secret`):
//   WHOOP_CLIENT_ID     — Whoop OAuth client ID
//   WHOOP_CLIENT_SECRET — Whoop OAuth client secret (use `wrangler secret put`)
//   ALLOWED_ORIGIN      — Your app's origin for CORS

const WHOOP_TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';
const WHOOP_API_BASE = 'https://api.prod.whoop.com/developer';

function corsHeaders(origin, allowedOrigin) {
  const allowed = origin === allowedOrigin ? origin : allowedOrigin;
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(data, status, origin, allowedOrigin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin, allowedOrigin),
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const allowedOrigin = env.ALLOWED_ORIGIN || 'https://thejoecrabtree.github.io';

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin, allowedOrigin),
      });
    }

    const path = url.pathname;

    try {
      // Token exchange (POST /token)
      if (path === '/token' && request.method === 'POST') {
        return await handleTokenExchange(request, env, origin, allowedOrigin);
      }

      // Token refresh (POST /refresh)
      if (path === '/refresh' && request.method === 'POST') {
        return await handleTokenRefresh(request, env, origin, allowedOrigin);
      }

      // API proxy (GET /api/v2/...) — proxies to Whoop developer API
      if (path.startsWith('/api/') && request.method === 'GET') {
        return await handleApiProxy(request, url, origin, allowedOrigin);
      }

      return jsonResponse({ error: 'Not found' }, 404, origin, allowedOrigin);
    } catch (err) {
      console.error('Worker error:', err);
      return jsonResponse({ error: 'Internal server error', message: err.message }, 500, origin, allowedOrigin);
    }
  },
};

/**
 * GET /api/v2/* — Proxy Whoop API calls
 * The browser sends: GET /api/v2/recovery?limit=1
 * We forward to: GET https://api.prod.whoop.com/developer/v2/recovery?limit=1
 * with the Authorization header passed through.
 */
async function handleApiProxy(request, url, origin, allowedOrigin) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Missing Authorization header' }, 401, origin, allowedOrigin);
  }

  // Strip /api prefix → forward rest to Whoop
  const whoopPath = url.pathname.replace(/^\/api/, '');
  const whoopUrl = `${WHOOP_API_BASE}${whoopPath}${url.search}`;

  const whoopRes = await fetch(whoopUrl, {
    method: 'GET',
    headers: {
      'Authorization': authHeader,
      'Accept': 'application/json',
    },
  });

  const data = await whoopRes.text();

  return new Response(data, {
    status: whoopRes.status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin, allowedOrigin),
    },
  });
}

/**
 * POST /token — Exchange authorization code for access + refresh tokens
 * Body: { code, redirect_uri, grant_type }
 */
async function handleTokenExchange(request, env, origin, allowedOrigin) {
  const body = await request.json();
  const { code, redirect_uri, grant_type } = body;

  if (!code || !redirect_uri) {
    return jsonResponse({ error: 'Missing code or redirect_uri' }, 400, origin, allowedOrigin);
  }

  const params = new URLSearchParams({
    grant_type: grant_type || 'authorization_code',
    code,
    redirect_uri,
    client_id: env.WHOOP_CLIENT_ID,
    client_secret: env.WHOOP_CLIENT_SECRET,
  });

  const whoopRes = await fetch(WHOOP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await whoopRes.json();

  if (!whoopRes.ok) {
    console.error('Whoop token error:', JSON.stringify(data));
    return jsonResponse(
      { error: 'Token exchange failed', details: data },
      whoopRes.status,
      origin,
      allowedOrigin,
    );
  }

  return jsonResponse(data, 200, origin, allowedOrigin);
}

/**
 * POST /refresh — Refresh an expired access token
 * Body: { refresh_token, grant_type }
 */
async function handleTokenRefresh(request, env, origin, allowedOrigin) {
  const body = await request.json();
  const { refresh_token, grant_type } = body;

  if (!refresh_token) {
    return jsonResponse({ error: 'Missing refresh_token' }, 400, origin, allowedOrigin);
  }

  const params = new URLSearchParams({
    grant_type: grant_type || 'refresh_token',
    refresh_token,
    client_id: env.WHOOP_CLIENT_ID,
    client_secret: env.WHOOP_CLIENT_SECRET,
  });

  const whoopRes = await fetch(WHOOP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await whoopRes.json();

  if (!whoopRes.ok) {
    console.error('Whoop refresh error:', JSON.stringify(data));
    return jsonResponse(
      { error: 'Token refresh failed', details: data },
      whoopRes.status,
      origin,
      allowedOrigin,
    );
  }

  return jsonResponse(data, 200, origin, allowedOrigin);
}
