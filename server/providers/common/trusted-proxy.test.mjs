import test from 'node:test';
import assert from 'node:assert/strict';
import {
  gateProxyHeaders,
  proxyTrusted,
  requestProtocol,
} from './trusted-proxy.js';
import {
  passwordMatches,
  sitePasswordPlugin,
} from '../../standalone/site-password.js';

const proxied = {
  socket: {},
  headers: { 'x-forwarded-proto': 'https', 'x-forwarded-for': '1.2.3.4' },
};

test('the proxy is trusted only with both the flag and a site password', () => {
  assert.equal(proxyTrusted({}), false);
  assert.equal(proxyTrusted({ GEV_TRUST_PROXY: '1' }), false);
  assert.equal(proxyTrusted({ GEV_SITE_PASSWORD: 'pw' }), false);
  assert.equal(
    proxyTrusted({ GEV_TRUST_PROXY: 'false', GEV_SITE_PASSWORD: 'pw' }),
    false,
  );
  assert.equal(
    proxyTrusted({ GEV_TRUST_PROXY: '1', GEV_SITE_PASSWORD: 'pw' }),
    true,
  );
});

test('untrusted requests keep their proxy headers and socket scheme', () => {
  assert.equal(requestProtocol(proxied, {}), 'http:');
  assert.equal(gateProxyHeaders(proxied, {}), proxied.headers);
});

test('a trusted proxy supplies the scheme and hides its forwarding headers', () => {
  const env = { GEV_TRUST_PROXY: '1', GEV_SITE_PASSWORD: 'pw' };
  assert.equal(requestProtocol(proxied, env), 'https:');
  assert.deepEqual(gateProxyHeaders(proxied, env), {});
  const chained = {
    socket: {},
    headers: { 'x-forwarded-proto': 'https,http' },
  };
  assert.equal(requestProtocol(chained, env), 'http:');
});

test('Basic credentials match on the password alone', () => {
  const basic = (v) => `Basic ${Buffer.from(v).toString('base64')}`;
  assert.equal(passwordMatches(basic('anyone:pw'), 'pw'), true);
  assert.equal(passwordMatches(basic(':pw'), 'pw'), true);
  assert.equal(passwordMatches(basic('anyone:nope'), 'pw'), false);
  assert.equal(passwordMatches(basic('no-colon'), 'pw'), false);
  assert.equal(passwordMatches('Bearer pw', 'pw'), false);
  assert.equal(passwordMatches(undefined, 'pw'), false);
});

function run(env, req) {
  let handler;
  sitePasswordPlugin(env).configurePreviewServer({
    middlewares: { use: (fn) => (handler = fn) },
  });
  const res = {
    status: 0,
    writeHead(code) {
      this.status = code;
    },
    end() {},
  };
  let passed = false;
  handler(req, res, () => (passed = true));
  return { passed, status: res.status };
}

test('the site password gate is a no-op until a password is set', () => {
  assert.deepEqual(run({}, { url: '/', headers: {} }), {
    passed: true,
    status: 0,
  });
});

test('the site password gate refuses without credentials but serves /healthz', () => {
  const env = { GEV_SITE_PASSWORD: 'pw' };
  assert.deepEqual(run(env, { url: '/api/openai/chat', headers: {} }), {
    passed: false,
    status: 401,
  });
  assert.deepEqual(run(env, { url: '/healthz?x=1', headers: {} }), {
    passed: false,
    status: 200,
  });
  const authorization = `Basic ${Buffer.from('u:pw').toString('base64')}`;
  assert.equal(run(env, { url: '/', headers: { authorization } }).passed, true);
});
