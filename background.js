const GOOGLE_SEARCH_URL = 'https://www.google.com/search?q=';
const GEMINI_URL = 'https://gemini.google.com/app?q=';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message)
    .then(() => sendResponse({ ok: true }))
    .catch((error) => {
      console.warn('[Google Quick Search]', error);
      sendResponse({ ok: false, error: String(error?.message || error) });
    });
  return true;
});

async function handleMessage(message) {
  switch (message?.type) {
    case 'google-search':
      await openTab(GOOGLE_SEARCH_URL + encodeURIComponent(message.text));
      return;
    case 'ask-gemini':
      await openTab(GEMINI_URL + encodeURIComponent(message.text));
      return;
  }
}

function openTab(url) {
  return chrome.tabs.create({ url, active: true });
}

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});
