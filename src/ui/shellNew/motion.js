import { gsap } from 'gsap';

/**
 * Motion for the redesigned shell. Every animation goes through here so the
 * timings stay consistent and `prefers-reduced-motion` is honoured once:
 * with reduced motion, tweens jump straight to their end state.
 */
export const EASE_OUT = 'power3.out';
export const EASE_IN = 'power2.in';
export const DURATION = Object.freeze({ fast: 0.16, base: 0.24, slow: 0.42 });

export function prefersReducedMotion(win = globalThis.window) {
  try {
    return Boolean(
      win?.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    );
  } catch {
    return false;
  }
}

/** Scale durations to zero when the person asked for reduced motion. */
function timed(vars) {
  return prefersReducedMotion()
    ? { ...vars, duration: 0, delay: 0, stagger: 0 }
    : vars;
}

/** Fade and slide elements in from `x`/`y`, staggered. */
export function enter(
  targets,
  { x = 0, y = 8, delay = 0, stagger = 0.04, duration = DURATION.base } = {},
) {
  if (!targets) return null;
  return gsap.fromTo(
    targets,
    { autoAlpha: 0, x, y },
    timed({
      autoAlpha: 1,
      x: 0,
      y: 0,
      duration,
      delay,
      stagger,
      ease: EASE_OUT,
      clearProps: 'transform',
    }),
  );
}

/** Slide a panel open (`open=true`) or closed along x. */
export function slidePanel(target, open, { from = -16 } = {}) {
  if (!target) return null;
  gsap.killTweensOf(target);
  return open
    ? gsap.fromTo(
        target,
        { autoAlpha: 0, x: from },
        timed({ autoAlpha: 1, x: 0, duration: DURATION.base, ease: EASE_OUT }),
      )
    : gsap.to(
        target,
        timed({
          autoAlpha: 0,
          x: from,
          duration: DURATION.fast,
          ease: EASE_IN,
        }),
      );
}

/** Pop a menu or card in from slightly above, or out again. */
export function pop(target, open) {
  if (!target) return null;
  gsap.killTweensOf(target);
  return open
    ? gsap.fromTo(
        target,
        { autoAlpha: 0, y: -6, scale: 0.98 },
        timed({
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: DURATION.base,
          ease: EASE_OUT,
          transformOrigin: '50% 0%',
        }),
      )
    : gsap.to(
        target,
        timed({
          autoAlpha: 0,
          y: -6,
          scale: 0.98,
          duration: DURATION.fast,
          ease: EASE_IN,
        }),
      );
}

/** Move the rail's active indicator to `y` (px), easing between items. */
export function moveIndicator(target, y, visible) {
  if (!target) return null;
  return gsap.to(
    target,
    timed({
      y,
      autoAlpha: visible ? 1 : 0,
      duration: DURATION.base,
      ease: EASE_OUT,
    }),
  );
}

/** The shell's first appearance: notch drops, rail slides, dock rises. */
export function introTimeline({ rail, notch, dock, extras }) {
  const tl = gsap.timeline({ defaults: { ease: EASE_OUT } });
  if (prefersReducedMotion()) {
    tl.set([rail, notch, dock, extras].filter(Boolean), {
      autoAlpha: 1,
      clearProps: 'transform',
    });
    return tl;
  }
  if (rail)
    tl.fromTo(
      rail,
      { autoAlpha: 0, x: -24 },
      { autoAlpha: 1, x: 0, duration: DURATION.slow, clearProps: 'transform' },
      0,
    );
  if (rail?.querySelectorAll)
    tl.fromTo(
      rail.querySelectorAll('.sn-rail__item'),
      { autoAlpha: 0, x: -8 },
      {
        autoAlpha: 1,
        x: 0,
        duration: DURATION.base,
        stagger: 0.035,
        clearProps: 'transform',
      },
      0.1,
    );
  if (notch)
    tl.fromTo(
      notch,
      { autoAlpha: 0, y: -20 },
      { autoAlpha: 1, y: 0, duration: DURATION.slow, clearProps: 'transform' },
      0.08,
    );
  if (dock)
    tl.fromTo(
      dock,
      { autoAlpha: 0, y: 24 },
      { autoAlpha: 1, y: 0, duration: DURATION.slow, clearProps: 'transform' },
      0.16,
    );
  if (extras)
    tl.fromTo(
      extras,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: DURATION.slow },
      0.24,
    );
  return tl;
}
