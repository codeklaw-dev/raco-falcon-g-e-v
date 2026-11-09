/**
 * Which interface shell the page presents.
 *
 * `classic` is the original intelligence-HUD shell. `new` is the redesigned
 * shell (navigation rail, pane, top notch and bottom control center). The
 * choice comes from `?ui=new` / `?ui=classic` and is remembered per browser,
 * so a shared link keeps working and a person can switch back at any time.
 */
export const SHELL_VARIANTS = Object.freeze(['classic', 'new']);
export const DEFAULT_SHELL_VARIANT = 'classic';
export const SHELL_VARIANT_STORAGE_KEY = 'gev.ui';

/**
 * Resolve the shell from a query string and remembered choice. Pure.
 * @param {{search?: string, stored?: string|null}} input
 * @returns {{variant: string, remember: string|null}} The variant, and the
 *   value to remember when the query named one (otherwise null).
 */
export function resolveShellVariant({ search = '', stored = null } = {}) {
  let requested = null;
  try {
    requested = new URLSearchParams(search).get('ui');
  } catch {
    requested = null;
  }
  if (requested && SHELL_VARIANTS.includes(requested))
    return { variant: requested, remember: requested };
  if (stored && SHELL_VARIANTS.includes(stored))
    return { variant: stored, remember: null };
  return { variant: DEFAULT_SHELL_VARIANT, remember: null };
}

/**
 * Read the choice, remember it when the query named one, and mark the page
 * root with `data-ui`. Storage failures (private mode, blocked site data) only
 * mean the choice is not remembered.
 * @param {{document?: Document, location?: Location, storage?: Storage}} [env]
 * @returns {string} The applied variant.
 */
export function applyShellVariant({
  document: doc = globalThis.document,
  location = globalThis.location,
  storage = safeStorage(),
} = {}) {
  let stored = null;
  try {
    stored = storage?.getItem(SHELL_VARIANT_STORAGE_KEY) ?? null;
  } catch {
    stored = null;
  }
  const { variant, remember } = resolveShellVariant({
    search: location?.search ?? '',
    stored,
  });
  if (remember) {
    try {
      storage?.setItem(SHELL_VARIANT_STORAGE_KEY, remember);
    } catch {
      // Not remembered; the query still applies to this page.
    }
  }
  doc?.documentElement?.setAttribute('data-ui', variant);
  return variant;
}

/** Whether the page presents the redesigned shell. */
export function isNewShell(doc = globalThis.document) {
  return doc?.documentElement?.getAttribute('data-ui') === 'new';
}

function safeStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}
