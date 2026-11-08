import { timingSafeEqual, createHash } from 'node:crypto';

/**
 * Optional site-wide password for hosted deployments (HTTP Basic auth).
 *
 * Set GEV_SITE_PASSWORD to require it on every request; any username is
 * accepted. /healthz stays open for the platform's health checks. Unset, this
 * plugin does nothing, so local installs are unaffected.
 */
const REALM = 'Basic realm="GEV", charset="UTF-8"';

function digest(value) {
  return createHash('sha256').update(String(value)).digest();
}

/** Whether an Authorization header carries the expected password. */
export function passwordMatches(header, expected) {
  const match = /^Basic\s+([A-Za-z0-9+/=]+)$/i.exec(
    String(header || '').trim(),
  );
  if (!match) return false;
  const decoded = Buffer.from(match[1], 'base64').toString('utf8');
  const colon = decoded.indexOf(':');
  if (colon < 0) return false;
  const supplied = decoded.slice(colon + 1);
  return timingSafeEqual(digest(supplied), digest(expected));
}

export function sitePasswordPlugin(env = process.env) {
  const install = (server) => {
    server.middlewares.use((req, res, next) => {
      const expected = String(env.GEV_SITE_PASSWORD || '');
      const path = String(req.url || '').split('?')[0];
      if (path === '/healthz') {
        res.writeHead(200, {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-store',
        });
        res.end('ok');
        return;
      }
      if (!expected || passwordMatches(req.headers?.authorization, expected)) {
        next();
        return;
      }
      res.writeHead(401, {
        'WWW-Authenticate': REALM,
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-store',
      });
      res.end('Password required');
    });
  };
  return {
    name: 'gev-site-password',
    configureServer: install,
    configurePreviewServer: install,
  };
}
