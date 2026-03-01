// Cloudflare Worker — Whoop OAuth + API Proxy + AI Coach
// Handles token exchange, refresh, proxies Whoop API calls,
// and AI Coach requests to Claude API.
//
// Deploy:
//   cd workers/whoop-proxy
//   npx wrangler login
//   npx wrangler secret put WHOOP_CLIENT_SECRET
//   npx wrangler secret put ANTHROPIC_API_KEY
//   npx wrangler deploy
//
// Environment variables (set via wrangler.toml or `wrangler secret`):
//   WHOOP_CLIENT_ID     — Whoop OAuth client ID
//   WHOOP_CLIENT_SECRET — Whoop OAuth client secret (use `wrangler secret put`)
//   ANTHROPIC_API_KEY   — Anthropic API key for AI Coach (use `wrangler secret put`)
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

      // AI Coach (POST /ai) — proxies to Claude API
      if (path === '/ai' && request.method === 'POST') {
        return await handleAiCoach(request, env, origin, allowedOrigin);
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

/**
 * POST /ai — AI Coach via Claude API
 * Body: { message, context }
 * context: { week, day, dayLabel, readiness, lifts, workout }
 */
async function handleAiCoach(request, env, origin, allowedOrigin) {
  if (!env.ANTHROPIC_API_KEY) {
    return jsonResponse(
      { error: 'AI Coach not configured. Add ANTHROPIC_API_KEY as a Worker secret.' },
      503,
      origin,
      allowedOrigin,
    );
  }

  const body = await request.json();
  const { message, context } = body;

  if (!message) {
    return jsonResponse({ error: 'Missing message' }, 400, origin, allowedOrigin);
  }

  const systemPrompt = `You are a concise AI fitness coach for a 12-week progressive overload program (CrossFit/HYROX style, modified for 5th metatarsal recovery).

CURRENT STATE:
- Week ${context?.week || '?'}/12, ${context?.day || 'Unknown day'}
- Workout: ${context?.dayLabel || 'Unknown'}
- Readiness: ${context?.readiness || 'Not set'}
${context?.lifts ? `\nCURRENT 1RMs (kg):\n${context.lifts}` : ''}
${context?.workout ? `\nTODAY'S SECTIONS:\n${context.workout}` : ''}

You can suggest these modifications via a JSON block:
\`\`\`json
{"actions": [
  {"type": "adjust_1rm", "lift": "backSquat|deadlift|bench|pushPress|hipThrust|powerClean|snatch", "delta_kg": -2.5},
  {"type": "add_note", "date": "YYYY-MM-DD", "text": "Extra exercises or instructions"}
]}
\`\`\`

Rules:
- Keep responses under 80 words
- Be direct and practical
- Only include the JSON block if the user requests a specific change
- Weight deltas in kg (2.5kg increments)
- For "add more X exercises", use add_note with specific exercises and sets/reps`;

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }],
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text().catch(() => '');
      console.error('Claude API error:', claudeRes.status, err);
      return jsonResponse(
        { error: `AI service error (${claudeRes.status})` },
        claudeRes.status,
        origin,
        allowedOrigin,
      );
    }

    const claudeData = await claudeRes.json();
    const text = claudeData.content?.[0]?.text || '';

    let actions = null;
    const jsonMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        actions = parsed.actions || null;
      } catch { /* ignore malformed JSON */ }
    }

    const responseText = text.replace(/```json[\s\S]*?```/g, '').trim();

    return jsonResponse({ response: responseText, actions }, 200, origin, allowedOrigin);
  } catch (err) {
    console.error('AI Coach error:', err);
    return jsonResponse({ error: 'Failed to get AI response' }, 500, origin, allowedOrigin);
  }
}
