<script setup>
import { computed } from 'vue';
import { gsap } from 'gsap';
import { ArrowLeftRight } from '@lucide/vue';
import { t } from '../../i18n/index.js';
import { usePanelStore } from '../stores/panels.js';
import { FALLBACK_PANEL_ICON, PANEL_NAV, PANEL_NAV_ORDER } from './icons.js';
import { prefersReducedMotion } from './motion.js';

// The first bar of the Outlook-style navigation: one icon per side panel.
// Panels on the left side open in the pane beside this rail; panels on the
// right side open in the inspector. Disclosure stays with PanelNavigation.
const panels = usePanelStore();

const items = computed(() => {
  const all = [
    ...panels.sides.left.map((p) => ({ ...p, side: 'left' })),
    ...panels.sides.right.map((p) => ({ ...p, side: 'right' })),
  ].filter((p) => p.available);
  const rank = (id) => {
    const i = PANEL_NAV_ORDER.indexOf(id);
    return i === -1 ? PANEL_NAV_ORDER.length : i;
  };
  return all
    .sort((a, b) => rank(a.id) - rank(b.id))
    .map((p) => ({
      id: p.id,
      side: p.side,
      open: p.open,
      icon: PANEL_NAV[p.id]?.icon ?? FALLBACK_PANEL_ICON,
      label: PANEL_NAV[p.id] ? t(PANEL_NAV[p.id].label) : p.title,
    }));
});
// Display and tools sit apart at the bottom, like settings in a mail app.
const BOTTOM = new Set(['utilities-panel', 'scene-panel', 'pp-toggles']);
const top = computed(() => items.value.filter((i) => !BOTTOM.has(i.id)));
const bottom = computed(() => items.value.filter((i) => BOTTOM.has(i.id)));

function choose(item, event) {
  panels.select(item.id);
  if (prefersReducedMotion()) return;
  const icon = event.currentTarget.querySelector('.sn-rail__glyph');
  gsap.fromTo(
    icon,
    { scale: 0.82 },
    { scale: 1, duration: 0.42, ease: 'back.out(3)' },
  );
}

function classicShell() {
  const url = new URL(globalThis.location.href);
  url.searchParams.set('ui', 'classic');
  globalThis.location.assign(url.toString());
}
</script>

<template>
  <nav class="sn-rail" :aria-label="t('Main navigation')">
    <div class="sn-rail__brand" aria-hidden="true"><span>F</span></div>
    <ul class="sn-rail__list">
      <li v-for="item in top" :key="item.id">
        <button
          type="button"
          class="sn-rail__item"
          :class="{ 'is-active': item.open }"
          :aria-pressed="String(item.open)"
          :aria-label="item.label"
          :data-tip="item.label"
          @click="choose(item, $event)"
        >
          <component
            :is="item.icon"
            class="sn-rail__glyph"
            :size="20"
            :stroke-width="1.6"
            aria-hidden="true"
          />
        </button>
      </li>
    </ul>
    <ul class="sn-rail__list sn-rail__list--bottom">
      <li v-for="item in bottom" :key="item.id">
        <button
          type="button"
          class="sn-rail__item"
          :class="{ 'is-active': item.open }"
          :aria-pressed="String(item.open)"
          :aria-label="item.label"
          :data-tip="item.label"
          @click="choose(item, $event)"
        >
          <component
            :is="item.icon"
            class="sn-rail__glyph"
            :size="20"
            :stroke-width="1.6"
            aria-hidden="true"
          />
        </button>
      </li>
      <li>
        <button
          type="button"
          class="sn-rail__item"
          :aria-label="t('Switch to the classic interface')"
          :data-tip="t('Classic interface')"
          @click="classicShell"
        >
          <ArrowLeftRight
            class="sn-rail__glyph"
            :size="18"
            :stroke-width="1.6"
            aria-hidden="true"
          />
        </button>
      </li>
    </ul>
  </nav>
</template>
