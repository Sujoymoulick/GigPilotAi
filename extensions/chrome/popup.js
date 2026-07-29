document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    const statusEl = document.getElementById('fiverrStatus');
    if (activeTab?.url?.includes('fiverr.com')) {
      statusEl.textContent = 'Fiverr Detected';
      statusEl.style.color = '#4ade80';
    } else {
      statusEl.textContent = 'Not on Fiverr';
      statusEl.style.color = '#94a3b8';
    }
  });

  document.getElementById('openDashboardBtn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:4321/dashboard' });
  });

  document.getElementById('copyDraftBtn')?.addEventListener('click', () => {
    navigator.clipboard.writeText('Sample Gig Title from GigPilot AI');
    alert('Copied draft title to clipboard!');
  });
});
