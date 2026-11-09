import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SHELL_VARIANT_STORAGE_KEY,
  applyShellVariant,
  isNewShell,
  resolveShellVariant,
} from './shellVariant.js';

test('the query names the shell and is remembered', () => {
  assert.deepEqual(resolveShellVariant({ search: '?ui=new' }), {
    variant: 'new',
    remember: 'new',
  });
  assert.deepEqual(
    resolveShellVariant({ search: '?ui=classic', stored: 'new' }),
    {
      variant: 'classic',
      remember: 'classic',
    },
  );
});

test('a remembered choice applies when the query names none', () => {
  assert.deepEqual(resolveShellVariant({ search: '', stored: 'new' }), {
    variant: 'new',
    remember: null,
  });
});

test('unknown values fall back to the classic shell', () => {
  assert.equal(
    resolveShellVariant({ search: '?ui=v9', stored: 'x' }).variant,
    'classic',
  );
  assert.equal(resolveShellVariant().variant, 'classic');
});

function fakeEnv(search, initial = {}) {
  const attrs = {};
  const store = { ...initial };
  return {
    attrs,
    store,
    env: {
      document: {
        documentElement: {
          setAttribute: (k, v) => (attrs[k] = v),
          getAttribute: (k) => attrs[k] ?? null,
        },
      },
      location: { search },
      storage: {
        getItem: (k) => store[k] ?? null,
        setItem: (k, v) => (store[k] = v),
      },
    },
  };
}

test('applying marks the page root and stores a queried choice', () => {
  const { attrs, store, env } = fakeEnv('?ui=new');
  assert.equal(applyShellVariant(env), 'new');
  assert.equal(attrs['data-ui'], 'new');
  assert.equal(store[SHELL_VARIANT_STORAGE_KEY], 'new');
  assert.equal(isNewShell(env.document), true);
});

test('blocked storage still applies the queried shell', () => {
  const { attrs, env } = fakeEnv('?ui=new');
  env.storage = {
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    },
  };
  assert.equal(applyShellVariant(env), 'new');
  assert.equal(attrs['data-ui'], 'new');
});
