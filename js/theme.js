// ============================================================
// ByteLens — Theme Toggle (Dark / Light Mode)
// ============================================================

(function () {
    const themeToggle = document.getElementById('themeToggle');
    const htmlEl = document.documentElement;

    // Restore saved theme
    const savedTheme = localStorage.getItem('bytelens-theme');
    if (savedTheme === 'light') {
        htmlEl.classList.remove('dark');
        themeToggle.textContent = '🌙';
    } else {
        htmlEl.classList.add('dark');
        themeToggle.textContent = '☀️';
    }

    themeToggle.addEventListener('click', () => {
        if (htmlEl.classList.contains('dark')) {
            htmlEl.classList.remove('dark');
            themeToggle.textContent = '🌙';
            localStorage.setItem('bytelens-theme', 'light');
        } else {
            htmlEl.classList.add('dark');
            themeToggle.textContent = '☀️';
            localStorage.setItem('bytelens-theme', 'dark');
        }
    });
})();
