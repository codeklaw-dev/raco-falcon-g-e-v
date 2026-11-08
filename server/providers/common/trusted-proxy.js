/**
 * Hosted-deployment opt-in for running behind a platform reverse proxy (Fly.io,
 * Render, Railway, ...).
 *
 * By default the same-site gates refuse any request carrying forwarding headers,
 * because a local install should never be reachable through a proxy. A hosted
 * deployment always is, so every cost-bearing route (chat, voice tokens, place
 * search) would answer 403. Setting GEV_TRUST_PROXY lets those gates ignore the
 * platform's forwarding headers and read the scheme from X-Forwarded-Proto.
 *
 * Trusting the proxy removes the last barrier between the public internet and
 * routes that spend the configured API keys, so it is honoured ONLY when
 * GEV_SITE_PASSWORD is also set (see server/standalone/site-password.js). The
 * Host allowlist, Sec-Fetch-Site and exact-Origin checks still apply.
 */

/** Whether the deployment opted in to trusting its reverse proxy. */
export function proxyTrusted(env = process.env) {
  const flag = String(env.GEV_TRUST_PROXY || '')
    .trim()
    .toLowerCase();
  const wanted = flag !== '' && flag !== '0' && flag !== 'false';
  return wanted && String(env.GEV_SITE_PASSWORD || '') !== '';
}

/**
 * The scheme the browser used: the socket's own, or the proxy's single
 * X-Forwarded-Proto token when the proxy is trusted.
 * @param {import('node:http').IncomingMessage} req
 * @returns {'http:'|'https:'}
 */
export function requestProtocol(req, env = process.env) {
  if (req.socket?.encrypted) return 'https:';
  if (!proxyTrusted(env)) return 'http:';
  const proto = String(req.headers?.['x-forwarded-proto'] || '')
    .trim()
    .toLowerCase();
  return proto === 'https' ? 'https:' : 'http:';
}

/**
 * Headers the gates inspect for proxy signals: none when the proxy is trusted.
 * @param {import('node:http').IncomingMessage} req
 */
export function gateProxyHeaders(req, env = process.env) {
  return proxyTrusted(env) ? {} : req.headers || {};
}
