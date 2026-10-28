# Google Quick Search

A Chrome (Manifest V3) extension that acts on the text you select. Highlight any word or
phrase on a page or in a text field, then press a shortcut:

- **S** — search the selection on Google in a new tab.
- **A** — open Gemini in a new tab with the selection filled in as your prompt.

Both shortcuts are customizable, and the extension can be disabled at any time.

## Install

1. Clone or download this repository.
2. Open `chrome://extensions` in Chrome or any Chromium browser.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select this folder.

Click the toolbar icon to open the settings page.

## Usage

Select text, then press the shortcut. Shortcuts fire whenever text is selected — on the
page or inside inputs, textareas, and editable fields.

They do not run on `chrome://` pages, the Chrome Web Store, or in PDF viewers. For Ask
Gemini, you may need to press Enter or click Send in Gemini after the prompt is filled in.

## Settings

Open the options page from the toolbar icon:

- Click a shortcut, then press the key combination to record it.
- Press <kbd>Esc</kbd> to cancel, or <kbd>Backspace</kbd>/<kbd>Delete</kbd> to clear a shortcut.
- Duplicate shortcuts are rejected.
- Changes save automatically and sync through Chrome.

Defaults: **S** for Search Google, **A** for Ask Gemini.

## Notes

- Settings are stored with `chrome.storage.sync`; the only requested permission is `storage`.
- Ask Gemini uses the unofficial `https://gemini.google.com/app?q=` URL parameter to prefill
  the prompt. You must be signed in to a Google account; very long selections may exceed URL
  length limits.
- There is no build step — the extension runs directly from this folder.
