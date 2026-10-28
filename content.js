(() => {
  const { ACTIONS, DEFAULT_SETTINGS, SETTINGS_KEY, matchesShortcut, normalizeSettings } = GQS;

  let settings = normalizeSettings(DEFAULT_SETTINGS);

  chrome.storage.sync
    .get(SETTINGS_KEY)
    .then((data) => {
      settings = normalizeSettings(data[SETTINGS_KEY]);
    })
    .catch(() => {});

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes[SETTINGS_KEY]) {
      settings = normalizeSettings(changes[SETTINGS_KEY].newValue);
    }
  });

  const handlers = {
    search: (text) => send({ type: 'google-search', text }),
    askGemini: (text) => send({ type: 'ask-gemini', text })
  };

  window.addEventListener('keydown', onKeyDown, true);

  function onKeyDown(event) {
    if (!settings.enabled || event.defaultPrevented || event.repeat || event.isComposing) return;

    const text = getSelectedText();
    if (!text) return;

    for (const action of ACTIONS) {
      if (!matchesShortcut(event, settings.shortcuts[action])) continue;
      event.preventDefault();
      event.stopImmediatePropagation();
      handlers[action](text);
      return;
    }
  }

  function getSelectedText() {
    const active = document.activeElement;
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
      const { selectionStart, selectionEnd, value } = active;
      if (typeof selectionStart === 'number' && typeof selectionEnd === 'number' && selectionEnd > selectionStart) {
        return value.slice(selectionStart, selectionEnd).trim();
      }
      return '';
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return '';
    return selection.toString().trim();
  }

  function send(message) {
    try {
      const pending = chrome.runtime.sendMessage(message);
      if (pending && typeof pending.catch === 'function') {
        pending.catch(() => {});
      }
    } catch {
      // The extension context is gone after a reload or update.
    }
  }
})();
