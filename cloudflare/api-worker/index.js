/**
 * Merge Combinator API Worker
 *
 * Handles VIA authentication flow callbacks for MC.
 * Deployed to: api.mergecombinator.com
 *
 * Endpoints:
 *   GET  /auth/post-2fa     - Redirect after VIA 2FA setup
 *   POST /api/verify-email  - Verify email tokens from VIA flows
 *   GET  /health            - Health check
 *
 * Configuration:
 *   - MC_PUBLIC_URL: Where to redirect users after auth
 *   - VIA_ISSUER_URL: VIA/Authentik base URL
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for API endpoints
    const corsHeaders = {
      'Access-Control-Allow-Origin': env.MC_PUBLIC_URL || 'https://www.mergecombinator.com',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      // Route requests
      if (path === '/health') {
        return handleHealth(env, corsHeaders);
      }

      if (path === '/auth/post-2fa' && request.method === 'GET') {
        return handlePost2FA(request, env);
      }

      if (path === '/api/verify-email' && request.method === 'POST') {
        return handleVerifyEmail(request, env, corsHeaders);
      }

      // 404 for unknown routes
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });

    } catch (error) {
      console.error('API error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  },
};

/**
 * Health check endpoint
 */
function handleHealth(env, corsHeaders) {
  return new Response(JSON.stringify({
    status: 'ok',
    service: 'mc-api',
    timestamp: new Date().toISOString(),
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

/**
 * POST /auth/post-2fa
 *
 * Called after VIA 2FA setup completes.
 * Redirects user back to MC app.
 *
 * Unlike SigmaBlox (which creates Ghost magic links), MC just redirects home.
 * The user is already authenticated in VIA - MC frontend will pick up session.
 */
function handlePost2FA(request, env) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email');

  console.log(`[post-2fa] Redirect for: ${email || '(no email)'}`);

  // Redirect to MC homepage or dashboard
  // User's VIA session is valid; MC frontend will detect auth state
  const redirectUrl = env.MC_PUBLIC_URL || 'https://www.mergecombinator.com';
  const destination = email
    ? `${redirectUrl}/dashboard?welcome=true`
    : redirectUrl;

  return Response.redirect(destination, 302);
}

/**
 * POST /api/verify-email
 *
 * Verifies email token from VIA enrollment/welcome flows.
 *
 * For MC, this is simplified - we just validate the request and return success.
 * VIA handles the actual user activation; this is for the frontend confirmation.
 *
 * Future: Could update user profile in Authentik or trigger welcome email.
 */
async function handleVerifyEmail(request, env, corsHeaders) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({
      error: 'Invalid JSON body',
      code: 'invalid_request'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const { token, email } = body;

  if (!token || !email) {
    return new Response(JSON.stringify({
      error: 'Missing token or email',
      code: 'invalid_request'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  console.log(`[verify-email] Request for: ${email}`);

  // TODO: Implement actual token verification
  // For now, return success - VIA handles the real verification
  // Future: Call Authentik API to verify token and update user

  // Placeholder success response
  return new Response(JSON.stringify({
    success: true,
    email: email,
    message: 'Email verified',
    // Redirect info for frontend
    redirectUrl: `${env.MC_PUBLIC_URL || 'https://www.mergecombinator.com'}/dashboard`,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
