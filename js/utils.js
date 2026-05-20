// ============================================================
// ByteLens — Shared Utilities
// ============================================================

// --- Toast Notification System ---
function showToast(message, type = 'info') {
    // Remove existing toast if any
    const existing = document.getElementById('bytelens-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'bytelens-toast';

    const colors = {
        success: 'from-green-500 to-emerald-600',
        error: 'from-red-500 to-rose-600',
        info: 'from-blue-500 to-indigo-600',
        warning: 'from-amber-500 to-orange-600',
    };

    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠',
    };

    toast.className = `fixed top-6 right-6 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl text-white font-semibold shadow-2xl bg-gradient-to-r ${colors[type] || colors.info} transform translate-x-full transition-transform duration-500 ease-out`;

    toast.innerHTML = `
        <span class="text-xl">${icons[type] || icons.info}</span>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Slide in
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.classList.remove('translate-x-full');
            toast.classList.add('translate-x-0');
        });
    });

    // Auto dismiss
    setTimeout(() => {
        toast.classList.remove('translate-x-0');
        toast.classList.add('translate-x-full');
        setTimeout(() => toast.remove(), 500);
    }, 3500);
}

// --- Modal Helper Functions ---
function showModal(modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    // Force reflow before adding transition class
    void modal.offsetWidth;
    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
    });
    document.body.style.overflow = 'hidden';
}

function hideModal(modal) {
    modal.classList.add('opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
    document.body.style.overflow = '';
}

// Expose globally
window.ByteLens.showToast = showToast;
window.ByteLens.showModal = showModal;
window.ByteLens.hideModal = hideModal;
