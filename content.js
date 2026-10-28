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
    if (isEditableElement(event.target) || isEditableElement(document.activeElement)) return;

    const text = getSelectedPageText();
    if (!text) return;

    for (const action of ACTIONS) {
      if (!matchesShortcut(event, settings.shortcuts[action])) continue;
      event.preventDefault();
      event.stopImmediatePropagation();
      handlers[action](text);
      return;
    }
  }

  function isEditableElement(element) {
    if (!(element instanceof Element)) return false;
    if (element.isContentEditable || element.matches('input, textarea, select')) return true;
    const editableAncestor = element.closest('[contenteditable]');
    return Boolean(editableAncestor?.isContentEditable);
  }

  function getSelectedPageText() {
    if (document.designMode === 'on') return '';
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return '';
    if (isEditableNode(selection.anchorNode) || isEditableNode(selection.focusNode)) return '';
    return selection.toString().trim();
  }

  function isEditableNode(node) {
    const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    return element ? isEditableElement(element) : false;
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
