(() => {
  const {
    SETTINGS_KEY,
    ACTIONS,
    DEFAULT_SETTINGS,
    isMac,
    isModifierKey,
    shortcutFromEvent,
    shortcutsEqual,
    normalizeSettings,
    formatModifiers,
    formatShortcut
  } = GQS;

  const ACTION_LABELS = {
    search: 'Search Google',
    askGemini: 'Ask Gemini'
  };

  const enabledInput = document.getElementById('enabled');
  const errorEl = document.getElementById('error');
  const statusEl = document.getElementById('status');
  const resetButton = document.getElementById('reset');
  const recorders = new Map(
    ACTIONS.map((action) => [action, document.querySelector(`[data-recorder="${action}"]`)])
  );

  let settings = normalizeSettings(DEFAULT_SETTINGS);
  let recordingAction = null;
  let statusTimer = null;

  enabledInput.addEventListener('change', () => {
    settings.enabled = enabledInput.checked;
    persist();
  });

  resetButton.addEventListener('click', () => {
    stopRecording();
    settings = normalizeSettings(DEFAULT_SETTINGS);
    render();
    persist();
  });

  for (const [action, button] of recorders) {
    button.addEventListener('click', () => {
      if (recordingAction === action) {
        stopRecording();
      } else {
        startRecording(action);
      }
    });
  }

  document.addEventListener('click', (event) => {
    if (!recordingAction) return;
    const button = recorders.get(recordingAction);
    if (button && button.contains(event.target)) return;
    stopRecording();
  }, true);

  window.addEventListener('keydown', (event) => {
    if (!recordingAction) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    handleRecordingKey(event);
  }, true);

  window.addEventListener('blur', () => {
    if (recordingAction) stopRecording();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync' || !changes[SETTINGS_KEY] || recordingAction) return;
    settings = normalizeSettings(changes[SETTINGS_KEY].newValue);
    render();
  });

  (async () => {
    try {
      const data = await chrome.storage.sync.get(SETTINGS_KEY);
      settings = normalizeSettings(data[SETTINGS_KEY]);
    } catch {}
    render();
  })();

  function startRecording(action) {
    stopRecording();
    recordingAction = action;
    showError('');
    const button = recorders.get(action);
    button.classList.add('recording');
    button.textContent = 'Press keys…';
  }

  function stopRecording() {
    if (!recordingAction) return;
    const action = recordingAction;
    recordingAction = null;
    recorders.get(action).classList.remove('recording');
    renderRecorder(action);
  }

  function handleRecordingKey(event) {
    if (event.key === 'Escape') {
      stopRecording();
      return;
    }

    const hasModifier = event.ctrlKey || event.altKey || event.shiftKey || event.metaKey;
    if (!hasModifier && (event.key === 'Backspace' || event.key === 'Delete')) {
      settings.shortcuts[recordingAction] = null;
      stopRecording();
      persist();
      return;
    }

    if (isModifierKey(event.key)) {
      showModifierPreview(event);
      return;
    }

    const shortcut = shortcutFromEvent(event);
    if (!shortcut) return;

    const action = recordingAction;
    const duplicate = ACTIONS.find(
      (other) => other !== action && shortcutsEqual(settings.shortcuts[other], shortcut)
    );

    if (duplicate) {
      showError(`${formatShortcut(shortcut)} is already used by ${ACTION_LABELS[duplicate]}.`);
      stopRecording();
      return;
    }

    settings.shortcuts[action] = shortcut;
    stopRecording();
    persist();
  }

  function showModifierPreview(event) {
    const parts = formatModifiers({
      ctrl: event.ctrlKey,
      alt: event.altKey,
      shift: event.shiftKey,
      meta: event.metaKey
    });
    const button = recorders.get(recordingAction);
    if (parts.length === 0) {
      button.textContent = 'Press keys…';
    } else {
      button.textContent = isMac ? `${parts.join('')}…` : `${parts.join(' + ')} + …`;
    }
  }

  async function persist() {
    try {
      await chrome.storage.sync.set({ [SETTINGS_KEY]: settings });
      showError('');
      flashStatus('Saved');
    } catch (error) {
      showError(`Could not save: ${error?.message || error}`);
    }
  }

  function render() {
    enabledInput.checked = settings.enabled;
    for (const action of ACTIONS) {
      renderRecorder(action);
    }
  }

  function renderRecorder(action) {
    const button = recorders.get(action);
    const shortcut = settings.shortcuts[action];
    button.classList.toggle('unset', !shortcut);
    button.textContent = formatShortcut(shortcut);
    button.setAttribute('aria-label', `${ACTION_LABELS[action]}: ${formatShortcut(shortcut)}. Activate to change.`);
  }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = !message;
  }

  function flashStatus(message) {
    statusEl.textContent = message;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
      statusEl.textContent = '';
    }, 1600);
  }
})();
