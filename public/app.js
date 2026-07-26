document.querySelectorAll('.reveal-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const code = btn.previousElementSibling;
    const full = code.getAttribute('data-full');
    const masked = full.slice(0, 18) + '\u2022'.repeat(10);
    if (code.textContent === full) {
      code.textContent = masked;
      btn.textContent = 'نمایش';
    } else {
      code.textContent = full;
      btn.textContent = 'پنهان';
    }
  });
});

document.querySelectorAll('.copy-btn').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const text = btn.getAttribute('data-copy');
    try {
      await navigator.clipboard.writeText(text);
      const old = btn.textContent;
      btn.textContent = 'کپی شد \u2713';
      setTimeout(() => (btn.textContent = old), 1500);
    } catch (e) {
      alert('کپی خودکار در این مرورگر پشتیبانی نشد.');
    }
  });
});
