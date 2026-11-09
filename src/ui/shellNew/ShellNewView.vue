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
import { gsap } from 'gsap';
import { isNewShell } from '../shellVariant.js';
import { useVoiceStore } from '../stores/voice.js';
import NavRail from './NavRail.vue';
import PaneChrome from './PaneChrome.vue';
import TopNotch from './TopNotch.vue';
import {
  DURATION,
  EASE_OUT,
  introTimeline,
  prefersReducedMotion,
} from './motion.js';

// The chat grows up out of the control center when it opens.
const { view: voice } = storeToRefs(useVoiceStore());
const chatOpen = computed(() =>
  Boolean(voice.value?.chat?.open && !voice.value?.chat?.minimized),
);
watch(chatOpen, async (open) => {
  if (!open || prefersReducedMotion()) return;
  await nextTick();
  const panel = globalThis.document?.getElementById('gev-chat-panel');
  if (!panel) return;
  gsap.fromTo(
    panel,
    { autoAlpha: 0, y: 18, scale: 0.97, transformOrigin: '50% 100%' },
    {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: DURATION.slow,
      ease: EASE_OUT,
      clearProps: 'transform,opacity,visibility',
    },
  );
});

// The redesigned shell's own chrome. Renders nothing on the classic shell.
// Existing panels, the dock and the chat keep their owners; shell.css places
// and restyles them under html[data-ui="new"].
const enabled = isNewShell();
const rail = ref(null);
const notch = ref(null);
let observer = null;
let played = false;

function playIntro() {
  if (played) return;
  played = true;
  introTimeline({
    rail: rail.value?.$el,
    notch: notch.value?.$el,
    dock: globalThis.document?.getElementById('command-dock'),
    extras: globalThis.document?.querySelectorAll(
      '.locale-picker, #corner-actions',
    ),
  });
}

onMounted(() => {
  if (!enabled) return;
  // Play once the loading screen has gone, so the motion is actually seen.
  const loader = globalThis.document?.getElementById('loading-screen');
  if (!loader || loader.classList.contains('hidden')) return playIntro();
  observer = new MutationObserver(() => {
    if (loader.classList.contains('hidden')) {
      observer?.disconnect();
      playIntro();
    }
  });
  observer.observe(loader, { attributes: true, attributeFilter: ['class'] });
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <div v-if="enabled" class="sn-shell">
    <NavRail ref="rail" />
    <PaneChrome side="left" />
    <PaneChrome side="right" />
    <TopNotch ref="notch" />
  </div>
</template>
