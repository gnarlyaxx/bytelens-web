// ============================================================
// ByteLens — Payment System (Midtrans Snap)
// ============================================================

(function () {
    const { showToast } = window.ByteLens;

    let midtransClientKey = null;
    let isSnapReady = false;

    // --- Initialize: Fetch Client Key & Load Snap.js ---
    async function initPayment() {
        try {
            const res = await fetch('/api/midtrans-client-key');
            const data = await res.json();
            midtransClientKey = data.clientKey;

            if (midtransClientKey && midtransClientKey !== 'YOUR_SANDBOX_CLIENT_KEY_HERE') {
                loadSnapScript();
            } else {
                console.warn('Midtrans client key not configured. Payment in demo mode.');
            }
        } catch (err) {
            console.warn('Payment init: server not available, running in demo mode.');
        }
    }

    function loadSnapScript() {
        const script = document.createElement('script');
        script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', midtransClientKey);
        script.onload = () => {
            isSnapReady = true;
            console.log('✅ Midtrans Snap loaded successfully.');
        };
        script.onerror = () => {
            console.warn('Failed to load Midtrans Snap script.');
        };
        document.head.appendChild(script);
    }

    // --- Purchase Photo ---
    async function purchasePhoto(photo) {
        if (!window.ByteLens.isLoggedIn) {
            window.ByteLens.openLoginWarning();
            return;
        }

        const user = window.ByteLens.currentUser;
        const orderId = `BL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

        // If Snap is not ready, show demo mode
        if (!isSnapReady) {
            showToast('Payment system in demo mode. Configure Midtrans keys to enable. 🔧', 'info');
            return;
        }

        try {
            showToast('Preparing payment...', 'info');

            // Request snap token from server
            const res = await fetch('/api/create-transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: orderId,
                    amount: photo.price,
                    photoTitle: photo.title,
                    buyerEmail: user.email || 'buyer@bytelens.com',
                    buyerName: user.name || 'ByteLens User',
                }),
            });

            const data = await res.json();

            if (!data.token) {
                throw new Error('Failed to get payment token');
            }

            // Open Midtrans Snap popup
            window.snap.pay(data.token, {
                onSuccess: function (result) {
                    console.log('Payment success:', result);
                    showToast('🎉 Payment successful! Your photo is ready for download.', 'success');
                    // Close the photo modal
                    if (window.ByteLens.closePhotoModal) window.ByteLens.closePhotoModal();
                },
                onPending: function (result) {
                    console.log('Payment pending:', result);
                    showToast('⏳ Payment pending. Please complete your payment.', 'warning');
                },
                onError: function (result) {
                    console.error('Payment error:', result);
                    showToast('❌ Payment failed. Please try again.', 'error');
                },
                onClose: function () {
                    console.log('Payment popup closed.');
                    showToast('Payment cancelled.', 'info');
                },
            });
        } catch (err) {
            console.error('Purchase error:', err);
            showToast('Failed to process payment. Please try again.', 'error');
        }
    }

    // Expose
    window.ByteLens.initPayment = initPayment;
    window.ByteLens.purchasePhoto = purchasePhoto;
})();
