(() => {
  const SETTINGS_KEY = 'settings';
  const ACTIONS = ['search', 'askGemini'];

  const DEFAULT_SETTINGS = Object.freeze({
    enabled: true,
    shortcuts: Object.freeze({
      search: Object.freeze({ key: 's', ctrl: false, alt: false, shift: false, meta: false }),
      askGemini: Object.freeze({ key: 'a', ctrl: false, alt: false, shift: false, meta: false })
    })
  });

  const MODIFIER_KEYS = new Set([
    'Alt', 'AltGraph', 'CapsLock', 'Control', 'Fn', 'FnLock', 'Hyper', 'Meta',
    'NumLock', 'OS', 'ScrollLock', 'Shift', 'Super', 'Symbol', 'SymbolLock'
  ]);

  const IGNORED_KEYS = new Set(['dead', 'escape', 'process', 'unidentified']);

  const platform = (typeof navigator !== 'undefined' && (navigator.userAgentData?.platform || navigator.platform)) || '';
  const isMac = /mac/i.test(platform);

  function isModifierKey(key) {
    return MODIFIER_KEYS.has(key);
  }

  function normalizeKey(rawKey) {
    if (typeof rawKey !== 'string' || rawKey.length === 0) return null;
    if (rawKey === ' ' || rawKey === 'Spacebar' || rawKey === 'Space') return 'space';
    return rawKey.toLowerCase();
  }

  function shortcutFromEvent(event) {
    if (isModifierKey(event.key)) return null;
    const key = normalizeKey(event.key);
    if (!key || IGNORED_KEYS.has(key)) return null;
    return {
      key,
      ctrl: !!event.ctrlKey,
      alt: !!event.altKey,
      shift: !!event.shiftKey,
      meta: !!event.metaKey
    };
  }

  function normalizeShortcut(value) {
    if (!value || typeof value !== 'object') return null;
    if (value.key === null) return null;
    const key = normalizeKey(value.key);
    if (!key) return null;
    return {
      key,
      ctrl: !!value.ctrl,
      alt: !!value.alt,
      shift: !!value.shift,
      meta: !!value.meta
    };
  }

  function normalizeSettings(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const rawShortcuts = source.shortcuts && typeof source.shortcuts === 'object' ? source.shortcuts : {};
    const shortcuts = {};

    for (const action of ACTIONS) {
      const value = rawShortcuts[action];
      if (value === null || (value && typeof value === 'object' && value.key === null)) {
        shortcuts[action] = null;
      } else {
        shortcuts[action] = normalizeShortcut(value) || { ...DEFAULT_SETTINGS.shortcuts[action] };
      }
    }

    return { enabled: source.enabled !== false, shortcuts };
  }

  function matchesShortcut(event, shortcut) {
    if (!shortcut || !shortcut.key) return false;
    const key = normalizeKey(event.key);
    if (!key || key !== shortcut.key) return false;
    return event.ctrlKey === !!shortcut.ctrl
      && event.altKey === !!shortcut.alt
      && event.shiftKey === !!shortcut.shift
      && event.metaKey === !!shortcut.meta;
  }

  function shortcutsEqual(a, b) {
    if (!a || !b) return false;
    return a.key === b.key
      && !!a.ctrl === !!b.ctrl
      && !!a.alt === !!b.alt
      && !!a.shift === !!b.shift
      && !!a.meta === !!b.meta;
  }

  function formatModifiers(modifiers) {
    const parts = [];
    if (isMac) {
      if (modifiers.ctrl) parts.push('⌃');
      if (modifiers.alt) parts.push('⌥');
      if (modifiers.shift) parts.push('⇧');
      if (modifiers.meta) parts.push('⌘');
    } else {
      if (modifiers.ctrl) parts.push('Ctrl');
      if (modifiers.alt) parts.push('Alt');
      if (modifiers.shift) parts.push('Shift');
      if (modifiers.meta) parts.push('Meta');
    }
    return parts;
  }

  const KEY_LABELS = {
    space: 'Space',
    escape: 'Esc',
    enter: 'Enter',
    tab: 'Tab',
    backspace: 'Backspace',
    delete: 'Delete',
    insert: 'Insert',
    home: 'Home',
    end: 'End',
    pageup: 'Page Up',
    pagedown: 'Page Down',
    arrowup: '↑',
    arrowdown: '↓',
    arrowleft: '←',
    arrowright: '→'
  };

  function formatKey(key) {
    if (KEY_LABELS[key]) return KEY_LABELS[key];
    if (/^f([1-9]|1[0-9]|2[0-4])$/.test(key)) return key.toUpperCase();
    if (key.length === 1) return key.toUpperCase();
    return key.charAt(0).toUpperCase() + key.slice(1);
  }

  function formatShortcut(shortcut) {
    if (!shortcut || !shortcut.key) return 'Not set';
    const parts = formatModifiers(shortcut);
    parts.push(formatKey(shortcut.key));
    return parts.join(isMac ? '' : ' + ');
  }

  globalThis.GQS = Object.freeze({
    SETTINGS_KEY,
    ACTIONS,
    DEFAULT_SETTINGS,
    isMac,
    isModifierKey,
    normalizeKey,
    shortcutFromEvent,
    normalizeShortcut,
    normalizeSettings,
    matchesShortcut,
    shortcutsEqual,
    formatModifiers,
    formatShortcut
  });
})();
