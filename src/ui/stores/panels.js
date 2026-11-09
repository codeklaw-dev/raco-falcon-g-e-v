import { defineStore } from 'pinia';
import { reactive, shallowRef } from 'vue';

/**
 * @typedef {object} RailPanel
 * @property {string} id Panel element id.
 * @property {string} title The panel's translated title.
 * @property {boolean} open Whether the panel is expanded.
 * @property {boolean} available Whether the panel is offered (not `hidden`).
 */

const samePanels = (a, b) =>
  a.length === b.length &&
  a.every(
    (panel, index) =>
      panel.id === b[index].id &&
      panel.title === b[index].title &&
      panel.open === b[index].open &&
      panel.available === b[index].available,
  );

/**
 * The desktop side panels as the rails present them. Panel disclosure stays
 * with PanelChrome; this store publishes each side's panels in order.
 */
export const usePanelStore = defineStore('gev-panels', () => {
  /** @type {{left: RailPanel[], right: RailPanel[]}} */
  const sides = reactive({ left: [], right: [] });

  /**
   * Replace one side's panels, keeping the array when nothing changed.
   * @param {'left'|'right'} side Sidebar.
   * @param {RailPanel[]} panels Panels in display order.
   */
  function setSide(side, panels) {
    if (!samePanels(sides[side], panels)) sides[side] = panels;
  }

  /**
   * @param {'left'|'right'} side Sidebar.
   * @returns {string|null} The open panel's id.
   */
  function openPanelId(side) {
    return (
      sides[side].find((panel) => panel.open && panel.available)?.id ?? null
    );
  }

  /** @param {string} id Panel id. */
  function isOpen(id) {
    return [...sides.left, ...sides.right].some(
      (panel) => panel.id === id && panel.open,
    );
  }

  /** PanelNavigation's selection, so any view can open or close a panel. */
  const selector = shallowRef(null);

  /** @param {?Function} next `select(panelId)`, or null to disconnect. */
  function connectSelect(next) {
    selector.value = typeof next === 'function' ? next : null;
  }

  /**
   * Toggle a panel as its rail item would. No-op until navigation connects.
   * @param {string} id Panel id.
   */
  function select(id) {
    selector.value?.(id);
  }

  return { sides, setSide, openPanelId, isOpen, connectSelect, select };
});
