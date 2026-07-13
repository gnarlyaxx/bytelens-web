// ============================================================
// ByteLens — Midtrans Webhook Route
// POST /api/payment-notification
// Called by Midtrans when payment status changes
// ============================================================

const express = require('express');
const router = express.Router();
const { snap } = require('../config/midtrans');
const { supabase } = require('../config/supabase');
const { TX_STATUS } = require('../config/constants');
const { createLogger } = require('../utils/logger');

const log = createLogger('Webhook');

/**
 * Midtrans sends a POST notification to this endpoint whenever a
 * transaction status changes (capture, settlement, pending, deny, etc.).
 *
 * This handler:
 * 1. Verifies the notification signature via midtrans-client SDK
 * 2. Updates the transaction status in Supabase
 * 3. Supabase Realtime then notifies the Discord bot
 */
router.post('/payment-notification', async (req, res) => {
    try {
        // --- Verify & parse the notification ---
        const notification = await snap.transaction.notification(req.body);

        const {
            order_id: orderId,
            transaction_status: transactionStatus,
            fraud_status: fraudStatus,
            transaction_id: midtransTransactionId,
            payment_type: paymentType,
        } = notification;

        log.info(`Webhook received: ${orderId} | Status: ${transactionStatus} | Fraud: ${fraudStatus}`);

        // --- Determine our internal status ---
        let newStatus;
        let paidAt = null;

        if (transactionStatus === 'capture') {
            // Credit card: check fraud status
            newStatus = fraudStatus === 'accept' ? TX_STATUS.PAID : TX_STATUS.CANCELLED;
            if (newStatus === TX_STATUS.PAID) paidAt = new Date().toISOString();
        } else if (transactionStatus === 'settlement') {
            // Bank transfer, e-wallet: confirmed
            newStatus = TX_STATUS.PAID;
            paidAt = new Date().toISOString();
        } else if (transactionStatus === 'pending') {
            newStatus = TX_STATUS.PENDING;
        } else if (transactionStatus === 'expire') {
            newStatus = TX_STATUS.EXPIRED;
        } else if (['deny', 'cancel'].includes(transactionStatus)) {
            newStatus = TX_STATUS.CANCELLED;
        } else {
            log.warn(`Unhandled transaction status: ${transactionStatus}`);
            return res.status(200).json({ status: 'OK' });
        }

        // --- Update Supabase ---
        const updateData = {
            status: newStatus,
            midtrans_transaction_id: midtransTransactionId,
            payment_type: paymentType,
        };

        if (paidAt) {
            updateData.paid_at = paidAt;
        }

        const { error } = await supabase
            .from('transactions')
            .update(updateData)
            .eq('midtrans_order_id', orderId);

        if (error) {
            log.error(`Supabase update failed for ${orderId}: ${error.message}`);
            return res.status(500).json({ error: 'Database update failed' });
        }

        log.success(`Transaction ${orderId} updated to: ${newStatus}`);

        // Respond 200 to Midtrans (they will retry on non-200)
        res.status(200).json({ status: 'OK' });
    } catch (error) {
        log.error(`Webhook error: ${error.message}`);
        res.status(500).json({ error: 'Notification handling failed' });
    }
});

module.exports = router;
