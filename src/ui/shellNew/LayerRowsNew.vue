<script setup>
import RailChips from '../rail/RailChips.vue';
import RailRowList from '../rail/RailRowList.vue';
import RowSlider from '../layerPanel/RowSlider.vue';
import RowSwitch from '../layerPanel/RowSwitch.vue';
import RowText from '../layerPanel/RowText.vue';
import { FALLBACK_LAYER_ICON, LAYER_ICONS } from './icons.js';

// The data layer rows for the redesigned shell. Same contract as
// LayerRows.vue: LayerPanel presents every value and receives clicks with the
// layer id. Rows keep `data-layer-id`, which the voice agent highlights by.
defineProps({
  items: { type: Array, required: true },
  onToggle: { type: Function, default: () => {} },
  onChip: { type: Function, default: () => {} },
  onListItem: { type: Function, default: () => {} },
  onSlider: { type: Function, default: () => {} },
});

const iconFor = (id) => LAYER_ICONS[id] ?? FALLBACK_LAYER_ICON;
// Steady states read from the switch itself; others get a small status pill.
const QUIET = new Set(['off', 'nominal']);
const statusOf = (toggle) =>
  QUIET.has(toggle.feedState)
    ? null
    : { state: toggle.feedState, text: toggle.text };
</script>

<template>
  <template v-for="item in items" :key="item.key">
    <h3 v-if="item.heading" class="sn-layer-group">{{ item.heading }}</h3>
    <div
      v-else
      class="sn-layer"
      :class="{
        'is-on': item.toggle.classes.active,
        'is-busy': item.toggle.classes.transitioning,
        'is-unavailable': item.toggle.feedState === 'unavailable',
      }"
      :data-layer-id="item.id"
      :data-layer-name="item.englishName"
    >
      <div class="sn-layer__main">
        <span class="sn-layer__icon" aria-hidden="true">
          <component :is="iconFor(item.id)" :size="16" :stroke-width="1.75" />
        </span>
        <div class="sn-layer__text">
          <RowText class="sn-layer__name" :text="item.name" />
          <RowText tag="div" class="sn-layer__meta" :text="item.meta" />
        </div>
        <span
          v-if="statusOf(item.toggle)"
          class="sn-pill"
          :data-state="statusOf(item.toggle).state"
          >{{ statusOf(item.toggle).text }}</span
        >
        <RowText
          v-else-if="item.count && !item.count.empty"
          class="sn-layer__count"
          :text="item.count.text"
        />
        <button
          type="button"
          role="switch"
          class="sn-switch"
          :aria-checked="String(Boolean(item.toggle.classes.active))"
          :data-feed-state="item.toggle.feedState"
          :aria-disabled="String(item.toggle.ariaDisabled)"
          :aria-busy="String(item.toggle.ariaBusy)"
          :title="item.toggle.title || undefined"
          :aria-label="item.toggle.ariaLabel"
          @click="onToggle(item.id)"
        >
          <span class="sn-switch__thumb" aria-hidden="true"></span>
        </button>
      </div>
      <template v-if="item.controls">
        <div
          class="sn-layer__controls data-toggle-controls"
          :hidden="item.controls.hidden"
        >
          <RailChips
            :chips="item.controls.chips"
            :on-select="(chip) => onChip(item.id, chip.id)"
          />
          <RowSwitch
            v-if="item.controls.segmented"
            :segmented="item.controls.segmented"
            :on-select="(optionId) => onChip(item.id, optionId)"
          />
          <RowSlider
            v-if="item.controls.slider"
            :slider="item.controls.slider"
            :on-input="
              (value) => onSlider(item.id, item.controls.slider.id, value)
            "
          />
          <span
            v-for="(entry, index) in item.controls.legend"
            :key="index"
            class="data-toggle-legend-item"
            :title="entry.blurb || undefined"
            ><span
              class="data-toggle-legend-swatch"
              :style="{ background: entry.color }"
            ></span
            ><span>{{ entry.text }}</span></span
          >
          <div
            v-if="item.controls.info"
            class="data-toggle-controls-info"
            :title="item.controls.info.title"
            :hidden="!item.controls.info.text"
          >
            {{ item.controls.info.text }}
          </div>
        </div>
        <RailRowList
          :list="item.controls.list"
          :on-select="(entry) => onListItem(item.id, entry.id)"
        />
      </template>
    </div>
  </template>
</template>
