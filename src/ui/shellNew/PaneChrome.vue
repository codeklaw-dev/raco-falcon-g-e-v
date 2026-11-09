<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { X } from '@lucide/vue';
import { t } from '../../i18n/index.js';
import { usePanelStore } from '../stores/panels.js';
import { PANEL_NAV } from './icons.js';
import { enter, slidePanel } from './motion.js';

// The frame around one side's open panel: the pane beside the rail (left
// side) or the inspector (right side). The panel itself stays in its stack,
// which the shell's stylesheet places inside this frame.
const props = defineProps({ side: { type: String, required: true } });
const panels = usePanelStore();
const frame = ref(null);

const openId = computed(() => panels.openPanelId(props.side));
const openPanel = computed(() =>
  panels.sides[props.side].find((p) => p.id === openId.value),
);
const title = computed(
  () =>
    (PANEL_NAV[openId.value] && t(PANEL_NAV[openId.value].label)) ??
    openPanel.value?.title ??
    '',
);
const stackId =
  props.side === 'left' ? 'left-panel-stack' : 'right-context-rail';
const from = props.side === 'left' ? -20 : 20;

/** Stagger the first rows of the open panel in, for a calm reveal. */
function revealRows(stack) {
  const panel =
    openId.value && stack.querySelector(`#${CSS.escape(openId.value)}`);
  if (!panel) return;
  const rows = panel.querySelectorAll(
    '.sn-layer, .sn-layer-group, .scene-controls, .scene-step-heading, .cctv-panel-inner > *, .pp-panel-body > *, .street-level-panel-inner > *, .global-context-panel-inner > *',
  );
  enter([...rows].slice(0, 16), {
    y: 6,
    stagger: 0.022,
    delay: 0.06,
    duration: 0.3,
  });
}

function animate(open) {
  slidePanel(frame.value, open, { from });
  const stack = globalThis.document?.getElementById(stackId);
  if (!stack) return;
  slidePanel(stack, open, { from });
  if (open) revealRows(stack);
}

// The stylesheet shows a side's stack only while it has an open panel.
watch(
  openId,
  (next) =>
    globalThis.document?.documentElement?.toggleAttribute(
      `data-sn-${props.side}-open`,
      Boolean(next),
    ),
  { immediate: true },
);

watch(openId, (next, prev) => {
  if (Boolean(next) !== Boolean(prev)) animate(Boolean(next));
  else if (next && next !== prev) {
    // Switching panels: a quick cross-fade of the content only.
    const stack = globalThis.document?.getElementById(stackId);
    if (stack) {
      slidePanel(stack, true, { from: from / 2 });
      revealRows(stack);
    }
  }
});
onMounted(() => {
  if (frame.value && !openId.value) frame.value.style.visibility = 'hidden';
});

function close() {
  if (openId.value) panels.select(openId.value);
}
</script>

<template>
  <section
    ref="frame"
    class="sn-pane"
    :class="`sn-pane--${side}`"
    :aria-label="title"
    :aria-hidden="openId ? undefined : 'true'"
  >
    <header class="sn-pane__header">
      <h2 class="sn-pane__title">{{ title }}</h2>
      <button
        type="button"
        class="sn-icon-btn"
        :aria-label="t('Close {name}', { name: title })"
        @click="close"
      >
        <X :size="16" :stroke-width="1.75" aria-hidden="true" />
      </button>
    </header>
  </section>
</template>
