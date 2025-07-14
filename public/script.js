document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('shorten-form');
  const longUrlInput = document.getElementById('long-url');
  const resultDiv = document.getElementById('result');
  const shortUrlLink = document.getElementById('short-url');
  const copyBtn = document.getElementById('copy-btn');
  const errorDiv = document.getElementById('error');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    errorDiv.classList.add('hidden');
    resultDiv.classList.add('hidden');
    const longUrl = longUrlInput.value.trim();
    if (!longUrl) return;

    try {
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: longUrl })
      });
      const data = await res.json();
      if (res.ok && data.shortUrl) {
        shortUrlLink.href = data.shortUrl;
        shortUrlLink.textContent = data.shortUrl;
        resultDiv.classList.remove('hidden');
      } else {
        throw new Error(data.message || 'Failed to shorten URL');
      }
    } catch (err) {
      errorDiv.textContent = err.message;
      errorDiv.classList.remove('hidden');
    }
  });

  copyBtn.addEventListener('click', function () {
    const url = shortUrlLink.textContent;
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      copyBtn.textContent = 'Copied!';
      setTimeout(() => (copyBtn.textContent = 'Copy'), 1500);
    });
  });
}); 