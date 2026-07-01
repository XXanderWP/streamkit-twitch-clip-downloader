const statusEl = document.getElementById('status');

async function loadState() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') ?? '';
  const url = `http://localhost:${window.location.port}/addon/MyOrg/my-stream-addon/state?token=${encodeURIComponent(token)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (statusEl) {
      statusEl.textContent = data.ok ? 'Connected' : JSON.stringify(data);
    }
  } catch (error) {
    if (statusEl) {
      statusEl.textContent = 'Static widget — customize app.ts';
    }
    console.error(error);
  }
}

loadState();
