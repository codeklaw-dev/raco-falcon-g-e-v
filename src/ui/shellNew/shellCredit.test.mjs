import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The redesigned shell places the map credit itself, outside the classic
// layout model (creditAttribution.test.mjs skips html[data-ui='new'] rules).
// These pins keep the credit visible and clear of the control center.
const css = readFileSync(new URL('./shell.css', import.meta.url), 'utf8');

const blocks = (selectorPattern) =>
  [...css.matchAll(new RegExp(`${selectorPattern}\\s*\\{([^}]*)\\}`, 'g'))].map(
    (m) => m[1],
  );
const px = (block, prop) => {
  const match = new RegExp(`(?:^|;|\\s)${prop}\\s*:\\s*(\\d+)px`).exec(block);
  return match ? Number(match[1]) : null;
};

test('the new shell never hides or fades the map credit', () => {
  const credit = blocks("html\\[data-ui='new'\\][^{]*#cesium-credits");
  assert.ok(credit.length > 0, 'the new shell must place the credit');
  for (const block of credit) {
    assert.doesNotMatch(block, /display\s*:\s*none/);
    assert.doesNotMatch(block, /visibility\s*:\s*hidden/);
    assert.doesNotMatch(block, /opacity\s*:/);
  }
});

test('the credit sits bottom-right, above the corner buttons and clear of the dock', () => {
  const [credit] = blocks("html\\[data-ui='new'\\] #cesium-credits");
  assert.match(credit, /right:\s*var\(--sn-4\)/);
  // Corner buttons: 16px from the bottom and 32px tall.
  assert.ok(
    px(credit, 'bottom') >= 16 + 32 + 8,
    'credit must clear the corner buttons',
  );
});
