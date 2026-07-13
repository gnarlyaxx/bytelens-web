// ============================================================
// ByteLens — App Entry Point
// All modules are loaded via separate script tags.
// This file handles initialization and global event listeners.
// ============================================================

(function () {
    // --- Close Modals on Overlay Click ---
    window.addEventListener('click', (e) => {
        const BL = window.ByteLens;
        const photoModal = document.getElementById('photoModal');
        const uploadModal = document.getElementById('uploadModal');
        const serviceUploadModal = document.getElementById('serviceUploadModal');
        const loginWarningModal = document.getElementById('loginWarningModal');
        const authModal = document.getElementById('authModal');
        const profileModal = document.getElementById('profileModal');
        const vaultSellModal = document.getElementById('vaultSellModal');
        const welcomeModal = document.getElementById('welcomeModal');

        if (e.target === photoModal && BL.closePhotoModal) BL.closePhotoModal();
        if (e.target === uploadModal && BL.closeUploadModal) BL.closeUploadModal();
        if (e.target === serviceUploadModal && BL.closeServiceModal) BL.closeServiceModal();
        if (e.target === loginWarningModal && BL.closeLoginWarning) BL.closeLoginWarning();
        if (e.target === authModal && BL.closeAuth) BL.closeAuth();
        if (e.target === profileModal && BL.closeProfile) BL.closeProfile();
        if (e.target === vaultSellModal && BL.closeSellModal) BL.closeSellModal();
        if (e.target === welcomeModal) closeWelcomeModal();
    });

    // --- Close modals on ESC key ---
    window.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;

        const BL = window.ByteLens;
        const chatPanel = document.getElementById('chatPanel');
        const vaultPanel = document.getElementById('vaultPanel');
        const vaultSellModal = document.getElementById('vaultSellModal');

        // Close in priority order (topmost first)
        if (vaultSellModal && !vaultSellModal.classList.contains('hidden') && BL.closeSellModal) {
            BL.closeSellModal();
        } else if (chatPanel && !chatPanel.classList.contains('hidden') && BL.closeChatPanel) {
            BL.closeChatPanel();
        } else if (vaultPanel && !vaultPanel.classList.contains('hidden') && BL.closeVault) {
            BL.closeVault();
        } else if (!document.getElementById('authModal').classList.contains('hidden') && BL.closeAuth) {
            BL.closeAuth();
        } else if (!document.getElementById('loginWarningModal').classList.contains('hidden') && BL.closeLoginWarning) {
            BL.closeLoginWarning();
        } else if (!document.getElementById('profileModal').classList.contains('hidden') && BL.closeProfile) {
            BL.closeProfile();
        } else if (!document.getElementById('photoModal').classList.contains('hidden') && BL.closePhotoModal) {
            BL.closePhotoModal();
        } else if (!document.getElementById('uploadModal').classList.contains('hidden') && BL.closeUploadModal) {
            BL.closeUploadModal();
        } else if (!document.getElementById('serviceUploadModal').classList.contains('hidden') && BL.closeServiceModal) {
            BL.closeServiceModal();
        } else if (document.getElementById('welcomeModal') && !document.getElementById('welcomeModal').classList.contains('hidden')) {
            closeWelcomeModal();
        }
    });

    // --- Welcome Modal Logic ---
    function closeWelcomeModal() {
        const welcomeModal = document.getElementById('welcomeModal');
        if (welcomeModal) {
            welcomeModal.classList.add('opacity-0');
            setTimeout(() => {
                welcomeModal.classList.add('hidden');
                welcomeModal.classList.remove('flex');
            }, 300);
            sessionStorage.setItem('welcomeShown', 'true');
        }
    }

    const closeWelcomeBtn = document.getElementById('closeWelcomeBtn');
    if (closeWelcomeBtn) {
        closeWelcomeBtn.addEventListener('click', closeWelcomeModal);
    }

    // --- Initialize App ---
    window.addEventListener('DOMContentLoaded', () => {
        const BL = window.ByteLens;
        if (BL.initGallery) BL.initGallery();
        if (BL.checkExistingSession) BL.checkExistingSession();
        if (BL.initPayment) BL.initPayment();

        // Show Welcome Modal on first visit per session
        if (!sessionStorage.getItem('welcomeShown')) {
            const welcomeModal = document.getElementById('welcomeModal');
            if (welcomeModal) {
                welcomeModal.classList.remove('hidden');
                welcomeModal.classList.add('flex');
                // Trigger reflow for transition
                void welcomeModal.offsetWidth;
                welcomeModal.classList.remove('opacity-0');
            }
        }
    });
})();
