// ============================================================
// ByteLens — Midtrans Snap Client Configuration
// Centralizes Midtrans client creation for reuse across modules
// ============================================================

const midtransClient = require('midtrans-client');

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY;

if (!MIDTRANS_SERVER_KEY || !MIDTRANS_CLIENT_KEY) {
    console.error('❌ Missing MIDTRANS_SERVER_KEY or MIDTRANS_CLIENT_KEY in .env');
    process.exit(1);
}

const snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: MIDTRANS_SERVER_KEY,
    clientKey: MIDTRANS_CLIENT_KEY,
});

module.exports = { snap, MIDTRANS_CLIENT_KEY };
