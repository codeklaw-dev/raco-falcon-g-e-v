<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import { storeToRefs } from 'pinia';
import {
  Check,
  ChevronDown,
  Compass,
  Contrast,
  Eraser,
  Globe,
  Link2,
  Moon,
  Palette,
  Thermometer,
  Tv,
  Sun,
} from '@lucide/vue';
import { msg, t } from '../../i18n/index.js';
import { useDisplayStore } from '../stores/display.js';
import { useGlobeActionsStore } from '../stores/globeActions.js';
import { useLocationStore } from '../stores/location.js';
import { useWorldTimeStore } from '../stores/worldTime.js';
import { enter, pop } from './motion.js';

// The notch: where you are, how the globe looks, what time it shows, and the
// camera actions, in one small bar at the top center.
const display = useDisplayStore();
const { style, mapSource, mapSourceControls } = storeToRefs(display);
const { view: loc } = storeToRefs(useLocationStore());
const worldTime = useWorldTimeStore();
const { time } = storeToRefs(worldTime);
const globe = useGlobeActionsStore();

/** The visual styles under plain names; ids are the style manager's. */
const VIEW_MODES = [
  {
    id: 'normal',
    label: msg('Standard'),
    hint: msg('True colour, no filter'),
    icon: Sun,
  },
  {
    id: 'noir',
    label: msg('Mono'),
    hint: msg('High-contrast black and white'),
    icon: Contrast,
  },
  {
    id: 'thermal',
    label: msg('Thermal'),
    hint: msg('White-hot heat contrast'),
    icon: Thermometer,
  },
  {
    id: 'surveillance',
    label: msg('Night vision'),
    hint: msg('Green low-light intensifier'),
    icon: Moon,
  },
  {
    id: 'retro',
    label: msg('Retro CRT'),
    hint: msg('Phosphor screen with scanlines'),
    icon: Tv,
  },
  {
    id: 'anime',
    label: msg('Illustrated'),
    hint: msg('Cel-shaded colour and outlines'),
    icon: Palette,
  },
];
const activeMode = computed(
  () => VIEW_MODES.find((m) => m.id === style.value?.name) ?? VIEW_MODES[0],
);

const place = computed(() => {
  const text = String(loc.value?.status?.city ?? '').replace(/^\s*📍\s*/u, '');
  return !text || /--\s*$/.test(text) ? t('Earth') : text;
});

const clock = computed(() => {
  const ms = time.value?.timeMs;
  if (!Number.isFinite(ms)) return '';
  return new Date(ms).toISOString().slice(11, 16) + ' UTC';
});
const live = computed(() => time.value?.live !== false);

const open = ref(false);
const menu = ref(null);
const root = ref(null);
watch(open, async (next) => {
  if (next) {
    await nextTick();
    pop(menu.value, true);
    enter(menu.value?.querySelectorAll('.sn-menu__item'), {
      y: 4,
      stagger: 0.025,
      delay: 0.04,
    });
  }
});
function closeMenu() {
  if (!open.value) return;
  const tween = pop(menu.value, false);
  if (tween) tween.eventCallback('onComplete', () => (open.value = false));
  else open.value = false;
}
function toggleMenu() {
  if (open.value) closeMenu();
  else open.value = true;
}
function chooseMode(mode) {
  display.act('setStyle', mode.id);
}
function chooseSource(chip) {
  if (!chip.available) return;
  void mapSourceControls.value?.select(chip.id).catch(() => {});
}
function onDocPointer(event) {
  if (open.value && root.value && !root.value.contains(event.target))
    closeMenu();
}
function onKey(event) {
  if (event.key === 'Escape' && open.value) {
    event.stopPropagation();
    closeMenu();
  }
}
onMounted(() => {
  globalThis.document?.addEventListener('pointerdown', onDocPointer, true);
  globalThis.document?.addEventListener('keydown', onKey, true);
});
onBeforeUnmount(() => {
  globalThis.document?.removeEventListener('pointerdown', onDocPointer, true);
  globalThis.document?.removeEventListener('keydown', onKey, true);
});
</script>

<template>
  <div ref="root" class="sn-notch" role="toolbar" :aria-label="t('View')">
    <span class="sn-notch__place" :title="place">{{ place }}</span>
    <span class="sn-notch__sep" aria-hidden="true"></span>
    <button
      type="button"
      class="sn-notch__btn"
      :class="{ 'is-open': open }"
      aria-haspopup="menu"
      :aria-expanded="String(open)"
      @click="toggleMenu"
    >
      <span class="sn-notch__label">{{ t('View') }}</span>
      <span>{{ t(activeMode.label) }}</span>
      <ChevronDown
        class="sn-notch__chev"
        :size="14"
        :stroke-width="2"
        aria-hidden="true"
      />
    </button>
    <button
      type="button"
      class="sn-notch__btn"
      :title="live ? t('Showing live data') : t('Return to live')"
      @click="worldTime.goLive()"
    >
      <span
        class="sn-live-dot"
        :class="{ 'is-live': live }"
        aria-hidden="true"
      ></span>
      <span>{{ live ? t('Live') : clock }}</span>
    </button>
    <span class="sn-notch__sep" aria-hidden="true"></span>
    <div class="sn-notch__actions">
      <button
        type="button"
        class="sn-icon-btn"
        :aria-label="t('Clear all layers')"
        :data-tip="t('Clear layers')"
        @click="globe.act('clear')"
      >
        <Eraser :size="16" :stroke-width="1.75" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="sn-icon-btn"
        :aria-label="t('Copy share link')"
        :data-tip="t('Copy link')"
        @click="globe.act('share')"
      >
        <Link2 :size="16" :stroke-width="1.75" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="sn-icon-btn"
        :aria-label="t('North up')"
        :data-tip="t('North up')"
        @click="globe.act('northUp')"
      >
        <Compass :size="16" :stroke-width="1.75" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="sn-icon-btn"
        :aria-label="t('Full globe view')"
        :data-tip="t('Full globe')"
        @click="globe.act('reset')"
      >
        <Globe :size="16" :stroke-width="1.75" aria-hidden="true" />
      </button>
    </div>

    <div
      v-if="open"
      ref="menu"
      class="sn-menu"
      role="menu"
      :aria-label="t('View mode')"
    >
      <p class="sn-menu__heading">{{ t('View mode') }}</p>
      <button
        v-for="mode in VIEW_MODES"
        :key="mode.id"
        type="button"
        role="menuitemradio"
        class="sn-menu__item"
        :aria-checked="String(mode.id === activeMode.id)"
        @click="chooseMode(mode)"
      >
        <span class="sn-menu__swatch" :data-mode="mode.id" aria-hidden="true">
          <component :is="mode.icon" :size="16" :stroke-width="1.75" />
        </span>
        <span class="sn-menu__text">
          <span class="sn-menu__label">{{ t(mode.label) }}</span>
          <span class="sn-menu__hint">{{ t(mode.hint) }}</span>
        </span>
        <Check
          v-if="mode.id === activeMode.id"
          class="sn-menu__check"
          :size="16"
          :stroke-width="2"
          aria-hidden="true"
        />
      </button>
      <template v-if="mapSource?.chips?.length">
        <p class="sn-menu__heading">{{ t('Map source') }}</p>
        <div class="sn-menu__chips">
          <button
            v-for="chip in mapSource.chips"
            :key="chip.id"
            type="button"
            class="sn-chip sn-menu__item"
            :class="{ 'is-active': chip.active }"
            :aria-pressed="String(Boolean(chip.active))"
            :aria-disabled="String(!chip.available)"
            :title="chip.title"
            @click="chooseSource(chip)"
          >
            {{ chip.label }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
