console.log('[GigPilot AI Companion] Content Script Loaded on Fiverr Page');
// Listen for helper messages safely without executing illegal automated publishing
chrome.runtime?.onMessage?.addListener((request, sender, sendResponse) => {
  if (request.action === 'detect_fiverr_form') {
    sendResponse({ detected: true, url: window.location.href });
  }
});
