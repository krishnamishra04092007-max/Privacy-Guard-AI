// background.js - Service worker to open side panel and manage lifecycle

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('[Privacy Guard AI] setPanelBehavior error:', error));

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Privacy Guard AI] Extension successfully installed.');
});